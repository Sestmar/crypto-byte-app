import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, deleteDoc, getDoc, collectionData } from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { Observable, of, switchMap } from 'rxjs';

export interface Asset {
  id: string;
  amount: number;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // 1. OBTENER PORTFOLIO (HOLDINGS)
  // Devuelve una lista en tiempo real: [{id: 'bitcoin', amount: 0.5}, ...]
  getPortfolio(): Observable<Asset[]> {
    return authState(this.auth).pipe(
      switchMap(user => {
        if (!user) return of([]);
        
        // Referencia a la sub-colección 'assets' del usuario
        const assetsRef = collection(this.firestore, `users/${user.uid}/assets`);
        // idField: 'id' hace que el ID del documento se meta en el objeto como propiedad 'id'
        return collectionData(assetsRef, { idField: 'id' }) as Observable<Asset[]>;
      })
    );
  }

  // 2. GUARDAR O ACTUALIZAR ACTIVO (Con cantidad)
  async saveAsset(coinId: string, amount: number) {
    const user = this.auth.currentUser;
    if (!user) return;

    const assetDoc = doc(this.firestore, `users/${user.uid}/assets/${coinId}`);
    await setDoc(assetDoc, { 
      amount: amount,
      updatedAt: new Date()
    }, { merge: true });
  }

  // 3. ELIMINAR ACTIVO
  async removeAsset(coinId: string) {
    const user = this.auth.currentUser;
    if (!user) return;

    const assetDoc = doc(this.firestore, `users/${user.uid}/assets/${coinId}`);
    await deleteDoc(assetDoc);
  }

  // 4. VERIFICAR SI TENEMOS EL ACTIVO (Para saber si mostrar Add o Edit)
  // Devuelve la cantidad si existe, o null si no lo tienes
  async getAssetAmount(coinId: string): Promise<number | null> {
    const user = this.auth.currentUser;
    if (!user) return null;

    const assetDoc = doc(this.firestore, `users/${user.uid}/assets/${coinId}`);
    const snapshot = await getDoc(assetDoc);
    
    if (snapshot.exists()) {
      return snapshot.data()['amount'];
    }
    return null;
  }
}