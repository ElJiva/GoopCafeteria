/**
 * GOOP CAFETERÍA — server.js
 * Backend: Node.js + Express + SQLite (better-sqlite3)
 * API REST para CRUD de Menu, Pedidos, Inventario y Autenticación
 */

'use strict';

const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ─── BASE DE DATOS ────────────────────────────────────────
// Use path.join to correctly locate the database in the 'database' folder
const db = new Database(path.join(__dirname, '../database/goop.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── CREAR TABLAS ─────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    username   TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    role       TEXT NOT NULL DEFAULT 'user'
                 CHECK(role IN ('admin','user')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS menu (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL CHECK(category IN ('Bebidas','Alimentos','Postres')),
    price       REAL NOT NULL CHECK(price >= 0),
    image       TEXT DEFAULT '',
    available   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id          TEXT PRIMARY KEY,
    client      TEXT NOT NULL,
    user_id     TEXT,
    products    TEXT NOT NULL,
    total       REAL NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'Pendiente'
                  CHECK(status IN ('Pendiente','Preparando','Entregado')),
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    quantity     REAL NOT NULL DEFAULT 0,
    unit         TEXT NOT NULL,
    max_capacity REAL NOT NULL DEFAULT 1,
    created_at   TEXT DEFAULT (datetime('now'))
  );
`);

// ─── UTILIDADES ───────────────────────────────────────────
function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password + 'goop_salt_2026').digest('hex');
}

function sendError(res, status, message) {
    return res.status(status).json({ error: message });
}

// ─── SEED DATA ────────────────────────────────────────────
function seedIfEmpty() {
    // Admin user
    const adminExists = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
    if (!adminExists) {
        db.prepare('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)')
            .run('admin-001', 'admin', hashPassword('12345'), 'admin');
    }

    const menuCount = db.prepare('SELECT COUNT(*) as c FROM menu').get().c;
    if (menuCount === 0) {
        const ins = db.prepare('INSERT INTO menu (id, name, category, price, image, available) VALUES (?, ?, ?, ?, ?, ?)');
        db.transaction(() => {
            ins.run('m1', 'Latte de Vainilla', 'Bebidas', 65, '', 1);
            ins.run('m2', 'Cappuccino Clásico', 'Bebidas', 58, '', 1);
            ins.run('m3', 'Matcha Latte', 'Bebidas', 72, '', 1);
            ins.run('m4', 'Tostada de Aguacate', 'Alimentos', 85, '', 1);
            ins.run('m5', 'Bowl de Granola', 'Alimentos', 78, '', 0);
            ins.run('m6', 'Croissant de Mantequilla', 'Alimentos', 45, '', 1);
            ins.run('m7', 'Cheesecake de Frutos Rojos', 'Postres', 92, '', 1);
            ins.run('m8', 'Brownie de Chocolate', 'Postres', 55, '', 1);
        })();
    }

    const ordersCount = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
    if (ordersCount === 0) {
        const ins = db.prepare('INSERT INTO orders (id, client, user_id, products, total, status) VALUES (?, ?, ?, ?, ?, ?)');
        db.transaction(() => {
            ins.run('PED-001', 'Ana Martínez', 'admin-001', JSON.stringify(['m1', 'm4']), 150, 'Entregado');
            ins.run('PED-002', 'Carlos Ruiz', 'admin-001', JSON.stringify(['m2', 'm7']), 150, 'Preparando');
            ins.run('PED-003', 'Sofía López', 'admin-001', JSON.stringify(['m3', 'm8']), 127, 'Pendiente');
        })();
    }

    const invCount = db.prepare('SELECT COUNT(*) as c FROM inventory').get().c;
    if (invCount === 0) {
        const ins = db.prepare('INSERT INTO inventory (id, name, quantity, unit, max_capacity) VALUES (?, ?, ?, ?, ?)');
        db.transaction(() => {
            ins.run('i1', 'Café Molido', 4.5, 'kg', 10);
            ins.run('i2', 'Leche Entera', 8, 'L', 20);
            ins.run('i3', 'Leche de Avena', 1.2, 'L', 15);
            ins.run('i4', 'Azúcar', 0.4, 'kg', 5);
            ins.run('i5', 'Harina', 3, 'kg', 10);
            ins.run('i6', 'Mantequilla', 0.2, 'kg', 3);
            ins.run('i7', 'Polvo de Matcha', 80, 'g', 500);
            ins.run('i8', 'Vainilla Líquida', 30, 'mL', 500);
        })();
    }
}
seedIfEmpty();

// ─── MIDDLEWARE: AUTH ─────────────────────────────────────
// Tokens en memoria (simple, sin JWT)
const activeSessions = new Map(); // token → { userId, username, role }

function requireAuth(req, res, next) {
    const token = req.headers['x-auth-token'];
    if (!token || !activeSessions.has(token)) {
        return sendError(res, 401, 'No autorizado. Inicia sesión primero.');
    }
    req.user = activeSessions.get(token);
    next();
}

function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user.role !== 'admin') {
            return sendError(res, 403, 'Acceso denegado. Se requiere rol de administrador.');
        }
        next();
    });
}

//  RUTAS: AUTENTICACIÓN


// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return sendError(res, 400, 'Usuario y contraseña son requeridos');

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
    if (!user || user.password !== hashPassword(password))
        return sendError(res, 401, 'Usuario o contraseña incorrectos');

    const token = uid() + uid();
    activeSessions.set(token, { userId: user.id, username: user.username, role: user.role });

    res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role }
    });
});

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return sendError(res, 400, 'Usuario y contraseña son requeridos');
    if (username.trim().length < 3)
        return sendError(res, 400, 'El usuario debe tener al menos 3 caracteres');
    if (password.length < 4)
        return sendError(res, 400, 'La contraseña debe tener al menos 4 caracteres');
    if (username.trim().toLowerCase() === 'admin')
        return sendError(res, 400, 'Ese nombre de usuario no está disponible');

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
    if (existing)
        return sendError(res, 409, 'El nombre de usuario ya está en uso');

    const id = uid();
    db.prepare('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)')
        .run(id, username.trim(), hashPassword(password), 'user');

    const token = uid() + uid();
    activeSessions.set(token, { userId: id, username: username.trim(), role: 'user' });

    res.status(201).json({
        token,
        user: { id, username: username.trim(), role: 'user' }
    });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
    const token = req.headers['x-auth-token'];
    if (token) activeSessions.delete(token);
    res.json({ message: 'Sesión cerrada' });
});

// GET /api/auth/me — verificar sesión activa
app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
});

//  RUTAS: MENU ( escritura solo admin)

app.get('/api/menu', (req, res) => {
    const rows = db.prepare('SELECT * FROM menu ORDER BY category, name').all();
    res.json(rows.map(r => ({ ...r, available: r.available === 1 })));
});

app.get('/api/menu/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM menu WHERE id = ?').get(req.params.id);
    if (!row) return sendError(res, 404, 'Producto no encontrado');
    res.json({ ...row, available: row.available === 1 });
});

app.post('/api/menu', requireAdmin, (req, res) => {
    const { name, category, price, image = '', available = true } = req.body;
    if (!name || !category || price === undefined)
        return sendError(res, 400, 'Faltan campos requeridos: name, category, price');
    if (!['Bebidas', 'Alimentos', 'Postres'].includes(category))
        return sendError(res, 400, 'Categoría inválida');
    if (isNaN(price) || price < 0)
        return sendError(res, 400, 'Precio inválido');

    const id = uid();
    db.prepare('INSERT INTO menu (id, name, category, price, image, available) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, name.trim(), category, parseFloat(price), image.trim(), available ? 1 : 0);

    const created = db.prepare('SELECT * FROM menu WHERE id = ?').get(id);
    res.status(201).json({ ...created, available: created.available === 1 });
});

app.put('/api/menu/:id', requireAdmin, (req, res) => {
    const existing = db.prepare('SELECT * FROM menu WHERE id = ?').get(req.params.id);
    if (!existing) return sendError(res, 404, 'Producto no encontrado');

    const { name, category, price, image, available } = req.body;
    const updated = {
        name: name !== undefined ? name.trim() : existing.name,
        category: category !== undefined ? category : existing.category,
        price: price !== undefined ? parseFloat(price) : existing.price,
        image: image !== undefined ? image.trim() : existing.image,
        available: available !== undefined ? (available ? 1 : 0) : existing.available,
    };
    if (!['Bebidas', 'Alimentos', 'Postres'].includes(updated.category))
        return sendError(res, 400, 'Categoría inválida');

    db.prepare('UPDATE menu SET name=?, category=?, price=?, image=?, available=? WHERE id=?')
        .run(updated.name, updated.category, updated.price, updated.image, updated.available, req.params.id);

    const row = db.prepare('SELECT * FROM menu WHERE id = ?').get(req.params.id);
    res.json({ ...row, available: row.available === 1 });
});

app.delete('/api/menu/:id', requireAdmin, (req, res) => {
    const existing = db.prepare('SELECT * FROM menu WHERE id = ?').get(req.params.id);
    if (!existing) return sendError(res, 404, 'Producto no encontrado');
    db.prepare('DELETE FROM menu WHERE id = ?').run(req.params.id);
    res.json({ message: `Producto "${existing.name}" eliminado correctamente` });
});


//  RUTAS: PEDIDOS

// Admin ve todos; usuario normal solo los suyos
app.get('/api/orders', requireAuth, (req, res) => {
    const { status } = req.query;
    let rows;
    if (req.user.role === 'admin') {
        if (status && status !== 'all') {
            rows = db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status);
        } else {
            rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
        }
    } else {
        if (status && status !== 'all') {
            rows = db.prepare('SELECT * FROM orders WHERE user_id = ? AND status = ? ORDER BY created_at DESC').all(req.user.userId, status);
        } else {
            rows = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.userId);
        }
    }
    res.json(rows.map(r => ({ ...r, products: JSON.parse(r.products || '[]') })));
});

app.get('/api/orders/:id', requireAuth, (req, res) => {
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!row) return sendError(res, 404, 'Pedido no encontrado');
    if (req.user.role !== 'admin' && row.user_id !== req.user.userId)
        return sendError(res, 403, 'No tienes permiso para ver este pedido');
    res.json({ ...row, products: JSON.parse(row.products || '[]') });
});

app.post('/api/orders', requireAuth, (req, res) => {
    const { client, products = [], status = 'Pendiente' } = req.body;
    if (!client) return sendError(res, 400, 'El nombre del cliente es requerido');
    if (!Array.isArray(products) || products.length === 0)
        return sendError(res, 400, 'Selecciona al menos un producto');
    if (!['Pendiente', 'Preparando', 'Entregado'].includes(status))
        return sendError(res, 400, 'Estatus inválido');

    const placeholders = products.map(() => '?').join(',');
    const menuItems = db.prepare(`SELECT price FROM menu WHERE id IN (${placeholders})`).all(...products);
    if (menuItems.length === 0)
        return sendError(res, 400, 'Ninguno de los productos seleccionados existe en el menú');
    const calculatedTotal = menuItems.reduce((sum, m) => sum + m.price, 0);

    // Generar ID secuencial seguro
    const allOrders = db.prepare('SELECT id FROM orders').all();
    let maxNum = 0;
    for (const o of allOrders) {
        const match = o.id.match(/PED-(\d+)/);
        if (match) { const n = parseInt(match[1]); if (n > maxNum) maxNum = n; }
    }
    const id = 'PED-' + String(maxNum + 1).padStart(3, '0');

    // Usuario normal no puede poner estatus distinto a Pendiente
    const finalStatus = req.user.role === 'admin' ? status : 'Pendiente';

    try {
        db.prepare('INSERT INTO orders (id, client, user_id, products, total, status) VALUES (?, ?, ?, ?, ?, ?)')
            .run(id, client.trim(), req.user.userId, JSON.stringify(products), calculatedTotal, finalStatus);
    } catch (err) {
        return sendError(res, 500, 'Error al guardar el pedido: ' + err.message);
    }

    const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.status(201).json({ ...created, products: JSON.parse(created.products) });
});

// Solo admin puede cambiar estatus; usuario puede editar sus propios pedidos pendientes
app.put('/api/orders/:id', requireAuth, (req, res) => {
    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!existing) return sendError(res, 404, 'Pedido no encontrado');
    if (req.user.role !== 'admin' && existing.user_id !== req.user.userId)
        return sendError(res, 403, 'No tienes permiso para editar este pedido');

    const { client, products, status } = req.body;
    const updClient = client !== undefined ? client.trim() : existing.client;
    const updStatus = status !== undefined ? status : existing.status;
    const updProducts = products !== undefined ? products : JSON.parse(existing.products);

    // Usuario normal no puede cambiar estatus
    const finalStatus = req.user.role === 'admin' ? updStatus : existing.status;

    if (!['Pendiente', 'Preparando', 'Entregado'].includes(finalStatus))
        return sendError(res, 400, 'Estatus inválido');

    const placeholders = updProducts.map(() => '?').join(',');
    const menuItems = db.prepare(`SELECT price FROM menu WHERE id IN (${placeholders})`).all(...updProducts);
    const total = menuItems.reduce((sum, m) => sum + m.price, 0);

    db.prepare('UPDATE orders SET client=?, products=?, total=?, status=? WHERE id=?')
        .run(updClient, JSON.stringify(updProducts), total, finalStatus, req.params.id);

    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json({ ...row, products: JSON.parse(row.products) });
});

app.delete('/api/orders/:id', requireAdmin, (req, res) => {
    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!existing) return sendError(res, 404, 'Pedido no encontrado');
    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    res.json({ message: `Pedido ${req.params.id} eliminado correctamente` });
});

//  RUTAS: INVENTARIO (solo admin)

app.get('/api/inventory', requireAdmin, (req, res) => {
    const rows = db.prepare('SELECT * FROM inventory ORDER BY name').all();
    res.json(rows);
});

app.get('/api/inventory/:id', requireAdmin, (req, res) => {
    const row = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id);
    if (!row) return sendError(res, 404, 'Insumo no encontrado');
    res.json(row);
});

app.post('/api/inventory', requireAdmin, (req, res) => {
    const { name, quantity, unit, max_capacity } = req.body;
    if (!name || !unit || quantity === undefined || max_capacity === undefined)
        return sendError(res, 400, 'Faltan campos requeridos');
    if (isNaN(quantity) || quantity < 0) return sendError(res, 400, 'Cantidad inválida');
    if (isNaN(max_capacity) || max_capacity <= 0) return sendError(res, 400, 'Capacidad máxima inválida');

    const id = uid();
    db.prepare('INSERT INTO inventory (id, name, quantity, unit, max_capacity) VALUES (?, ?, ?, ?, ?)')
        .run(id, name.trim(), parseFloat(quantity), unit, parseFloat(max_capacity));

    const created = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    res.status(201).json(created);
});

app.put('/api/inventory/:id', requireAdmin, (req, res) => {
    const existing = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id);
    if (!existing) return sendError(res, 404, 'Insumo no encontrado');

    const { name, quantity, unit, max_capacity } = req.body;
    const updated = {
        name: name !== undefined ? name.trim() : existing.name,
        quantity: quantity !== undefined ? parseFloat(quantity) : existing.quantity,
        unit: unit !== undefined ? unit : existing.unit,
        max_capacity: max_capacity !== undefined ? parseFloat(max_capacity) : existing.max_capacity,
    };

    db.prepare('UPDATE inventory SET name=?, quantity=?, unit=?, max_capacity=? WHERE id=?')
        .run(updated.name, updated.quantity, updated.unit, updated.max_capacity, req.params.id);

    const row = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id);
    res.json(row);
});

app.delete('/api/inventory/:id', requireAdmin, (req, res) => {
    const existing = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id);
    if (!existing) return sendError(res, 404, 'Insumo no encontrado');
    db.prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id);
    res.json({ message: `Insumo "${existing.name}" eliminado correctamente` });
});

// ─── RUTA RAÍZ ────────────────────────────────────────────
// Servir el frontend principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── INICIAR SERVIDOR ─────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n☕ Goop Cafetería — Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Base de datos SQLite: ${path.join(__dirname, 'goop.db')}`);
    console.log(`\nCredenciales admin: usuario=admin | contraseña=12345`);
    console.log(`\nEndpoints Auth:`);
    console.log(`  POST /api/auth/login`);
    console.log(`  POST /api/auth/register`);
    console.log(`  POST /api/auth/logout`);
    console.log(`  GET  /api/auth/me`);
});
