import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, deleteDoc, getDoc, collectionData, runTransaction } from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { Observable, of, switchMap } from 'rxjs';

export interface Asset {
  id: string;
  amount: number;
  buyPrice?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  
  // Moneda base para el simulador
  private BASE_CURRENCY = 'tether';

  // 1. OBTENER PORTFOLIO (Igual)
  getPortfolio(): Observable<Asset[]> {
    return authState(this.auth).pipe(
      switchMap(user => {
        if (!user) return of([]);
        const assetsRef = collection(this.firestore, `users/${user.uid}/assets`);
        return collectionData(assetsRef, { idField: 'id' }) as Observable<Asset[]>;
      })
    );
  }

  // 2. OBTENER DATOS DE UN ACTIVO
  async getAssetData(coinId: string): Promise<Asset | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    const assetDoc = doc(this.firestore, `users/${user.uid}/assets/${coinId}`);
    const snapshot = await getDoc(assetDoc);
    return snapshot.exists() ? snapshot.data() as Asset : null;
  }

  // 3. DEPOSITAR DINERO FICTICIO (USDT)
  async depositBalance(amount: number) {
    const user = this.auth.currentUser;
    if (!user) return;

    const usdtDoc = doc(this.firestore, `users/${user.uid}/assets/${this.BASE_CURRENCY}`);
    const snapshot = await getDoc(usdtDoc);
    
    let currentBalance = 0;
    if (snapshot.exists()) {
      currentBalance = snapshot.data()['amount'];
    }

    await setDoc(usdtDoc, { 
      amount: currentBalance + amount,
      buyPrice: 1.00, // El USDT siempre vale 1
      updatedAt: new Date()
    }, { merge: true });
  }

  // 4. EJECUTAR TRADE (Compra con saldo real)
  async executeTrade(coinId: string, amountToBuy: number, pricePerCoin: number) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not logged in');

    const usdtRef = doc(this.firestore, `users/${user.uid}/assets/${this.BASE_CURRENCY}`);
    const coinRef = doc(this.firestore, `users/${user.uid}/assets/${coinId}`);

    // Transacción ATÓMICA: O todo o nada
    await runTransaction(this.firestore, async (transaction) => {
      // A. Verificar saldo USDT
      const usdtSnap = await transaction.get(usdtRef);
      if (!usdtSnap.exists()) throw new Error('No USDT balance available. Please Deposit first.');
      
      const currentUSDT = usdtSnap.data()['amount'];
      const totalCost = amountToBuy * pricePerCoin;

      if (currentUSDT < totalCost) {
        throw new Error(`Insufficient funds. Cost: $${totalCost.toFixed(2)} - Available: $${currentUSDT.toFixed(2)}`);
      }

      // B. Calcular promedio ponderado si ya tenemos la moneda
      const coinSnap = await transaction.get(coinRef);
      let newAmount = amountToBuy;
      let newAvgPrice = pricePerCoin;

      if (coinSnap.exists()) {
        const data = coinSnap.data();
        const currentAmount = data['amount'];
        const currentAvg = data['buyPrice'];

        const totalValOld = currentAmount * currentAvg;
        const totalValNew = amountToBuy * pricePerCoin;
        
        newAmount = currentAmount + amountToBuy;
        newAvgPrice = (totalValOld + totalValNew) / newAmount;
      }

      // C. Ejecutar cambios
      transaction.update(usdtRef, { amount: currentUSDT - totalCost });
      
      transaction.set(coinRef, {
        amount: newAmount,
        buyPrice: newAvgPrice,
        updatedAt: new Date()
      }, { merge: true });
    });
  }

  // --- NUEVO: RETIRAR FONDOS (Para Withdraw y Transfer) ---
  async withdrawBalance(amount: number) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not connected');

    const usdtDoc = doc(this.firestore, `users/${user.uid}/assets/${this.BASE_CURRENCY}`);
    
    await runTransaction(this.firestore, async (transaction) => {
      const snapshot = await transaction.get(usdtDoc);
      if (!snapshot.exists()) throw new Error('No wallet found');

      const currentBalance = snapshot.data()['amount'];
      
      if (amount > currentBalance) {
        throw new Error(`Insufficient funds. You have $${currentBalance.toFixed(2)}`);
      }

      transaction.update(usdtDoc, {
        amount: currentBalance - amount,
        updatedAt: new Date()
      });
    });
  }

  // 5. VENDER TODO (Cash Out a USDT)
  async sellAsset(coinId: string, currentPrice: number) {
    const user = this.auth.currentUser;
    if (!user) return;

    const coinRef = doc(this.firestore, `users/${user.uid}/assets/${coinId}`);
    const usdtRef = doc(this.firestore, `users/${user.uid}/assets/${this.BASE_CURRENCY}`);

    await runTransaction(this.firestore, async (transaction) => {
      const coinSnap = await transaction.get(coinRef);
      const usdtSnap = await transaction.get(usdtRef);
      
      if (!coinSnap.exists()) return;

      const coinAmount = coinSnap.data()['amount'];
      const sellValue = coinAmount * currentPrice;

      // Borramos moneda
      transaction.delete(coinRef);

      // Ingresamos USDT
      const currentUSDT = usdtSnap.exists() ? usdtSnap.data()['amount'] : 0;
      transaction.set(usdtRef, {
        amount: currentUSDT + sellValue,
        buyPrice: 1.00
      }, { merge: true });
    });
  }

  // Método simple de borrado (por si acaso)
  async removeAsset(coinId: string) {
    const user = this.auth.currentUser;
    if (!user) return;
    await deleteDoc(doc(this.firestore, `users/${user.uid}/assets/${coinId}`));
  }
}