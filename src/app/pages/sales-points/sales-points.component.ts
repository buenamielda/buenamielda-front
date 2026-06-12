import { CommonModule } from '@angular/common';
import {
  Component,
  Injector,
  OnDestroy,
  OnInit,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

import { SalesPointResponseDto } from '../../models/sales-point.model';
import { SalesPointService } from '../../services/sales-point.service';

@Component({
  selector: 'app-sales-points',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-points.component.html',
  styleUrl: './sales-points.component.scss',
})
export class SalesPointsComponent implements OnInit, OnDestroy {
  private readonly salesPointService = inject(SalesPointService);

  private map?: L.Map;
  private markersLayer?: L.LayerGroup;
  private readonly markers = new Map<number, L.Marker>();

  readonly salesPoints = this.salesPointService.salesPoints;
  readonly loading = this.salesPointService.loading;
  readonly error = this.salesPointService.error;

  readonly search = signal('');
  readonly selectedId = signal<number | null>(null);

  private readonly injector = inject(Injector);

  readonly filteredSalesPoints = computed(() => {
    const value = this.search().trim().toLowerCase();

    if (!value) {
      return this.salesPoints();
    }

    return this.salesPoints().filter((salesPoint) =>
      [
        salesPoint.nombre,
        salesPoint.direccion,
        salesPoint.codigoPostal,
        salesPoint.localidad,
        salesPoint.provincia,
        salesPoint.pais,
      ]
        .join(' ')
        .toLowerCase()
        .includes(value),
    );
  });

  private readonly updateMapEffect = effect(() => {
    const salesPoints = this.filteredSalesPoints();

    if (salesPoints.length === 0) {
      this.markersLayer?.clearLayers();
      this.markers.clear();
      return;
    }
    
    afterNextRender(
      () => {
        if (!this.map) {
          this.initializeMap();
        }

        this.renderMarkers(salesPoints);
        this.map?.invalidateSize();
      },
      { injector: this.injector },
    );
  });

  ngOnInit(): void {
    this.salesPointService.loadSalesPoints();
  }

  ngAfterViewInit(): void {
    this.initializeMap();
    this.renderMarkers(this.filteredSalesPoints());
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  selectSalesPoint(salesPoint: SalesPointResponseDto): void {
    this.selectedId.set(salesPoint.id);

    const marker = this.markers.get(salesPoint.id);

    if (!marker || !this.map) {
      return;
    }

    this.map.flyTo(marker.getLatLng(), 15);
    marker.openPopup();
  }

  fullAddress(salesPoint: SalesPointResponseDto): string {
    return [
      salesPoint.direccion,
      `${salesPoint.codigoPostal} ${salesPoint.localidad}`,
      salesPoint.provincia,
    ].join(', ');
  }

  phoneLink(phone: string): string {
    return `tel:${phone.replace(/\s/g, '')}`;
  }

  private initializeMap(): void {
    const container = document.getElementById('sales-points-map');

    if (!container || this.map) {
      return;
    }

    this.map = L.map(container, {
      center: [40.416775, -3.70379],
      zoom: 6,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
  }

  private renderMarkers(salesPoints: SalesPointResponseDto[]): void {
    if (!this.map || !this.markersLayer) {
      return;
    }

    this.markersLayer.clearLayers();
    this.markers.clear();

    const bounds = L.latLngBounds([]);

    salesPoints.forEach((salesPoint) => {
      const position = L.latLng(
        Number(salesPoint.latitud),
        Number(salesPoint.longitud),
      );

      const marker = L.marker(position, {
        icon: L.divIcon({
          className: 'sales-point-marker',
          html: '<span></span>',
          iconSize: [28, 36],
          iconAnchor: [14, 36],
          popupAnchor: [0, -34],
        }),
      });

      marker.bindPopup(this.createPopupContent(salesPoint));

      marker.on('click', () => {
        this.selectedId.set(salesPoint.id);
      });

      marker.addTo(this.markersLayer!);
      this.markers.set(salesPoint.id, marker);
      bounds.extend(position);
    });

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 14,
      });
    }
  }

  private createPopupContent(salesPoint: SalesPointResponseDto): HTMLElement {
    const container = document.createElement('div');
    container.className = 'sales-point-popup';

    const title = document.createElement('strong');
    title.textContent = salesPoint.nombre;

    const address = document.createElement('span');
    address.textContent = this.fullAddress(salesPoint);

    const phone = document.createElement('a');
    phone.href = this.phoneLink(salesPoint.telefono);
    phone.textContent = salesPoint.telefono;

    container.append(title, address, phone);

    if (salesPoint.horario) {
      const schedule = document.createElement('span');
      schedule.textContent = salesPoint.horario;
      container.append(schedule);
    }

    return container;
  }
}
