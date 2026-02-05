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
  // Guardamos los datos aquí: { 'markets': { data: [...], timestamp: 123456 } }
  private cache = new Map<string, { data: any, expiry: number }>();
  
  // Tiempo de vida de los datos (ej: 90 segundos). 
  // Durante este tiempo, NO pediremos nada a la API, usaremos la memoria.
  private CACHE_DURATION = 90000; 

  constructor() { }

  // --- MÉTODO PRIVADO PARA GESTIONAR PETICIONES CON CACHÉ ---
  private getData<T>(key: string, url: string, forceRefresh = false): Observable<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    // 1. Si existe caché y no ha caducado, devolvemos eso (RÁPIDO)
    if (cached && (now < cached.expiry) && !forceRefresh) {
      // console.log(`⚡ Usando caché para: ${key}`);
      return of(cached.data);
    }

    // 2. Si no, pedimos a la API (LENTO PERO FRESCO)
    return this.http.get<T>(url).pipe(
      tap(data => {
        // Guardamos en caché al recibir respuesta exitosa
        this.cache.set(key, {
          data: data,
          expiry: now + this.CACHE_DURATION
        });
      }),
      catchError(error => {
        console.error(`Error API (${key}):`, error);
        
        // ESTRATEGIA DE RESILIENCIA:
        // Si la API falla (Error 429), pero tenemos datos antiguos en caché,
        // devolvemos los antiguos en vez de romper la app.
        if (cached) {
          console.warn('⚠️ API falló, usando datos antiguos de caché.');
          return of(cached.data);
        }
        
        // Si no hay nada, devolvemos null o array vacío según el caso
        return of(null as any); 
      })
    );
  }

  // 1. Obtener lista de mercado (Market Tab)
  getMarkets(): Observable<any[]> {
    const url = `${this.apiUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`;
    return this.getData<any[]>('markets', url);
  }

  // 2. Buscar moneda (Search Tab) - ESTO NO SE CACHEA (Es búsqueda en tiempo real)
  searchCoin(query: string): Observable<any> {
    if(!query) return of([]);
    const url = `${this.apiUrl}/search?query=${query}`;
    return this.http.get<any>(url).pipe(
      map((res: any) => res.coins || []), 
      catchError(() => of([]))
    );
  }

  // 3. Obtener detalle (CoinDetail) - Cacheamos por ID única
  getCoinDetail(id: string): Observable<any> {
    const url = `${this.apiUrl}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    return this.getData<any>(`detail-${id}`, url);
  }

  // 4. Tendencias
  getTrending(): Observable<any> {
    return this.getData<any>('trending', `${this.apiUrl}/search/trending`);
  }

  // 5. Datos Globales
  getGlobalData(): Observable<any> {
    return this.getData<any>('global', `${this.apiUrl}/global`);
  }

  // 6. Gráficos - Importante cachear, son datos pesados
  getMarketChart(id: string): Observable<any> {
    return this.getData<any>(`chart-${id}`, `${this.apiUrl}/coins/${id}/market_chart?vs_currency=usd&days=7`);
  }

  // 7. Cartera (Wallet) - Obtenemos datos específicos
  getCoinsByIds(ids: string[]): Observable<any[]> {
    if (!ids || ids.length === 0) return of([]);
    
    // Ordenamos los IDs para que "bitcoin,ethereum" sea igual que "ethereum,bitcoin" en la key del caché
    const sortedIds = [...ids].sort().join(',');
    const url = `${this.apiUrl}/coins/markets?vs_currency=usd&ids=${sortedIds}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;
    
    return this.getData<any[]>(`wallet-${sortedIds}`, url);
  }
}