import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { AuthService, AuthUser } from '../services/auth.service';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  standalone: false
})
export class Tab1Page {
  private static readonly AVATAR_KEY = 'user_custom_avatar_image';
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  currentUser: AuthUser | null = null;
  sessionRestored = false;
  avatarImage: string | null = null;
  showAvatarPicker = false;

  presetAvatars = [
    { label: '⚾ Béisbol', emoji: '⚾', bg: 'linear-gradient(135deg, #1e3c72, #2a5298)' },
    { label: '🏈 NFL', emoji: '🏈', bg: 'linear-gradient(135deg, #b31217, #e52d27)' },
    { label: '📊 Analista', emoji: '📊', bg: 'linear-gradient(135deg, #11998e, #38ef7d)' },
    { label: '🤖 IA Oráculo', emoji: '🤖', bg: 'linear-gradient(135deg, #7f00ff, #e100ff)' },
    { label: '⭐ Pro Pick', emoji: '⭐', bg: 'linear-gradient(135deg, #f7971e, #ffd200)' }
  ];

  async ionViewWillEnter(): Promise<void> {
    this.currentUser = this.authService.getCurrentUser();
    this.sessionRestored = this.authService.wasRestoredFromPreferences();
    const stored = await Preferences.get({ key: Tab1Page.AVATAR_KEY });
    this.avatarImage = stored.value || null;
  }

  toggleAvatarPicker(): void {
    this.showAvatarPicker = !this.showAvatarPicker;
  }

  async selectPresetAvatar(avatar: { emoji: string; bg: string }): Promise<void> {
    this.avatarImage = `data:text/plain;utf8,${avatar.emoji}`;
    await Preferences.set({ key: Tab1Page.AVATAR_KEY, value: this.avatarImage });
    this.showAvatarPicker = false;
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      this.avatarImage = reader.result as string;
      await Preferences.set({ key: Tab1Page.AVATAR_KEY, value: this.avatarImage });
      this.showAvatarPicker = false;
    };
    reader.readAsDataURL(file);
  }

  async removeAvatar(): Promise<void> {
    this.avatarImage = null;
    await Preferences.remove({ key: Tab1Page.AVATAR_KEY });
    this.showAvatarPicker = false;
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
