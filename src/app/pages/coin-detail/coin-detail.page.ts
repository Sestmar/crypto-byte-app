import { Component, OnInit, inject, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonChip, IonIcon, IonLabel, IonSpinner, IonGrid, IonRow, IonCol, IonFab, IonFabButton,
  AlertController, ToastController 
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { PortfolioService, Asset } from 'src/app/core/services/portfolio.service';
import { addIcons } from 'ionicons';
import { caretUp, caretDown, heart, heartOutline, add, checkmarkCircle, walletOutline, trendingUpOutline, trendingDownOutline } from 'ionicons/icons';
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
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  @ViewChild('lineCanvas') lineCanvas: ElementRef | undefined;
  chart: any;

  coin: any = null;
  loading = true;
  currentAsset: Asset | null = null; 

  // NUEVO: Objeto para guardar los cálculos de TU posición
  myPosition = {
    totalValue: 0,
    pnl: 0,
    pnlPercent: 0
  };

  constructor() {
    // Añadimos iconos nuevos para la tarjeta de posición
    addIcons({ caretUp, caretDown, heart, heartOutline, add, checkmarkCircle, walletOutline, trendingUpOutline, trendingDownOutline });
    Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Filler, Tooltip);
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        this.currentAsset = await this.portfolioService.getAssetData(id);
      } catch (error) {
        console.error("Error cargando activo:", error);
      }
      
      this.cryptoService.getCoinDetail(id).subscribe({
        next: (data) => {
          this.coin = data;
          
          // CALCULAMOS TU POSICIÓN AL CARGAR LOS DATOS
          this.calculatePosition();

          this.loading = false;
          this.cdr.detectChanges();
          this.loadChart(id, data.market_data.current_price.usd);
        },
        error: () => this.loading = false
      });
    }
  }

  // --- NUEVA FUNCIÓN: CALCULA GANANCIAS/PÉRDIDAS ---
  calculatePosition() {
    if (this.currentAsset && this.coin) {
      const currentPrice = this.coin.market_data.current_price.usd;
      const amount = this.currentAsset.amount;
      const buyPrice = this.currentAsset.buyPrice || 0;

      const currentValue = amount * currentPrice;
      const investedValue = amount * buyPrice;

      this.myPosition.totalValue = currentValue;
      
      if (buyPrice > 0) {
        this.myPosition.pnl = currentValue - investedValue;
        this.myPosition.pnlPercent = (this.myPosition.pnl / investedValue) * 100;
      } else {
        this.myPosition.pnl = 0;
        this.myPosition.pnlPercent = 0;
      }
    }
  }

  // --- CHART ---
  loadChart(id: string, currentPrice: number) {
    this.cryptoService.getMarketChart(id).subscribe({
      next: (data) => {
        const prices = data.prices; 
        const labels = prices.map((price: any) => new Date(price[0]).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }));
        const values = prices.map((price: any) => price[1]);
        this.createChart(labels, values);
      },
      error: (err) => {
        console.warn("API Error", err);
        this.generateFakeChart(currentPrice);
      }
    });
  }

  generateFakeChart(basePrice: number) {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const values = [];
    for (let i = 0; i < 7; i++) {
      values.push(basePrice * (1 + (Math.random() * 0.1 - 0.05)));
    }
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
          plugins: { legend: { display: false } },
          scales: { x: { display: false }, y: { display: false } },
          animation: { duration: 1500 }
        }
      });
    }
  }

  // --- GESTIÓN DE PORTFOLIO ---

  async handlePortfolioAction() {
    if (!this.coin) return;
    if (this.currentAsset) {
      this.presentEditOrDeleteAlert();
    } else {
      this.presentAddAlert();
    }
  }

  async presentAddAlert() {
    const currentPrice = this.coin.market_data.current_price.usd;

    const alert = await this.alertController.create({
      header: 'Add Transaction',
      subHeader: this.coin.name,
      inputs: [
        {
          name: 'amount',
          type: 'number',
          placeholder: 'Amount',
          min: 0,
          value: this.currentAsset ? this.currentAsset.amount : ''
        },
        {
          name: 'buyPrice',
          type: 'number',
          placeholder: 'Buy Price ($)',
          value: this.currentAsset ? this.currentAsset.buyPrice : currentPrice
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: async (data) => {
            if (!data.amount || !data.buyPrice) {
              this.showToast('Please fill in both Amount and Price', 'danger');
              return false;
            }

            try {
              await this.portfolioService.saveAsset(
                this.coin.id, 
                parseFloat(data.amount),
                parseFloat(data.buyPrice)
              );
              
              this.currentAsset = { 
                id: this.coin.id,
                amount: parseFloat(data.amount),
                buyPrice: parseFloat(data.buyPrice)
              };

              // RECALCULAMOS AL GUARDAR
              this.calculatePosition();

              this.showToast('Asset saved successfully!', 'success');
              return true;

            } catch (error) {
              console.error(error);
              this.showToast('Error saving asset', 'danger');
              return false;
            }
          }
        }
      ],
      cssClass: 'cyber-alert'
    });
    await alert.present();
  }

  async presentEditOrDeleteAlert() {
    const alert = await this.alertController.create({
      header: 'Manage Asset',
      message: `Holding: ${this.currentAsset?.amount} ${this.coin.symbol.toUpperCase()}`,
      buttons: [
        {
          text: 'Edit Position',
          handler: () => this.presentAddAlert()
        },
        {
          text: 'Sell / Remove',
          role: 'destructive',
          handler: async () => {
            await this.portfolioService.removeAsset(this.coin.id);
            this.currentAsset = null;
            this.myPosition = { totalValue: 0, pnl: 0, pnlPercent: 0 }; // Limpiamos datos
            this.showToast('Asset removed', 'warning');
          }
        },
        { text: 'Cancel', role: 'cancel' }
      ],
      cssClass: 'cyber-alert'
    });
    await alert.present();
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      color: color,
      position: 'top'
    });
    toast.present();
  }
}