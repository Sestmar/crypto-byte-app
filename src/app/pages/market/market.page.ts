import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonList, IonItem, IonAvatar, IonLabel, IonBadge, 
  IonCard, IonSpinner, IonChip, IonIcon, // <--- AQUÍ FALTABA EL SPINNER
  IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowUp, arrowDown } from 'ionicons/icons';

@Component({
  selector: 'app-market',
  templateUrl: './market.page.html',
  styleUrls: ['./market.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonList, IonItem, IonAvatar, IonLabel, IonBadge, 
    IonCard, IonSpinner, IonChip, IonIcon, // <--- Y AQUÍ TAMBIÉN
    IonRefresher, IonRefresherContent,
    CommonModule, FormsModule
  ]
})
export class MarketPage implements OnInit {
  private cryptoService = inject(CryptoService);
  private router = inject(Router);

  coins: any[] = [];
  allCoins: any[] = []; // Copia de seguridad para filtrar
  loading = true;
  activeFilter = 'rank'; // Filtro por defecto

  constructor() {
    addIcons({ arrowUp, arrowDown });
  }

  ngOnInit() {
    this.loadMarket();
  }

  loadMarket(event?: any) {
    this.loading = true;
    this.cryptoService.getMarkets().subscribe({
      next: (data) => {
        this.allCoins = data;
        this.coins = [...data]; // Inicializamos la vista
        this.sort('rank'); // Ordenamos por defecto
        this.loading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        if (event) event.target.complete();
      }
    });
  }

  openDetail(id: string) {
    this.router.navigate(['/coin-detail', id]);
  }

  // --- LÓGICA DE FILTROS ---
  sort(type: string) {
    this.activeFilter = type;
    this.loading = true; // Efecto visual rápido

    // Pequeño timeout para que se note el cambio
    setTimeout(() => {
      switch (type) {
        case 'rank':
          this.coins = [...this.allCoins].sort((a, b) => a.market_cap_rank - b.market_cap_rank);
          break;
        case 'gainers':
          this.coins = [...this.allCoins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
          break;
        case 'losers':
          this.coins = [...this.allCoins].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
          break;
        case 'name':
          this.coins = [...this.allCoins].sort((a, b) => a.name.localeCompare(b.name));
          break;
      }
      this.loading = false;
    }, 200);
  }
}