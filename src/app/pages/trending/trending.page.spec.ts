import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrendingPage } from './trending.page';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router'; // NECESARIO AHORA
import { CryptoService } from 'src/app/core/services/crypto.service';

describe('TrendingPage', () => {
  let component: TrendingPage;
  let fixture: ComponentFixture<TrendingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendingPage],
      providers: [
        provideHttpClient(),        // <--- SOLUCIÓN AL ERROR HttpClient
        provideHttpClientTesting(), // <--- SOLUCIÓN AL ERROR
        provideRouter([]),          // <--- SOLUCIÓN (por el this.router.navigate)
        CryptoService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrendingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});