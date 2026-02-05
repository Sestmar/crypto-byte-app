import { Component, inject, OnInit, OnDestroy } from '@angular/core'; // <--- AÑADIDO OnDestroy
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, 
  IonAvatar, IonLabel, IonText, IonButtons, IonButton, IonIcon, 
  IonSpinner, IonCard, IonItemSliding, IonItemOptions, IonItemOption, 
  IonGrid, IonRow, IonCol, IonListHeader,
  AlertController, ToastController 
} from '@ionic/angular/standalone';
import { RouterLink, Router } from '@angular/router'; 
import { PortfolioService, Asset } from 'src/app/core/services/portfolio.service';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { addIcons } from 'ionicons';
import { 
  trashOutline, settingsOutline, eyeOutline, eyeOffOutline, 
  swapHorizontalOutline, walletOutline, arrowDownCircleOutline, 
  arrowUpCircleOutline 
} from 'ionicons/icons';
import { Subscription } from 'rxjs'; // <--- IMPORTANTE

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.page.html',
  styleUrls: ['./portfolio.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, 
    IonAvatar, IonLabel, IonText, IonButtons, IonButton, IonIcon, 
    IonSpinner, CommonModule, FormsModule, RouterLink, IonCard,
    IonItemSliding, IonItemOptions, IonItemOption, IonGrid, IonRow, IonCol,
    IonListHeader
  ]
})
export class PortfolioPage implements OnInit, OnDestroy { // <--- Implementamos interfaces
  private portfolioService = inject(PortfolioService);
  private cryptoService = inject(CryptoService);
  private router = inject(Router); 
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  
  myCoins: any[] = [];
  loading = false;
  
  totalBalanceUSD = 0;
  totalInvested = 0;
  totalPnL = 0;        
  totalPnLPercent = 0; 
  
  availableUSDT = 0;
  
  hideBalance = false; 
  showInBTC = false;   

  // Variable para controlar la conexión y que no se duplique
  private portfolioSub: Subscription | null = null;

  constructor() {
    addIcons({ 
      trashOutline, settingsOutline, eyeOutline, eyeOffOutline, 
      swapHorizontalOutline, walletOutline, arrowDownCircleOutline, 
      arrowUpCircleOutline 
    });
  }

  // CAMBIO: Usamos ngOnInit en vez de ionViewWillEnter para evitar duplicados
  ngOnInit() {
    this.loadPortfolio();
  }

  // CAMBIO: Cuando salimos de la página, cortamos la conexión
  ngOnDestroy() {
    if (this.portfolioSub) {
      this.portfolioSub.unsubscribe();
    }
  }

  toggleVisibility() { this.hideBalance = !this.hideBalance; }
  toggleCurrency() { this.showInBTC = !this.showInBTC; }
  openSettings() { this.router.navigate(['/settings']); }

  loadPortfolio() {
    this.loading = true;
    
    // Si ya existe una suscripción, la cerramos antes de abrir otra
    if (this.portfolioSub) {
      this.portfolioSub.unsubscribe();
    }

    this.portfolioSub = this.portfolioService.getPortfolio().subscribe({
      next: (assets: Asset[]) => {
        if (!assets || assets.length === 0) {
          this.myCoins = [];
          this.totalBalanceUSD = 0;
          this.loading = false;
          return;
        }

        const ids = assets.map(a => a.id);

        this.cryptoService.getCoinsByIds(ids).subscribe({
          next: (apiCoins) => {
            // Reiniciamos variables a 0 CADA VEZ que llegan datos
            let tempTotalBalance = 0;
            let tempTotalInvested = 0;
            let tempUSDT = 0;

            this.myCoins = apiCoins.map(coin => {
              const asset = assets.find(a => a.id === coin.id);
              const amount = asset ? asset.amount : 0;
              const buyPrice = asset?.buyPrice || 0; 

              const currentValue = amount * coin.current_price;
              const investedValue = amount * buyPrice;
              
              const pnl = currentValue - investedValue;
              const pnlPercent = buyPrice > 0 ? (pnl / investedValue) * 100 : 0;

              tempTotalBalance += currentValue;
              if (buyPrice > 0) tempTotalInvested += investedValue;

              if (coin.id === 'tether') {
                tempUSDT = amount; // Guardamos la CANTIDAD real de USDT
              }

              return {
                ...coin,
                amount,
                buyPrice,
                totalValue: currentValue,
                pnl,
                pnlPercent
              };
            });

            // Actualizamos la vista
            this.totalBalanceUSD = tempTotalBalance;
            this.totalInvested = tempTotalInvested;
            
            // Fix visual: Asegurar que USDT valga 1$ para el cálculo visual de "Efectivo"
            // (Aunque USDT oscila 0.99-1.01, para retirar asumimos 1:1)
            this.availableUSDT = tempUSDT; 

            this.totalPnL = this.totalBalanceUSD - this.totalInvested;
            this.totalPnLPercent = this.totalInvested > 0 ? (this.totalPnL / this.totalInvested) * 100 : 0;

            this.loading = false;
          },
          error: () => this.loading = false
        });
      }
    });
  }

