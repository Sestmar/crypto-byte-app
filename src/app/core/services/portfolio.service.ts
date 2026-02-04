import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private STORAGE_KEY = 'crypto_portfolio_v1';

  constructor() { }

  // Obtener todas las monedas guardadas
  getPortfolio(): any[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Verificar si una moneda ya está guardada
  isSaved(id: string): boolean {
    const portfolio = this.getPortfolio();
    return portfolio.some((coin: any) => coin.id === id);
  }

  // Guardar o Eliminar (Toggle)
  toggleCoin(coin: any): boolean {
    let portfolio = this.getPortfolio();
    const exists = portfolio.find((c: any) => c.id === coin.id);

    if (exists) {
      // Si existe, la borramos
      portfolio = portfolio.filter((c: any) => c.id !== coin.id);
    } else {
      // Si no existe, guardamos solo los datos necesarios (para no llenar la memoria)
      const simpleCoin = {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        image: coin.image.large || coin.image, // A veces viene como objeto o string
        current_price: coin.market_data?.current_price?.usd || coin.current_price
      };
      portfolio.push(simpleCoin);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(portfolio));
    return !exists; // Retorna true si se guardó, false si se borró
  }
}