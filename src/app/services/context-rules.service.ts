import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, Subscription } from 'rxjs';
import { Network, ConnectionStatus } from '@capacitor/network';
import { GeoService, GeoState } from './geo.service';
import { SensorService, BatteryData, MotionData } from './sensor.service';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export interface ContextVariables {
  // Variable de Contexto 1: Ubicación Geográfica y Geocerca
  insideZone: boolean;           // true si está a <= 5.0 km de un estadio
  closestVenueName: string;
  distanceKm: number;
  latitude: number | null;
  longitude: number | null;

  // Variable de Contexto 2: Conectividad y Red
  isOnline: boolean;
  connectionType: string;        // 'wifi' | 'cellular' | 'none' | 'unknown'

  // Variable de Contexto 3: Nivel de Batería y Circuito PMIC
  batteryLevel: number;          // 0 - 100
  isLowBattery: boolean;         // true si <= 20%
  isCharging: boolean;

  // Variable de Contexto 4: Telemetría de Movimiento e Inercia
  isMoving: boolean;
  accelerationMagnitude: number; // m/s²

  // Bandera de simulación
  isSimulated: boolean;
  activeScenarioName: string;
}

export interface DecisionRule {
  id: string;
  title: string;
  code: string;
  condition: string;
  isActive: boolean;
  statusBadge: 'ACTIVA' | 'INACTIVA';
  accentColor: string;
  icon: string;
  actionSummary: string;
  behaviorChanges: string[];
}

