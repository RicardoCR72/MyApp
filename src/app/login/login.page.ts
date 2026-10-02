import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiDiagnostic, ApiDiagnosticService } from '../services/api-diagnostic.service';
import { ConnectionService } from '../services/connection.service';
import { NetworkService } from '../services/network.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly connectionService = inject(ConnectionService);
  private readonly diagnosticService = inject(ApiDiagnosticService);
  private readonly networkService = inject(NetworkService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);

  username = '';
  password = '';
  serverIp = '';
  usernameFocused = false;
  passwordFocused = false;
  serverFocused = false;
  isTesting = false;
  isMoved = false;
  showAuthenticating = false;
  showLoginContent = true;
  showSuccess = false;
  isAnimating = false;
  errorMessage = '';
  connectionDiagnostic: ApiDiagnostic | null = null;

  get destinationPreview(): string {
    const ip = this.serverIp.trim() || '192.168.1.71';
    return `http://${ip}:80/miapp-api/login.php`;
  }

  get currentNetworkStatus(): string {
    return this.networkService.label();
  }

  ionViewWillEnter(): void {
    this.serverIp = this.connectionService.getHost();
    if (this.authService.isAuthenticated()) {
      void this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
    }
  }

  async login(): Promise<void> {
    if (this.isAnimating) return;

    this.errorMessage = '';
    if (!this.serverIp.trim() || !this.username.trim() || !this.password) {
      this.errorMessage = 'Escribe la IP, el usuario y la contraseña.';
      this.changeDetector.detectChanges();
      return;
    }

    try {
      await this.connectionService.setHost(this.serverIp);
      this.serverIp = this.connectionService.getHost();
    } catch (error: unknown) {
      this.errorMessage = error instanceof Error ? error.message : 'La IP no es valida.';
      this.changeDetector.detectChanges();
      return;
    }

    this.isAnimating = true;
    this.isTesting = true;
    this.showSuccess = false;
    this.changeDetector.detectChanges();

    await this.pause(250);
    this.isMoved = true;
    this.changeDetector.detectChanges();

    await this.pause(200);
    this.showAuthenticating = true;
    this.changeDetector.detectChanges();

    try {
      await Promise.all([
        this.pause(900),
        this.authService.login({
          username: this.username.trim(),
          password: this.password
        })
      ]);
      this.connectionDiagnostic = this.diagnosticService.getLast();

      this.showAuthenticating = false;
      this.changeDetector.detectChanges();
      await this.pause(350);

      this.showLoginContent = false;
      this.showSuccess = true;
      this.isMoved = false;
      this.isTesting = false;
      this.isAnimating = false;
      this.changeDetector.detectChanges();

      await this.pause(900);
      await this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
    } catch (error: unknown) {
      this.showAuthenticating = false;
      this.changeDetector.detectChanges();
      await this.pause(350);

      this.isMoved = false;
      this.isTesting = false;
      this.isAnimating = false;
      this.errorMessage = this.authService.getErrorMessage(error);
      this.connectionDiagnostic = this.diagnosticService.getLast();
      this.changeDetector.detectChanges();
    }
  }

  private pause(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }
}
