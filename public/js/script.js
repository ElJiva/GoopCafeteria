/* ═══════════════════════════════════════════════════════════
   GOOP CAFETERÍA — script.js
   Frontend: consume REST API en http://localhost:3000/api
   Soporte para Autenticación y Roles
   ═══════════════════════════════════════════════════════════ */

'use strict';

const API = 'http://localhost:3000/api';

// ─── ESTADO GLOBAL ────────────────────────────────────────
const state = {
  menu: [],
  orders: [],
  userOrders: [], // Pedidos del usuario actual
  inventory: [],
  currentView: 'auth',
  currentTab: 'menu',
  deleteTarget: { type: null, id: null },
  catalogFilter: 'all',
  token: sessionStorage.getItem('goop_token'),
  user: JSON.parse(sessionStorage.getItem('goop_user') || 'null'),
};

// ─── UTILIDADES ───────────────────────────────────────────
// ─── UTILIDADES ───────────────────────────────────────────
function formatPrice(n) {
  return '$' + Number(n).toFixed(2);
}

function getStockPercent(item) {
  return Math.min(100, Math.round((item.quantity / item.max_capacity) * 100));
}

function getStockLevel(item) {
  const pct = getStockPercent(item);
  if (pct <= 10) return 'critical';
  if (pct <= 25) return 'low';
  return 'ok';
}

function getIcon(name, cls = 'icon') {
  const icons = {
    'coffee': '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>',
    'food': '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3"></path></svg>',
    'cake': '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"></path><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 4-1"></path><path d="M2 21h20"></path><path d="M7 8v2"></path><path d="M12 8v2"></path><path d="M17 8v2"></path><path d="M7 4h.01"></path><path d="M12 4h.01"></path><path d="M17 4h.01"></path></svg>',
    'plate': '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>',
    'pending': '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    'fire': '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.56 2.9A7 7 0 0 1 19 9v4a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V9a7 7 0 0 0-4.44-6.1"></path><path d="M12 17v4"></path><path d="M8 21h8"></path></svg>',
    'check': '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    'x': '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    'alert': '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    'info': '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    'edit': '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    'trash': '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    'arrow-right': '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
    'box': '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
    'clipboard': '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>'
  };
  return icons[name] || '';
}

function getCategoryIcon(cat) {
  const map = { Bebidas: 'coffee', Alimentos: 'food', Postres: 'cake' };
  return getIcon(map[cat] || 'plate');
}

function getStatusBadge(status) {
  const map = {
    'Pendiente': { cls: 'badge-pending', icon: 'pending' },
    'Preparando': { cls: 'badge-preparing', icon: 'fire' },
    'Entregado': { cls: 'badge-delivered', icon: 'check' },
  };
  const s = map[status] || { cls: '', icon: '' };
  return `<span class="badge ${s.cls}">${getIcon(s.icon, 'icon-sm')} ${status}</span>`;
}

