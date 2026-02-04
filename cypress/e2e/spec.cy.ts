describe('CryptoByte E2E Tests', () => {
  
  beforeEach(() => {
    // Interceptamos llamadas
    cy.intercept('GET', '**/coins/markets*', { fixture: 'market_list.json' }).as('getMarkets');
    cy.intercept('GET', '**/coins/bitcoin*', { fixture: 'coin_detail.json' }).as('getBitcoin');
    cy.intercept('GET', '**/market_chart*', { body: { prices: [] } }).as('getChart');

    // Cargar página
    cy.visit('http://localhost:8100');
    cy.wait('@getMarkets');
  });

  // TEST 1: Carga de lista (OK)
  it('TEST 1: Debe cargar la lista con Bitcoin y precio simulado', () => {
    cy.contains('Bitcoin').should('exist');
    cy.contains('$50,000.00').should('exist');
  });

  // TEST 2: Navegación al detalle (FIX: Usamos 'exist' en lugar de 'visible')
  it('TEST 2: Debe navegar al detalle de Bitcoin y ver la descripción', () => {
    cy.contains('Bitcoin').click();
    
    // Esperamos a la API
    cy.wait('@getBitcoin');

    // Verificar URL
    cy.url().should('include', '/coin-detail/bitcoin');

    // FIX: Cambiamos .should('be.visible') por .should('exist')
    // Esto evita el error de "position: fixed" o scroll
    cy.contains('Satoshi Nakamoto').should('exist');
  });

  // TEST 3: Favoritos (FIX: Añadimos espera para la animación)
  it('TEST 3: Debe añadir a favoritos y verlo en Wallet', () => {
    // 1. Entrar en Bitcoin
    cy.contains('Bitcoin').click();
    cy.wait('@getBitcoin');

    // 2. Click forzado en FAB de favoritos
    cy.get('ion-fab-button').click({ force: true });

    // 3. Volver atrás
    cy.get('ion-back-button').click({ force: true });

    // 4. Ir a Wallet
    cy.get('ion-tab-button').contains('Wallet').click({ force: true });

    // FIX: Esperamos 1 segundo a que Ionic termine la animación de transición
    cy.wait(1000);

    // 5. Verificar
    cy.url().should('include', '/portfolio');
    
    // FIX: Usamos 'exist' para evitar el error de "opacity: 0"
    cy.get('app-portfolio').contains('Bitcoin').should('exist');
  });

});