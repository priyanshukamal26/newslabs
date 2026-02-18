const net = require('net');

const host = 'db.ynmwektovmyzvgyeljzd.supabase.co';
const ports = [5432, 6543];

ports.forEach(port => {
    console.log(`Testing connection to ${host}:${port}...`);
    const socket = new net.Socket();
    socket.setTimeout(5000);

    socket.on('connect', () => {
        console.log(`✅ Successfully connected to ${host}:${port}`);
        socket.destroy();
    });

    socket.on('timeout', () => {
        console.log(`❌ Timeout connecting to ${host}:${port}`);
        socket.destroy();
    });

    socket.on('error', (err) => {
        console.log(`❌ Error connecting to ${host}:${port}:`, err.message);
    });

    socket.connect(port, host);
});
