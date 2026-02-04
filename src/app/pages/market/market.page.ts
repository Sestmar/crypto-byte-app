import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonList, IonItem, IonAvatar, IonLabel, IonSkeletonText, IonBadge, IonCard,
  IonChip, IonIcon // <--- Añadir IonChip e IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons'; // Importar addIcons
import { arrowUp, arrowDown, filter } from 'ionicons/icons';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-market',
  templateUrl: './market.page.html',
  styleUrls: ['./market.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonList, IonItem, IonAvatar, IonLabel, IonSkeletonText, IonBadge, IonCard,
    IonChip, IonIcon // <--- Añadir aquí también
  ]
})
export class MarketPage implements OnInit {
  private cryptoService = inject(CryptoService);
  private router = inject(Router);
  
  coins: any[] = [];
  originalCoins: any[] = []; // Para poder volver al orden original
  loading = true;
  activeFilter = 'rank'; // Para saber cuál está activo

  constructor() {
    addIcons({ arrowUp, arrowDown, filter });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.cryptoService.getMarkets().subscribe({
      next: (data) => {
        this.coins = data;
        this.originalCoins = [...data]; // Guardamos copia
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  // Lógica de ordenación local
  sort(type: string) {
    this.activeFilter = type;
    
    switch(type) {
      case 'rank':
        // Restaurar orden original (Market Cap)
        this.coins = [...this.originalCoins];
        break;
      case 'gainers':
        // Ordenar por mayor subida %
        this.coins.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
        break;
      case 'losers':
        // Ordenar por mayor bajada %
        this.coins.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
        break;
      case 'name':
        // Alfabético
        this.coins.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
  }

  openDetail(id: string) {
    this.router.navigate(['/coin-detail', id]);
  }
}