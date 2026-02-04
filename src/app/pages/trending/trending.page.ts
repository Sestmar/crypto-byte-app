import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, 
  IonAvatar, IonLabel, IonBadge, IonIcon, IonCard 
} from '@ionic/angular/standalone';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { Router } from '@angular/router'; // <--- 1. Importar Router
import { addIcons } from 'ionicons';
import { flame } from 'ionicons/icons';

@Component({
  selector: 'app-trending',
  templateUrl: './trending.page.html',
  styleUrls: ['./trending.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, IonList, IonItem, IonAvatar, IonLabel, IonBadge, IonIcon, IonCard]
})
export class TrendingPage implements OnInit {
  private cryptoService = inject(CryptoService);
  private router = inject(Router); // <--- 2. Inyectar Router
  trendingCoins: any[] = [];

  constructor() { addIcons({ flame }); }

  ngOnInit() {
    this.cryptoService.getTrending().subscribe(data => {
      this.trendingCoins = data.coins; 
    });
  }

  // <--- 3. Añadir función de navegación
  openDetail(id: string) {
    this.router.navigate(['/coin-detail', id]);
  }
}