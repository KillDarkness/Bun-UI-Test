# Guia de Teste - Agrupamento de Blocos de Erro

## 🎯 Objetivo

Verificar que os blocos de erro estão sendo exibidos de forma agrupada e estilizada tanto no terminal quanto na UI web.

## 📋 Pré-requisitos

- Bun instalado
- Porta 3000 disponível (backend WebSocket)
- Porta 5173 disponível (frontend Vite)

## 🧪 Métodos de Teste

### Método 1: Script Automatizado (Recomendado)

Este método executa apenas o backend e testes via WebSocket:

```bash
./run-tests.sh
```

**O que você deve ver:**

1. ✅ Backend inicia na porta 3000
2. ✅ Cliente WebSocket conecta
3. ✅ Testes executam
4. ✅ **Bloco de erro agrupado** aparece assim:

```
72 | });
73 | 
74 | // Teste que falha intencionalmente para demonstrar visualização de falhas
75 | describe("Failing tests (for demo)", () => {
76 |   test("this test will fail", () => {
77 |     expect(1 + 1).toBe(3); // Intencionalmente errado
                       ^
error: expect(received).toBe(expected)

Expected: 3
Received: 2

      at <anonymous> (/root/b/test/example.test.ts:77:19)
```

**✅ SUCESSO:** Todo o bloco aparece junto, não linha por linha!

---

### Método 2: Full Stack (Backend + Frontend)

Este método inicia backend e frontend para testar na UI web:

```bash
chmod +x test-full-stack.sh
./test-full-stack.sh
```

**O que você deve ver:**

