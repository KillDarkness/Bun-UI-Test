# 🧪 Bun Test UI

Uma interface visual moderna e bonita para rodar e visualizar seus testes Bun em tempo real.

![Tests](https://img.shields.io/badge/tests-passing-blue)
![Bun](https://img.shields.io/badge/bun-1.0+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- 🎨 **Interface Moderna** - Design limpo com tema dark
- ⚡ **Tempo Real** - Veja os testes rodando ao vivo via WebSocket
- 🔍 **Busca Recursiva** - Encontra automaticamente todos os arquivos de teste no projeto
- 📂 **Organização por Arquivo** - Testes agrupados por arquivo com expansão/colapso
- ▶️ **Execução Seletiva** - Rode todos os testes, um arquivo específico, ou um teste individual
- 📊 **Estatísticas** - Contador de testes passados, falhos e em execução
- 🎯 **Suporte Completo** - Detecta `.test.ts`, `.spec.js`, `_test.tsx` e mais
- 🚀 **Performance** - Backend compilado para máxima velocidade

## 🚀 Instalação Rápida

```bash
# Clone o repositório
git clone <repo-url>
cd buntestui

# Instale globalmente
bun link

# Builde o projeto
buntestui build
```

## 📖 Uso

### Em qualquer projeto com testes Bun:

```bash
cd ~/meu-projeto
buntestui run
```

Abra seu navegador em **http://localhost:3000** e veja a mágica acontecer! ✨

## 🎮 Comandos

| Comando | Descrição |
|---------|-----------|
| `buntestui build` | Builda o frontend (Vite) e backend (executável) |
| `buntestui run` | Inicia o Test UI em modo produção (usa arquivos buildados) |
| `buntestui dev` | Inicia em modo desenvolvimento (hot reload) |
| `buntestui help` | Mostra ajuda |

## 📋 Padrões de Teste Suportados

O Bun Test UI detecta automaticamente:

- `*.test.ts` / `*.test.js` / `*.test.tsx` / `*.test.jsx`
- `*.spec.ts` / `*.spec.js` / `*.spec.tsx` / `*.spec.jsx`
- `*_test.ts` / `*_test.js` / `*_test.tsx` / `*_test.jsx`
- `*_spec.ts` / `*_spec.js` / `*_spec.tsx` / `*_spec.jsx`

## 🏗️ Arquitetura

```
┌─────────────┐         WebSocket         ┌─────────────┐
│             │      (port 5060)          │             │
│  Frontend   │◄─────────────────────────►│  Backend    │
│  (React)    │                           │  (Bun)      │
│  port 5050  │                           │             │
└─────────────┘                           └─────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │  bun test    │
                                          │  (spawned)   │
                                          └──────────────┘
```

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Bun native WebSocket + process spawning
- **Comunicação**: WebSocket em tempo real
- **Compilado**: Executável standalone (~93MB)

## 🎨 Interface

A interface possui:

- **Painel de Testes**: Lista de arquivos e testes com status visual
- **Painel de Output**: Logs em tempo real com syntax highlighting
- **Header**: Estatísticas e controles de execução
- **Design Responsivo**: Funciona em mobile e desktop

### Cores:

- 🔵 **Azul**: Testes passando, status conectado
- 🟢 **Verde**: Logs de sucesso `(pass)`
- 🔴 **Vermelho**: Testes falhando, erros
- 🟡 **Amarelo**: Testes em execução

## 📚 Documentação Completa

Veja [INSTALL.md](./INSTALL.md) para instruções detalhadas de instalação e uso.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se livre para abrir issues e pull requests.

## 📄 Licença

MIT

## 🙏 Agradecimentos

Feito com ❤️ para a comunidade Bun
