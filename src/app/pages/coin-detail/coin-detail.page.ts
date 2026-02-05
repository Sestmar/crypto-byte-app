import { Component, OnInit, inject, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonChip, IonIcon, IonLabel, IonSpinner, IonGrid, IonRow, IonCol, IonFab, IonFabButton,
  AlertController // <--- IMPORTANTE
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { PortfolioService } from 'src/app/core/services/portfolio.service';
import { addIcons } from 'ionicons';
// Nuevos iconos: add y checkmark-circle
import { caretUp, caretDown, heart, heartOutline, add, checkmarkCircle } from 'ionicons/icons';
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
  private alertController = inject(AlertController); // <--- INYECCIÓN

  @ViewChild('lineCanvas') lineCanvas: ElementRef | undefined;
  chart: any;

  coin: any = null;
  loading = true;
  
  // En vez de isFavorite, ahora controlamos la cantidad
  // null = no la tienes. numero = cantidad que tienes.
  currentAmount: number | null = null; 

  constructor() {
    addIcons({ caretUp, caretDown, heart, heartOutline, add, checkmarkCircle });
    Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Filler, Tooltip);
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // 1. Verificamos si ya tenemos esta moneda y cuánta
      this.currentAmount = await this.portfolioService.getAssetAmount(id);
      
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

  // --- LÓGICA DE CHART (INTACTA) ---
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

  // --- NUEVA LÓGICA DE PORTFOLIO (Alertas) ---

  async handlePortfolioAction() {
    if (!this.coin) return;

    if (this.currentAmount !== null) {
      // YA LA TIENES -> PREGUNTAR SI BORRAR O EDITAR
      this.presentEditOrDeleteAlert();
    } else {
      // NO LA TIENES -> AÑADIR NUEVA
      this.presentAddAlert();
    }
  }

  async presentAddAlert() {
    const alert = await this.alertController.create({
      header: 'Add to Portfolio',
      subHeader: this.coin.name,
      message: 'Enter the amount you hold:',
      inputs: [
        {
          name: 'amount',
          type: 'number',
          placeholder: '0.00',
          min: 0
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: async (data) => {
            if (data.amount) {
              await this.portfolioService.saveAsset(this.coin.id, parseFloat(data.amount));
              this.currentAmount = parseFloat(data.amount); // Actualizamos vista
            }
          }
        }
      ],
      cssClass: 'cyber-alert' // Usaremos estilos globales si quieres personalizarlos
    });
    await alert.present();
  }

  async presentEditOrDeleteAlert() {
    const alert = await this.alertController.create({
      header: 'Manage Asset',
      message: `You hold ${this.currentAmount} ${this.coin.symbol.toUpperCase()}`,
      buttons: [
        {
          text: 'Update Amount',
          handler: () => this.presentAddAlert() // Reusamos la de añadir
        },
        {
          text: 'Remove Asset',
          role: 'destructive',
          handler: async () => {
            await this.portfolioService.removeAsset(this.coin.id);
            this.currentAmount = null;
          }
        },
        { text: 'Cancel', role: 'cancel' }
      ],
      cssClass: 'cyber-alert'
    });
    await alert.present();
  }
}