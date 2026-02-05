import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, 
  IonAvatar, IonLabel, IonText, IonButtons, IonButton, IonIcon, IonSpinner,
  IonCard
} from '@ionic/angular/standalone';
import { RouterLink, Router } from '@angular/router'; 
import { PortfolioService } from 'src/app/core/services/portfolio.service';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { addIcons } from 'ionicons';
// CORRECCIÓN ICONOS: Importamos trashOutline explícitamente
import { trashOutline, settingsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.page.html',
  styleUrls: ['./portfolio.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, 
    IonAvatar, IonLabel, IonText, IonButtons, IonButton, IonIcon, 
    IonSpinner, CommonModule, FormsModule, RouterLink, IonCard
  ]
})
export class PortfolioPage {
  private portfolioService = inject(PortfolioService);
  private cryptoService = inject(CryptoService);
  private router = inject(Router); 
  
  myCoins: any[] = [];
  loading = false;
  error = false; // Para controlar si falla la carga

  constructor() {
    // REGISTRAMOS EL ICONO CON EL NOMBRE CORRECTO
    addIcons({ 'trash-outline': trashOutline, 'settings-outline': settingsOutline });
  }

  ionViewWillEnter() {
    this.loadPortfolio();
  }

  loadPortfolio() {
    this.loading = true;
    this.error = false;
    
    // 1. Pedimos los IDs favoritos a Firebase
    this.portfolioService.getFavorites().subscribe({
      next: (favoriteIds) => {
        console.log('Favoritos recuperados:', favoriteIds);

        if (!favoriteIds || favoriteIds.length === 0) {
          this.myCoins = [];
          this.loading = false;
          return;
        }

        // 2. OPTIMIZACIÓN: Pedimos SOLO las monedas que necesitamos
        // Esto evita el error de CORS/Límites por pedir demasiados datos
        this.cryptoService.getCoinsByIds(favoriteIds).subscribe({
          next: (coinsData) => {
            this.myCoins = coinsData;
            this.loading = false;
          },
          error: (err) => {
            console.error('Error cargando datos de monedas:', err);
            this.error = true; // Podrías mostrar un mensaje de error en el HTML
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
    // Borramos de Firebase
    await this.portfolioService.removeCoin(coin.id);
    
    // Borramos visualmente de la lista al instante
    this.myCoins = this.myCoins.filter(c => c.id !== coin.id);
  }
}