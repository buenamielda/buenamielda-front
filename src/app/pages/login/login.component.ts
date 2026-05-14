import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AuthService,
  InactiveUserError,
  InvalidCredentialsError,
} from '../../services/auth.service';
import { LoginResponseDto } from '../../models/auth.model';

interface LoginForm {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);

  readonly form = signal<LoginForm>({
    email: '',
    password: '',
  });

  readonly submitted = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly loggedUser = signal<LoginResponseDto | null>(null);

  readonly canSubmit = computed(() => {
    const value = this.form();
    return this.isEmailValid(value.email) && value.password.length > 0;
  });

  updateField<K extends keyof LoginForm>(field: K, value: LoginForm[K]): void {
    this.form.update((current) => ({ ...current, [field]: value }));
    this.errorMessage.set('');
  }

  submit(): void {
    this.submitted.set(true);
    this.loggedUser.set(null);

    if (!this.canSubmit()) {
      this.errorMessage.set('Introduce un email y una contrasena validos.');
      return;
    }

    this.loading.set(true);

    try {
      const user = this.authService.login(this.form());
      this.loggedUser.set(user);
      this.form.set({ email: '', password: '' });
      this.submitted.set(false);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        this.errorMessage.set('Email o contrasena incorrectos.');
      } else if (error instanceof InactiveUserError) {
        this.errorMessage.set('Tu usuario esta desactivado. Contacta con soporte.');
      } else {
        this.errorMessage.set('No se ha podido iniciar sesion. Intentalo de nuevo.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  showEmailError(): boolean {
    return this.submitted() && !this.isEmailValid(this.form().email);
  }

  showPasswordError(): boolean {
    return this.submitted() && this.form().password.length === 0;
  }

  private isEmailValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }
}
