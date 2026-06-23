import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ForumService } from '../forum.service';
import {
  ForumAnswerCreateRequest,
  ForumAnswerResponse,
  ForumQuestionCreateRequest,
  ForumQuestionListResponse,
  ForumQuestionResponse,
} from '../../models/forum.model';

describe('ForumService', () => {
  let service: ForumService;
  let httpMock: HttpTestingController;

  const questions: ForumQuestionListResponse[] = [
    {
      id: 1,
      titulo: 'Pregunta antigua',
      estado: 'PUBLICADA',
      activa: true,
      fechaCreacion: '2026-06-20T10:00:00',
      fechaActualizacion: '2026-06-20T12:00:00',
      usuarioId: 1,
      nombreUsuario: 'Paula',
      totalRespuestas: 1,
    },
    {
      id: 2,
      titulo: 'Pregunta reciente',
      estado: 'PUBLICADA',
      activa: true,
      fechaCreacion: '2026-06-21T10:00:00',
      fechaActualizacion: '2026-06-22T12:00:00',
      usuarioId: 2,
      nombreUsuario: 'Admin',
      totalRespuestas: 0,
    },
  ];

  const answer: ForumAnswerResponse = {
    id: 10,
    contenido: 'Esta es una respuesta',
    estado: 'PUBLICADA',
    activa: true,
    fechaCreacion: '2026-06-22T13:00:00',
    fechaActualizacion: '2026-06-22T13:00:00',
    usuarioId: 3,
    nombreUsuario: 'Usuario',
  };

  const detail: ForumQuestionResponse = {
    id: 1,
    titulo: 'Pregunta antigua',
    contenido: 'Contenido de la pregunta',
    estado: 'PUBLICADA',
    activa: true,
    fechaCreacion: '2026-06-20T10:00:00',
    fechaActualizacion: '2026-06-20T12:00:00',
    usuarioId: 1,
    nombreUsuario: 'Paula',
    respuestas: [answer],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ForumService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ForumService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe cargar y ordenar las preguntas por fecha de actualizacion descendente', () => {
    service.loadQuestions();

    expect(service.loading()).toBeTrue();
    expect(service.error()).toBeNull();

    const request = httpMock.expectOne('/api/foro');
    expect(request.request.method).toBe('GET');
    request.flush(questions);

    expect(service.loading()).toBeFalse();
    expect(service.error()).toBeNull();
    expect(service.questions().map((question) => question.id)).toEqual([2, 1]);
  });

  it('debe informar error si no se pueden cargar las preguntas', () => {
    service.loadQuestions();

    const request = httpMock.expectOne('/api/foro');
    request.flush('Error', { status: 500, statusText: 'Server error' });

    expect(service.loading()).toBeFalse();
    expect(service.questions()).toEqual([]);
    expect(service.error()).toBe('No se han podido cargar las preguntas del foro.');
  });

  it('debe cargar el detalle de una pregunta', () => {
    service.loadQuestionById(1);

    expect(service.detailLoading()).toBeTrue();
    expect(service.detailError()).toBeNull();
    expect(service.selectedQuestion()).toBeNull();

    const request = httpMock.expectOne('/api/foro/1');
    expect(request.request.method).toBe('GET');
    request.flush(detail);

    expect(service.detailLoading()).toBeFalse();
    expect(service.selectedQuestion()).toEqual(detail);
  });

  it('debe informar error si no se puede cargar el detalle de una pregunta', () => {
    service.loadQuestionById(1);

    const request = httpMock.expectOne('/api/foro/1');
    request.flush('Error', { status: 404, statusText: 'Not found' });

    expect(service.detailLoading()).toBeFalse();
    expect(service.selectedQuestion()).toBeNull();
    expect(service.detailError()).toBe('No se ha podido cargar la pregunta del foro.');
  });

  it('debe crear una pregunta y recargar el listado', () => {
    const payload: ForumQuestionCreateRequest = {
      titulo: 'Nueva pregunta',
      contenido: 'Contenido de la nueva pregunta',
    };

    service.createQuestion(payload).subscribe((response) => {
      expect(response).toEqual(detail);
    });

    const postRequest = httpMock.expectOne('/api/foro');
    expect(postRequest.request.method).toBe('POST');
    expect(postRequest.request.body).toEqual(payload);
    postRequest.flush(detail);

    const reloadRequest = httpMock.expectOne('/api/foro');
    expect(reloadRequest.request.method).toBe('GET');
    reloadRequest.flush(questions);
  });

  it('debe crear una respuesta y recargar detalle y listado', () => {
    const payload: ForumAnswerCreateRequest = {
      contenido: 'Respuesta nueva',
    };

    service.createAnswer(1, payload).subscribe((response) => {
      expect(response).toEqual(answer);
    });

    const postRequest = httpMock.expectOne(
      (request) => request.url === '/api/foro/1' && request.method === 'POST',
    );
    expect(postRequest.request.body).toEqual(payload);
    postRequest.flush(answer);

    const detailRequest = httpMock.expectOne(
      (request) => request.url === '/api/foro/1' && request.method === 'GET',
    );
    detailRequest.flush(detail);

    const listRequest = httpMock.expectOne('/api/foro');
    expect(listRequest.request.method).toBe('GET');
    listRequest.flush(questions);
  });

  it('debe eliminar una pregunta y recargar el listado', () => {
    service.loadQuestionById(1);
    httpMock.expectOne('/api/foro/1').flush(detail);

    expect(service.selectedQuestion()).toEqual(detail);

    service.deleteQuestion(1).subscribe((response) => {
      expect(response).toBeNull();
    });

    const deleteRequest = httpMock.expectOne('/api/foro/pregunta/1');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);

    expect(service.selectedQuestion()).toBeNull();

    const reloadRequest = httpMock.expectOne('/api/foro');
    expect(reloadRequest.request.method).toBe('GET');
    reloadRequest.flush(questions);
  });

  it('debe eliminar una respuesta y recargar detalle y listado', () => {
    service.deleteAnswer(1, 10).subscribe((response) => {
      expect(response).toBeNull();
    });

    const deleteRequest = httpMock.expectOne('/api/foro/respuesta/10');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);

    const detailRequest = httpMock.expectOne('/api/foro/1');
    expect(detailRequest.request.method).toBe('GET');
    detailRequest.flush(detail);

    const listRequest = httpMock.expectOne('/api/foro');
    expect(listRequest.request.method).toBe('GET');
    listRequest.flush(questions);
  });

  it('debe limpiar la pregunta seleccionada y el error de detalle', () => {
    service.loadQuestionById(1);
    httpMock
      .expectOne('/api/foro/1')
      .flush('Error', { status: 404, statusText: 'Not found' });

    expect(service.detailError()).toBe('No se ha podido cargar la pregunta del foro.');

    service.clearSelectedQuestion();

    expect(service.selectedQuestion()).toBeNull();
    expect(service.detailError()).toBeNull();
  });
});