
const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function main() {
    const baseUrl = 'http://localhost:3000/api';

    // 1. Register/Login
    const username = 'testuser_' + Date.now();
    const password = 'password123';

    console.log(`Step 1: Registering user ${username}...`);
    let res = await request({
        hostname: 'localhost', port: 3000, path: '/api/auth/register', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ username, password }));

    if (res.status !== 201) {
        console.error('Registration failed:', res.body);
        return;
    }
    const { token } = JSON.parse(res.body);
    console.log('Registered. Token:', token.substring(0, 10) + '...');

    // 2. Get Menu
    console.log('Step 2: Fetching menu...');
    res = await request({ hostname: 'localhost', port: 3000, path: '/api/menu', method: 'GET' });
    const menu = JSON.parse(res.body);
    if (menu.length === 0) {
        console.error('Menu is empty! Cannot place order.');
        return; // Or create a menu item if I want to be robust
    }
    const productId = menu[0].id;
    console.log('Found product:', menu[0].name, 'ID:', productId);

    // 3. Create Order
    console.log('Step 3: Creating order...');
    const orderData = {
        client: 'Test Client',
        products: [productId],
        status: 'Pendiente'
    };

    res = await request({
        hostname: 'localhost', port: 3000, path: '/api/orders', method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
        }
    }, JSON.stringify(orderData));

    console.log('Order Response Status:', res.status);
    console.log('Order Response Body (first 200 chars):', res.body.substring(0, 200));

    if (res.body.startsWith('<')) {
        console.log('❌ CRITICAL: Received HTML instead of JSON. This causes "Unexpected token <...".');
    } else {
        try {
            JSON.parse(res.body);
            console.log('✅ Response is valid JSON.');
        } catch (e) {
            console.log('❌ CRITICAL: Response is NOT valid JSON:', e.message);
        }
    }
}

main().catch(console.error);
