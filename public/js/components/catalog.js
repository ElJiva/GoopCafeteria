/* ═══════════════════════════════════════════════════════════
   GOOP CAFETERÍA — components/catalog.js
   Gestión del catálogo
   ═══════════════════════════════════════════════════════════ */
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { getIcon, getCategoryIcon, formatPrice, getStatusBadge, escHtml } from '../utils.js';
import { openModal } from './modals.js';

export async function loadCatalog() {
    try {
        const menu = await apiFetch('/menu');
        state.menu = menu;
        renderCatalog();
    } catch {
        console.error('Error cargando menú');
    }

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

export function renderCatalog() {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;

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

export function renderUserOrders() {
    const container = document.getElementById('user-orders-section');
    const grid = document.getElementById('user-orders-grid');
    if (!container || !grid) return;

    if (!state.orders.length) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    grid.innerHTML = state.orders.slice(0, 6).map(o => {
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

export function filterCatalog(cat) {
    state.catalogFilter = cat;
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === cat);
    });
    renderCatalog();
}
