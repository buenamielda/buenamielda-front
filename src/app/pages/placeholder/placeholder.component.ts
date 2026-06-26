import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-learn-placeholder',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './placeholder.component.html',
  styleUrl: './placeholder.component.scss',
})
export class LearnPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap);

  private readonly sectionNames: Record<string, string> = {
    guia: 'Guía del apicultor',
    colmenas: 'Tipos de colmenas',
    temporadas: 'Temporadas',
    'primeros-pasos': 'Primeros pasos',
    ayuda: 'Ayuda',
    suscribete: 'Suscríbete',
    privacidad: 'Política de privacidad',
    terminos: 'Términos y condiciones',
  };

  readonly sectionTitle = computed(() => {
    const section = this.params()?.get('section');
    return section
      ? (this.sectionNames[section] ?? 'Aprende apicultura')
      : 'Aprende apicultura';
  });
}
