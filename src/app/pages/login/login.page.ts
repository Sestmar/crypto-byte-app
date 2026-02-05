import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { 
  IonContent, IonButton, IonIcon, IonText, IonSpinner 
} from '@ionic/angular/standalone';
// Importamos Auth de AngularFire
import { Auth, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { addIcons } from 'ionicons';
import { shieldCheckmarkOutline, mailOutline, logoGoogle } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, IonText, IonSpinner, CommonModule]
})
export class LoginPage {
  private auth = inject(Auth);     // Inyectamos servicio de Auth
  private router = inject(Router); // Inyectamos Router
  loading = false;

  constructor() {
    addIcons({ shieldCheckmarkOutline, mailOutline, logoGoogle });
  }

  async loginGoogle() {
    this.loading = true;
    try {
      const provider = new GoogleAuthProvider();
      // Forzar selección de cuenta (opcional, ayuda a veces si se queda pillado)
      provider.setCustomParameters({ prompt: 'select_account' }); 

      const credential = await signInWithPopup(this.auth, provider);
      console.log('User:', credential.user);
    
      // IMPORTANTE: Usar ngZone si la redirección falla (aunque con Router suele ir bien)
      this.router.navigate(['/tabs/market']);
    
    } catch (error) {
      console.error('Login Error:', error);
      alert('Error: ' + error);
    } finally {
      this.loading = false;
    }
  }
}