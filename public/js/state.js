/* ═══════════════════════════════════════════════════════════
   GOOP CAFETERÍA — state.js
   Estado global de la aplicación
   ═══════════════════════════════════════════════════════════ */

export const state = {
    menu: [],
    orders: [],
    userOrders: [],
    inventory: [],
    currentView: 'auth',
    currentTab: 'menu',
    deleteTarget: { type: null, id: null },
    catalogFilter: 'all',
    token: sessionStorage.getItem('goop_token'),
    user: JSON.parse(sessionStorage.getItem('goop_user') || 'null'),
};
