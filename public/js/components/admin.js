/* ═══════════════════════════════════════════════════════════
   GOOP CAFETERÍA — components/admin.js
   Lógica del panel de administración
   ═══════════════════════════════════════════════════════════ */
import { state } from '../state.js';
import { navigate } from '../app.js';
import { formatPrice, getStockLevel } from '../utils.js';
import { loadMenuTable, loadOrdersTable, loadInventoryTable } from './tables.js';

export async function loadAdmin() {
    if (state.user?.role !== 'admin') { navigate('catalog'); return; }
    await Promise.all([
        loadMenuTable(),
        loadOrdersTable(),
        loadInventoryTable(),
    ]);
    updateStats();
}

export function updateStats() {
    const activeOrders = state.orders.filter(o => o.status !== 'Entregado').length;
    const lowStock = state.inventory.filter(i => getStockLevel(i) !== 'ok').length;
    const todaySales = state.orders
        .filter(o => o.status === 'Entregado')
        .reduce((sum, o) => sum + o.total, 0);

    const elProducts = document.getElementById('stat-products');
    if (elProducts) elProducts.textContent = state.menu.length;

    const elOrders = document.getElementById('stat-orders');
    if (elOrders) elOrders.textContent = activeOrders;

    const elLowStock = document.getElementById('stat-lowstock');
    if (elLowStock) elLowStock.textContent = lowStock;

    const elSales = document.getElementById('stat-sales');
    if (elSales) elSales.textContent = formatPrice(todaySales);
}
