import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { GeoService, GeoState, SportVenue } from '../services/geo.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
  standalone: false
})
export class Tab4Page implements AfterViewInit, OnDestroy {
  public mapMode: 'leaflet' | 'leafmap' = 'leaflet';
  public leafmapUrl: SafeResourceUrl;

  public map?: L.Map;
  public userMarker?: L.Marker;
  public accuracyCircle?: L.Circle;
  public venueMarkers: Map<string, L.Marker> = new Map();
  public connectionLine?: L.Polyline;

  public geoState: GeoState = {
    status: 'idle',
    coords: null,
    timestamp: null,
    errorMessage: null,
    errorCode: null,
    isSimulated: false
  };

  public venues: SportVenue[] = [];
  public closestVenue?: SportVenue;
  public selectedVenue?: SportVenue;
  public isSheetExpanded: boolean = true;
  public copySuccess: boolean = false;

  private sub?: Subscription;

  constructor(
    public geoService: GeoService,
    private sanitizer: DomSanitizer
  ) {
    this.leafmapUrl = this.sanitizer.bypassSecurityTrustResourceUrl('assets/leafmap/leafmap_map.html');
  }

  ngAfterViewInit() {
    this.initMap();
    this.sub = this.geoService.state.subscribe(state => {
      this.geoState = state;
      this.venues = this.geoService.getVenuesWithDistance();
      if (this.venues.length > 0 && this.venues[0].distanceKm !== undefined) {
        this.closestVenue = this.venues[0];
        if (!this.selectedVenue) {
          this.selectedVenue = this.closestVenue;
        }
      }
      this.updateUserPositionOnMap();
    });

    // Solicitar ubicación al iniciar si aún no se ha pedido
    if (!this.geoState.coords && this.geoState.status === 'idle') {
      this.geoService.requestCurrentPosition().catch(() => {});
    }
  }

  ionViewDidEnter() {
    setTimeout(() => {
      if (this.map && this.mapMode === 'leaflet') {
        this.map.invalidateSize();
      }
    }, 200);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    if (this.map) {
      this.map.remove();
    }
  }

