import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, 
  IonAvatar, IonLabel, IonText, IonButtons, IonButton, IonIcon, 
  IonSpinner, IonCard,
  // --- AÑADIMOS ESTOS IMPORTS QUE FALTABAN ---
  IonItemSliding, IonItemOptions, IonItemOption 
} from '@ionic/angular/standalone';
import { RouterLink, Router } from '@angular/router'; 
import { PortfolioService, Asset } from 'src/app/core/services/portfolio.service';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { addIcons } from 'ionicons';
import { trashOutline, settingsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.page.html',
  styleUrls: ['./portfolio.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, 
    IonAvatar, IonLabel, IonText, IonButtons, IonButton, IonIcon, 
    IonSpinner, CommonModule, FormsModule, RouterLink, IonCard,
    // --- Y LOS AÑADIMOS AQUÍ TAMBIÉN ---
    IonItemSliding, IonItemOptions, IonItemOption
  ]
})
export class PortfolioPage {
  private portfolioService = inject(PortfolioService);
  private cryptoService = inject(CryptoService);
  private router = inject(Router); 
  
  myCoins: any[] = [];
  loading = false;
  totalBalance = 0;

  constructor() {
    addIcons({ 'trash-outline': trashOutline, 'settings-outline': settingsOutline });
  }

  ionViewWillEnter() {
    this.loadPortfolio();
  }

  loadPortfolio() {
    this.loading = true;
    this.totalBalance = 0;
    
    // 1. Pedimos la lista de ACTIVOS a Firebase
    this.portfolioService.getPortfolio().subscribe({
      next: (assets: Asset[]) => {
        
        if (!assets || assets.length === 0) {
          this.myCoins = [];
          this.loading = false;
          return;
        }

        // 2. Extraemos IDs para pedir precios
        const ids = assets.map(a => a.id);

        this.cryptoService.getCoinsByIds(ids).subscribe({
          next: (apiCoins) => {
            // 3. FUSIÓN DE DATOS
            this.myCoins = apiCoins.map(coin => {
              const matchingAsset = assets.find(a => a.id === coin.id);
              const amount = matchingAsset ? matchingAsset.amount : 0;
              const value = amount * coin.current_price;

              this.totalBalance += value;

              return {
                ...coin,
                amount: amount,
                totalValue: value
              };
            });

            this.loading = false;
          },
          error: (err) => {
            console.error('Error API:', err);
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error("Error Firebase:", err);
        this.loading = false;
      }
    });
  }

  openSettings() {
    this.router.navigate(['/settings']);
  }

  async remove(coin: any) {
    await this.portfolioService.removeAsset(coin.id);
    this.totalBalance -= coin.totalValue;
    this.myCoins = this.myCoins.filter(c => c.id !== coin.id);
  }
}