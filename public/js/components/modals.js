/* ═══════════════════════════════════════════════════════════
   GOOP CAFETERÍA — components/modals.js
   Gestión de modales
   ═══════════════════════════════════════════════════════════ */
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { formatPrice, escHtml } from '../utils.js';

export async function openModal(type) {
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

        const clientInput = document.getElementById('order-client');
        if (clientInput) {
            if (state.user && state.user.role !== 'admin') {
                clientInput.value = state.user.username;
                clientInput.readOnly = true;
            } else {
                clientInput.value = '';
                clientInput.readOnly = false;
            }
        }

        if (!state.menu.length) {
            try {
                state.menu = await apiFetch('/menu');
            } catch { }
        }
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

export function closeModal(type) {
    const modal = document.getElementById('modal-' + type);
    if (modal) modal.hidden = true;
    document.body.style.overflow = '';
}

export function setupModalListeners() {
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
}

function renderProductSelector(selectedIds = []) {
    const container = document.getElementById('product-selector');
    const available = state.menu.filter(p => p.available);
    if (!available.length) {
        container.innerHTML = '<p style="color:var(--cafe-light);font-size:0.85rem;padding:0.5rem">No hay productos disponibles</p>';
        return;
    }
    container.innerHTML = available.map(p => `
    <label class="product-select-item${selectedIds.includes(p.id) ? ' selected' : ''}" for="ps-${p.id}">
      <input type="checkbox" id="ps-${p.id}" value="${p.id}" ${selectedIds.includes(p.id) ? 'checked' : ''} />
      <div>
        <div class="product-select-name">${escHtml(p.name)}</div>
        <div class="product-select-price">${formatPrice(p.price)}</div>
      </div>
    </label>`).join('');

    // Attach listener
    container.querySelectorAll('input[type=checkbox]').forEach(cb => {
        cb.addEventListener('change', onProductSelectChange);
    });
}

export function onProductSelectChange() {
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
