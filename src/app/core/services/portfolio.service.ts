import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth'; // <--- IMPORTANTE: authState
import { Observable, from, of } from 'rxjs';
import { switchMap, map, catchError, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // Helper para obtener la referencia al documento (solo si ya tenemos usuario síncrono)
  private getUserDocRef(uid: string) {
    return doc(this.firestore, `users/${uid}`);
  }

  // 1. OBTENER FAVORITOS (CORREGIDO PARA F5)
  getFavorites(): Observable<string[]> {
    // Usamos authState para ESPERAR a que Firebase restaure la sesión
    return authState(this.auth).pipe(
      take(1), // Tomamos solo el primer estado (logueado o no)
      switchMap(user => {
        if (!user) {
          // Si tras esperar, no hay usuario, devolvemos vacío
          return of([]);
        }

        // Si hay usuario, vamos a Firestore
        const userDoc = this.getUserDocRef(user.uid);
        return from(getDoc(userDoc)).pipe(
          map(snapshot => {
            if (snapshot.exists()) {
              return snapshot.data()['favorites'] || [];
            } else {
              return [];
            }
          }),
          catchError(err => {
            console.error('Error leyendo favoritos:', err);
            return of([]);
          })
        );
      })
    );
  }

  // 2. AÑADIR A FAVORITOS
  async addCoin(coinId: string) {
    const user = this.auth.currentUser;
    if (!user) return; // Aquí podemos usar currentUser porque la acción es manual

    const userDoc = this.getUserDocRef(user.uid);
    await setDoc(userDoc, { 
      favorites: arrayUnion(coinId),
      email: user.email 
    }, { merge: true });
  }

  // 3. QUITAR DE FAVORITOS
  async removeCoin(coinId: string) {
    const user = this.auth.currentUser;
    if (!user) return;

    const userDoc = this.getUserDocRef(user.uid);
    await updateDoc(userDoc, {
      favorites: arrayRemove(coinId)
    });
  }

  // 4. VERIFICAR SI ES FAVORITO
  async isFavorite(coinId: string): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) return false;

    const userDoc = this.getUserDocRef(user.uid);
    const snapshot = await getDoc(userDoc);
    
    if (snapshot.exists()) {
      const favs = snapshot.data()['favorites'] || [];
      return favs.includes(coinId);
    }
    return false;
  }
}