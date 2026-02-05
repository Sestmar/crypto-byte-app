import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, 
  IonAvatar, IonLabel, IonText, IonButtons, IonButton, IonIcon, 
  IonSpinner, IonCard, IonItemSliding, IonItemOptions, IonItemOption, 
  IonGrid, IonRow, IonCol, IonListHeader
} from '@ionic/angular/standalone';
import { RouterLink, Router } from '@angular/router'; 
import { PortfolioService, Asset } from 'src/app/core/services/portfolio.service';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { addIcons } from 'ionicons';
// IMPORTAMOS TODOS LOS NUEVOS ICONOS NECESARIOS
import { 
  trashOutline, settingsOutline, eyeOutline, eyeOffOutline, 
  swapHorizontalOutline, walletOutline, arrowDownCircleOutline, 
  arrowUpCircleOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.page.html',
  styleUrls: ['./portfolio.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, 
    IonAvatar, IonLabel, IonText, IonButtons, IonButton, IonIcon, 
    IonSpinner, CommonModule, FormsModule, RouterLink, IonCard,
    IonItemSliding, IonItemOptions, IonItemOption, IonGrid, IonRow, IonCol,
    IonListHeader
  ]
})
export class PortfolioPage {
  private portfolioService = inject(PortfolioService);
  private cryptoService = inject(CryptoService);
  private router = inject(Router); 
  
  myCoins: any[] = [];
  loading = false;
  
  // Variables financieras
  totalBalanceUSD = 0;
  totalInvested = 0;
  totalPnL = 0;        // Ganancia/Pérdida en $
  totalPnLPercent = 0; // Ganancia/Pérdida en %
  
  // Vista (Toggle visual)
  hideBalance = false; // Para ocultar el saldo ****
  showInBTC = false;   // Para cambiar entre USD y BTC

  constructor() {
    // Registramos los iconos
    addIcons({ 
      trashOutline, settingsOutline, eyeOutline, eyeOffOutline, 
      swapHorizontalOutline, walletOutline, arrowDownCircleOutline, 
      arrowUpCircleOutline 
    });
  }

  ionViewWillEnter() {
    this.loadPortfolio();
  }

  // Funciones para los botones de la interfaz
  toggleVisibility() { this.hideBalance = !this.hideBalance; }
  toggleCurrency() { this.showInBTC = !this.showInBTC; }
  openSettings() { this.router.navigate(['/settings']); }

  loadPortfolio() {
    this.loading = true;
    this.totalBalanceUSD = 0;
    this.totalInvested = 0;
    
    this.portfolioService.getPortfolio().subscribe({
      next: (assets: Asset[]) => {
        if (!assets || assets.length === 0) {
          this.myCoins = [];
          this.loading = false;
          return;
        }

        const ids = assets.map(a => a.id);

        this.cryptoService.getCoinsByIds(ids).subscribe({
          next: (apiCoins) => {
            this.myCoins = apiCoins.map(coin => {
              const asset = assets.find(a => a.id === coin.id);
              const amount = asset ? asset.amount : 0;
              const buyPrice = asset?.buyPrice || 0; // Si es antiguo será 0

              // Cálculos por moneda
              const currentValue = amount * coin.current_price;
              const investedValue = amount * buyPrice;
              
              // Ganancia individual
              const pnl = currentValue - investedValue;
              const pnlPercent = buyPrice > 0 ? (pnl / investedValue) * 100 : 0;

              // Sumas globales
              this.totalBalanceUSD += currentValue;
              if (buyPrice > 0) this.totalInvested += investedValue;

              return {
                ...coin,
                amount,
                buyPrice,
                totalValue: currentValue,
                pnl,        // Dato para pintar verde/rojo
                pnlPercent
              };
            });

            // Cálculos Globales del Portfolio
            this.totalPnL = this.totalBalanceUSD - this.totalInvested;
            this.totalPnLPercent = this.totalInvested > 0 ? (this.totalPnL / this.totalInvested) * 100 : 0;

            this.loading = false;
          },
          error: () => this.loading = false
        });
      }
    });
  }

  async remove(coin: any) {
    await this.portfolioService.removeAsset(coin.id);
    this.loadPortfolio(); // Recargamos para recalcular totales
  }
}