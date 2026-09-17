import { Component, inject } from '@angular/core';
import {
  CreateUserInput,
  UserRecord,
  UserRole,
  UserService,
  UserStatus
} from '../services/user.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {
  private readonly userService = inject(UserService);

  users: UserRecord[] = [];
  isLoading = false;
  isSaving = false;
  showForm = false;
  editingUserId: number | null = null;
  errorMessage = '';
  successMessage = '';

  form: CreateUserInput = this.emptyForm();

  ionViewWillEnter(): void {
    void this.loadUsers();
  }

  async loadUsers(event?: { target?: { complete?: () => void } }): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      this.users = await this.userService.list();
    } catch (error: unknown) {
      this.errorMessage = this.userService.getErrorMessage(error);
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

    this.isSaving = true;
    try {
      if (this.editingUserId === null) {
        await this.userService.create({
          ...this.form,
          username: this.form.username.trim(),
          email: this.form.email.trim(),
          fullName: this.form.fullName.trim()
        });
        this.successMessage = 'Usuario creado correctamente.';
      } else {
        const update = {
          username: this.form.username.trim(),
          email: this.form.email.trim(),
          fullName: this.form.fullName.trim(),
          role: this.form.role,
          status: this.form.status,
          ...(this.form.password ? { password: this.form.password } : {})
        };
        await this.userService.patch(this.editingUserId, update);
        this.successMessage = 'Usuario actualizado correctamente.';
      }

      this.showForm = false;
      this.editingUserId = null;
      this.form = this.emptyForm();
      await this.loadUsers();
    } catch (error: unknown) {
      this.errorMessage = this.userService.getErrorMessage(error);
    } finally {
      this.isSaving = false;
    }
  }

  async deleteUser(user: UserRecord): Promise<void> {
    const confirmed = window.confirm(`¿Eliminar al usuario ${user.username}? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    this.clearMessages();
    try {
      await this.userService.remove(user.id);
      this.successMessage = 'Usuario eliminado correctamente.';
      await this.loadUsers();
    } catch (error: unknown) {
      this.errorMessage = this.userService.getErrorMessage(error);
    }
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
  }
}