function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── MÓDULO: TOAST ────────────────────────────────────────
function showToast(msg, type = 'success') {
  const icons = { success: 'check', error: 'alert', warning: 'alert', info: 'info' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `<span class="toast-icon">${getIcon(icons[type] || 'check', 'icon-lg')}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3200);
}

// ─── MÓDULO: API FETCH ────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (state.token) headers['x-auth-token'] = state.token;

  try {
    const res = await fetch(API + endpoint, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) logout(); // Token inválido o expirado
      throw new Error(data.error || 'Error en el servidor');
    }
    return data;
  } catch (err) {
    if (err.message.includes('Failed to fetch')) {
      showToast('No se puede conectar al servidor.', 'error');
    } else {
      showToast(err.message, 'error');
    }
    throw err;
  }
}

// ─── AUTHENTICATION ───────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    loginSuccess(data);
  } catch { /* error handled in apiFetch */ }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;

  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    loginSuccess(data);
  } catch { /* error handled in apiFetch */ }
}

function loginSuccess(data) {
  state.token = data.token;
  state.user = data.user;
  sessionStorage.setItem('goop_token', data.token);
  sessionStorage.setItem('goop_user', JSON.stringify(data.user));
  showToast(`¡Bienvenido, ${data.user.username}!`, 'success');
  updateAuthUI();

  if (state.user.role === 'admin') {
    navigate('admin');
  } else {
    navigate('catalog');
  }
}

function logout() {
  state.token = null;
  state.user = null;
  state.menu = [];
  state.orders = [];
  sessionStorage.removeItem('goop_token');
  sessionStorage.removeItem('goop_user');
  updateAuthUI();
  navigate('auth');
  showToast('Sesión cerrada', 'info');
}

function toggleAuthMode(mode) {
  const loginForm = document.getElementById('form-login');
  const regForm = document.getElementById('form-register');
  const msgLogin = document.getElementById('msg-to-login');
  const msgReg = document.getElementById('msg-to-register');
  const title = document.querySelector('.auth-title');
  const subtitle = document.querySelector('.auth-subtitle');

  if (mode === 'register') {
    loginForm.hidden = true;
    regForm.hidden = false;
    msgLogin.hidden = false;
    msgReg.hidden = true;
    title.textContent = 'Crea tu cuenta';
    subtitle.textContent = 'Únete a la comunidad Goop';
  } else {
    loginForm.hidden = false;
    regForm.hidden = true;
    msgLogin.hidden = true;
    msgReg.hidden = false;
    title.textContent = 'Bienvenido a Goop';
    subtitle.textContent = 'Inicia sesión para gestionar tus pedidos';
  }
}

function updateAuthUI() {
  const isLoggedIn = !!state.token;
  const isAdmin = state.user?.role === 'admin';

  // Navbar items visibility
  document.getElementById('nav-item-login').hidden = isLoggedIn;
  document.querySelectorAll('.auth-only').forEach(el => el.hidden = !isLoggedIn);
  document.querySelectorAll('.admin-only').forEach(el => el.hidden = !isAdmin);

  if (isLoggedIn) {
    document.getElementById('user-display').textContent = `(${state.user.username})`;
    // Update Add Order modal client input to readonly
    const clientInput = document.getElementById('order-client');
    if (clientInput) {
      if (isAdmin) {
        clientInput.readOnly = false;
        clientInput.value = '';
      } else {
        clientInput.readOnly = true;
        clientInput.value = state.user.username;
      }
    }
    // Update Status select in Add Order
    const statusGroup = document.getElementById('group-order-status');
    if (statusGroup) statusGroup.hidden = !isAdmin;
  }
}

// ───NAVEGACIÓN ───────────────────────────────────
function navigate(view) {
  if (view !== 'auth' && !state.token) {
    navigate('auth');
    return;
  }

  state.currentView = view;
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
    v.hidden = true;
  });
  const target = document.getElementById('view-' + view);
  if (target) { target.classList.add('active'); target.hidden = false; }

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const navBtn = document.getElementById('nav-' + view);
  if (navBtn) { navBtn.classList.add('active'); navBtn.setAttribute('aria-current', 'page'); }

  document.getElementById('hamburger').setAttribute('aria-expanded', 'false');
  document.querySelector('.navbar-links').classList.remove('open');

  if (view === 'admin') loadAdmin();
  if (view === 'catalog') loadCatalog();
}

function toggleMobileMenu() {
  const links = document.querySelector('.navbar-links');
  const btn = document.getElementById('hamburger');
  const open = links.classList.toggle('open');
  btn.setAttribute('aria-expanded', open);
}

function switchTab(tab) {
  state.currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.remove('active');
    p.hidden = true;
  });
  const tabBtn = document.getElementById('tab-' + tab);
  const tabPanel = document.getElementById('panel-' + tab);
  if (tabBtn) { tabBtn.classList.add('active'); tabBtn.setAttribute('aria-selected', 'true'); }
  if (tabPanel) { tabPanel.classList.add('active'); tabPanel.hidden = false; }

  if (tab === 'menu') loadMenuTable();
  if (tab === 'orders') loadOrdersTable();
  if (tab === 'inventory') loadInventoryTable();
}

// ───CATALOGO ──────────────────────────────────────
async function loadCatalog() {
  // 1. Cargar menú (publico) 
  try {
    const menu = await apiFetch('/menu');
    state.menu = menu;
    renderCatalog();
  } catch {
    console.error('Error cargando menú');
  }

  // 2. Cargar pedidos del usuario (privado)
  if (state.token) {
    try {
      const orders = await apiFetch('/orders');
      state.orders = orders;
      renderUserOrders();
    } catch {
      console.warn('Error cargando pedidos de usuario');
    }
  }
}

function renderCatalog() {
  const grid = document.getElementById('catalog-grid');
  const items = state.menu.filter(p =>
    state.catalogFilter === 'all' || p.category === state.catalogFilter
  );

  if (!items.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon" style="font-size:3rem;display:block;margin:0 auto 1rem;color:var(--terracota)">${getIcon('coffee', 'icon-lg')}</div>
      <p class="empty-state-title">Sin productos en esta categoría</p>
      <p class="empty-state-text">Prueba con otro filtro</p>
    </div>`;
    return;
  }

  grid.innerHTML = items.map(p => {
    const imgHtml = p.image
      ? `<img class="product-card-img" src="${escHtml(p.image)}" alt="${escHtml(p.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="product-card-img-placeholder" style="display:none">${getCategoryIcon(p.category)}</div>`
      : `<div class="product-card-img-placeholder">${getCategoryIcon(p.category)}</div>`;
    return `
      <article class="product-card${p.available ? '' : ' unavailable'}" role="listitem" aria-label="${escHtml(p.name)}">
        ${imgHtml}
        <div class="product-card-body">
          <p class="product-card-category">${escHtml(p.category)}</p>
          <h3 class="product-card-name">${escHtml(p.name)}</h3>
          <div class="product-card-footer">
            <span class="product-card-price">${formatPrice(p.price)}</span>
            <span class="badge ${p.available ? 'badge-available' : 'badge-unavailable'}">
              ${p.available ? '● Disponible' : '● Agotado'}
            </span>
          </div>
        </div>
      </article>`;
  }).join('');
}