1. ✅ Backend inicia (ws://localhost:3000)
2. ✅ Frontend inicia (http://localhost:5173)
3. ✅ Mensagem com as URLs

**Agora abra o navegador:**

1. Navegue para `http://localhost:5173`
2. Clique no botão **"Run All"**
3. Observe o painel **"Output"** à direita

**No painel Output você verá:**

- ✅ Linhas normais de teste (verde/branco)
- 🔴 **Bloco de erro destacado** com:
  - Fundo vermelho claro
  - Borda vermelha à esquerda
  - Ícone de erro (X vermelho)
  - Label "TEST ERROR"
  - Todo o contexto do erro agrupado
- 🔵 **Bloco de resumo destacado** com:
  - Fundo azul claro
  - Borda azul à esquerda
  - Ícone de check (✓ azul)
  - Label "TEST SUMMARY"
  - Estatísticas dos testes

---

### Método 3: Manual (Maior Controle)

Para desenvolvimento e debugging, inicie cada componente separadamente:

**Terminal 1 - Backend:**
```bash
bun run ui-runner.ts
```

Você verá:
```
🚀 WebSocket server running on ws://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd app
bun run dev
```

Você verá:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
```

**Terminal 3 - Monitorar Backend Logs:**
```bash
# Em outra aba/janela
tail -f backend.log  # Quando o backend gerar logs
```

**Navegador:**
1. Abra `http://localhost:5173`
2. Clique em "Run All"
3. Observe os blocos de erro

**Para parar:**
```bash
# No terminal 1 e 2
Ctrl+C
```

---

## 🎨 Como Identificar que Está Funcionando

### ❌ Comportamento INCORRETO (linha por linha):

No terminal ou UI, você veria cada linha separada:
```
error: expect(received).toBe(expected)
Expected: 3
Received: 2
      at <anonymous> (/root/b/test/example.test.ts:77:19)
```

### ✅ Comportamento CORRETO (bloco agrupado):

**No Terminal:**
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

**Na UI Web:**
```
╔═══════════════════════════════════════════════════╗
║ ❌ TEST ERROR                                     ║
╠═══════════════════════════════════════════════════╣
║ 72 | });                                           ║
║ 73 |                                               ║
║ 74 | // Teste que falha intencionalmente           ║
║ 75 | describe("Failing tests (for demo)", () => {  ║
║ 76 |   test("this test will fail", () => {         ║
║ 77 |     expect(1 + 1).toBe(3);                    ║
║                        ^                           ║
║ error: expect(received).toBe(expected)            ║
║                                                    ║
║ Expected: 3                                        ║
║ Received: 2                                        ║
║                                                    ║
║       at <anonymous> (/root/b/test/example...)    ║
╚═══════════════════════════════════════════════════╝
```

Com fundo vermelho claro e borda vermelha destacada!

---

## 🔍 Verificação nos Logs do Backend

Se quiser ver os logs detalhados do backend:

```bash
bun run ui-runner.ts 2>&1 | grep -A 5 "ERROR BLOCK"
```

Você deve ver:
```
📦 [ERROR BLOCK] Enviando bloco com X linhas:
---START---
[conteúdo do bloco]
---END---
```

Isso confirma que o backend está detectando e agrupando corretamente.

---

## 🐛 Troubleshooting

### Problema: "Porta 3000 já em uso"

```bash
# Encontre o processo
lsof -i :3000

# Mate o processo
kill -9 <PID>

# Ou use:
pkill -f ui-runner
```

### Problema: "Porta 5173 já em uso"

```bash
# Encontre o processo
lsof -i :5173

# Mate o processo
kill -9 <PID>

# Ou use:
pkill -f vite
```

### Problema: Backend não está agrupando

Verifique se o arquivo `ui-runner.ts` tem a função `isErrorLine` atualizada:

```bash
grep -A 5 "hasErrorPointer" ui-runner.ts
```

Deve conter:
```typescript
const hasErrorPointer = /^\s*\^/.test(line);
```

### Problema: Frontend não está mostrando blocos destacados

Verifique o código em `app/src/App.tsx`:

```bash
grep -A 3 "isErrorBlock" app/src/App.tsx
```

Deve conter a lógica de detecção e renderização especial.

---

## 📊 Checklist de Validação

- [ ] Backend inicia sem erros
- [ ] Frontend inicia sem erros
- [ ] WebSocket conecta (veja "Connected" verde na UI)
- [ ] Clicar "Run All" executa testes
- [ ] Testes passam (verde) aparecem na lista
- [ ] Teste falhando aparece em vermelho na lista
- [ ] **Bloco de erro aparece agrupado no painel Output**
- [ ] Bloco de erro tem fundo vermelho e borda
- [ ] Bloco de erro tem ícone e label "TEST ERROR"
- [ ] Bloco de resumo aparece em azul
- [ ] Bloco de resumo tem ícone e label "TEST SUMMARY"
- [ ] Logs normais aparecem sem destaque especial

---

## 🎬 Demo Rápida

Execute esta sequência rápida de comandos:

```bash
# 1. Limpar processos antigos
pkill -f ui-runner 2>/dev/null
pkill -f vite 2>/dev/null
sleep 1

# 2. Executar teste automatizado
./run-tests.sh
```

**Resultado esperado em ~10 segundos:**
- ✅ Backend inicia
- ✅ Testes executam
- ✅ Você vê o bloco de erro agrupado no terminal
- ✅ Script finaliza e limpa tudo

**Tempo total:** ~10 segundos

---

## 📸 Screenshots Esperados

### Terminal (run-tests.sh)
```
════════════════════════════════════════════════════
  🧪 Bun Test Runner - Execução Completa
════════════════════════════════════════════════════

ℹ Verificando dependências...
✓ Bun encontrado: 1.3.3
ℹ Iniciando backend WebSocket...
✓ Backend iniciado (PID: 12345)
ℹ Aguardando backend ficar pronto...
✓ Backend WebSocket rodando em ws://localhost:3000
ℹ Conectando ao WebSocket e executando testes...
✓ Conectado ao WebSocket
📋 Arquivos de teste encontrados: 2
📝 Total de testes: 28
▶️  Solicitando execução de todos os testes...

[... testes passando ...]

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

[... resto dos testes ...]

════════════════════════════════════════════════════
✓ Testes finalizados (exit code: 1)
════════════════════════════════════════════════════
```

### UI Web (http://localhost:5173)

**Painel Esquerdo (Tests):**
- Lista de arquivos de teste
- Status de cada teste (✓ verde / ✗ vermelho)
- Contadores de pass/fail

**Painel Direito (Output):**
- Linhas normais em branco/verde
- **Bloco de erro em destaque:**
  - Fundo: vermelho claro
  - Borda esquerda: vermelha grossa
  - Ícone: ❌ vermelho
  - Label: "TEST ERROR"
  - Conteúdo: todo o erro agrupado
- **Bloco de resumo em destaque:**
  - Fundo: azul claro
  - Borda esquerda: azul grossa
  - Ícone: ✓ azul
  - Label: "TEST SUMMARY"

---

## ✅ Conclusão

Se todos os itens do checklist estão marcados, a implementação está funcionando corretamente! 

Os blocos de erro agora são:
- 📦 **Agrupados** (não mais linha por linha)
- 🎨 **Estilizados** (fundo e borda colorida)
- 🏷️ **Rotulados** (com ícone e título)
- 👁️ **Legíveis** (contexto completo visível)

**Parabéns! 🎉**
