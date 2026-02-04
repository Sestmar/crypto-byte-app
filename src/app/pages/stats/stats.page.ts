import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, 
  IonCardSubtitle, IonCardTitle, IonCardContent, IonProgressBar, IonGrid, IonRow, IonCol 
} from '@ionic/angular/standalone';
import { CryptoService } from 'src/app/core/services/crypto.service';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonProgressBar, IonGrid, IonRow, IonCol]
})
export class StatsPage implements OnInit {
  private cryptoService = inject(CryptoService);
  globalData: any = null;

  ngOnInit() {
    this.cryptoService.getGlobalData().subscribe(res => {
      this.globalData = res.data;
    });
  }
}