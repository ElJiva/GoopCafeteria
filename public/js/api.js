/* ═══════════════════════════════════════════════════════════
   GOOP CAFETERÍA — api.js
   Módulo de interacción con la API
   ═══════════════════════════════════════════════════════════ */
import { state } from './state.js';
import { showToast } from './components/toast.js';

const API = 'http://localhost:3000/api';

export async function apiFetch(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (state.token) headers['x-auth-token'] = state.token;

    try {
        const res = await fetch(API + endpoint, { ...options, headers });
        const data = await res.json();
        if (!res.ok) {
            if (res.status === 401) {
                // Import dynamic to avoid circular dependency if possible, 
                // or dispatch event, or just handle logout in app.js via event
                window.dispatchEvent(new CustomEvent('goop:logout'));
            }
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
