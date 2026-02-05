import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular'; 

import { 
  IonContent, IonButton, IonIcon, IonText, IonSpinner 
} from '@ionic/angular/standalone';

// Auth Imports
import { Auth, GoogleAuthProvider, signInWithCredential, signInWithPopup, signInAnonymously } from '@angular/fire/auth';
import { addIcons } from 'ionicons';

// IMPORTANTE: Aquí cambiamos eyeOffOutline por rocketOutline para que coincida con el HTML
import { shieldCheckmarkOutline, logoGoogle, rocketOutline } from 'ionicons/icons';

import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, IonText, IonSpinner, CommonModule]
})
export class LoginPage implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);
  private platform = inject(Platform);
  loading = false;

  constructor() {
    // Registramos el cohete
    addIcons({ shieldCheckmarkOutline, logoGoogle, rocketOutline });
  }

  ngOnInit() {
    if (!this.platform.is('capacitor')) {
        // Inicialización web segura
        GoogleAuth.initialize({
            clientId: '953486025598-j4j1otlkse0obv95gcpij2c439fjig7j.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
        }); 
    }
  }

  // --- LOGIN GOOGLE ---
  async loginGoogle() {
    this.loading = true;
    try {
      let userCredential;

      if (this.platform.is('capacitor')) {
        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        userCredential = await signInWithCredential(this.auth, credential);
      } 
      else {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        userCredential = await signInWithPopup(this.auth, provider);
      }

      console.log('User:', userCredential.user);
      this.router.navigate(['/tabs/market']);
    
    } catch (error: any) {
      console.error('Login Error:', error);
      
      // FILTRO DE ERRORES: Si cierra ventana, ignoramos
      const msg = error.message || JSON.stringify(error);
      if (msg.includes('closed-by-user') || msg.includes('cancelled') || msg.includes('12501')) {
        console.log('Login cancelado por el usuario');
      } else {
        alert('Error de conexión: ' + msg);
      }

    } finally {
      this.loading = false;
    }
  }

  // --- MODO DEMO (INVITADO) ---
  async loginGuest() {
    this.loading = true;
    try {
      await signInAnonymously(this.auth);
      this.router.navigate(['/tabs/market']);
    } catch (error: any) {
      alert('Error en modo demo: ' + error.message);
    } finally {
      this.loading = false;
    }
  }
}