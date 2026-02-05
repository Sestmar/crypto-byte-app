import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
  IonItem, IonLabel, IonAvatar, IonButton, IonIcon, IonList, IonCard, IonCardContent
} from '@ionic/angular/standalone';
import { Auth, signOut, user } from '@angular/fire/auth'; // Importamos user y signOut
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { logOutOutline, personOutline, mailOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonItem, IonLabel, IonAvatar, IonButton, IonIcon, IonList, IonCard, IonCardContent,
    CommonModule, FormsModule
  ]
})
export class SettingsPage implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);
  
  // Observable del usuario actual
  user$ = user(this.auth); 

  constructor() {
    addIcons({ logOutOutline, personOutline, mailOutline, shieldCheckmarkOutline });
  }

  ngOnInit() {
  }

  async logout() {
    try {
      await signOut(this.auth);
      // Redirigir al login tras cerrar sesión
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  }
}