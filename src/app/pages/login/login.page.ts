import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular'; // Para detectar si es móvil

import { 
  IonContent, IonButton, IonIcon, IonText, IonSpinner 
} from '@ionic/angular/standalone';

// Importamos Auth de AngularFire
import { Auth, GoogleAuthProvider, signInWithCredential, signInWithPopup } from '@angular/fire/auth';
import { addIcons } from 'ionicons';
import { shieldCheckmarkOutline, mailOutline, logoGoogle } from 'ionicons/icons';

// Importamos el plugin nativo
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
  private platform = inject(Platform); // Inyectamos Platform
  loading = false;

  constructor() {
    addIcons({ shieldCheckmarkOutline, mailOutline, logoGoogle });
  }

  ngOnInit() {
    // Inicializamos SIEMPRE, pasando el clientId por seguridad
    GoogleAuth.initialize({
      clientId: '953486025598-j4j1otlkse0obv95gcpij2c439fjig7j.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
  }

  async loginGoogle() {
    this.loading = true;
    try {
      let userCredential;

      // 1. SI ES MÓVIL (Android/iOS) -> USAMOS PLUGIN NATIVO
      if (this.platform.is('capacitor')) {
        // Esto abre la ventana nativa de Google del móvil
        const googleUser = await GoogleAuth.signIn();
        
        // Creamos la credencial para Firebase usando el token que nos da Google
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        
        // Iniciamos sesión en Firebase
        userCredential = await signInWithCredential(this.auth, credential);
      } 
      // 2. SI ES WEB (PC) -> USAMOS POPUP CLÁSICO
      else {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        userCredential = await signInWithPopup(this.auth, provider);
      }

      console.log('User:', userCredential.user);
      this.router.navigate(['/tabs/market']);
    
    } catch (error: any) {
      console.error('Login Error:', error);
      alert('Error: ' + (error.message || JSON.stringify(error)));
    } finally {
      this.loading = false;
    }
  }
}