  // --- 1. DEPOSITAR ---
  async deposit() {
    const alert = await this.alertController.create({
      header: 'Deposit Simulator',
      subHeader: 'Add Paper Money (USDT)',
      inputs: [ { name: 'amount', type: 'number', placeholder: 'e.g. 10000', min: 0 } ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Deposit',
          handler: async (data) => {
            if (data.amount) {
              await this.portfolioService.depositBalance(parseFloat(data.amount));
              this.showToast(`Depositado $${data.amount}`, 'correctamente');
            }
          }
        }
      ],
      cssClass: 'cyber-alert'
    });
    await alert.present();
  }

  // --- 2. RETIRAR (MEJORADO CON BOTÓN MAX) ---
  async withdraw() {
    const alert = await this.alertController.create({
      header: 'Retirar Fondos',
      subHeader: 'Retirar al Banco',
      // Mostramos el saldo exacto formateado
      message: `Efectivo disponible: $${this.availableUSDT.toLocaleString('en-US', {minimumFractionDigits: 2})}`,
      inputs: [ 
        { 
          name: 'amount', 
          type: 'number', 
          placeholder: 'Amount to withdraw',
          min: 0,
          id: 'withdraw-input' // ID para referencia futura si hiciera falta
        } 
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'MAX', // Botón para retirar todo
          handler: (data) => {
            // Truco: Al pulsar MAX, cerramos esta alerta y abrimos la confirmación con el total
            this.alertController.dismiss();
            this.confirmWithdraw(this.availableUSDT); 
            return false;
          }
        },
        {
          text: 'Confirmar',
          handler: (data) => {
            if (!data.amount) return;
            this.confirmWithdraw(parseFloat(data.amount));
          }
        }
      ],
      cssClass: 'cyber-alert'
    });
    await alert.present();
  }

  // Función auxiliar para ejecutar el retiro
  async confirmWithdraw(amount: number) {
    if (amount > this.availableUSDT) {
      this.showToast(`USDT Insufficiente. Tienes $${this.availableUSDT.toFixed(2)}`, 'danger');
      return;
    }

    try {
      await this.portfolioService.withdrawBalance(amount);
      this.showToast(`Retirado $${amount.toLocaleString()} correctamente`, 'success');
    } catch (error: any) {
      this.showToast(error.message, 'danger');
    }
  }

  // --- 3. TRANSFERIR ---
  async transfer() {
    const alert = await this.alertController.create({
      header: 'Transferencia Interna',
      subHeader: 'Enviar a Amigo / Wallet',
      message: `Efectivo Disponible: $${this.availableUSDT.toLocaleString('es-ES', {minimumFractionDigits: 2})}`,
      inputs: [
        { name: 'address', type: 'text', placeholder: 'Dirección Destino (0x...)' },
        { name: 'amount', type: 'number', placeholder: 'Cantidad USDT', min: 0 }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: async (data) => {
            if (!data.amount || !data.address) return;
            const amount = parseFloat(data.amount);

            if (amount > this.availableUSDT) {
              this.showToast(`USDT Insuficiente`, 'danger');
              return;
            }

            try {
              await this.portfolioService.withdrawBalance(amount);
              this.showToast(`Enviado $${amount} a ${data.address.substring(0,6)}...`, 'success');
            } catch (error: any) {
              this.showToast(error.message, 'danger');
            }
          }
        }
      ],
      cssClass: 'cyber-alert'
    });
    await alert.present();
  }

  async remove(coin: any) {
    await this.portfolioService.removeAsset(coin.id);
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastController.create({
      message: msg, duration: 2000, color: color, position: 'top'
    });
    toast.present();
  }
}