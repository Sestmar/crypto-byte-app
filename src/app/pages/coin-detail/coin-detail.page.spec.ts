import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoinDetailPage } from './coin-detail.page';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { CryptoService } from 'src/app/core/services/crypto.service';

describe('CoinDetailPage', () => {
  let component: CoinDetailPage;
  let fixture: ComponentFixture<CoinDetailPage>;
  let cryptoService: CryptoService;

  // Mock Detalle
  const mockCoinDetail = {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'btc', // Añadido para evitar errores
    description: { en: 'Bitcoin is a cryptocurrency.' },
    image: { large: 'btc.png' },
    market_data: {
      current_price: { usd: 50000 },
      price_change_percentage_24h: 1.5,
      market_cap: { usd: 1000000 },
      total_volume: { usd: 500000 },
      high_24h: { usd: 51000 },
      low_24h: { usd: 49000 }
    }
  };

  // Mock Gráfica (NUEVO REQUISITO)
  const mockChartData = {
    prices: [
      [1622520000000, 35000],
      [1622606400000, 36000]
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoinDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => 'bitcoin'
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CoinDetailPage);
    component = fixture.componentInstance;
    cryptoService = TestBed.inject(CryptoService);

    // Espiamos AMBOS métodos
    spyOn(cryptoService, 'getCoinDetail').and.returnValue(of(mockCoinDetail));
    // IMPORTANTE: Espiar la llamada de la gráfica para que no falle al intentar pintar el Chart
    spyOn(cryptoService, 'getMarketChart').and.returnValue(of(mockChartData));

    // Desactivar la generación real del chart para evitar errores de Canvas en test
    // Sobrescribimos la función createChart del componente para que no haga nada en el test
    component.createChart = () => {}; 

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getCoinDetail with "bitcoin"', () => {
    expect(cryptoService.getCoinDetail).toHaveBeenCalledWith('bitcoin');
  });

  it('should set coin data correctly', () => {
    expect(component.coin).toEqual(mockCoinDetail);
    expect(component.coin.name).toBe('Bitcoin');
  });

  it('loading should be false after data fetch', () => {
    expect(component.loading).toBeFalse();
  });
  
  // Test extra: verificar que intenta cargar la gráfica
  it('should call getMarketChart', () => {
    expect(cryptoService.getMarketChart).toHaveBeenCalledWith('bitcoin');
  });
});