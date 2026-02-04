# CryptoByte

> **Tracker de Criptomonedas en Tiempo Real con Estética Cyberpunk**

![Angular](https://img.shields.io/badge/Angular-17-red) ![Ionic](https://img.shields.io/badge/Ionic-7-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Status](https://img.shields.io/badge/Status-Completado-success)

CryptoByte es una aplicación móvil híbrida desarrollada con **Ionic 7** y **Angular** (Componentes Standalone). Va más allá de un simple consumidor de API, ofreciendo una **UI Cyberpunk/Glassmorphism** inmersiva, gráficas interactivas y una arquitectura robusta respaldada por pruebas exhaustivas (Unitarias y E2E).

---

## Capturas de Pantalla

| Mercado (Home) | Detalle Moneda | Wallet (Cartera) |
|:---:|:---:|:---:|
| <img src="./screenshots/home.png" width="200"> | <img src="./screenshots/detail.png" width="200"> | <img src="./screenshots/wallet.png" width="200"> |

*(Nota: Las imágenes se encuentran en la carpeta screenshots del repositorio)*

---

## Características Clave

* **UI/UX Cyberpunk:** Diseño personalizado con efecto "Glassmorphism" (cristal), degradados de neón y fondos animados con CSS Keyframes.
* **Datos en Tiempo Real:** Consume la **API de CoinGecko** para obtener precios en vivo, tendencias y estadísticas globales.
* **Gráficas Interactivas:** Implementadas con **Chart.js**, incluyendo degradados personalizados y tooltips dinámicos.
* **Gestión de Portfolio:** Los usuarios pueden guardar sus activos favoritos (persistencia mediante LocalStorage).
* **Búsqueda Avanzada:** Buscador optimizado con `debounce` para reducir llamadas innecesarias a la API.
* **Soporte "Safe Area":** Diseño totalmente adaptado a dispositivos móviles modernos (Android/iOS), respetando notches y barras de navegación.

---

## Stack Tecnológico

* **Framework:** Ionic 7 + Angular 17
* **Arquitectura:** Componentes Standalone, Servicios para gestión de estado (State Management).
* **Estilos:** SCSS, Variables CSS, Flexbox/Grid.
* **Visualización:** Chart.js + ng2-charts.
* **Testing:**
    * **Unitario/Integración:** Jasmine + Karma (+29 tests).
    * **E2E (Extremo a Extremo):** Cypress (Stubbing de red y Fixtures).
* **Despliegue:** Capacitor (Android).

---

## Instalación y Uso

### Prerrequisitos
* Node.js (v18+)
* Ionic CLI (`npm install -g @ionic/cli`)

### Pasos

1.  **Clonar el repositorio**
    ```bash
    git clone [https://github.com/Sestmar/crypto-byte-app.git](https://github.com/Sestmar/crypto-byte-app.git)
    cd crypto-byte-app
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

3.  **Ejecutar en Navegador**
    ```bash
    ionic serve
    ```

4.  **Ejecutar en Android**
    ```bash
    ionic build
    npx cap sync
    npx cap open android
    ```

---

## Testing y Calidad

La calidad del código ha sido una prioridad en este proyecto.

### Tests Unitarios y de Integración (Karma)
Cubren Servicios, Llamadas HTTP y Lógica de Componentes.
```bash
npx ng test

```

Roadmap Futuro (v2.0)
  [ ] Integración Backend: Migrar de LocalStorage a Firebase Firestore para sincronización en la nube.

  [ ] Autenticación: Login de usuario mediante Firebase Auth (Google/Email).

  [ ] Funcionalidades Web3: Conectar wallets reales (MetaMask/Phantom) usando Wagmi/Viem.

  [ ] Tracker PnL: Calcular ganancias y pérdidas reales basadas en transacciones de usuario.

```bash 
Autor
Desarrollado por Sergio Estudillo (Sestmar) para el ciclo de Desarrollo de Aplicaciones Multiplataforma (DAM).
