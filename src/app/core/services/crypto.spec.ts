import { TestBed } from '@angular/core/testing';
import { CryptoService } from './crypto.service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

describe('CryptoService', () => {
  let service: CryptoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting() // Importante para mockear peticiones
      ]
    });
    service = TestBed.inject(CryptoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verifica que no queden peticiones pendientes
  });

  // TEST 7
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // TEST 8: Testear que getMarkets hace una petición GET
  it('getMarkets() should call API via GET and return data', () => {
    const mockResponse = [{ id: 'bitcoin', name: 'Bitcoin' }];

    // Llamamos al método
    service.getMarkets().subscribe(data => {
      expect(data.length).toBe(1);
      expect(data).toEqual(mockResponse);
    });

    // Esperamos que se haya hecho UNA llamada a esa URL
    const req = httpMock.expectOne(req => req.url.includes('/coins/markets'));
    expect(req.request.method).toBe('GET');

    // "Respondemos" simuladamente
    req.flush(mockResponse);
  });

  // TEST 9: Testear búsqueda
  it('searchCoin() should call search API', () => {
    const mockResponse = { coins: [{ id: 'dogecoin' }] };

    service.searchCoin('doge').subscribe(res => {
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('dogecoin');
    });

    const req = httpMock.expectOne(req => req.url.includes('/search?query=doge'));
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  // TEST 10: Testear manejo de errores (fallback a array vacío)
  it('getMarkets() should return empty array on error', () => {
    service.getMarkets().subscribe(data => {
      expect(data).toEqual([]); // Debe devolver array vacío gracias al catchError
    });

    const req = httpMock.expectOne(req => req.url.includes('/coins/markets'));
    // Simulamos un error de red
    req.flush('Error 500', { status: 500, statusText: 'Server Error' });
  });
});