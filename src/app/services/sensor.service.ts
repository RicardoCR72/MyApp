import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Motion } from '@capacitor/motion';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export interface MotionData {
  x: number;
  y: number;
  z: number;
  magnitude: number;
  withGravityX: number;
  withGravityY: number;
  withGravityZ: number;
  interval: number;
}

export interface OrientationData {
  alpha: number; // Rotación en Z (brújula 0 - 360°)
  beta: number;  // Inclinación Frontal / Pitch (-180° a 180°)
  gamma: number; // Inclinación Lateral / Roll (-90° a 90°)
}

export interface BatteryData {
  level: number;        // 0 a 100%
  charging: boolean;
  chargingTime: number; // segundos o Infinity
  dischargingTime: number;
  supported: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  private motionSub = new BehaviorSubject<MotionData>({
    x: 0,
    y: 0,
    z: 0,
    magnitude: 0,
    withGravityX: 0,
    withGravityY: 9.8,
    withGravityZ: 0,
    interval: 16
  });

  private orientationSub = new BehaviorSubject<OrientationData>({
    alpha: 0,
    beta: 0,
    gamma: 0
  });

  private batterySub = new BehaviorSubject<BatteryData>({
    level: 100,
    charging: false,
    chargingTime: 0,
    dischargingTime: 0,
    supported: false
  });

  private shakeCountSub = new BehaviorSubject<number>(0);
  private isListening = false;
  private lastShakeTime = 0;
  private motionPluginHandle: any = null;
  private orientationPluginHandle: any = null;

  public motion$: Observable<MotionData> = this.motionSub.asObservable();
  public orientation$: Observable<OrientationData> = this.orientationSub.asObservable();
  public battery$: Observable<BatteryData> = this.batterySub.asObservable();
  public shakeCount$: Observable<number> = this.shakeCountSub.asObservable();

  constructor(private zone: NgZone) {
    this.initBattery();
  }

  /**
   * Inicia la captura continua de sensores físicos (Acelerómetro + Giroscopio)
   */
  public async startSensors(): Promise<void> {
    if (this.isListening) return;
    this.isListening = true;

    // 1. Intentar con Plugin Capacitor Motion
    try {
      this.motionPluginHandle = await Motion.addListener('accel', (event) => {
        this.zone.run(() => {
          this.processMotionEvent(event);
        });
      });

      this.orientationPluginHandle = await Motion.addListener('orientation', (event) => {
        this.zone.run(() => {
          this.orientationSub.next({
            alpha: Math.round(event.alpha || 0),
            beta: Math.round(event.beta || 0),
            gamma: Math.round(event.gamma || 0)
          });
        });
      });
    } catch {
      // 2. Fallback a Web Sensors API estándar (W3C DeviceMotionEvent / DeviceOrientationEvent)
      this.initWebMotionFallback();
    }
  }

  /**
   * Detiene la captura de sensores para ahorrar batería del dispositivo
   */
  public async stopSensors(): Promise<void> {
    this.isListening = false;
    if (this.motionPluginHandle) {
      await this.motionPluginHandle.remove();
      this.motionPluginHandle = null;
    }
    if (this.orientationPluginHandle) {
      await this.orientationPluginHandle.remove();
      this.orientationPluginHandle = null;
    }
    window.removeEventListener('devicemotion', this.onWebMotion);
    window.removeEventListener('deviceorientation', this.onWebOrientation);
  }

  /**
   * Procesa la lectura del acelerómetro y evalúa sacudida (Shake)
   */
  private processMotionEvent(event: any): void {
    const acc = event.acceleration || { x: 0, y: 0, z: 0 };
    const accGrav = event.accelerationIncludingGravity || { x: 0, y: 0, z: 9.8 };

    const x = acc.x || (accGrav.x ? accGrav.x * 0.8 : 0);
    const y = acc.y || (accGrav.y ? accGrav.y * 0.8 : 0);
    const z = acc.z || (accGrav.z ? (accGrav.z - 9.8) * 0.8 : 0);

    const magnitude = Math.sqrt(x * x + y * y + z * z);

    this.motionSub.next({
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      z: Number(z.toFixed(2)),
      magnitude: Number(magnitude.toFixed(2)),
      withGravityX: Number((accGrav.x || 0).toFixed(2)),
      withGravityY: Number((accGrav.y || 0).toFixed(2)),
      withGravityZ: Number((accGrav.z || 0).toFixed(2)),
      interval: event.interval || 16
    });

    // Detección de Sacudida Física (Shake Detection)
    // Si la aceleración supera el umbral de 15 m/s² y pasaron al menos 600ms desde la última sacudida
    const now = Date.now();
    if (magnitude > 15 && now - this.lastShakeTime > 600) {
      this.lastShakeTime = now;
      this.shakeCountSub.next(this.shakeCountSub.value + 1);
      // Feedback físico inmediato con motor de vibración
      this.triggerHaptic('heavy');
    }
  }

  private onWebMotion = (event: DeviceMotionEvent) => {
    this.zone.run(() => {
      this.processMotionEvent(event);
    });
  };

  private onWebOrientation = (event: DeviceOrientationEvent) => {
    this.zone.run(() => {
      this.orientationSub.next({
        alpha: Math.round(event.alpha || 0),
        beta: Math.round(event.beta || 0),
        gamma: Math.round(event.gamma || 0)
      });
    });
  };

  private initWebMotionFallback(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('devicemotion', this.onWebMotion, true);
      window.addEventListener('deviceorientation', this.onWebOrientation, true);
    }
  }

  /**
   * Dispara una vibración física o retroalimentación háptica en el dispositivo
   */
  public async triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning'): Promise<void> {
    try {
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
      }
    } catch {
      // Fallback a W3C Navigator.vibrate
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        const pattern = type === 'heavy' ? [80, 40, 80] : (type === 'warning' ? [120, 60, 120] : [50]);
        navigator.vibrate(pattern);
      }
    }
  }

  /**
   * Consulta el sensor físico de batería del dispositivo mediante W3C Battery Status API
   */
  private async initBattery(): Promise<void> {
    if (typeof navigator !== 'undefined' && 'getBattery' in (navigator as any)) {
      try {
        const battery = await (navigator as any).getBattery();
        const updateBattery = () => {
          this.zone.run(() => {
            this.batterySub.next({
              level: Math.round(battery.level * 100),
              charging: battery.charging,
              chargingTime: battery.chargingTime,
              dischargingTime: battery.dischargingTime,
              supported: true
            });
          });
        };

        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      } catch {
        // Battery API no soportada
      }
    }
  }

  public resetShakeCount(): void {
    this.shakeCountSub.next(0);
  }
}
