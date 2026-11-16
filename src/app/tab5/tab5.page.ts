import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GeoService, GeoState, SportVenue } from '../services/geo.service';

@Component({
  selector: 'app-tab5',
  templateUrl: 'tab5.page.html',
  styleUrls: ['tab5.page.scss'],
  standalone: false
})
export class Tab5Page implements OnInit, OnDestroy {
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

  private sub?: Subscription;

  constructor(
    public geoService: GeoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.sub = this.geoService.state.subscribe(state => {
      this.geoState = state;
      this.refreshVenues();
    });
  }

  ionViewWillEnter() {
    this.refreshVenues();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

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
