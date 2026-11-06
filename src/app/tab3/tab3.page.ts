import { Component, inject } from '@angular/core';
import { AuthService, AuthUser } from '../services/auth.service';
import {
  OraclePrediction,
  OracleService,
  OracleSport
} from '../services/oracle.service';
import { ApiDiagnosticService } from '../services/api-diagnostic.service';
import { ApiErrorModalService } from '../services/api-error-modal.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page {
  private readonly authService = inject(AuthService);
  private readonly oracleService = inject(OracleService);
  private readonly diagnosticService = inject(ApiDiagnosticService);
  private readonly errorModalService = inject(ApiErrorModalService);

  currentUser: AuthUser | null = null;
  selectedSport: OracleSport = 'MLB';
  predictions: OraclePrediction[] = [];
  selectedPrediction: OraclePrediction | null = null;
  selectedFilter: 'ALL' | 'PICKS' | 'OVER' | 'UNDER' = 'ALL';
  viewMode: 'interactive' | 'cards' = 'interactive';
  isLoading = false;
  errorMessage = '';
  cacheMessage = '';

  // Elemento Multimedia: Narrador de Audio & Síntesis de voz del Oráculo
  isAudioPlaying = false;
  isAudioPaused = false;
  audioSpeed = 1.0;
  audioProgress = 0;
  private audioTimer: ReturnType<typeof setInterval> | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioCtx: AudioContext | null = null;

  get filteredPredictions(): OraclePrediction[] {
    return this.predictions.filter(p => {
      if (this.selectedFilter === 'PICKS') {
        return p.pickStatus.toUpperCase() === 'PICK';
      }
      if (this.selectedFilter === 'OVER') {
        return p.selection.toUpperCase() === 'OVER';
      }
      if (this.selectedFilter === 'UNDER') {
        return p.selection.toUpperCase() === 'UNDER';
      }
      return true;
    });
  }

  get totalPicksCount(): number {
    return this.predictions.filter(p => p.pickStatus.toUpperCase() === 'PICK').length;
  }

  get averageConfidence(): number {
    if (this.predictions.length === 0) return 0;
    const sum = this.predictions.reduce((acc, p) => acc + (p.probability || 0.5), 0);
    return Math.round((sum / this.predictions.length) * 100);
  }

  ionViewWillEnter(): void {
    this.currentUser = this.authService.getCurrentUser();
    void this.loadPredictions();
  }

  async changeSport(sport: OracleSport): Promise<void> {
    this.selectedSport = sport;
    this.selectedPrediction = null;
    await this.loadPredictions();
  }

  setFilter(filter: 'ALL' | 'PICKS' | 'OVER' | 'UNDER'): void {
    this.selectedFilter = filter;
    if (this.selectedPrediction && !this.filteredPredictions.includes(this.selectedPrediction)) {
      this.selectedPrediction = this.filteredPredictions[0] ?? null;
    }
  }

  selectPrediction(prediction: OraclePrediction): void {
    if (this.selectedPrediction?.id === prediction.id) {
      this.selectedPrediction = null;
    } else {
      this.selectedPrediction = prediction;
    }
  }

  async loadPredictions(event?: { target?: { complete?: () => void } }): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    this.cacheMessage = '';
    try {
      this.predictions = await this.oracleService.getPredictions(this.selectedSport);
      if (this.predictions.length > 0 && !this.selectedPrediction) {
        // Select the first value pick by default for the interactive graphic
        this.selectedPrediction = this.predictions.find(p => p.pickStatus.toUpperCase() === 'PICK') ?? this.predictions[0];
      }
      const state = this.oracleService.getLoadState();
      if (state.source === 'cache') {
        this.cacheMessage = `Datos cargados desde el dataset del modelo (${this.formatCacheDate(state.savedAt)}).`;
      }
    } catch (error: unknown) {
      this.predictions = [];
      this.errorMessage = this.oracleService.getErrorMessage(error);
      await this.errorModalService.present(this.diagnosticService.getLast());
    } finally {
      this.isLoading = false;
      event?.target?.complete?.();
    }
  }

  probabilityPercent(value: number | null): string {
    if (value === null || !Number.isFinite(value)) return 'N/D';
    return `${(value * 100).toFixed(1)}%`;
  }

  signedNumber(value: number | null, suffix = ''): string {
    if (value === null || !Number.isFinite(value)) return 'N/D';
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}${suffix}`;
  }

  oddsLabel(value: number | null): string {
    if (value === null || !Number.isFinite(value)) return 'N/D';
    return value > 0 ? `+${value.toFixed(0)}` : value.toFixed(0);
  }

  expectedValueLabel(value: number | null): string {
    if (value === null || !Number.isFinite(value)) return 'N/D';
    const percent = Math.abs(value) <= 2 ? value * 100 : value;
    return this.signedNumber(percent, '%');
  }

  marketLabel(prediction: OraclePrediction): string {
    const labels: Record<string, string> = {
      F5_TOTAL: 'Total primeras 5 entradas',
      GAME_TOTAL: 'Total del partido',
      receptions: 'Recepciones',
      receiving_yards: 'Yardas por recepcion',
      rushing_yards: 'Yardas terrestres',
      passing_yards: 'Yardas de pase',
      touchdowns: 'Touchdown'
    };
    return labels[prediction.marketType] ?? prediction.marketType.replaceAll('_', ' ');
  }

  pickColor(status: string): string {
    const normalized = status.toUpperCase();
    if (normalized === 'PICK') return 'success';
    if (normalized.includes('LESION') || normalized.includes('REVISAR')) return 'warning';
    return 'medium';
  }

  ionViewWillLeave(): void {
    this.stopAudio();
  }

  /**
   * Elemento Multimedia: Reproduce el análisis de IA por síntesis de voz y efectos de audio
   */
  playAudioAnalysis(prediction?: OraclePrediction): void {
    const target = prediction || this.selectedPrediction || (this.predictions.length > 0 ? this.predictions[0] : null);
    if (!target) return;

    this.stopAudio();
    this.playTone(587.33, 0.12);
    setTimeout(() => this.playTone(880, 0.18), 120);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const sportName = this.selectedSport === 'MLB' ? 'Béisbol de Grandes Ligas' : 'Fútbol Americano NFL';
      const text = `Reporte multimedia del Oráculo Deportivo. ${sportName}. Partido: ${target.awayTeam} contra ${target.homeTeam}. Mercado: ${this.marketLabel(target)}. Línea de la casa de apuestas: ${target.line}. La inteligencia artificial proyecta ${target.predictedValue ?? target.line}, con recomendación hacia ${target.selection}. Probabilidad estimada del ${this.probabilityPercent(target.probability)}. Ventaja estimada sobre la casa: ${this.signedNumber(target.edge)}.`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-MX';
      utterance.rate = this.audioSpeed;

      utterance.onstart = () => {
        this.isAudioPlaying = true;
        this.isAudioPaused = false;
        this.startAudioProgress();
      };

      utterance.onend = () => {
        this.isAudioPlaying = false;
        this.isAudioPaused = false;
        this.audioProgress = 100;
        this.clearAudioTimer();
        this.playTone(523.25, 0.2);
      };

      utterance.onerror = () => {
        this.isAudioPlaying = false;
        this.isAudioPaused = false;
        this.clearAudioTimer();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } else {
      this.isAudioPlaying = true;
      this.startAudioProgress();
      setTimeout(() => this.stopAudio(), 6000);
    }
  }

  pauseAudio(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.isAudioPlaying) {
      if (this.isAudioPaused) {
        window.speechSynthesis.resume();
        this.isAudioPaused = false;
      } else {
        window.speechSynthesis.pause();
        this.isAudioPaused = true;
      }
    }
  }

  stopAudio(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isAudioPlaying = false;
    this.isAudioPaused = false;
    this.audioProgress = 0;
    this.clearAudioTimer();
  }

  toggleAudioSpeed(): void {
    const speeds = [1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(this.audioSpeed) + 1) % speeds.length;
    this.audioSpeed = speeds[nextIdx];
    if (this.isAudioPlaying) {
      this.playAudioAnalysis();
    }
  }

  private playTone(freq: number, duration: number): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // AudioContext no interactuado aún o no disponible
    }
  }

  private startAudioProgress(): void {
    this.clearAudioTimer();
    this.audioProgress = 5;
    this.audioTimer = setInterval(() => {
      if (this.isAudioPlaying && !this.isAudioPaused) {
        if (this.audioProgress < 95) {
          this.audioProgress += 2;
        }
      }
    }, 300);
  }

  private clearAudioTimer(): void {
    if (this.audioTimer) {
      clearInterval(this.audioTimer);
      this.audioTimer = null;
    }
  }

  private formatCacheDate(value: string | null): string {
    return value ? new Date(value).toLocaleString('es-MX') : 'momento desconocido';
  }
}
