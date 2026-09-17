import { Component, inject } from '@angular/core';
import { AuthService, AuthUser } from '../services/auth.service';

interface OracleMarket {
  line: string;
  calibration: string;
  description: string;
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page {
  private readonly authService = inject(AuthService);

  currentUser: AuthUser | null = null;

  readonly markets: OracleMarket[] = [
    {
      line: 'F5 3.5',
      calibration: 'Beta / binomial',
      description: 'Probabilidad calibrada para Over y Under en las primeras cinco entradas.'
    },
    {
      line: 'F5 4.5',
      calibration: 'Platt',
      description: 'Mercado principal del modelo con ajuste probabilístico fuera de muestra.'
    },
    {
      line: 'F5 5.5',
      calibration: 'Residual empírico',
      description: 'Estimación para juegos con mayor expectativa ofensiva en F5.'
    }
  ];

  ionViewWillEnter(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

}
