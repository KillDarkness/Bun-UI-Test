Segmentation fault
~/b > bun run --watch ui-runner.ts
🚀 WebSocket server running on ws://localhost:3000
✓ UI connected
📖 Reading test files to extract test names...
✓ Found 2 test files with 28 tests total
📨 [WEBSOCKET] Mensagem recebida: run:request {
  file: "test/utils.test.ts",
}
▶️ [RUN REQUEST] file: test/utils.test.ts testName: undefined
Running file: test/utils.test.ts
🚀 [RUN] Comando: bun test test/utils.test.ts
Starting bun test test/utils.test.ts...
📝 [NORMAL LINE] Enviando: bun test v1.3.3 (274e01c7)
bun test exited with code 0
📨 [WEBSOCKET] Mensagem recebida: run:request {
  file: "test/example.test.ts",
}
▶️ [RUN REQUEST] file: test/example.test.ts testName: undefined
Running file: test/example.test.ts
🚀 [RUN] Comando: bun test test/example.test.ts
Starting bun test test/example.test.ts...
📝 [NORMAL LINE] Enviando: bun test v1.3.3 (274e01c7)
bun test exited with code 1
✗ UI disconnected




