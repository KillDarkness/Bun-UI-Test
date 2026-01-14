const ws = new WebSocket('ws://localhost:3000');

ws.addEventListener('open', () => {
    console.log('✓ Conectado');
});

ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data.toString());
    
    if (msg.type === 'connected') {
        console.log('▶️  Executando testes...\n');
        ws.send(JSON.stringify({ type: 'run:request', payload: {} }));
    } else if (msg.type === 'log') {
        console.log(msg.payload.message);
    } else if (msg.type === 'run:complete') {
        console.log(`\n✅ Finalizado (exit: ${msg.payload.exitCode})`);
        ws.close();
        process.exit(msg.payload.exitCode);
    }
});

setTimeout(() => process.exit(1), 15000);