  public onMapModeChange(event: any) {
    this.mapMode = event.detail.value;
    if (this.mapMode === 'leaflet') {
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        } else {
          this.initMap();
        }
      }, 150);
    }
  }

  private initMap() {
    const el = document.getElementById('leaflet-map');
    if (!el || this.map) return;

    const initialLat = this.geoState.coords ? this.geoState.coords.latitude : 24.0277;
    const initialLon = this.geoState.coords ? this.geoState.coords.longitude : -104.6532;
    const initialZoom = this.geoState.coords ? 13 : 5;

    this.map = L.map('leaflet-map', {
      zoomControl: false, // Usaremos botones flotantes modernos
      attributionControl: false
    }).setView([initialLat, initialLon], initialZoom);

    // Mosaicos oficiales Esri WorldTopoMap (libres de bloqueo 403)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    }).addTo(this.map);

    this.renderVenueMarkers();

    if (this.geoState.coords) {
      this.updateUserPositionOnMap();
    }
  }

  public renderVenueMarkers() {
    if (!this.map) return;

    this.venueMarkers.forEach(m => m.remove());
    this.venueMarkers.clear();

    this.venues = this.geoService.getVenuesWithDistance();
    if (this.venues.length > 0 && this.venues[0].distanceKm !== undefined) {
      this.closestVenue = this.venues[0];
      if (!this.selectedVenue) {
        this.selectedVenue = this.closestVenue;
      }
    }

    this.venues.forEach(venue => {
      const markerHtml = `
        <div class="venue-marker ${venue.league.toLowerCase()}">
          <span>${venue.emoji}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-venue-icon-wrapper',
        html: markerHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
      });

      const distText = venue.distanceKm !== undefined
        ? `<div class="dist-tag">📍 A ${venue.distanceKm} km (${venue.bearing || ''})</div>`
        : '';

      const popupContent = `
        <div class="custom-popup">
          <h3>${venue.name}</h3>
          <p><strong>Equipo:</strong> ${venue.team}</p>
          <p><strong>Ciudad:</strong> ${venue.city}, ${venue.country}</p>
          ${distText}
        </div>
      `;

      const marker = L.marker([venue.latitude, venue.longitude], { icon: customIcon })
        .bindPopup(popupContent)
        .addTo(this.map!);

      marker.on('click', () => {
        this.selectedVenue = venue;
        this.isSheetExpanded = true;
      });

      this.venueMarkers.set(venue.id, marker);
    });

    this.drawRouteToClosest();
  }

  public updateUserPositionOnMap() {
    if (!this.map) return;

    const coords = this.geoState.coords;
    if (!coords) {
      if (this.userMarker) {
        this.userMarker.remove();
        this.userMarker = undefined;
      }
      if (this.accuracyCircle) {
        this.accuracyCircle.remove();
        this.accuracyCircle = undefined;
      }
      if (this.connectionLine) {
        this.connectionLine.remove();
        this.connectionLine = undefined;
      }
      return;
    }

    const latLng = L.latLng(coords.latitude, coords.longitude);

    if (!this.userMarker) {
      const userHtml = `
        <div class="user-marker-pin">
          <div class="user-marker-pulse"></div>
        </div>
      `;

      const userIcon = L.divIcon({
        className: 'user-pin-wrapper',
        html: userHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      this.userMarker = L.marker(latLng, { icon: userIcon, zIndexOffset: 1000 })
        .bindPopup(`<b>Tu Ubicación</b><br>${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}<br>±${coords.accuracy.toFixed(0)}m`)
        .addTo(this.map);
    } else {
      this.userMarker.setLatLng(latLng);
    }

    if (!this.accuracyCircle) {
      this.accuracyCircle = L.circle(latLng, {
        radius: Math.max(coords.accuracy, 20),
        color: '#3880ff',
        fillColor: '#3880ff',
        fillOpacity: 0.18,
        weight: 1.5
      }).addTo(this.map);
    } else {
      this.accuracyCircle.setLatLng(latLng);
      this.accuracyCircle.setRadius(Math.max(coords.accuracy, 20));
    }

    this.renderVenueMarkers();
  }

  private drawRouteToClosest() {
    if (!this.map || !this.geoState.coords) return;

    this.venues = this.geoService.getVenuesWithDistance();
    if (this.venues.length === 0 || this.venues[0].distanceKm === undefined) return;

    this.closestVenue = this.venues[0];
    const target = this.selectedVenue || this.closestVenue;

    const userPoint: [number, number] = [this.geoState.coords.latitude, this.geoState.coords.longitude];
    const venuePoint: [number, number] = [target.latitude, target.longitude];

    if (this.connectionLine) {
      this.connectionLine.setLatLngs([userPoint, venuePoint]);
    } else {
      this.connectionLine = L.polyline([userPoint, venuePoint], {
        color: '#2dd55b',
        weight: 3.5,
        dashArray: '8, 8',
        opacity: 0.9
      }).addTo(this.map);
    }
  }

  public recenterOnUser() {
    if (!this.map) return;
    if (this.geoState.coords) {
      this.map.flyTo([this.geoState.coords.latitude, this.geoState.coords.longitude], 14, {
        duration: 1.2
      });
      if (this.userMarker) {
        this.userMarker.openPopup();
      }
    } else {
      this.geoService.requestCurrentPosition();
    }
  }

  public selectAndFlyToVenue(venue: SportVenue) {
    this.selectedVenue = venue;
    this.drawRouteToClosest();
    if (!this.map) return;
    this.map.flyTo([venue.latitude, venue.longitude], 15, {
      duration: 1.2
    });
    const marker = this.venueMarkers.get(venue.id);
    if (marker) {
      marker.openPopup();
    }
  }

  public requestLocation() {
    this.geoService.requestCurrentPosition();
  }

  public copyCoords() {
    if (!this.geoState.coords) return;
    const text = `${this.geoState.coords.latitude.toFixed(6)}, ${this.geoState.coords.longitude.toFixed(6)}`;
    navigator.clipboard?.writeText(text).then(() => {
      this.copySuccess = true;
      setTimeout(() => (this.copySuccess = false), 2500);
    });
  }

  public toggleSheet() {
    this.isSheetExpanded = !this.isSheetExpanded;
  }
}
