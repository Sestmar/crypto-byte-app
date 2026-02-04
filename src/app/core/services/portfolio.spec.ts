import { TestBed } from '@angular/core/testing';
import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  let service: PortfolioService;

  const mockCoin = {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'btc',
    image: 'url-a-imagen',
    current_price: 50000
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PortfolioService);
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getPortfolio() should return empty array initially', () => {
    const portfolio = service.getPortfolio();
    expect(portfolio).toEqual([]);
    expect(portfolio.length).toBe(0);
  });

  it('toggleCoin() should ADD coin if not exists', () => {
    const result = service.toggleCoin(mockCoin);
    expect(result).toBeTrue(); 
    expect(service.getPortfolio().length).toBe(1);
    expect(service.isSaved('bitcoin')).toBeTrue(); 
  });

  it('toggleCoin() should REMOVE coin if already exists', () => {
    service.toggleCoin(mockCoin);
    const result = service.toggleCoin(mockCoin);
    expect(result).toBeFalse(); 
    expect(service.getPortfolio().length).toBe(0); 
  });

  it('isSaved() should return true for saved coin', () => {
    service.toggleCoin(mockCoin);
    expect(service.isSaved(mockCoin.id)).toBeTrue();
  });

  it('isSaved() should return false for unknown coin', () => {
    expect(service.isSaved('ethereum')).toBeFalse();
  });
});