
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
    // 1. Login as Admin
    console.log('Logging in as Admin...');
    let res = await request({
        hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ username: 'admin', password: '12345' }));

    if (res.status !== 200) {
        console.error('Admin login failed:', res.body);
        return;
    }
    const { token } = JSON.parse(res.body);
    console.log('Admin logged in. Token:', token.substring(0, 10));

    // 2. Fetch Orders
    console.log('Fetching orders...');
    res = await request({
        hostname: 'localhost', port: 3000, path: '/api/orders', method: 'GET',
        headers: { 'x-auth-token': token }
    });

    if (res.status !== 200) {
        console.error('Fetch orders failed:', res.body);
        return;
    }

    const orders = JSON.parse(res.body);
    console.log(`Successfully fetched ${orders.length} orders.`);


    if (orders.length > 0) {
        console.log('Latest order:', JSON.stringify(orders[0], null, 2));
    } else {
        console.log('No orders found.');
    }
}

main().catch(console.error);
