import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import {
  CreateShippingAddressRequest,
  ShippingAddress,
} from '../models/shipping-address.model';
import { ShippingAddressService } from './shipping-address.service';

describe('ShippingAddressService', () => {
  let service: ShippingAddressService;
  let httpMock: HttpTestingController;

  const address: ShippingAddress = {
    id: 1,
    nombre: 'Paula',
    telefono: '600000000',
    direccion: 'Calle Miel 1',
    codigoPostal: '28001',
    localidad: 'Madrid',
    provincia: 'Madrid',
    pais: 'España',
    principal: true,
    activa: true,
  };

  const payload: CreateShippingAddressRequest = {
    nombreDestinatario: 'Paula',
    telefono: '600000000',
    direccion: 'Calle Miel 1',
    codigoPostal: '28001',
    localidad: 'Madrid',
    provincia: 'Madrid',
    pais: 'España',
    principal: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ShippingAddressService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load addresses and update state', () => {
    service.loadAddresses();

    const request = httpMock.expectOne('/api/direcciones');

    expect(request.request.method).toBe('GET');

    request.flush([address]);

    expect(service.loading()).toBeFalse();
    expect(service.errorMessage()).toBe('');
    expect(service.addresses()).toEqual([address]);
  });

  it('should clear addresses and show auth message on forbidden load', () => {
    service.loadAddresses();

    httpMock
      .expectOne('/api/direcciones')
      .flush({}, { status: 403, statusText: 'Forbidden' });

    expect(service.loading()).toBeFalse();
    expect(service.addresses()).toEqual([]);
    expect(service.errorMessage()).toBe(
      'Inicia sesión para consultar tus direcciones.',
    );
  });

  it('should show backend message when load fails with message', () => {
    service.loadAddresses();

    httpMock
      .expectOne('/api/direcciones')
      .flush(
        { message: 'Error controlado' },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(service.errorMessage()).toBe('Error controlado');
  });

  it('should create address and append it to state', () => {
    service.createAddress(payload).subscribe((createdAddress) => {
      expect(createdAddress.id).toBe(1);
    });

    const request = httpMock.expectOne('/api/direcciones');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);

    request.flush(address);

    expect(service.addresses()).toEqual([address]);
  });

  it('should update address and replace it in state', () => {
    service.loadAddresses();
    httpMock.expectOne('/api/direcciones').flush([
      {
        ...address,
        principal: false,
      },
    ]);

    const updatedAddress: ShippingAddress = {
      ...address,
      direccion: 'Calle Nueva 2',
      principal: true,
    };

    service.updateAddress(1, payload).subscribe((response) => {
      expect(response.direccion).toBe('Calle Nueva 2');
    });

    const request = httpMock.expectOne('/api/direcciones/1');

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);

    request.flush(updatedAddress);

    expect(service.addresses()[0].direccion).toBe('Calle Nueva 2');
    expect(service.addresses()[0].principal).toBeTrue();
  });

  it('should delete address and remove it from state', () => {
    service.loadAddresses();
    httpMock.expectOne('/api/direcciones').flush([address]);

    service.deleteAddress(1).subscribe();

    const request = httpMock.expectOne('/api/direcciones/1');

    expect(request.request.method).toBe('DELETE');

    request.flush(null);

    expect(service.addresses()).toEqual([]);
  });
});
