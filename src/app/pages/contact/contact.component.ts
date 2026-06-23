import { CommonModule } from '@angular/common';
import {
  Component,
  Injector,
  OnDestroy,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';

interface ContactForm {
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnDestroy {
  private readonly injector = inject(Injector);
  private map?: L.Map;
  private readonly contactPosition = L.latLng(42.5902, -3.2687);

  readonly submitted = signal(false);
  readonly sent = signal(false);
  readonly form = signal<ContactForm>({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: '',
  });

  readonly canSubmit = computed(() => {
    const value = this.form();

    return (
      value.nombre.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim()) &&
      value.asunto.trim().length >= 3 &&
      value.mensaje.trim().length >= 10
    );
  });

  constructor() {
    afterNextRender(
      () => {
        this.initializeMap();
      },
      { injector: this.injector },
    );
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  updateField<K extends keyof ContactForm>(
    field: K,
    value: ContactForm[K],
  ): void {
    this.form.update((current) => ({ ...current, [field]: value }));
    this.sent.set(false);
  }

  send(): void {
    this.submitted.set(true);

    if (!this.canSubmit()) {
      return;
    }

    this.sent.set(true);
    this.submitted.set(false);
    this.form.set({
      nombre: '',
      email: '',
      asunto: '',
      mensaje: '',
    });
  }

  private initializeMap(): void {
    const container = document.getElementById('contact-map');

    if (!container || this.map) {
      return;
    }

    this.map = L.map(container, {
      center: this.contactPosition,
      zoom: 12,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    L.marker(this.contactPosition, {
      icon: L.divIcon({
        className: 'contact-map-marker',
        html: '<span></span>',
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -34],
      }),
    })
      .bindPopup(this.createPopupContent())
      .addTo(this.map);
  }

  private createPopupContent(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'contact-map-popup';

    const title = document.createElement('strong');
    title.textContent = 'Buena mielda';

    const location = document.createElement('span');
    location.textContent = 'Rojas de Bureba, Burgos';

    const email = document.createElement('a');
    email.href = 'mailto:buenamieldamicolmena@gmail.com';
    email.textContent = 'buenamieldamicolmena@gmail.com';

    container.append(title, location, email);

    return container;
  }
}