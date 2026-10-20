import { Component, inject } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import {
  CreateUserInput,
  UserRecord,
  UserRole,
  UserService,
  UserStatus
} from '../services/user.service';
import { ApiDiagnosticService } from '../services/api-diagnostic.service';
import { ApiErrorModalService } from '../services/api-error-modal.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {
  private readonly userService = inject(UserService);
  private readonly diagnosticService = inject(ApiDiagnosticService);
  private readonly errorModalService = inject(ApiErrorModalService);
  private readonly loadingCtrl = inject(LoadingController);

  users: UserRecord[] = [];
  isLoading = false;
  isSaving = false;
  showForm = false;
  editingUserId: number | null = null;
  updateMethod: 'PATCH' | 'PUT' = 'PATCH';
  errorMessage = '';
  successMessage = '';
  cacheMessage = '';

  form: CreateUserInput = this.emptyForm();

  ionViewWillEnter(): void {
    void this.loadUsers();
  }

  async loadUsers(event?: { target?: { complete?: () => void } }): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    this.cacheMessage = '';
    try {
      this.users = await this.userService.list();
      const state = this.userService.getLoadState();
      if (state.source === 'cache') {
        this.cacheMessage = `Sin conexión con la API. Mostrando usuarios guardados el ${this.formatCacheDate(state.savedAt)}.`;
      }
    } catch (error: unknown) {
      this.errorMessage = this.userService.getErrorMessage(error);
      await this.errorModalService.present(this.diagnosticService.getLast());
    } finally {
      this.isLoading = false;
      event?.target?.complete?.();
    }
  }

  openCreateForm(): void {
    this.editingUserId = null;
    this.form = this.emptyForm();
    this.clearMessages();
    this.showForm = true;
  }

  openEditForm(user: UserRecord): void {
    this.editingUserId = user.id;
    this.form = {
      username: user.username,
      email: user.email,
      password: '',
      fullName: user.fullName,
      role: user.role,
      status: user.status
    };
    this.clearMessages();
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingUserId = null;
    this.form = this.emptyForm();
  }

  async saveUser(): Promise<void> {
    this.clearMessages();
    if (!this.form.username.trim() || !this.form.email.trim() || !this.form.fullName.trim()) {
      this.errorMessage = 'Completa el usuario, correo y nombre.';
      return;
    }
    if (this.editingUserId === null && this.form.password.length < 8) {
      this.errorMessage = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    const actionText = this.editingUserId === null
      ? 'Creando usuario (POST)...'
      : this.updateMethod === 'PUT'
        ? 'Reemplazando usuario (PUT)...'
        : 'Actualizando usuario (PATCH)...';

    const loading = await this.presentLoading(actionText);
    this.isSaving = true;

    try {
      if (this.editingUserId === null) {
        await this.userService.create({
          ...this.form,
          username: this.form.username.trim(),
          email: this.form.email.trim(),
          fullName: this.form.fullName.trim()
        });
        this.successMessage = 'Usuario creado correctamente (POST 201).';
      } else {
        const update = {
          username: this.form.username.trim(),
          email: this.form.email.trim(),
          fullName: this.form.fullName.trim(),
          role: this.form.role,
          status: this.form.status,
          ...(this.form.password ? { password: this.form.password } : {})
        };

        if (this.updateMethod === 'PUT') {
          await this.userService.update(this.editingUserId, update);
          this.successMessage = 'Usuario reemplazado completamente (PUT 200).';
        } else {
          await this.userService.patch(this.editingUserId, update);
          this.successMessage = 'Usuario actualizado parcialmente (PATCH 200).';
        }
      }

      this.showForm = false;
      this.editingUserId = null;
      this.form = this.emptyForm();
      await this.loadUsers();
    } catch (error: unknown) {
      this.errorMessage = this.userService.getErrorMessage(error);
      await this.errorModalService.present(this.diagnosticService.getLast());
    } finally {
      this.isSaving = false;
      await loading.dismiss();
    }
  }

  async deleteUser(user: UserRecord): Promise<void> {
    const confirmed = window.confirm(`¿Eliminar al usuario ${user.username}? Esta acción ejecutará DELETE en la API.`);
    if (!confirmed) return;

    this.clearMessages();
    const loading = await this.presentLoading('Eliminando usuario (DELETE)...');

    try {
      await this.userService.remove(user.id);
      this.successMessage = `Usuario @${user.username} eliminado correctamente (DELETE 200).`;
      await this.loadUsers();
    } catch (error: unknown) {
      this.errorMessage = this.userService.getErrorMessage(error);
      await this.errorModalService.present(this.diagnosticService.getLast());
    } finally {
      await loading.dismiss();
    }
  }

  private async presentLoading(message: string): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingCtrl.create({
      message,
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }

  statusLabel(status: UserStatus): string {
    return ({ active: 'Activo', inactive: 'Inactivo', blocked: 'Bloqueado' })[status];
  }

  statusColor(status: UserStatus): string {
    return ({ active: 'success', inactive: 'medium', blocked: 'danger' })[status];
  }

  roleLabel(role: UserRole): string {
    return role === 'admin' ? 'Administrador' : 'Usuario';
  }

  private emptyForm(): CreateUserInput {
    return {
      username: '',
      email: '',
      password: '',
      fullName: '',
      role: 'user',
      status: 'active'
    };
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.cacheMessage = '';
  }

  private formatCacheDate(value: string | null): string {
    return value ? new Date(value).toLocaleString('es-MX') : 'momento desconocido';
  }
}
