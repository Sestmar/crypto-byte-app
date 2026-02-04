import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private http = inject(HttpClient);
  // URL base de la API gratuita de CoinGecko
  private apiUrl = 'https://api.coingecko.com/api/v3';

  constructor() { }

  // 1. Obtener lista de mercado (Para la Tab 'Market')
  getMarkets(): Observable<any[]> {
    // Traemos las top 50 monedas ordenadas por capitalización, en USD
    const url = `${this.apiUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`;
    
    return this.http.get<any[]>(url).pipe(
      catchError(error => {
        console.error('Error cargando mercado:', error);
        return of([]); // Retorna array vacío si falla para no romper la app
      })
    );
  }

  // 2. Buscar moneda (Para la Tab 'Search')
  searchCoin(query: string): Observable<any> {
    const url = `${this.apiUrl}/search?query=${query}`;
    return this.http.get<any>(url).pipe(
      map((res: any) => res.coins || []), // Mapeamos para devolver solo la lista de monedas
      catchError(() => of([]))
    );
  }

  // 3. Obtener detalle (Para la página 'CoinDetail')
  getCoinDetail(id: string): Observable<any> {
    const url = `${this.apiUrl}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    return this.http.get<any>(url);
  }

  // TAB 2: Tendencias (Trending)
  getTrending(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/search/trending`);
  }

  // TAB 5: Datos Globales (Stats)
  getGlobalData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/global`);
  }

  // Obtener datos gráficos (precios últimos 7 días)
  getMarketChart(id: string): Observable<any> {
    // days=7 para una semana, interval=daily para que no pese mucho
    return this.http.get<any>(`${this.apiUrl}/coins/${id}/market_chart?vs_currency=usd&days=7`);
  }
}