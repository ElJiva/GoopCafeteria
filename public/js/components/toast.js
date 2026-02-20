/* ═══════════════════════════════════════════════════════════
   GOOP CAFETERÍA — components/toast.js
   Módulo de notificaciones
   ═══════════════════════════════════════════════════════════ */
import { getIcon } from '../utils.js';

export function showToast(msg, type = 'success') {
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
