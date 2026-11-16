import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
}

export interface GeoState {
  status: 'idle' | 'requesting' | 'tracking' | 'granted' | 'denied' | 'error';
  coords: GeoCoordinates | null;
  timestamp: Date | null;
  errorMessage: string | null;
  errorCode: number | null;
  isSimulated: boolean;
  simulationName?: string;
}

export interface SportVenue {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  league: 'MLB' | 'NFL' | 'LIGA_MX' | 'POLI';
  latitude: number;
  longitude: number;
  capacity: number;
  team: string;
  emoji: string;
  distanceKm?: number;
  bearing?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeoService {
  private watchId: number | null = null;

  // Sedes deportivas emblemáticas (Contexto deportivo Oráculo / MiApp)
  private venues: SportVenue[] = [
    {
      id: 'sarabia-dgo',
      name: 'Estadio Francisco Sarabia',
      city: 'Durango',
      state: 'Durango',
      country: 'México',
      league: 'POLI',
      latitude: 24.0277,
      longitude: -104.6532,
      capacity: 5000,
      team: 'Polideportivo Durango',
      emoji: '🏟️'
    },
    {
      id: 'villa-dgo',
      name: 'Estadio Francisco Villa (Generales)',
      city: 'Durango',
      state: 'Durango',
      country: 'México',
      league: 'MLB',
      latitude: 24.0321,
      longitude: -104.6409,
      capacity: 4983,
      team: 'Caliente de Durango (LMB/Béisbol)',
      emoji: '⚾'
    },
    {
      id: 'corona-trc',
      name: 'Estadio Corona (TSM)',
      city: 'Torreón',
      state: 'Coahuila',
      country: 'México',
      league: 'LIGA_MX',
      latitude: 25.6267,
      longitude: -103.4144,
      capacity: 29237,
      team: 'Santos Laguna',
      emoji: '⚽'
    },
    {
      id: 'revolucion-trc',
      name: 'Estadio de la Revolución',
      city: 'Torreón',
      state: 'Coahuila',
      country: 'México',
      league: 'MLB',
      latitude: 25.5398,
      longitude: -103.4357,
      capacity: 9500,
      team: 'Algodoneros de Unión Laguna (LMB)',
      emoji: '⚾'
    },
    {
      id: 'azteca',
      name: 'Estadio Azteca',
      city: 'Ciudad de México',
      state: 'CDMX',
      country: 'México',
      league: 'LIGA_MX',
      latitude: 19.3029,
      longitude: -99.1505,
      capacity: 83264,
      team: 'Club América / Selección Mexicana / NFL Games',
      emoji: '⚽'
    },
    {
      id: 'harp-helu',
      name: 'Estadio Alfredo Harp Helú',
      city: 'Ciudad de México',
      state: 'CDMX',
      country: 'México',
      league: 'MLB',
      latitude: 19.4038,
      longitude: -99.0911,
      capacity: 20576,
      team: 'Diablos Rojos del México / MLB Mexico Series',
      emoji: '⚾'
    },
    {
      id: 'bbva-mty',
      name: 'Estadio BBVA (Gigante de Acero)',
      city: 'Guadalupe',
      state: 'Nuevo León',
      country: 'México',
      league: 'LIGA_MX',
      latitude: 25.6698,
      longitude: -100.2447,
      capacity: 53500,
      team: 'Rayados de Monterrey',
      emoji: '⚽'
    },
    {
      id: 'akron-gdl',
      name: 'Estadio Akron',
      city: 'Zapopan',
      state: 'Jalisco',
      country: 'México',
      league: 'LIGA_MX',
      latitude: 20.6816,
      longitude: -103.4627,
      capacity: 46232,
      team: 'Chivas de Guadalajara',
      emoji: '⚽'
    },
    {
      id: 'att-dallas',
      name: 'AT&T Stadium',
      city: 'Arlington',
      state: 'Texas',
      country: 'EE.UU.',
      league: 'NFL',
      latitude: 32.7473,
      longitude: -97.0945,
      capacity: 80000,
      team: 'Dallas Cowboys',
      emoji: '🏈'
    },
    {
      id: 'minute-maid-houston',
      name: 'Daikin Park (Minute Maid)',
      city: 'Houston',
      state: 'Texas',
      country: 'EE.UU.',
      league: 'MLB',
      latitude: 29.7573,
      longitude: -95.3555,
      capacity: 41168,
      team: 'Houston Astros',
      emoji: '⚾'
    },
    {
      id: 'dodger-stadium',
      name: 'Dodger Stadium',
      city: 'Los Ángeles',
      state: 'California',
      country: 'EE.UU.',
      league: 'MLB',
      latitude: 34.0739,
      longitude: -118.2400,
      capacity: 56000,
      team: 'Los Angeles Dodgers',
      emoji: '⚾'
    },
    {
      id: 'sofi-stadium',
      name: 'SoFi Stadium',
      city: 'Inglewood',
      state: 'California',
      country: 'EE.UU.',
      league: 'NFL',
      latitude: 33.9535,
      longitude: -118.3392,
      capacity: 70240,
      team: 'LA Rams / LA Chargers',
      emoji: '🏈'
    }
  ];

  private state$ = new BehaviorSubject<GeoState>({
    status: 'idle',
    coords: null,
    timestamp: null,
    errorMessage: null,
    errorCode: null,
    isSimulated: false
  });

  constructor() {
    this.checkInitialPermission();
  }

  get state(): Observable<GeoState> {
    return this.state$.asObservable();
  }

  get currentState(): GeoState {
    return this.state$.getValue();
  }

  get isGeolocationAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  private async checkInitialPermission() {
    if (!this.isGeolocationAvailable) {
      this.state$.next({
        ...this.currentState,
        status: 'error',
        errorMessage: 'La API de Geolocalización no está soportada en este navegador o entorno.',
        errorCode: -1
      });
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        if (perm.state === 'granted') {
          // Permiso ya concedido previamente, obtenemos posición automáticamente
          this.requestCurrentPosition();
        } else if (perm.state === 'denied') {
          this.state$.next({
            ...this.currentState,
            status: 'denied',
            errorMessage: 'El permiso de ubicación fue denegado en la configuración del navegador.',
            errorCode: 1
          });
        }

        perm.onchange = () => {
          if (perm.state === 'granted') {
            this.requestCurrentPosition();
          } else if (perm.state === 'denied') {
            this.state$.next({
              ...this.currentState,
              status: 'denied',
              errorMessage: 'El permiso de ubicación fue revocado por el usuario.',
              errorCode: 1
            });
          }
        };
      } catch (e) {
        // En algunos navegadores query({ name: 'geolocation' }) puede fallar silenciosamente
      }
    }
  }

