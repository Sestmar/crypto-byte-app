import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarketPage } from './market.page';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { of } from 'rxjs';

describe('MarketPage', () => {
  let component: MarketPage;
  let fixture: ComponentFixture<MarketPage>;
  let cryptoService: CryptoService;

  const mockCoins = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', current_price: 50000, price_change_percentage_24h: 5, image: 'img.png' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'eth', current_price: 3000, price_change_percentage_24h: -2, image: 'img.png' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MarketPage);
    component = fixture.componentInstance;
    cryptoService = TestBed.inject(CryptoService);

    spyOn(cryptoService, 'getMarkets').and.returnValue(of(mockCoins));

    fixture.detectChanges();
  });

  // TEST 1: Creación
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // TEST 2: Carga de datos
  it('should load coins on init', () => {
    expect(component.coins.length).toBe(2);
    expect(component.coins[0].name).toBe('Bitcoin');
  });

  // TEST 3: Llamada al servicio
  it('should call cryptoService.getMarkets()', () => {
    expect(cryptoService.getMarkets).toHaveBeenCalled();
  });
});