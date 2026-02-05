import { Component, OnInit, inject, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonChip, IonIcon, IonLabel, IonSpinner, IonGrid, IonRow, IonCol, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { PortfolioService } from 'src/app/core/services/portfolio.service';
import { addIcons } from 'ionicons';
import { caretUp, caretDown, heart, heartOutline } from 'ionicons/icons';
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Filler, Tooltip } from 'chart.js';

@Component({
  selector: 'app-coin-detail',
  templateUrl: './coin-detail.page.html',
  styleUrls: ['./coin-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    CommonModule, FormsModule, IonCard, IonCardContent, IonCardHeader, 
    IonCardTitle, IonChip, IonIcon, IonLabel, IonSpinner, 
    IonGrid, IonRow, IonCol, IonFab, IonFabButton
  ]
})
export class CoinDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private cryptoService = inject(CryptoService);
  private portfolioService = inject(PortfolioService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('lineCanvas') lineCanvas: ElementRef | undefined;
  chart: any;

  coin: any = null;
  loading = true;
  isFavorite = false;

  constructor() {
    addIcons({ caretUp, caretDown, heart, heartOutline });
    Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Filler, Tooltip);
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // 1. Verificar si es favorito en Firebase (Async)
      this.isFavorite = await this.portfolioService.isFavorite(id);
      
      this.cryptoService.getCoinDetail(id).subscribe({
        next: (data) => {
          this.coin = data;
          this.loading = false;
          
          this.cdr.detectChanges();
          
          this.loadChart(id, data.market_data.current_price.usd);
        },
        error: () => this.loading = false
      });
    }
  }

  // --- LÓGICA DE CHART (Igual que antes) ---
  loadChart(id: string, currentPrice: number) {
    this.cryptoService.getMarketChart(id).subscribe({
      next: (data) => {
        const prices = data.prices; 
        const labels = prices.map((price: any) => new Date(price[0]).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }));
        const values = prices.map((price: any) => price[1]);
        this.createChart(labels, values);
      },
      error: (err) => {
        console.warn("API Límite alcanzado, generando gráfica simulada.");
        this.generateFakeChart(currentPrice);
      }
    });
  }

  generateFakeChart(basePrice: number) {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const values = [];
    for (let i = 0; i < 7; i++) {
      const volatility = basePrice * 0.05; 
      const randomChange = (Math.random() - 0.5) * volatility;
      values.push(basePrice + randomChange);
    }
    values[6] = basePrice;
    this.createChart(labels, values);
  }

  createChart(labels: any[], data: any[]) {
    if (this.lineCanvas) {
      const ctx = this.lineCanvas.nativeElement.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(0, 243, 255, 0.5)'); 
      gradient.addColorStop(1, 'rgba(0, 243, 255, 0)');   

      if (this.chart) this.chart.destroy();

      this.chart = new Chart(this.lineCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Price',
            data: data,
            borderColor: '#00f3ff', 
            backgroundColor: gradient,
            borderWidth: 2,
            pointRadius: 0, 
            pointHoverRadius: 6,
            fill: true,
            tension: 0.4 
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { display: false },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(5, 5, 16, 0.9)',
              titleColor: '#00f3ff',
              bodyColor: '#fff',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              callbacks: {
                label: (context) => `$${Number(context.raw).toLocaleString()}`
              }
            }
          },
          scales: {
            x: { display: false }, 
            y: { display: false } 
          },
          animation: { duration: 1500, easing: 'easeOutQuart' }
        }
      });
    }
  }

  // --- LÓGICA DE FAVORITOS ACTUALIZADA ---
  async toggleFavorite() {
    if (!this.coin) return;

    const coinId = this.coin.id;

    if (this.isFavorite) {
      // Si ya es favorito, lo quitamos de Firebase
      await this.portfolioService.removeCoin(coinId);
      this.isFavorite = false;
    } else {
      // Si no lo es, lo añadimos
      await this.portfolioService.addCoin(coinId);
      this.isFavorite = true;
    }
  }
}