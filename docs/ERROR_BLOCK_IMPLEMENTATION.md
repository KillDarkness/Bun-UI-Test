# Implementação de Agrupamento de Blocos de Erro

## Resumo

Implementação completa de agrupamento de blocos de erro no backend e frontend para exibir erros de testes de forma agrupada ao invés de linha por linha.

## Mudanças no Backend (ui-runner.ts)

### ✅ Correção na Detecção de Linhas de Erro

**Antes:**
```typescript
trimmed.startsWith('^') // Não funcionava com espaços
```

**Depois:**
```typescript
const hasErrorPointer = /^\s*\^/.test(line); // Detecta ^ com espaços
```

### ✅ Agrupamento de Blocos

O backend agora:
1. **Detecta linhas de erro** usando múltiplos padrões:
   - Linhas de código: `72 |`
   - Keyword de erro: `error:`
   - Comparações: `Expected:`, `Received:`
   - Stack traces: `at <anonymous>`
   - Ponteiros de erro: `      ^`

2. **Acumula linhas** em um array até encontrar uma linha que não é erro

3. **Envia o bloco completo** em uma única mensagem WebSocket

**Exemplo de saída agrupada:**
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

## Mudanças no Frontend (App.tsx)

### ✅ Nova Interface LogEntry

```typescript
interface LogEntry {
  message: string
  stream: 'stdout' | 'stderr'
  timestamp: number
  isErrorBlock?: boolean   // ✨ Marca blocos de erro agrupados
  isSummaryBlock?: boolean // ✨ Marca blocos de resumo agrupados
}
```

### ✅ Detecção Inteligente de Blocos

O frontend detecta automaticamente blocos de erro analisando o conteúdo:

```typescript
// Um bloco de erro contém múltiplas características
const hasErrorKeyword = msg.includes('error:')
const hasExpectedReceived = msg.includes('Expected:') && msg.includes('Received:')
const hasCodeLines = lines.some(line => /^\d+\s*\|/.test(line.trim()))
const hasStackTrace = msg.includes('at <anonymous>') || msg.includes('at ')
const hasErrorPointer = lines.some(line => /^\s*\^/.test(line))

// É um bloco de erro se tem erro + contexto
const isErrorBlock = (hasErrorKeyword || hasExpectedReceived) && 
                    (hasCodeLines || hasStackTrace || hasErrorPointer)
```

### ✅ Renderização com Estilo Especial

**Blocos de Erro:**
- 🔴 Fundo vermelho semi-transparente
- 🔲 Borda vermelha
- 📦 Padding aumentado
- 🎨 Texto em vermelho claro

```tsx
if (log.isErrorBlock) {
  return (
    <div className="my-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
      <pre className="whitespace-pre-wrap break-words leading-relaxed text-red-300 text-xs">
        {log.message}
      </pre>
    </div>
  )
}
```

**Blocos de Resumo:**
- 🔵 Fundo azul semi-transparente
- 🔲 Borda azul
- 📊 Texto em azul claro e negrito

```tsx
if (log.isSummaryBlock) {
  return (
    <div className="my-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
      <pre className="whitespace-pre-wrap break-words leading-relaxed text-blue-300 font-semibold text-xs">
        {log.message}
      </pre>
    </div>
  )
}
```

## Comparação: Antes vs Depois

### ❌ Antes (Linha por Linha)

```
error: expect(received).toBe(expected)
Expected: 3
Received: 2
      at <anonymous> (/root/b/test/example.test.ts:77:19)
```

Cada linha era enviada e renderizada separadamente, dificultando a leitura.

### ✅ Depois (Bloco Agrupado)

```
┌────────────────────────────────────────────────────┐
│ 72 | });                                            │
│ 73 |                                                │
│ 74 | // Teste que falha intencionalmente            │
│ 75 | describe("Failing tests (for demo)", () => {   │
│ 76 |   test("this test will fail", () => {          │
│ 77 |     expect(1 + 1).toBe(3);                     │
│                        ^                            │
│ error: expect(received).toBe(expected)             │
│                                                     │
│ Expected: 3                                         │
│ Received: 2                                         │
│                                                     │
│       at <anonymous> (/root/b/test/example...)     │
└────────────────────────────────────────────────────┘
```

