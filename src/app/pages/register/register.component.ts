import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AuthService,
  EmailAlreadyRegisteredError,
} from '../../services/auth.service';
import { UsuarioResponseDto } from '../../models/auth.model';
import { finalize } from 'rxjs';

interface RegisterForm {
  nombre: string;
  email: string;
  password: string;
  repeatPassword: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);

  readonly form = signal<RegisterForm>({
    nombre: '',
    email: '',
    password: '',
    repeatPassword: '',
  });

  readonly submitted = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly createdUser = signal<UsuarioResponseDto | null>(null);

  readonly passwordsMatch = computed(
    () => this.form().password === this.form().repeatPassword,
  );

  readonly canSubmit = computed(() => {
    const value = this.form();
    return (
      value.nombre.trim().length >= 2 &&
      this.isEmailValid(value.email) &&
      this.isPasswordValid(value.password) &&
      this.passwordsMatch()
    );
  });

  updateField<K extends keyof RegisterForm>(
    field: K,
    value: RegisterForm[K],
  ): void {
    this.form.update((current) => ({ ...current, [field]: value }));
    this.errorMessage.set('');
  }

  submit(): void {
    this.submitted.set(true);
    this.createdUser.set(null);

    if (!this.canSubmit()) {
      this.errorMessage.set('Revisa los campos marcados antes de continuar.');
      return;
    }

    this.loading.set(true);

    const { nombre, email, password } = this.form();

    this.authService
      .register({ nombre, email, password })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (user) => {
          this.createdUser.set(user);
          this.form.set({
            nombre: '',
            email: '',
            password: '',
            repeatPassword: '',
          });
          this.submitted.set(false);
        },
        error: (error) => {
          if (error instanceof EmailAlreadyRegisteredError) {
            this.errorMessage.set(
              'Ese email ya esta registrado. Prueba con otro o inicia sesion.',
            );
          } else {
            this.errorMessage.set(
              'No se ha podido crear la cuenta. Intentalo de nuevo.',
            );
          }
        },
      });
  }

  showNameError(): boolean {
    return this.submitted() && this.form().nombre.trim().length < 2;
  }

  showEmailError(): boolean {
    return this.submitted() && !this.isEmailValid(this.form().email);
  }

  showPasswordError(): boolean {
    return this.submitted() && !this.isPasswordValid(this.form().password);
  }

  showRepeatPasswordError(): boolean {
    return this.submitted() && !this.passwordsMatch();
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
