# Bun Test UI Runner

Uma UI web para visualizar testes do Bun em tempo real, similar ao Vitest UI.

## Arquitetura

```
UI (React/Vite) ← WebSocket → Runner (ui-runner.ts) → spawn → bun test
```

O runner **NÃO** usa APIs internas do `bun:test` (que não existem publicamente).
Ele apenas spawna `bun test` e faz parsing do stdout/stderr.

## Como Usar

### 1. Iniciar o Runner (Terminal 1)
```bash
bun run ui-runner.ts
```

Isso irá:
- Iniciar um servidor WebSocket na porta 3000
- Aguardar conexão da UI
- Aguardar comando para executar os testes

### 2. Iniciar a UI (Terminal 2)
```bash
cd app
bun install  # primeira vez apenas
bun run dev
```

A UI irá conectar automaticamente ao WebSocket. Clique no botão **"▶ Run Tests"** para executar os testes.

## Protocolo de Eventos WebSocket

Todos os eventos seguem o formato:
```typescript
{
  type: string,
  payload: any
}
```

### Comandos Enviados pela UI

#### `run:request`
Solicita que o runner execute os testes (todos ou arquivo específico).

**Executar todos os testes:**
```json
{
  "type": "run:request",
  "payload": {}
}
```

**Executar arquivo específico:**
```json
{
  "type": "run:request",
  "payload": {
    "file": "test/example.test.ts"
  }
}
```

### Eventos Emitidos pelo Runner

#### `connected`
Emitido quando a UI conecta ao runner. Inclui lista de arquivos de teste encontrados.
```json
{
  "type": "connected",
  "payload": {
    "message": "Runner ready",
    "testFiles": ["test/example.test.ts", "test/utils.test.ts"]
  }
}
```

#### `run:start`
Emitido quando a execução dos testes começa.
```json
{
  "type": "run:start",
  "payload": {
    "timestamp": 1234567890,
    "file": "test/example.test.ts" // ou null para todos
  }
}
```

#### `run:complete`
Emitido quando todos os testes terminam.
```json
{
  "type": "run:complete",
  "payload": {
    "exitCode": 0,
    "timestamp": 1234567890
  }
}
```

#### `file:start`
Emitido quando um novo arquivo de teste é detectado.
```json
{
  "type": "file:start",
  "payload": {
    "filePath": "test/example.test.ts"
  }
}
```

#### `test:start`
Emitido quando um teste individual começa (detecção best-effort).
```json
{
  "type": "test:start",
  "payload": {
    "testName": "should work correctly",
    "timestamp": 1234567890
  }
}
```

#### `test:pass`
Emitido quando um teste passa (detectado pelo símbolo ✓).
```json
{
  "type": "test:pass",
  "payload": {
    "testName": "should work correctly",
    "duration": "0.12ms",
    "timestamp": 1234567890
  }
}
```

#### `test:fail`
Emitido quando um teste falha (detectado pelo símbolo ✗).
```json
{
  "type": "test:fail",
  "payload": {
    "testName": "should fail",
    "duration": "1.45ms",
    "timestamp": 1234567890
  }
}
```

#### `log`
Emitido com a saída bruta do processo (stdout/stderr).
```json
{
  "type": "log",
  "payload": {
    "message": "output text",
    "stream": "stdout" | "stderr"
  }
}
```

#### `error`
Emitido quando há um erro ao executar o processo.
```json
{
  "type": "error",
  "payload": {
    "message": "error description"
  }
}
```

## Estrutura do Projeto

```
.
├── ui-runner.ts          # Runner que executa bun test e emite eventos
├── README.md             # Este arquivo
├── app/                  # UI React/Vite
│   ├── src/
│   │   ├── App.tsx      # Componente principal com WebSocket
│   │   └── ...
│   └── package.json
└── test/                 # Testes de exemplo
    └── example.test.ts
```

## Limitações Conhecidas

1. **Parsing baseado em stdout**: O runner faz parsing da saída formatada do `bun test`, o que pode quebrar se o formato mudar em versões futuras.

2. **Sem API oficial de reporters**: O Bun não possui uma API oficial de reporters como Jest ou Vitest, então não podemos "plugar" diretamente no test runner.

3. **Detecção de teste:start**: A detecção de quando um teste *começa* é best-effort, pois o Bun só emite informação quando o teste *termina*.

4. **Watch mode**: Por enquanto, os testes são executados uma vez. Watch mode será adicionado em versões futuras.

## Próximos Passos

- [ ] Implementar watch mode (re-executar testes em mudanças)
- [ ] Adicionar filtros (por arquivo, por status)
- [ ] Melhorar parsing de stack traces
- [ ] Adicionar suporte a coverage
- [ ] Persistir resultados entre runs

## Por que essa abordagem?

Não inventamos nenhuma API fictícia. Tudo é baseado em:
- `spawn` do Node.js (compatível com Bun)
- WebSocket nativo do Bun
- Parsing de texto da saída do `bun test`

Essa abordagem é totalmente compatível com o Bun atual e não quebrará com APIs que não existem.
