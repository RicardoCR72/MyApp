import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);

  username = '';
  password = '';
  usernameFocused = false;
  passwordFocused = false;
  isTesting = false;
  isMoved = false;
  showAuthenticating = false;
  showLoginContent = true;
  showSuccess = false;
  isAnimating = false;
  errorMessage = '';

  async login(): Promise<void> {
    if (this.isAnimating) return;

    this.errorMessage = '';
    if (!this.username.trim() || !this.password) {
      this.errorMessage = 'Escribe tu usuario y contraseña.';
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
      this.changeDetector.detectChanges();
    }
  }

  private pause(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }
}
