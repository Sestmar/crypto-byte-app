import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.coingecko.com/api/v3';

  // --- SISTEMA DE CACHÉ ---
  private cache = new Map<string, { data: any, expiry: number }>();
  private CACHE_DURATION = 90000; // 90 segundos

  constructor() { }

  // Helper para caché
  private getData<T>(key: string, url: string, forceRefresh = false): Observable<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    if (cached && (now < cached.expiry) && !forceRefresh) {
      return of(cached.data);
    }

    return this.http.get<T>(url).pipe(
      tap(data => {
        this.cache.set(key, {
          data: data,
          expiry: now + this.CACHE_DURATION
        });
      }),
      catchError(error => {
        console.error(`Error API (${key}):`, error);
        if (cached) return of(cached.data); // Resiliencia
        return of(null as any); 
      })
    );
  }

  // 1. Market (Lista general)
  getMarkets(): Observable<any[]> {
    const url = `${this.apiUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`;
    return this.getData<any[]>('markets', url);
  }

  // 2. Search (Búsqueda)
  searchCoin(query: string): Observable<any> {
    if(!query) return of([]);
    const url = `${this.apiUrl}/search?query=${query}`;
    return this.http.get<any>(url).pipe(
      map((res: any) => res.coins || []), 
      catchError(() => of([]))
    );
  }

  // 3. Detalle (CoinDetail)
  getCoinDetail(id: string): Observable<any> {
    const url = `${this.apiUrl}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    return this.getData<any>(`detail-${id}`, url);
  }

  // 4. Trending
  getTrending(): Observable<any> {
    return this.getData<any>('trending', `${this.apiUrl}/search/trending`);
  }

  // 5. Global Stats
  getGlobalData(): Observable<any> {
    return this.getData<any>('global', `${this.apiUrl}/global`);
  }

  // 6. Gráfico Línea (Market Chart)
  getMarketChart(id: string, days: string = '1'): Observable<any> {
    return this.getData<any>(
      `chart-${id}-${days}`, 
      `${this.apiUrl}/coins/${id}/market_chart?vs_currency=usd&days=${days}`
    );
  }

  // 7. Gráfico Velas (OHLC) - ¡LA NUEVA!
  getOHLC(id: string, days: string): Observable<any[]> {
    return this.getData<any[]>(
      `ohlc-${id}-${days}`, 
      `${this.apiUrl}/coins/${id}/ohlc?vs_currency=usd&days=${days}`
    );
  }

  // 8. Wallet (Multiples IDs) - ¡LA QUE FALTABA!
  getCoinsByIds(ids: string[]): Observable<any[]> {
    if (!ids || ids.length === 0) return of([]);
    
    const sortedIds = [...ids].sort().join(',');
    const url = `${this.apiUrl}/coins/markets?vs_currency=usd&ids=${sortedIds}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;
    
    return this.getData<any[]>(`wallet-${sortedIds}`, url);
  }
}