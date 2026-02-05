import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, deleteDoc, getDoc, collectionData } from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { Observable, of, switchMap } from 'rxjs';

// MODIFICACIÓN: Añadimos buyPrice opcional
export interface Asset {
  id: string;
  amount: number;
  buyPrice?: number; // Nuevo campo para calcular PnL
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // 1. OBTENER PORTFOLIO (Igual que antes)
  getPortfolio(): Observable<Asset[]> {
    return authState(this.auth).pipe(
      switchMap(user => {
        if (!user) return of([]);
        const assetsRef = collection(this.firestore, `users/${user.uid}/assets`);
        return collectionData(assetsRef, { idField: 'id' }) as Observable<Asset[]>;
      })
    );
  }

  // 2. GUARDAR ACTIVO (Ahora pide precio de compra)
  async saveAsset(coinId: string, amount: number, buyPrice: number) {
    const user = this.auth.currentUser;
    if (!user) return;

    const assetDoc = doc(this.firestore, `users/${user.uid}/assets/${coinId}`);
    
    // Guardamos cantidad y precio de compra
    await setDoc(assetDoc, { 
      amount: amount,
      buyPrice: buyPrice, 
      updatedAt: new Date()
    }, { merge: true });
  }

  // 3. ELIMINAR (Igual que antes)
  async removeAsset(coinId: string) {
    const user = this.auth.currentUser;
    if (!user) return;
    const assetDoc = doc(this.firestore, `users/${user.uid}/assets/${coinId}`);
    await deleteDoc(assetDoc);
  }

  // 4. OBTENER DATOS DEL ACTIVO (Cantidad y Precio Compra)
  // Útil para pre-llenar el formulario de edición
  async getAssetData(coinId: string): Promise<Asset | null> {
    const user = this.auth.currentUser;
    if (!user) return null;

    const assetDoc = doc(this.firestore, `users/${user.uid}/assets/${coinId}`);
    const snapshot = await getDoc(assetDoc);
    
    if (snapshot.exists()) {
      return snapshot.data() as Asset;
    }
    return null;
  }
}