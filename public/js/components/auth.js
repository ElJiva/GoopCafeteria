/* ═══════════════════════════════════════════════════════════
   GOOP CAFETERÍA — components/auth.js
   Gestión de autenticación
   ═══════════════════════════════════════════════════════════ */
import { state } from '../state.js';
import { apiFetch } from '../api.js';
import { showToast } from './toast.js';
import { navigate } from '../app.js'; // Will be circular, but navigate is hoisted or we attach to window/state

export async function handleLogin(e) {
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

export async function handleRegister(e) {
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

export function logout() {
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

export function toggleAuthMode(mode) {
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

export function updateAuthUI() {
    const isLoggedIn = !!state.token;
    const isAdmin = state.user?.role === 'admin';

    document.getElementById('nav-item-login').hidden = isLoggedIn;
    document.querySelectorAll('.auth-only').forEach(el => el.hidden = !isLoggedIn);
    document.querySelectorAll('.admin-only').forEach(el => el.hidden = !isAdmin);

    if (isLoggedIn) {
        if (document.getElementById('user-display'))
            document.getElementById('user-display').textContent = `(${state.user.username})`;

        // Update Add Order modal client input to readonly
        const clientInput = document.getElementById('order-client');
        if (clientInput) {
            if (isAdmin) {
                clientInput.readOnly = false;
                //clientInput.value = ''; // Don't clear on every UI update
            } else {
                clientInput.readOnly = true;
                clientInput.value = state.user.username;
            }
        }
        const statusGroup = document.getElementById('group-order-status');
        if (statusGroup) statusGroup.hidden = !isAdmin;
    }
}
