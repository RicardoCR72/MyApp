import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, AuthUser } from '../services/auth.service';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  standalone: false
})
export class Tab1Page {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  currentUser: AuthUser | null = null;
  sessionRestored = false;

  ionViewWillEnter(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.sessionRestored = this.authService.wasRestoredFromPreferences();
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