  /**
   * Solicita explícitamente el permiso y obtiene la posición actual
   */
  public requestCurrentPosition(highAccuracy: boolean = true): Promise<GeoCoordinates> {
    return new Promise((resolve, reject) => {
      if (!this.isGeolocationAvailable) {
        const errorMsg = 'La geolocalización no está soportada en este dispositivo.';
        this.state$.next({
          status: 'error',
          coords: null,
          timestamp: new Date(),
          errorMessage: errorMsg,
          errorCode: -1,
          isSimulated: false
        });
        reject(new Error(errorMsg));
        return;
      }

      this.state$.next({
        ...this.currentState,
        status: 'requesting',
        errorMessage: null,
        errorCode: null
      });

      const options: PositionOptions = {
        enableHighAccuracy: highAccuracy,
        timeout: 15000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const coords: GeoCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed
          };

          this.state$.next({
            status: 'granted',
            coords,
            timestamp: new Date(position.timestamp),
            errorMessage: null,
            errorCode: null,
            isSimulated: false
          });

          resolve(coords);
        },
        (error: GeolocationPositionError) => {
          let userMsg = 'Error al obtener la ubicación.';
          if (error.code === error.PERMISSION_DENIED) {
            userMsg = 'Permiso denegado: Por favor habilita el acceso a la ubicación en el icono de candado o configuración.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            userMsg = 'Señal de GPS no disponible o ubicación desactivada en el dispositivo.';
          } else if (error.code === error.TIMEOUT) {
            userMsg = 'Tiempo de espera agotado al intentar conectar con satélites GPS / Red.';
          }

          this.state$.next({
            status: error.code === error.PERMISSION_DENIED ? 'denied' : 'error',
            coords: null,
            timestamp: new Date(),
            errorMessage: userMsg,
            errorCode: error.code,
            isSimulated: false
          });

          reject(error);
        },
        options
      );
    });
  }

  /**
   * Activa el seguimiento de posición en tiempo real (watchPosition)
   */
  public startTracking(): void {
    if (!this.isGeolocationAvailable) return;
    if (this.watchId !== null) return;

    this.state$.next({
      ...this.currentState,
      status: 'tracking',
      errorMessage: null,
      errorCode: null
    });

    this.watchId = navigator.geolocation.watchPosition(
      (pos: GeolocationPosition) => {
        const coords: GeoCoordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed
        };

        this.state$.next({
          status: 'tracking',
          coords,
          timestamp: new Date(pos.timestamp),
          errorMessage: null,
          errorCode: null,
          isSimulated: false
        });
      },
      (err: GeolocationPositionError) => {
        this.stopTracking();
        this.state$.next({
          status: err.code === err.PERMISSION_DENIED ? 'denied' : 'error',
          coords: null,
          timestamp: new Date(),
          errorMessage: err.message || 'Error en el seguimiento de posición.',
          errorCode: err.code,
          isSimulated: false
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 2000
      }
    );
  }

  public stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.currentState.status === 'tracking') {
      this.state$.next({
        ...this.currentState,
        status: 'granted'
      });
    }
  }

  /**
   * Simula una ubicación (ideal para pruebas en emuladores o si no hay señal satelital)
   */
  public setSimulatedLocation(lat: number, lon: number, locationName: string): void {
    this.stopTracking();
    const coords: GeoCoordinates = {
      latitude: lat,
      longitude: lon,
      accuracy: 10,
      altitude: 1890,
      heading: null,
      speed: null
    };

    this.state$.next({
      status: 'granted',
      coords,
      timestamp: new Date(),
      errorMessage: null,
      errorCode: null,
      isSimulated: true,
      simulationName: locationName
    });
  }

  /**
   * Cálculo de Distancia mediante la Fórmula del Semiverseno (Haversine Formula)
   * Retorna la distancia en kilómetros con 2 decimales
   */
  public calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Math.round(d * 100) / 100;
  }

  /**
   * Calcula el rumbo o dirección cardinal entre dos coordenadas
   */
  public calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): string {
    const dLon = this.deg2rad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(this.deg2rad(lat2));
    const x =
      Math.cos(this.deg2rad(lat1)) * Math.sin(this.deg2rad(lat2)) -
      Math.sin(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.cos(dLon);

    let brng = Math.atan2(y, x);
    brng = (brng * 180 / Math.PI + 360) % 360;

    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(brng / 45) % 8;
    return directions[index];
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Obtiene la lista de sedes deportivas con distancias calculadas y ordenadas por proximidad
   */
  public getVenuesWithDistance(filterLeague?: string, maxRadiusKm?: number): SportVenue[] {
    const currentCoords = this.currentState.coords;

    let list = this.venues.map(v => {
      let distanceKm: number | undefined;
      let bearing: string | undefined;

      if (currentCoords) {
        distanceKm = this.calculateDistance(
          currentCoords.latitude,
          currentCoords.longitude,
          v.latitude,
          v.longitude
        );
        bearing = this.calculateBearing(
          currentCoords.latitude,
          currentCoords.longitude,
          v.latitude,
          v.longitude
        );
      }

      return {
        ...v,
        distanceKm,
        bearing
      };
    });

    if (filterLeague && filterLeague !== 'ALL') {
      list = list.filter(v => v.league === filterLeague);
    }

    if (maxRadiusKm && maxRadiusKm > 0) {
      list = list.filter(v => v.distanceKm !== undefined && v.distanceKm <= maxRadiusKm);
    }

    // Ordenar de más cercano a más lejano
    list.sort((a, b) => {
      if (a.distanceKm === undefined) return 1;
      if (b.distanceKm === undefined) return -1;
      return a.distanceKm - b.distanceKm;
    });

    return list;
  }

  public getAllVenues(): SportVenue[] {
    return [...this.venues];
  }
}
