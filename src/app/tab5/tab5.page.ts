import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GeoService, GeoState, SportVenue } from '../services/geo.service';
import { SensorService, MotionData, OrientationData, BatteryData } from '../services/sensor.service';
import { ContextRulesService, ContextState, DecisionRule } from '../services/context-rules.service';

@Component({
  selector: 'app-tab5',
  templateUrl: 'tab5.page.html',
  styleUrls: ['tab5.page.scss'],
  standalone: false
})
export class Tab5Page implements OnInit, OnDestroy {
  // Pestaña activa dentro de Tab 5: 'rules' (Reglas de contexto), 'sensors' (Sensores físicos) o 'radar' (Radar de estadios)
  public activeSection: 'rules' | 'sensors' | 'radar' = 'rules';

  // ================= ESTADO DEL MOTOR DE REGLAS DE CONTEXTO =================
  public contextState: ContextState;

  // ================= ESTADO DE SENSORES FÍSICOS =================
  public isSensorsActive = true;
  public motionData: MotionData = {
    x: 0,
    y: 0,
    z: 0,
    magnitude: 0,
    withGravityX: 0,
    withGravityY: 9.8,
    withGravityZ: 0,
    interval: 16
  };

  public orientationData: OrientationData = {
    alpha: 0,
    beta: 0,
    gamma: 0
  };

  public batteryData: BatteryData = {
    level: 100,
    charging: false,
    chargingTime: 0,
    dischargingTime: 0,
    supported: false
  };

  public shakeCount = 0;
  public lastHapticTrigger = '';
  public showShakeToast = false;

  // ================= ESTADO DE GEOLOCALIZACIÓN Y RADAR =================
  public geoState: GeoState = {
    status: 'idle',
    coords: null,
    timestamp: null,
    errorMessage: null,
    errorCode: null,
    isSimulated: false
  };

  public selectedLeague: string = 'ALL';
  public selectedRadius: number = 0; // 0 significa sin límite
  public venues: SportVenue[] = [];
  public closestVenue?: SportVenue;

  private subs: Subscription[] = [];

  constructor(
    public geoService: GeoService,
    public sensorService: SensorService,
    public rulesService: ContextRulesService,
    private router: Router
  ) {
    this.contextState = this.rulesService.currentState;
  }

  ngOnInit() {
    // 1. Suscripción al Motor de Reglas de Contexto
    this.subs.push(
      this.rulesService.state$.subscribe(cs => {
        this.contextState = cs;
      })
    );

    // 2. Suscripción a Geolocalización
    this.subs.push(
      this.geoService.state.subscribe(state => {
        this.geoState = state;
        this.refreshVenues();
      })
    );

    // 3. Suscripción a Acelerómetro
    this.subs.push(
      this.sensorService.motion$.subscribe(motion => {
        this.motionData = motion;
      })
    );

    // 4. Suscripción a Giroscopio / Orientación Espacial
    this.subs.push(
      this.sensorService.orientation$.subscribe(orient => {
        this.orientationData = orient;
      })
    );

    // 5. Suscripción a Batería
    this.subs.push(
      this.sensorService.battery$.subscribe(batt => {
        this.batteryData = batt;
      })
    );

    // 6. Suscripción a Sacudidas (Shake)
    this.subs.push(
      this.sensorService.shakeCount$.subscribe(count => {
        if (count > this.shakeCount) {
          this.triggerShakeEffect();
        }
        this.shakeCount = count;
      })
    );

    // Iniciar sensores físicos automáticamente
    this.sensorService.startSensors();
  }

  ionViewWillEnter() {
    this.refreshVenues();
    if (this.isSensorsActive) {
      this.sensorService.startSensors();
    }
  }

  ionViewWillLeave() {
    // Mantener estado activo
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.sensorService.stopSensors();
  }

  // ================= MÉTODOS DEL MOTOR DE REGLAS =================
  public onSectionChange(event: any) {
    this.activeSection = event.detail.value;
  }

  public applyContextScenario(id: 'escenario_1' | 'escenario_2' | 'escenario_3' | 'normal' | 'real') {
    this.rulesService.applyScenario(id);
  }

  public performVipCheckIn() {
    this.rulesService.performVipCheckIn();
  }

  // ================= MÉTODOS DE SENSORES =================
  public toggleSensors() {
    this.isSensorsActive = !this.isSensorsActive;
    if (this.isSensorsActive) {
      this.sensorService.startSensors();
    } else {
      this.sensorService.stopSensors();
    }
  }

  public triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning') {
    this.lastHapticTrigger = type.toUpperCase();
    this.sensorService.triggerHaptic(type);
    setTimeout(() => {
      if (this.lastHapticTrigger === type.toUpperCase()) {
        this.lastHapticTrigger = '';
      }
    }, 1500);
  }

  public resetShake() {
    this.sensorService.resetShakeCount();
  }

  private triggerShakeEffect() {
    this.showShakeToast = true;
    setTimeout(() => {
      this.showShakeToast = false;
    }, 2200);
  }

  public getBubbleTransform(): string {
    const maxOffset = 38;
    const x = Math.max(-maxOffset, Math.min(maxOffset, this.orientationData.gamma * 1.2));
    const y = Math.max(-maxOffset, Math.min(maxOffset, this.orientationData.beta * 1.2));
    return `translate(${x}px, ${y}px)`;
  }

  public getAccelProgress(val: number): number {
    const abs = Math.abs(val);
    return Math.min(1, abs / 15);
  }

  // ================= MÉTODOS DE RADAR Y GEOLOCALIZACIÓN =================
  public onLeagueChange(event: any) {
    this.selectedLeague = event.detail.value;
    this.refreshVenues();
  }

  public onRadiusChange(event: any) {
    this.selectedRadius = Number(event.detail.value);
    this.refreshVenues();
  }

  public refreshVenues() {
    this.venues = this.geoService.getVenuesWithDistance(this.selectedLeague, this.selectedRadius);
    if (this.venues.length > 0 && this.venues[0].distanceKm !== undefined) {
      this.closestVenue = this.venues[0];
    } else {
      this.closestVenue = undefined;
    }
  }

  public requestLocation() {
    this.geoService.requestCurrentPosition();
  }

  public simulatePreset(preset: 'dgo' | 'azteca' | 'att') {
    if (preset === 'dgo') {
      this.geoService.setSimulatedLocation(24.0277, -104.6532, 'Durango Centro / Polideportivo');
    } else if (preset === 'azteca') {
      this.geoService.setSimulatedLocation(19.3029, -99.1505, 'Estadio Azteca (CDMX)');
    } else if (preset === 'att') {
      this.geoService.setSimulatedLocation(32.7473, -97.0945, 'AT&T Stadium (Dallas NFL)');
    }
  }

  public viewOnMap(venue: SportVenue) {
    this.router.navigate(['/tabs/tab4']);
  }

  public openInExternalMap(venue: SportVenue) {
    const url = `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`;
    window.open(url, '_blank');
  }

  public estimateDriveTime(km?: number): string {
    if (km === undefined) return 'N/D';
    if (km < 1) return '< 2 min en auto';
    if (km < 5) return `~ ${Math.round(km * 2.5)} min`;
    const hours = Math.floor(km / 90);
    const mins = Math.round((km % 90) / 1.5);
    if (hours === 0) return `~ ${mins} min`;
    return `~ ${hours} h ${mins} min`;
  }

  public getLeagueBadgeClass(league: string): string {
    switch (league) {
      case 'MLB': return 'league-mlb';
      case 'NFL': return 'league-nfl';
      case 'LIGA_MX': return 'league-ligamx';
      default: return 'league-poli';
    }
  }
}