export interface ContextState {
  variables: ContextVariables;
  rules: DecisionRule[];
  activeRulesCount: number;
  vipUnlocked: boolean;
  offlineModeActive: boolean;
  ecoModeActive: boolean;
  checkInDone: boolean;
  lastHapticMessage: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContextRulesService implements OnDestroy {
  // Estado reactivo central del motor de reglas
  private stateSubject = new BehaviorSubject<ContextState>({
    variables: {
      insideZone: false,
      closestVenueName: 'Calculando...',
      distanceKm: 999,
      latitude: null,
      longitude: null,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      connectionType: 'wifi',
      batteryLevel: 100,
      isLowBattery: false,
      isCharging: false,
      isMoving: false,
      accelerationMagnitude: 9.8,
      isSimulated: false,
      activeScenarioName: 'Sensores en Vivo (Modo Real)'
    },
    rules: [],
    activeRulesCount: 0,
    vipUnlocked: false,
    offlineModeActive: false,
    ecoModeActive: false,
    checkInDone: false,
    lastHapticMessage: ''
  });

  public state$: Observable<ContextState> = this.stateSubject.asObservable();

  // Suscripciones
  private subs: Subscription = new Subscription();
  private networkListenerRemove?: () => void;

  // Overrides de simulación (si el usuario activa un preset de prueba)
  private simulationOverride: Partial<ContextVariables> | null = null;
  private currentScenarioName = 'Sensores en Vivo (Modo Real)';

  constructor(
    private geoService: GeoService,
    private sensorService: SensorService
  ) {
    this.initNetworkListener();
    this.listenToSensorsAndLocation();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    if (this.networkListenerRemove) {
      this.networkListenerRemove();
    }
  }

  public get currentState(): ContextState {
    return this.stateSubject.getValue();
  }

  // ================= INICIALIZACIÓN DE RED =================
  private async initNetworkListener() {
    try {
      // Estado inicial con Capacitor
      const status = await Network.getStatus();
      this.updateNetworkState(status.connected, status.connectionType);

      // Escuchar cambios de red con Capacitor
      const handle = await Network.addListener('networkStatusChange', (s: ConnectionStatus) => {
        this.updateNetworkState(s.connected, s.connectionType);
      });
      this.networkListenerRemove = () => handle.remove();
    } catch {
      // Fallback a Web APIs estándar
      this.updateNetworkState(navigator.onLine, navigator.onLine ? 'wifi' : 'none');
    }

    // Doble garantía con eventos del navegador
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.updateNetworkState(true, 'wifi'));
      window.addEventListener('offline', () => this.updateNetworkState(false, 'none'));
    }
  }

  private updateNetworkState(online: boolean, connectionType: string) {
    if (this.simulationOverride?.isOnline !== undefined) {
      return; // No sobreescribir si está en modo preset simulado
    }
    const current = this.stateSubject.getValue();
    const updatedVars: ContextVariables = {
      ...current.variables,
      isOnline: online,
      connectionType: online ? (connectionType || 'wifi') : 'none'
    };
    this.recomputeRules(updatedVars);
  }

  // ================= ESCUCHA REACTIVA COMBINADA =================
  private listenToSensorsAndLocation() {
    this.subs.add(
      combineLatest([
        this.geoService.state,
        this.sensorService.battery$,
        this.sensorService.motion$
      ]).subscribe(([geo, battery, motion]) => {
        this.processHardwareInputs(geo, battery, motion);
      })
    );
  }

  private processHardwareInputs(geo: GeoState, battery: BatteryData, motion: MotionData) {
    const current = this.stateSubject.getValue();

    // 1. Calcular Geocerca / Distancia a sede más próxima
    const venues = this.geoService.getVenuesWithDistance();
    const closest = venues.length > 0 ? venues[0] : null;
    const distance = closest && closest.distanceKm !== undefined ? closest.distanceKm : 999;
    const isInsideZone = distance <= 5.0; // Radio de 5 km de influencia

    // 2. Extraer variables base de hardware
    const baseVars: ContextVariables = {
      insideZone: isInsideZone,
      closestVenueName: closest ? closest.name : 'Sin sede próxima',
      distanceKm: Math.round(distance * 10) / 10,
      latitude: geo.coords ? geo.coords.latitude : null,
      longitude: geo.coords ? geo.coords.longitude : null,
      isOnline: current.variables.isOnline,
      connectionType: current.variables.connectionType,
      batteryLevel: battery.level,
      isLowBattery: battery.level <= 20,
      isCharging: battery.charging,
      isMoving: motion.magnitude > 13.5,
      accelerationMagnitude: Math.round(motion.magnitude * 10) / 10,
      isSimulated: this.simulationOverride !== null,
      activeScenarioName: this.currentScenarioName
    };

    // Aplicar overrides si hay simulación activa
    const finalVars: ContextVariables = this.simulationOverride
      ? { ...baseVars, ...this.simulationOverride }
      : baseVars;

    this.recomputeRules(finalVars);
  }

  // ================= MOTOR DE REGLAS DE DECISIÓN =================
  private recomputeRules(v: ContextVariables) {
    /*
     * REGLA 1: MODO FAN ESTADIO (VIP EXPERIENCE)
     * Condición: En geocerca (<= 5 km del estadio) AND Conectado a Internet
     */
    const rule1Active = v.insideZone && v.isOnline;
    const rule1: DecisionRule = {
      id: 'rule-vip-fan',
      title: 'Regla 1: Modo Fan Estadio · Experiencia VIP & Streaming',
      code: 'R1: Geofence(<=5km) ∧ Network(Online)',
      condition: `insideZone (${v.insideZone ? 'SÍ' : 'NO'}) ∧ isOnline (${v.isOnline ? 'ONLINE' : 'OFFLINE'})`,
      isActive: rule1Active,
      statusBadge: rule1Active ? 'ACTIVA' : 'INACTIVA',
      accentColor: '#10b981', // Verde esmeralda
      icon: 'sparkles',
      actionSummary: 'Desbloquea credencial VIP de tribuna, botón de Check-in háptico y streaming de datos en vivo.',
      behaviorChanges: [
        'Habilita el panel exclusivo "Fan Zone VIP" con acceso prioritario.',
        'Activa el botón interactivo de "Check-in Presencial" con respuesta de vibración háptica.',
        'Despliega estadísticas satelitales en vivo de la sede deportiva más cercana.',
        'Muestra conteo de aforo estimado y clima del estadio en tiempo real.'
      ]
    };

    /*
     * REGLA 2: MODO RESILIENCIA OFFLINE (CACHE & BRÚJULA LOCAL)
     * Condición: Sin conexión a Internet (!isOnline)
     */
    const rule2Active = !v.isOnline;
    const rule2: DecisionRule = {
      id: 'rule-offline-cache',
      title: 'Regla 2: Resiliencia Offline · Brújula Local & Navegación en Caché',
      code: 'R2: Network(Offline)',
      condition: `isOnline == false (${v.isOnline ? 'Conectado a Internet' : 'SIN INTERNET'})`,
      isActive: rule2Active,
      statusBadge: rule2Active ? 'ACTIVA' : 'INACTIVA',
      accentColor: '#f59e0b', // Ámbar alerta
      icon: 'cloud-offline',
      actionSummary: 'Suspende tráfico HTTP saliente, cambia el mapa a capas cacheadas y activa brújula magnética local.',
      behaviorChanges: [
        'Despliega banner persistente: "Operando fuera de línea con datos locales de respaldo".',
        'Detiene intentos de reconexión pesados para evitar timeout y consumo innecesario.',
        'Calcula rumbos directos (acimut sexagesimal) hacia los estadios mediante trigonometría local pura.',
        'Deshabilita de forma segura las compras de boletos y streaming externo.'
      ]
    };

    /*
     * REGLA 3: MODO ECO-AHORRO INTELIGENTE (ENERGY SAVER)
     * Condición: Batería baja (<= 20%) AND Desconectado del cargador (!isCharging)
     */
    const rule3Active = v.batteryLevel <= 20 && !v.isCharging;
    const rule3: DecisionRule = {
      id: 'rule-eco-saver',
      title: 'Regla 3: Modo Eco-Ahorro Inteligente · Preservación de Batería',
      code: 'R3: Battery(<=20%) ∧ !Charging',
      condition: `batteryLevel (${v.batteryLevel}%) <= 20% ∧ isCharging (${v.isCharging ? 'CARGANDO' : 'NO CARGA'})`,
      isActive: rule3Active,
      statusBadge: rule3Active ? 'ACTIVA' : 'INACTIVA',
      accentColor: '#ef4444', // Rojo / Naranja
      icon: 'battery-dead',
      actionSummary: 'Reduce la tasa de muestreo de sensores a modo pasivo, apaga animaciones y fuerza tema Black OLED.',
      behaviorChanges: [
        'Atenúa la interfaz visual con alto contraste OLED (ahorro de panel de pantalla).',
        'Reduce el refresco del Acelerómetro/Giroscopio (suspende lectura continua de 60 Hz).',
        'Aumenta el intervalo de geolocalización GPS a sondeo cada 30 segundos (ahorro del 65% de energía).',
        'Oculta transiciones CSS fluidas y animaciones de radar.'
      ]
    };

    const rules = [rule1, rule2, rule3];
    const activeCount = rules.filter(r => r.isActive).length;

    const current = this.stateSubject.getValue();
    this.stateSubject.next({
      variables: v,
      rules,
      activeRulesCount: activeCount,
      vipUnlocked: rule1Active,
      offlineModeActive: rule2Active,
      ecoModeActive: rule3Active,
      checkInDone: current.checkInDone && rule1Active,
      lastHapticMessage: current.lastHapticMessage
    });
  }

  // ================= SIMULADOR DE ESCENARIOS DE PRUEBA =================
  /**
   * Permite validar al 100% los 3 escenarios exigidos desde la app física o navegador.
   */
  public applyScenario(scenarioId: 'escenario_1' | 'escenario_2' | 'escenario_3' | 'normal' | 'real') {
    switch (scenarioId) {
      case 'escenario_1':
        // Escenario 1: En Zona de Estadio (< 2 km) + Conexión Online -> DISPARA REGLA 1 (VIP)
        this.currentScenarioName = 'Escenario 1: En Estadio (0.8 km) + Online';
        this.simulationOverride = {
          insideZone: true,
          closestVenueName: 'Estadio Francisco Sarabia (Durango)',
          distanceKm: 0.8,
          isOnline: true,
          connectionType: 'wifi',
          batteryLevel: 78,
          isLowBattery: false,
          isCharging: false,
          isSimulated: true,
          activeScenarioName: this.currentScenarioName
        };
        this.triggerHaptic(ImpactStyle.Medium, 'Escenario 1 Aplicado: Modo Fan VIP Activo');
        break;

      case 'escenario_2':
        // Escenario 2: Pérdida de Conexión (Offline) -> DISPARA REGLA 2 (Offline Cache)
        this.currentScenarioName = 'Escenario 2: Sin Conexión (Offline)';
        this.simulationOverride = {
          isOnline: false,
          connectionType: 'none',
          insideZone: false,
          closestVenueName: 'Estadio Corona (TSM)',
          distanceKm: 215.4,
          batteryLevel: 62,
          isLowBattery: false,
          isCharging: false,
          isSimulated: true,
          activeScenarioName: this.currentScenarioName
        };
        this.triggerHaptic(ImpactStyle.Heavy, 'Escenario 2 Aplicado: Modo Resiliencia Offline');
        break;

      case 'escenario_3':
        // Escenario 3: Batería Crítica (12%) sin cargar -> DISPARA REGLA 3 (Eco-Saver)
        this.currentScenarioName = 'Escenario 3: Batería Crítica (14%) Desconectada';
        this.simulationOverride = {
          batteryLevel: 14,
          isLowBattery: true,
          isCharging: false,
          insideZone: false,
          closestVenueName: 'Estadio BBVA (Monterrey)',
          distanceKm: 510.2,
          isOnline: true,
          connectionType: 'cellular',
          isSimulated: true,
          activeScenarioName: this.currentScenarioName
        };
        this.triggerHaptic(ImpactStyle.Heavy, 'Escenario 3 Aplicado: Modo Eco-Ahorro Activo');
        break;

      case 'normal':
        // Escenario Base: En la ciudad, con internet y batería saludable -> Ninguna regla extrema
        this.currentScenarioName = 'Escenario Base: Fuera de Estadio (18 km) + Online';
        this.simulationOverride = {
          insideZone: false,
          closestVenueName: 'Estadio Francisco Sarabia',
          distanceKm: 18.2,
          isOnline: true,
          connectionType: 'wifi',
          batteryLevel: 88,
          isLowBattery: false,
          isCharging: false,
          isSimulated: true,
          activeScenarioName: this.currentScenarioName
        };
        this.triggerHaptic(ImpactStyle.Light, 'Escenario Base Normal');
        break;

      case 'real':
      default:
        // Volver a lectura real de hardware
        this.currentScenarioName = 'Sensores en Vivo (Modo Real)';
        this.simulationOverride = null;
        this.triggerHaptic(ImpactStyle.Light, 'Control devuelto a los sensores físicos');
        break;
    }

    // Recalcular de inmediato con las nuevas variables
    const current = this.stateSubject.getValue();
    const vars: ContextVariables = this.simulationOverride
      ? { ...current.variables, ...this.simulationOverride }
      : { ...current.variables, isSimulated: false, activeScenarioName: this.currentScenarioName };
    this.recomputeRules(vars);
  }

  // ================= ACCIONES DE CONTEXTO =================
  public async performVipCheckIn(): Promise<boolean> {
    const current = this.stateSubject.getValue();
    if (!current.vipUnlocked) {
      return false;
    }

    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }

    this.stateSubject.next({
      ...current,
      checkInDone: true,
      lastHapticMessage: '¡Check-in VIP confirmado con éxito! Credencial activa.'
    });

    return true;
  }

  private async triggerHaptic(style: ImpactStyle, msg: string) {
    try {
      await Haptics.impact({ style });
    } catch {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
    const current = this.stateSubject.getValue();
    this.stateSubject.next({
      ...current,
      lastHapticMessage: msg
    });
  }
}
