import { Component, OnInit, inject } from '@angular/core'; // <--- Añadimos OnInit
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonSearchbar, 
  IonList, IonItem, IonAvatar, IonLabel, IonSpinner, IonIcon 
} from '@ionic/angular/standalone';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { searchOutline, alertCircleOutline } from 'ionicons/icons'; // Añadimos icono de error por si acaso

// Importaciones de RxJS para manejar el flujo de búsqueda
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, 
    FormsModule, IonSearchbar, IonList, IonItem, IonAvatar, 
    IonLabel, IonSpinner, IonIcon
  ]
})
export class SearchPage implements OnInit {
  private cryptoService = inject(CryptoService);
  private router = inject(Router);

  results: any[] = [];
  searching = false;
  
  // Creamos un "Sujeto" para escuchar lo que escribes
  private searchSubject = new Subject<string>();

  constructor() {
    addIcons({ searchOutline, alertCircleOutline });
  }

  ngOnInit() {
    // Configuración REACTIVA de la búsqueda (La clave para que funcione bien)
    this.searchSubject.pipe(
      debounceTime(500), // 1. Espera 500ms a que el usuario deje de escribir
      distinctUntilChanged(), // 2. Si escribe lo mismo que antes, no busca
      switchMap((query) => {
        if (!query || query.length <= 2) {
          return of([]); // Si es muy corto, devolvemos vacío sin llamar a la API
        }
        this.searching = true;
        // 3. switchMap cancela la petición anterior si hay una nueva
        return this.cryptoService.searchCoin(query).pipe(
          catchError(error => {
            console.error('Error en búsqueda:', error);
            this.searching = false;
            return of([]); // Si falla, devolvemos array vacío
          })
        );
      })
    ).subscribe((data: any) => {
      // 4. Recibimos los datos finales
      // Aseguramos que sea un array (CoinGecko a veces devuelve { coins: [...] })
      if (Array.isArray(data)) {
        this.results = data;
      } else if (data && data.coins) {
        this.results = data.coins;
      } else {
        this.results = [];
      }
      this.searching = false;
    });
  }

  // Ahora esta función solo "empuja" el texto al Subject
  handleInput(event: any) {
    const query = event.target.value?.toLowerCase() || '';
    if (query.length === 0) {
      this.results = [];
      this.searching = false;
    }
    this.searchSubject.next(query);
  }

  goToDetail(id: string) {
    this.router.navigate(['/coin-detail', id]);
  }
}