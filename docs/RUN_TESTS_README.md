# Script de Execução de Testes - run-tests.sh

## Descrição

Script shell automatizado que:
1. ✅ Inicia o servidor backend WebSocket (ui-runner.ts)
2. ✅ Conecta ao WebSocket
3. ✅ Executa todos os testes via `bun test`
4. ✅ **Agrupa blocos de erro** ao invés de exibir linha por linha
5. ✅ Exibe resultados em tempo real com cores
6. ✅ Limpa processos automaticamente ao finalizar

## Características

### Agrupamento de Erros ✨

O script foi otimizado para **agrupar blocos de erro** do Bun test:

**Antes (linha por linha):**
```
=== LOG MESSAGE ===
error: expect(received).toBe(expected)
=== END LOG ===
=== LOG MESSAGE ===
Expected: 3
=== END LOG ===
=== LOG MESSAGE ===
Received: 2
=== END LOG ===
```

**Depois (bloco completo):**
```
72 | });
73 | 
74 | // Teste que falha intencionalmente
75 | describe("Failing tests (for demo)", () => {
76 |   test("this test will fail", () => {
77 |     expect(1 + 1).toBe(3);
                       ^
error: expect(received).toBe(expected)

Expected: 3
Received: 2

      at <anonymous> (/root/b/test/example.test.ts:77:19)
```

### Recursos

- 🎨 **Logs coloridos** para fácil visualização
- 🧹 **Cleanup automático** de processos ao sair (Ctrl+C ou erro)
- ⏱️ **Timeout de segurança** (30 segundos)
- 📊 **Resumo de resultados** ao final
- 🔍 **Verificação de dependências** antes de executar
- 🚀 **Inicialização automática** do backend

## Uso

### Executar todos os testes

```bash
./run-tests.sh
```

### Executar com UI (opcional)

```bash
START_UI=true ./run-tests.sh
```

Isso iniciará também a interface web em `http://localhost:5173`

## Exemplo de Saída

```
════════════════════════════════════════════════════
  🧪 Bun Test Runner - Execução Completa
════════════════════════════════════════════════════

ℹ Verificando dependências...
✓ Bun encontrado: 1.3.3
ℹ Iniciando backend WebSocket...
✓ Backend iniciado (PID: 8115)
ℹ Aguardando backend ficar pronto...
✓ Backend WebSocket rodando em ws://localhost:3000
ℹ Conectando ao WebSocket e executando testes...
✓ Conectado ao WebSocket
📋 Arquivos de teste encontrados: 2
📝 Total de testes: 28
▶️  Solicitando execução de todos os testes...

🚀 Iniciando execução dos testes...

bun test v1.3.3 (274e01c7)
test/example.test.ts:
  ✓ Math operations > addition works correctly [0.12ms]
  ✓ Math operations > subtraction works correctly [0.07ms]
  ...
  ✗ Failing tests (for demo) > this test will fail [2.28ms]
  
test/utils.test.ts:
  ✓ Object operations > Object.keys returns keys [0.51ms]
  ...

 19 pass
 1 fail
 33 expect() calls
Ran 20 tests across 2 files. [260.00ms]

════════════════════════════════════════════════════
✓ Testes finalizados (exit code: 1)
════════════════════════════════════════════════════
```

## Estrutura do Script

1. **Verificação de dependências**: Verifica se Bun está instalado
2. **Instalação de pacotes**: Instala dependências se necessário
3. **Inicialização do backend**: Roda `ui-runner.ts` em background
4. **Aguarda backend**: Espera o WebSocket estar pronto na porta 3000
5. **Conecta e executa testes**: Usa cliente WebSocket Bun para executar testes
6. **Exibe resultados**: Mostra output em tempo real com blocos agrupados
7. **Cleanup**: Finaliza processos automaticamente

## Troubleshooting

### Backend não inicia

Verifique se a porta 3000 está livre:
```bash
lsof -i :3000
```

### Timeout nos testes

Aumente o timeout no script (linha `setTimeout(..., 30000)`):
```typescript
setTimeout(() => {
    console.error('⏱️  Timeout: testes demoraram muito tempo');
    ws.close();
    process.exit(1);
}, 60000); // 60 segundos
```

### Logs do backend

Os logs do backend são salvos em `backend.log`:
```bash
cat backend.log
```

## Melhorias Implementadas

### No ui-runner.ts

- ✅ Detecção melhorada de linhas de erro (incluindo `^` com espaços)
- ✅ Agrupamento de blocos de erro completos
- ✅ Agrupamento de blocos de resumo
- ✅ Logs de debug para rastreamento

### No run-tests.sh

- ✅ Uso de API nativa do Bun para WebSocket
- ✅ Tratamento adequado de eventos com `addEventListener`
- ✅ Cleanup automático com trap EXIT/INT/TERM
- ✅ Verificação de porta antes de conectar
- ✅ Logs coloridos para melhor UX

## Arquivos

- `run-tests.sh` - Script principal
- `ui-runner.ts` - Backend WebSocket
- `backend.log` - Logs do backend (gerado automaticamente)
- `tmp_rovodev_ws_client.ts` - Cliente WebSocket temporário (removido automaticamente)

## Requisitos

- Bun >= 1.0
- Porta 3000 disponível
- Arquivos de teste em `test/*.test.ts`
