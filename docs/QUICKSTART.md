# 🚀 Quick Start Guide

## Pré-requisitos

- [Bun](https://bun.sh) instalado (`curl -fsSL https://bun.sh/install | bash`)

## Como Executar

### Opção 1: Dois Terminais (Recomendado)

#### Terminal 1: Iniciar o Runner
```bash
bun run ui-runner.ts
```

Você verá:
```
🚀 WebSocket server running on ws://localhost:3000
```

#### Terminal 2: Iniciar a UI
```bash
cd app
bun install  # Primeira vez apenas
bun run dev
```

Você verá:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Opção 2: Script Único (Em Desenvolvimento)

Você pode adicionar um script para rodar ambos:

```bash
# Em breve: bun run start
```

## 📊 Visualizando os Testes

1. Abra seu navegador em `http://localhost:5173`
2. A UI conectará automaticamente ao runner (você verá "● Connected")
3. Clique no botão **"▶ Run Tests"** para executar os testes
4. Você verá:
   - Status de conexão (● Connected)
   - Sumário de testes (Total, Pass, Fail, Running)
   - Lista de testes com status em tempo real
   - Logs detalhados do bun test

## 🎨 Interface

A UI mostra:

- **Header**: 
  - Botão "▶ Run All Tests" para executar todos os testes
  - Status da conexão (● Connected / ○ Disconnected)
- **Summary** (aparece após executar): Estatísticas dos testes (Total, Pass, Fail)
- **Tests Panel**: Estrutura em árvore com arquivos e testes
  - **📄 Arquivo de teste** (clique para expandir/colapsar)
  - Botão **▶ play** ao lado de cada arquivo para executar apenas aquele arquivo
  - Contadores por arquivo (X passed, Y failed)
  - Lista de testes dentro de cada arquivo:
    - ✓ = Passou (verde)
    - ✗ = Falhou (vermelho)
    - ⏳ = Executando (amarelo, com animação)
- **Output Panel**: Saída do `bun test` em tempo real
  - stdout: texto cinza
  - stderr: texto vermelho com destaque

## 📁 Estrutura do Projeto

```
.
├── ui-runner.ts           # Runner WebSocket (porta 3000)
├── README.md              # Documentação completa
├── QUICKSTART.md          # Este arquivo
├── test/                  # Seus testes
│   ├── example.test.ts    # Testes de exemplo
│   └── utils.test.ts      # Mais testes
└── app/                   # UI React + Vite
    ├── src/
    │   ├── App.tsx        # Componente principal
    │   └── App.css        # Estilos
    └── package.json
```

## 🧪 Adicionando Seus Próprios Testes

Crie arquivos `.test.ts` na pasta `test/`:

```typescript
// test/my-feature.test.ts
import { test, expect } from "bun:test";

test("my test", () => {
  expect(true).toBe(true);
});
```

Quando você executar `bun run ui-runner.ts`, seus testes aparecerão automaticamente na UI!

## ⚠️ Troubleshooting

### Runner não conecta
- Verifique se a porta 3000 está livre
- Certifique-se de que o Bun está instalado

### UI não conecta ao WebSocket
- Verifique se o runner está rodando primeiro
- Abra o console do navegador para ver erros
- Verifique se não há bloqueio de CORS

### Testes não aparecem
- Certifique-se de que seus testes estão na pasta `test/`
- Verifique que os arquivos terminam com `.test.ts` ou `.test.js`
- Veja os logs no painel de Logs da UI

## 🔄 Próximos Passos

Funcionalidades planejadas:
- [ ] Watch mode (re-executar em mudanças)
- [ ] Botão para re-executar testes
- [ ] Filtros (por arquivo, por status)
- [ ] Detalhes de stack trace para falhas
- [ ] Coverage integration

## 💡 Dicas

- **Para executar os testes**: Clique no botão "▶ Run Tests" na UI
- **Para re-executar**: Clique novamente no botão (ele limpa os resultados anteriores)
- **Conexão perdida?**: A UI tenta reconectar automaticamente
- **Testes não aparecem?**: Verifique se estão na pasta `test/` com extensão `.test.ts`
- Use `test/example.test.ts` como referência para seus testes