function renderUserOrders() {
  const container = document.getElementById('user-orders-section');
  const grid = document.getElementById('user-orders-grid');

  if (!state.orders.length) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  grid.innerHTML = state.orders.slice(0, 6).map(o => { // Show last 6 orders
    const productNames = (o.products || [])
      .map(pid => { const p = state.menu.find(m => m.id === pid); return p ? escHtml(p.name) : pid; })
      .join(', ');

    return `
      <div class="order-card">
        <div class="order-header">
          <span class="order-id">${escHtml(o.id)}</span>
          ${getStatusBadge(o.status)}
        </div>
        <p class="order-products">${productNames}</p>
        <div class="order-footer">
          <span class="order-date">${o.created_at ? o.created_at.split(' ')[0] : ''}</span>
          <span class="order-total">${formatPrice(o.total)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function filterCatalog(cat) {
  state.catalogFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === cat);
  });
  renderCatalog();
}

// ─── CARGA: ADMIN ─────────────────────────────────────────
async function loadAdmin() {
  if (state.user?.role !== 'admin') { navigate('catalog'); return; }
  await Promise.all([
    loadMenuTable(),
    loadOrdersTable(),
    loadInventoryTable(),
  ]);
  updateStats();
}

function updateStats() {
  const activeOrders = state.orders.filter(o => o.status !== 'Entregado').length;
  const lowStock = state.inventory.filter(i => getStockLevel(i) !== 'ok').length;
  const todaySales = state.orders
    .filter(o => o.status === 'Entregado')
    .reduce((sum, o) => sum + o.total, 0);

  document.getElementById('stat-products').textContent = state.menu.length;
  document.getElementById('stat-orders').textContent = activeOrders;
  document.getElementById('stat-lowstock').textContent = lowStock;
  document.getElementById('stat-sales').textContent = formatPrice(todaySales);
}

// ─── TABLA: MENÚ ──────────────────────────────────────────
async function loadMenuTable() {
  try {
    state.menu = await apiFetch('/menu');
    renderMenuTable();
    updateStats();
  } catch { }
}

function renderMenuTable() {
  const tbody = document.getElementById('menu-table-body');
  if (!state.menu.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">
      <div class="empty-state-icon" style="font-size:3rem;display:block;margin:0 auto 1rem;color:var(--terracota)">${getIcon('plate', 'icon-lg')}</div>
      <p class="empty-state-title">Sin productos</p>
      <p class="empty-state-text">Agrega tu primer producto al menú</p>
    </div></td></tr>`;
    return;
  }
  tbody.innerHTML = state.menu.map(p => `
    <tr>
      <td>
        <div class="table-product-info">
          ${p.image
      ? `<img class="table-product-img" src="${escHtml(p.image)}" alt="${escHtml(p.name)}" onerror="this.style.display='none'" />`
      : `<div class="product-emoji-thumb">${getCategoryIcon(p.category)}</div>`}
          <strong>${escHtml(p.name)}</strong>
        </div>
      </td>
      <td>${escHtml(p.category)}</td>
      <td><strong style="color:var(--terracota)">${formatPrice(p.price)}</strong></td>
      <td>
        <span class="badge ${p.available ? 'badge-available' : 'badge-unavailable'}">
          ${p.available ? '● Disponible' : '● Agotado'}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-icon btn-edit" onclick="editMenu('${p.id}')" aria-label="Editar ${escHtml(p.name)}">${getIcon('edit')} Editar</button>
          <button class="btn btn-icon btn-delete" onclick="deleteItem('menu','${p.id}','${escHtml(p.name)}')" aria-label="Eliminar ${escHtml(p.name)}">${getIcon('trash')} Eliminar</button>
        </div>
      </td>
    </tr>`).join('');
}

// ─── TABLA: PEDIDOS ───────────────────────────────────────
async function loadOrdersTable() {
  try {
    const filter = document.getElementById('order-status-filter')?.value || 'all';
    const qs = filter !== 'all' ? `?status=${encodeURIComponent(filter)}` : '';
    state.orders = await apiFetch('/orders' + qs);
    renderOrdersTable();
    updateStats();
  } catch { }
}

function renderOrdersTable() {
  const tbody = document.getElementById('orders-table-body');
  if (!state.orders.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
      <div class="empty-state-icon" style="font-size:3rem;display:block;margin:0 auto 1rem;color:var(--terracota)">${getIcon('clipboard', 'icon-lg')}</div>
      <p class="empty-state-title">Sin pedidos</p>
      <p class="empty-state-text">Crea el primer pedido del día</p>
    </div></td></tr>`;
    return;
  }
  tbody.innerHTML = state.orders.map(o => {
    const productNames = (o.products || [])
      .map(pid => { const p = state.menu.find(m => m.id === pid); return p ? escHtml(p.name) : pid; })
      .join(', ');
    const nextStatus = { 'Pendiente': 'Preparando', 'Preparando': 'Entregado', 'Entregado': null }[o.status];
    return `
      <tr>
        <td><strong style="font-family:var(--font-heading)">${escHtml(o.id)}</strong></td>
        <td>${escHtml(o.client)} <small style="color:var(--cafe-light)">(${o.user_id ? 'Usuario' : 'Invitado'})</small></td>
        <td style="max-width:200px;font-size:0.82rem;color:var(--cafe-light)">${productNames}</td>
        <td><strong style="color:var(--terracota)">${formatPrice(o.total)}</strong></td>
        <td>${getStatusBadge(o.status)}</td>
        <td>
          <div class="table-actions">
            ${nextStatus ? `<button class="btn btn-status btn-edit" onclick="advanceOrderStatus('${o.id}','${nextStatus}')" aria-label="Avanzar estatus">${getIcon('arrow-right')} ${nextStatus}</button>` : ''}
            <button class="btn btn-icon btn-edit" onclick="editOrder('${o.id}')" aria-label="Editar pedido">${getIcon('edit')}</button>
            <button class="btn btn-icon btn-delete" onclick="deleteItem('order','${o.id}','Pedido ${escHtml(o.id)}')" aria-label="Eliminar pedido">${getIcon('trash')}</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

async function filterOrders() { await loadOrdersTable(); }

// ─── INVENTARIO ────────────────────────────────────
async function loadInventoryTable() {
  try {
    state.inventory = await apiFetch('/inventory');
    renderInventoryTable();
    updateStats();
  } catch { }
}

function renderInventoryTable() {
  const tbody = document.getElementById('inventory-table-body');
  if (!state.inventory.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
      <div class="empty-state-icon" style="font-size:3rem;display:block;margin:0 auto 1rem;color:var(--terracota)">${getIcon('box', 'icon-lg')}</div>
      <p class="empty-state-title">Sin insumos</p>
      <p class="empty-state-text">Agrega los insumos de tu cafetería</p>
    </div></td></tr>`;
    return;
  }
  tbody.innerHTML = state.inventory.map(item => {
    const pct = getStockPercent(item);
    const level = getStockLevel(item);
    const alertMap = {
      ok: { cls: 'alert-ok', label: 'Normal' },
      low: { cls: 'alert-low', label: 'Low' },
      critical: { cls: 'alert-critical', label: 'Critical' },
    };
    const alert = alertMap[level];
    return `
      <tr>
        <td><strong>${escHtml(item.name)}</strong></td>
        <td>${item.quantity} ${escHtml(item.unit)}</td>
        <td>${escHtml(item.unit)}</td>
        <td>
          <div class="stock-bar-wrapper">
            <div class="stock-bar-track">
              <div class="stock-bar-fill ${level}" style="width:${pct}%"></div>
            </div>
            <span class="stock-bar-label">${pct}% de ${item.max_capacity} ${escHtml(item.unit)}</span>
          </div>
        </td>
        <td><span class="alert-badge ${alert.cls}">${alert.label}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-icon btn-edit" onclick="editInventory('${item.id}')" aria-label="Editar ${escHtml(item.name)}">${getIcon('edit')} Editar</button>
            <button class="btn btn-icon btn-delete" onclick="deleteItem('inventory','${item.id}','${escHtml(item.name)}')" aria-label="Eliminar ${escHtml(item.name)}">${getIcon('trash')} Eliminar</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ─── MODALES ──────────────────────────────────────────────
async function openModal(type) {
  const modal = document.getElementById('modal-' + type);
  if (!modal) return;
  const form = modal.querySelector('form');
  if (form) form.reset();

  if (type === 'menu') {
    document.getElementById('modal-menu-title').textContent = 'Agregar Producto';
    document.getElementById('menu-id').value = '';
    document.getElementById('menu-available').checked = true;
  }
  if (type === 'order') {
    document.getElementById('modal-order-title').textContent = 'Nuevo Pedido';
    document.getElementById('order-id').value = '';
    document.getElementById('order-total-display').textContent = '$0.00';

    // Auto-fill client name if user is logged in
    const clientInput = document.getElementById('order-client');
    if (state.user && state.user.role !== 'admin') {
      clientInput.value = state.user.username;
      clientInput.readOnly = true;
    } else {
      clientInput.value = '';
      clientInput.readOnly = false;
    }

    //Carga Menu Usuario
    if (!state.menu.length) await apiFetch('/menu').then(data => state.menu = data);
    renderProductSelector();
  }
  if (type === 'inventory') {
    document.getElementById('modal-inventory-title').textContent = 'Agregar Insumo';
    document.getElementById('inventory-id').value = '';
  }

  modal.hidden = false;
  modal.querySelector('input, select')?.focus();
  document.body.style.overflow = 'hidden';
}

function closeModal(type) {
  const modal = document.getElementById('modal-' + type);
  if (modal) modal.hidden = true;
  document.body.style.overflow = '';
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.hidden = true;
    document.body.style.overflow = '';
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not([hidden])').forEach(m => { m.hidden = true; });
    document.body.style.overflow = '';
  }
});

// ─── CRUD: MENÚ ───────────────────────────────────────────
async function editMenu(id) {
  try {
    const item = await apiFetch(`/menu/${id}`);
    document.getElementById('modal-menu-title').textContent = 'Editar Producto';
    document.getElementById('menu-id').value = item.id;
    document.getElementById('menu-name').value = item.name;
    document.getElementById('menu-category').value = item.category;
    document.getElementById('menu-price').value = item.price;
    document.getElementById('menu-image').value = item.image || '';
    document.getElementById('menu-available').checked = item.available;
    document.getElementById('modal-menu').hidden = false;
    document.body.style.overflow = 'hidden';
  } catch { }
}

async function saveMenu(e) {
  e.preventDefault();
  const name = document.getElementById('menu-name').value.trim();
  const category = document.getElementById('menu-category').value;
  const price = parseFloat(document.getElementById('menu-price').value);
  const image = document.getElementById('menu-image').value.trim();
  const available = document.getElementById('menu-available').checked;

  if (!name || !category || isNaN(price) || price < 0) {
    showToast('Por favor completa todos los campos requeridos', 'error');
    return;
  }

  const id = document.getElementById('menu-id').value;
  try {
    if (id) {
      await apiFetch(`/menu/${id}`, { method: 'PUT', body: JSON.stringify({ name, category, price, image, available }) });
      showToast(`"${name}" actualizado correctamente`, 'success');
    } else {
      await apiFetch('/menu', { method: 'POST', body: JSON.stringify({ name, category, price, image, available }) });
      showToast(`"${name}" agregado al menú`, 'success');
    }
    closeModal('menu');
    await loadMenuTable();
  } catch { }
}

// ─── CRUD: PEDIDOS ────────────────────────────────────────
function renderProductSelector(selectedIds = []) {
  const container = document.getElementById('product-selector');
  const available = state.menu.filter(p => p.available);
  if (!available.length) {
    container.innerHTML = '<p style="color:var(--cafe-light);font-size:0.85rem;padding:0.5rem">No hay productos disponibles</p>';
    return;
  }
  container.innerHTML = available.map(p => `
    <label class="product-select-item${selectedIds.includes(p.id) ? ' selected' : ''}" for="ps-${p.id}">
      <input type="checkbox" id="ps-${p.id}" value="${p.id}" ${selectedIds.includes(p.id) ? 'checked' : ''}
        onchange="onProductSelectChange()" />
      <div>
        <div class="product-select-name">${escHtml(p.name)}</div>
        <div class="product-select-price">${formatPrice(p.price)}</div>
      </div>
    </label>`).join('');
}

function onProductSelectChange() {
  const checked = [...document.querySelectorAll('#product-selector input[type=checkbox]:checked')];
  const total = checked.reduce((sum, cb) => {
    const p = state.menu.find(m => m.id === cb.value);
    return sum + (p ? p.price : 0);
  }, 0);
  document.getElementById('order-total-display').textContent = formatPrice(total);
  document.querySelectorAll('.product-select-item').forEach(item => {
    item.classList.toggle('selected', item.querySelector('input').checked);
  });
}

async function editOrder(id) {
  try {
    const order = await apiFetch(`/orders/${id}`);
    document.getElementById('modal-order-title').textContent = 'Editar Pedido';
    document.getElementById('order-id').value = order.id;
    document.getElementById('order-client').value = order.client;
    //Edicion de admin
    const statusSelect = document.getElementById('order-status');
    statusSelect.value = order.status;

    renderProductSelector(order.products);
    document.getElementById('order-total-display').textContent = formatPrice(order.total);
    document.getElementById('modal-order').hidden = false;
    document.body.style.overflow = 'hidden';
  } catch { }
}

async function saveOrder(e) {
  e.preventDefault();
  const client = document.getElementById('order-client').value.trim();
  const status = document.getElementById('order-status').value;
  const checked = [...document.querySelectorAll('#product-selector input[type=checkbox]:checked')];
  const products = checked.map(cb => cb.value);

  if (!client) { showToast('Ingresa el nombre del cliente', 'error'); return; }
  if (!products.length) { showToast('Selecciona al menos un producto', 'error'); return; }

  const id = document.getElementById('order-id').value;
  try {
    if (id) {
      await apiFetch(`/orders/${id}`, { method: 'PUT', body: JSON.stringify({ client, products, status }) });
      showToast(`Pedido ${id} actualizado`, 'success');
    } else {
      const created = await apiFetch('/orders', { method: 'POST', body: JSON.stringify({ client, products, status }) });
      showToast(`Pedido ${created.id} creado para ${client}`, 'success');
    }
    closeModal('order');
    if (state.currentView === 'admin') await loadOrdersTable();
    if (state.currentView === 'catalog') await loadCatalog();
  } catch { }
}

async function advanceOrderStatus(id, nextStatus) {
  try {
    await apiFetch(`/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status: nextStatus }) });
    showToast(`Pedido ${id} → ${nextStatus}`, 'info');
    await loadOrdersTable();
  } catch { }
}

// ─── CRUD: INVENTARIO ─────────────────────────────────────
async function editInventory(id) {
  try {
    const item = await apiFetch(`/inventory/${id}`);
    document.getElementById('modal-inventory-title').textContent = 'Editar Insumo';
    document.getElementById('inventory-id').value = item.id;
    document.getElementById('inventory-name').value = item.name;
    document.getElementById('inventory-quantity').value = item.quantity;
    document.getElementById('inventory-unit').value = item.unit;
    document.getElementById('inventory-max').value = item.max_capacity;
    document.getElementById('modal-inventory').hidden = false;
    document.body.style.overflow = 'hidden';
  } catch { }
}

async function saveInventory(e) {
  e.preventDefault();
  const name = document.getElementById('inventory-name').value.trim();
  const quantity = parseFloat(document.getElementById('inventory-quantity').value);
  const unit = document.getElementById('inventory-unit').value;
  const max_capacity = parseFloat(document.getElementById('inventory-max').value);

  if (!name || !unit || isNaN(quantity) || isNaN(max_capacity) || max_capacity <= 0) {
    showToast('Por favor completa todos los campos requeridos', 'error');
    return;
  }

  const id = document.getElementById('inventory-id').value;
  try {
    if (id) {
      await apiFetch(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify({ name, quantity, unit, max_capacity }) });
      showToast(`"${name}" actualizado en inventario`, 'success');
    } else {
      await apiFetch('/inventory', { method: 'POST', body: JSON.stringify({ name, quantity, unit, max_capacity }) });
      showToast(`"${name}" agregado al inventario`, 'success');
    }
    closeModal('inventory');
    await loadInventoryTable();
  } catch { }
}

// ─── ELIMINAR ──────────────────────────
function deleteItem(type, id, label) {
  state.deleteTarget = { type, id };
  document.getElementById('confirm-message').textContent = `¿Deseas eliminar "${label}"?`;
  document.getElementById('modal-confirm').hidden = false;
  document.body.style.overflow = 'hidden';
}

async function confirmDelete() {
  const { type, id } = state.deleteTarget;
  if (!type || !id) return;

  const endpointMap = { menu: '/menu', order: '/orders', inventory: '/inventory' };
  const endpoint = endpointMap[type];
  if (!endpoint) return;

  try {
    await apiFetch(`${endpoint}/${id}`, { method: 'DELETE' });
    const msgs = { menu: 'Producto eliminado del menú', order: 'Pedido eliminado', inventory: 'Insumo eliminado' };
    showToast(msgs[type], 'warning');

    if (type === 'menu') { await loadMenuTable(); }
    if (type === 'order') { await loadOrdersTable(); }
    if (type === 'inventory') { await loadInventoryTable(); }

    closeModal('confirm');
    state.deleteTarget = { type: null, id: null };
  } catch { }
}

// ─── AUTO-REFRESH  ──────────────────────────────
function setupAutoRefresh() {
  setInterval(async () => {
    if (!state.token) return;

    // Admin: actualizar tabla de Pedidos si está visible
    if (state.currentView === 'admin') {

      await loadOrdersTable();
      updateStats();
      if (state.currentTab === 'inventory') await loadInventoryTable();
    }

    //Usuario: actualizar estado de sus pedidos
    if (state.currentView === 'catalog') {
      try {
        const orders = await apiFetch('/orders');
        state.orders = orders;
        renderUserOrders();
      } catch { }
    }
  }, 4000);
}

// ─── INICIALIZACION ───────────────────────────────────────
async function init() {
  setupAutoRefresh();

  if (state.token) {
    try {
      const { user } = await apiFetch('/auth/me'); // Validate token
      state.user = user;
      updateAuthUI();
      if (state.user.role === 'admin') {
        navigate('admin');
      } else {
        navigate('catalog');
      }
    } catch {
      logout(); // Token invalid
    }
  } else {
    updateAuthUI();
    navigate('auth');
  }
}

document.addEventListener('DOMContentLoaded', init);
