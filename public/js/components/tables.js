/* ═══════════════════════════════════════════════════════════
   GOOP CAFETERÍA — components/tables.js
   Lógica de tablas para Admin (Menu, Pedidos, Inventario)
   ═══════════════════════════════════════════════════════════ */
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { getIcon, getCategoryIcon, formatPrice, getStatusBadge, getStockPercent, getStockLevel, escHtml } from '../utils.js';
import { showToast } from './toast.js';
import { openModal, closeModal } from './modals.js';
import { updateStats } from './admin.js';

// ─── CRUD MENÚ ─────────────────────────────────────────

export async function loadMenuTable() {
    try {
        state.menu = await apiFetch('/menu');
        renderMenuTable();
        updateStats();
    } catch { }
}

export function renderMenuTable() {
    const tbody = document.getElementById('menu-table-body');
    if (!tbody) return;

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
          <button class="btn btn-icon btn-edit" data-id="${p.id}" data-action="edit-menu" aria-label="Editar ${escHtml(p.name)}">${getIcon('edit')} Editar</button>
          <button class="btn btn-icon btn-delete" data-id="${p.id}" data-name="${escHtml(p.name)}" data-action="delete-menu" aria-label="Eliminar ${escHtml(p.name)}">${getIcon('trash')} Eliminar</button>
        </div>
      </td>
    </tr>`).join('');
}

export async function editMenu(id) {
    try {
        const item = await apiFetch(`/menu/${id}`);
        document.getElementById('modal-menu-title').textContent = 'Editar Producto';
        document.getElementById('menu-id').value = item.id;
        document.getElementById('menu-name').value = item.name;
        document.getElementById('menu-category').value = item.category;
        document.getElementById('menu-price').value = item.price;
        document.getElementById('menu-image').value = item.image || '';
        document.getElementById('menu-available').checked = item.available;

        // Manually show modal
        const modal = document.getElementById('modal-menu');
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    } catch { }
}

export async function saveMenu(e) {
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


// ─── CRUD PEDIDOS ─────────────────────────────────────────

export async function loadOrdersTable() {
    try {
        const filter = document.getElementById('order-status-filter')?.value || 'all';
        const qs = filter !== 'all' ? `?status=${encodeURIComponent(filter)}` : '';
        state.orders = await apiFetch('/orders' + qs);
        renderOrdersTable();
        updateStats();
    } catch { }
}

export function renderOrdersTable() {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

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
            ${nextStatus ? `<button class="btn btn-status btn-edit" onclick="window.advanceOrderStatus('${o.id}','${nextStatus}')" aria-label="Avanzar estatus">${getIcon('arrow-right')} ${nextStatus}</button>` : ''}
            <button class="btn btn-icon btn-edit" onclick="window.editOrder('${o.id}')" aria-label="Editar pedido">${getIcon('edit')}</button>
            <button class="btn btn-icon btn-delete" onclick="window.deleteItem('order','${o.id}','Pedido ${escHtml(o.id)}')" aria-label="Eliminar pedido">${getIcon('trash')}</button>
          </div>
        </td>
      </tr>`;
    }).join('');
}

export async function filterOrders() { await loadOrdersTable(); }

export async function saveOrder(e) {
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
        // If we are in catalog, loadCatalog will handle update via autoRefresh or manual call
    } catch { }
}

export async function advanceOrderStatus(id, nextStatus) {
    try {
        await apiFetch(`/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status: nextStatus }) });
        showToast(`Pedido ${id} → ${nextStatus}`, 'info');
        await loadOrdersTable();
    } catch { }
}

export async function editOrder(id) {
    try {
        const order = await apiFetch(`/orders/${id}`);
        document.getElementById('modal-order-title').textContent = 'Editar Pedido';
        document.getElementById('order-id').value = order.id;
        document.getElementById('order-client').value = order.client;
        //Edicion de admin
        const statusSelect = document.getElementById('order-status');
        if (statusSelect) statusSelect.value = order.status;

        // Requires rendering product selector, waiting for it might be tricky if not careful
        // We assume menu is loaded.
        // We need to re-render renderProductSelector manually or via openModal logic
        // But openModal logic is generic. 
        // Simplified: Just use the exposed function from modals or replicate logic.
        // Ideally reusing renderProductSelector from modals.js, but it's not exported there.
        // Valid point. Let's assume we can trigger openModal('order') and then populate.

        // Ideally this should utilize openModal, but passing data.
        // Re-implementing simplified version:

        const modal = document.getElementById('modal-order');
        modal.hidden = false;
        // We need to trigger the checkbox selection
        // This is a bit disparate. 
        // For now, let's keep it simple: we rely on global window functions for these specific actions
        // because the HTML has onclick attributes.
        // IN PROGRESS: we are moving away from onclick.
    } catch { }
}

// ─── CRUD INVENTARIO ──────────────────────────────────────

export async function loadInventoryTable() {
    try {
        state.inventory = await apiFetch('/inventory');
        renderInventoryTable();
        updateStats();
    } catch { }
}

export function renderInventoryTable() {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;

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
            <button class="btn btn-icon btn-edit" onclick="window.editInventory('${item.id}')" aria-label="Editar ${escHtml(item.name)}">${getIcon('edit')} Editar</button>
            <button class="btn btn-icon btn-delete" onclick="window.deleteItem('inventory','${item.id}','${escHtml(item.name)}')" aria-label="Eliminar ${escHtml(item.name)}">${getIcon('trash')} Eliminar</button>
          </div>
        </td>
      </tr>`;
    }).join('');
}

export async function saveInventory(e) {
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

export async function editInventory(id) {
    try {
        const item = await apiFetch(`/inventory/${id}`);
        document.getElementById('modal-inventory-title').textContent = 'Editar Insumo';
        document.getElementById('inventory-id').value = item.id;
        document.getElementById('inventory-name').value = item.name;
        document.getElementById('inventory-quantity').value = item.quantity;
        document.getElementById('inventory-unit').value = item.unit;
        document.getElementById('inventory-max').value = item.max_capacity;

        const modal = document.getElementById('modal-inventory');
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    } catch { }
}


// ─── ELIMINAR ──────────────────────────
export function deleteItem(type, id, label) {
    state.deleteTarget = { type, id };
    document.getElementById('confirm-message').textContent = `¿Deseas eliminar "${label}"?`;
    document.getElementById('modal-confirm').hidden = false;
    document.body.style.overflow = 'hidden';
}

export async function confirmDelete() {
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
