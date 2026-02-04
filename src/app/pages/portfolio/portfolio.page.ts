import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // <--- Importar Router
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, 
  IonAvatar, IonLabel, IonButtons, IonButton, IonIcon, IonText,
  IonCard 
} from '@ionic/angular/standalone';
import { PortfolioService } from 'src/app/core/services/portfolio.service';
import { addIcons } from 'ionicons';
import { trashOutline, settingsOutline } from 'ionicons/icons'; // <--- Importar ambos iconos

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.page.html',
  styleUrls: ['./portfolio.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, 
    IonList, IonItem, IonAvatar, IonLabel, IonButtons, IonButton, IonIcon, IonText,
    IonCard
  ]
})
export class PortfolioPage {
  private portfolioService = inject(PortfolioService);
  private router = inject(Router); // <--- Inyectar Router
  myCoins: any[] = [];

  constructor() { 
    // Registramos la papelera Y el engranaje de ajustes
    addIcons({ trashOutline, settingsOutline }); 
  }

  // Se ejecuta cada vez que entras a la tab
  ionViewWillEnter() {
    this.loadPortfolio();
  }

  loadPortfolio() {
    this.myCoins = this.portfolioService.getPortfolio();
  }

  remove(coin: any) {
    this.portfolioService.toggleCoin(coin);
    this.loadPortfolio(); // Recargar lista
  }

  // Nueva función para navegar a Settings
  openSettings() {
    this.router.navigate(['/settings']);
  }
}