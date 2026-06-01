import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AuthService,
  InvalidCredentialsError,
  LoginValidationError,
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
    return (
      this.isEmailValid(value.email) && this.isPasswordValid(value.password)
    );
  });

  updateField<K extends keyof LoginForm>(field: K, value: LoginForm[K]): void {
    this.form.update((current) => ({ ...current, [field]: value }));
    this.errorMessage.set('');
  }

  submit(): void {
    this.submitted.set(true);
    this.loggedUser.set(null);

    if (!this.canSubmit()) {
      this.errorMessage.set('Introduce un email y una contraseña validos.');
      return;
    }

    this.loading.set(true);

    this.authService
      .login(this.form())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (user) => {
          this.loggedUser.set(user);
          this.form.set({ email: '', password: '' });
          this.submitted.set(false);
        },
        error: (error) => {
          if (error instanceof InvalidCredentialsError) {
            this.errorMessage.set('Email o contraseña incorrectos.');
          } else if (error instanceof LoginValidationError) {
            this.errorMessage.set(error.message);
          } else {
            this.errorMessage.set(
              'No se ha podido iniciar sesion. Intentalo de nuevo.',
            );
          }
        },
      });
  }

  showEmailError(): boolean {
    return this.submitted() && !this.isEmailValid(this.form().email);
  }

  showPasswordError(): boolean {
    return this.submitted() && !this.isPasswordValid(this.form().password);
  }

  private isEmailValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  private isPasswordValid(password: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,}$/.test(
      password,
    );
  }
}
