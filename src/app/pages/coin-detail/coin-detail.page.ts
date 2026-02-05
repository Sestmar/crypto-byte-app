import { Component, OnInit, inject, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonChip, IonIcon, IonLabel, IonSpinner, IonGrid, IonRow, IonCol, IonFab, IonFabButton,
  AlertController, ToastController, IonSegment, IonSegmentButton 
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { PortfolioService, Asset } from 'src/app/core/services/portfolio.service';
import { addIcons } from 'ionicons';
import { caretUp, caretDown, heart, heartOutline, add, checkmarkCircle, walletOutline, trendingUpOutline, trendingDownOutline } from 'ionicons/icons';

// --- IMPORTS CHART.JS ---
import 'hammerjs'; // <--- IMPORTANTE: HammerJS PRIMERO para que funcionen los gestos
import { 
  Chart, 
  LinearScale, 
  TimeSeriesScale, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns'; 
import zoomPlugin from 'chartjs-plugin-zoom'; 

@Component({
  selector: 'app-coin-detail',
  templateUrl: './coin-detail.page.html',
  styleUrls: ['./coin-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    CommonModule, FormsModule, IonCard, IonCardContent, IonCardHeader, 
    IonCardTitle, IonChip, IonIcon, IonLabel, IonSpinner, 
    IonGrid, IonRow, IonCol, IonFab, IonFabButton,
    IonSegment, IonSegmentButton
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
  availableUSDT = 0;
  
  selectedTimeframe = '1'; 

  myPosition = { totalValue: 0, pnl: 0, pnlPercent: 0 };

  constructor() {
    addIcons({ caretUp, caretDown, heart, heartOutline, add, checkmarkCircle, walletOutline, trendingUpOutline, trendingDownOutline });
    
    Chart.register(
      LinearScale, 
      TimeSeriesScale, 
      Tooltip, 
      Legend, 
      CandlestickController, 
      CandlestickElement,
      zoomPlugin
    );
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        this.currentAsset = await this.portfolioService.getAssetData(id);
        const usdtAsset = await this.portfolioService.getAssetData('tether');
        this.availableUSDT = usdtAsset ? usdtAsset.amount : 0;
      } catch (error) { console.error(error); }
      
      this.cryptoService.getCoinDetail(id).subscribe({
        next: (data) => {
          this.coin = data;
          this.calculatePosition();
          this.loading = false;
          this.cdr.detectChanges();
          this.loadCandleChart(id, '1');
        },
        error: () => this.loading = false
      });
    }
  }

  changeTimeframe(event: any) {
    this.selectedTimeframe = event.detail.value;
    if(this.coin) {
      this.loadCandleChart(this.coin.id, this.selectedTimeframe);
    }
  }

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
      }
    }
  }

  loadCandleChart(id: string, days: string) {
    if (this.chart) {
      this.chart.destroy();
    }

    this.cryptoService.getOHLC(id, days).subscribe({
      next: (ohlcData) => {
        const candleData = ohlcData.map(item => ({
          x: item[0],
          o: item[1],
          h: item[2],
          l: item[3],
          c: item[4]
        }));
        this.createCandleChart(candleData);
      },
      error: (err) => console.warn("API Error", err)
    });
  }

  createCandleChart(data: any[]) {
    if (this.lineCanvas) {
      const ctx = this.lineCanvas.nativeElement.getContext('2d');

      if (this.chart) this.chart.destroy();

      this.chart = new Chart(ctx, {
        type: 'candlestick', 
        data: {
          datasets: [{
            label: 'Price',
            data: data,
            color: { up: '#00ff9d', down: '#ff073a', unchanged: '#999' },
            borderColor: { up: '#00ff9d', down: '#ff073a', unchanged: '#999' },
            wickColor: { up: '#00ff9d', down: '#ff073a', unchanged: '#999' },
            barThickness: 'flex', 
          } as any] 
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { display: false },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: (context: any) => {
                  const p = context.raw;
                  return [`O: ${p.o}`, `H: ${p.h}`, `L: ${p.l}`, `C: ${p.c}`];
                }
              }
            },
            // --- CONFIGURACIÓN DE ZOOM CORREGIDA ---
            zoom: {
              // He quitado los límites estrictos para que puedas moverte libremente
              pan: {
                enabled: true,
                mode: 'x', 
                threshold: 0 // Respuesta instantánea al arrastrar
              },
              zoom: {
                wheel: { enabled: true },
                pinch: { enabled: true },
                mode: 'x',
              }
            }
          } as any,
          scales: {
            x: {
              type: 'time', 
              time: {
                unit: this.selectedTimeframe === '1' ? 'minute' : 'day', 
                displayFormats: { minute: 'HH:mm', day: 'dd MMM' }
              },
              grid: { display: false },
              ticks: { color: '#666', maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }
            },
            y: {
              position: 'right',
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#888', callback: (val: any) => '$' + val.toLocaleString() }
            }
          }
        }
      });
    }
  }

  // --- MÉTODOS DE TRADING ---
  // --- MÉTODOS DE TRADING ---
  async handlePortfolioAction() {
    if (!this.coin) return;
    if (this.coin.id === 'tether') {
      this.showToast('Ve a la Cartera para depositar USDT', 'warning');
      return;
    }
    if (this.currentAsset) {
      this.presentTradeOptions();
    } else {
      this.presentBuyAlert();
    }
  }

  async presentBuyAlert() {
    const currentPrice = this.coin.market_data.current_price.usd;
    const maxBuy = this.availableUSDT / currentPrice;

    if (this.availableUSDT < 1) {
      this.showToast('USDT Insuficiente. Deposita en la Cartera.', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Comprar ' + this.coin.symbol.toUpperCase(),
      subHeader: `Disponible: $${this.availableUSDT.toLocaleString('en-US', {maximumFractionDigits: 2})}`,
      message: `Precio: $${currentPrice.toLocaleString()}\nMáx: ${maxBuy.toFixed(6)}`,
      inputs: [{ name: 'amount', type: 'number', placeholder: 'Cantidad', min: 0, max: maxBuy }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'COMPRAR',
          handler: async (data) => {
            if (!data.amount) return;
            try {
              await this.portfolioService.executeTrade(this.coin.id, parseFloat(data.amount), currentPrice);
              this.showToast('¡Compra Exitosa!', 'success');
              this.ngOnInit();
              return true;
            } catch (error: any) {
              this.showToast(error.message, 'danger');
              return false;
            }
          }
        }
      ],
      cssClass: 'cyber-alert'
    });
    await alert.present();
  }

  async presentTradeOptions() {
    const alert = await this.alertController.create({
      header: 'Gestionar Posición',
      message: `Tienes: ${this.currentAsset?.amount} ${this.coin.symbol.toUpperCase()}`,
      buttons: [
        { text: 'Comprar Más', handler: () => this.presentBuyAlert() },
        {
          text: 'Vender Todo',
          role: 'destructive',
          handler: async () => {
            await this.portfolioService.sellAsset(this.coin.id, this.coin.market_data.current_price.usd);
            this.currentAsset = null;
            this.myPosition = { totalValue: 0, pnl: 0, pnlPercent: 0 };
            this.showToast('Posición Vendida', 'success');
            this.ngOnInit();
          }
        },
        { text: 'Cancelar', role: 'cancel' }
      ],
      cssClass: 'cyber-alert'
    });
    await alert.present();
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastController.create({
      message: msg, duration: 2000, color: color, position: 'top'
    });
    toast.present();
  }
}