Todo o contexto do erro em um único bloco visual destacado.

## Scripts Criados

### 1. `run-tests.sh`
Script shell para executar testes via WebSocket com agrupamento de erros.

**Uso:**
```bash
./run-tests.sh
```

**Características:**
- ✅ Inicia backend automaticamente
- ✅ Conecta via WebSocket
- ✅ Executa todos os testes
- ✅ Exibe erros agrupados
- ✅ Cleanup automático

### 2. `test-full-stack.sh`
Script para iniciar backend + frontend juntos.

**Uso:**
```bash
./test-full-stack.sh
```

**Características:**
- ✅ Inicia ui-runner.ts
- ✅ Inicia Vite dev server
- ✅ Mantém ambos rodando
- ✅ Cleanup ao sair (Ctrl+C)

## Arquitetura do Agrupamento

```
┌─────────────────────────────────────────────────────────┐
│                     bun test                            │
│  (gera output com blocos de erro naturais)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  ui-runner.ts (Backend)                 │
│                                                         │
│  1. Captura stdout linha por linha                     │
│  2. Detecta início de bloco de erro (linha com |)      │
│  3. Acumula linhas do bloco                            │
│  4. Detecta fim do bloco (linha normal)                │
│  5. Envia bloco completo via WebSocket                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ WebSocket (JSON)
                     │ { type: "log", payload: { message: "bloco..." } }
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   App.tsx (Frontend)                    │
│                                                         │
│  1. Recebe mensagem WebSocket                          │
│  2. Analisa conteúdo da mensagem                       │
│  3. Detecta características de erro:                   │
│     - Tem "error:"                                     │
│     - Tem "Expected:" e "Received:"                    │
│     - Tem linhas de código (XX |)                      │
│     - Tem stack trace                                  │
│     - Tem ponteiro ^                                   │
│  4. Marca como isErrorBlock = true                     │
│  5. Renderiza com estilo especial                      │
└─────────────────────────────────────────────────────────┘
```

## Testes

### Teste Manual

1. Inicie o backend:
   ```bash
   bun run ui-runner.ts
   ```

2. Em outro terminal, inicie o frontend:
   ```bash
   cd app && bun run dev
   ```

3. Abra o navegador em `http://localhost:5173`

4. Clique em "Run All" para executar os testes

5. Observe que o erro do teste `"this test will fail"` aparece como um bloco agrupado com:
   - Linhas de código contextualizadas
   - Ponteiro de erro (^)
   - Mensagem de erro
   - Expected/Received
   - Stack trace

### Teste Automatizado

Execute o script de teste:
```bash
./run-tests.sh
```

Observe no output do terminal que o bloco de erro aparece completo.

## Benefícios

### 👁️ Melhor Legibilidade
- Erros são visualmente destacados
- Contexto completo em um só lugar
- Fácil de identificar a linha problemática

### 🚀 Melhor Performance
- Menos mensagens WebSocket
- Menos re-renders no React
- Menos operações de DOM

### 🎨 Melhor UX
- Cores diferentes para erro vs resumo
- Bordas e backgrounds destacados
- Scroll automático funciona melhor

### 🐛 Melhor Debugging
- Todo contexto junto facilita análise
- Stack trace completo visível
- Linhas de código ao redor do erro

## Próximos Passos (Opcional)

1. **Expandir/Colapsar Blocos**
   - Adicionar botão para colapsar blocos grandes
   - Mostrar preview do erro quando colapsado

2. **Syntax Highlighting**
   - Adicionar highlight de sintaxe nas linhas de código
   - Melhorar legibilidade do stack trace

3. **Filtros**
   - Filtrar apenas logs de erro
   - Filtrar por arquivo/teste específico

4. **Exportar Logs**
   - Salvar logs em arquivo
   - Copiar bloco de erro para clipboard

## Arquivos Modificados

- ✅ `ui-runner.ts` - Backend com agrupamento
- ✅ `app/src/App.tsx` - Frontend com detecção e renderização
- ✅ `run-tests.sh` - Script de execução
- ✅ `test-full-stack.sh` - Script full stack
- ✅ `RUN_TESTS_README.md` - Documentação do script
- ✅ `ERROR_BLOCK_IMPLEMENTATION.md` - Este arquivo
