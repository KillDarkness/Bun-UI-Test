# 📦 Instalação do Bun Test UI

## Instalação Global

Para instalar o `buntestui` como um comando global:

```bash
# Clone ou navegue até o diretório do projeto
cd /path/to/buntestui

# Instale globalmente usando Bun
bun link

# Ou usando npm
npm link
```

Agora você pode usar `buntestui` de qualquer diretório!

## Comandos Disponíveis

### 1️⃣ Build do Frontend
```bash
buntestui build
```
Builda o frontend React/Vite para produção. Os arquivos são gerados em `app/dist/`.

### 2️⃣ Rodar o Test UI

#### Modo Produção (recomendado)
```bash
buntestui run
```
Inicia o servidor WebSocket e serve o frontend buildado. Se o build não existir, ele será criado automaticamente.

O comando:
- 🔍 Escaneia recursivamente todos os arquivos de teste no projeto
- 📡 Inicia WebSocket server em `ws://localhost:5060`
- 🌐 Serve o frontend em `http://localhost:5050`
- 🧪 Detecta arquivos: `.test.ts`, `.spec.js`, `_test.tsx`, etc.
- 🚀 Usa o executável compilado para máxima performance

#### Modo Desenvolvimento
```bash
buntestui dev
```
Roda em modo desenvolvimento com hot reload do frontend.

- 🔥 Hot reload do frontend (Vite dev server)
- 📡 Backend com reload automático
- 🌐 Frontend em `http://localhost:5050`

### 3️⃣ Ajuda
```bash
buntestui help
```
Mostra a mensagem de ajuda com todos os comandos disponíveis.

## Exemplo de Uso

```bash
# Em qualquer projeto com testes Bun
cd ~/meu-projeto

# Builda o frontend (primeira vez)
buntestui build

# Roda o Test UI
buntestui run
```

Abra seu navegador em `http://localhost:3000` e veja seus testes rodando! 🎉

## Padrões de Arquivos de Teste Suportados

O Bun Test UI detecta automaticamente estes padrões:
- `*.test.ts`, `*.test.js`, `*.test.tsx`, `*.test.jsx`
- `*.spec.ts`, `*.spec.js`, `*.spec.tsx`, `*.spec.jsx`
- `*_test.ts`, `*_test.js`, `*_test.tsx`, `*_test.jsx`
- `*_spec.ts`, `*_spec.js`, `*_spec.tsx`, `*_spec.jsx`

## Desinstalação

```bash
# Se instalou com bun link
bun unlink

# Se instalou com npm link
npm unlink -g buntestui
```

## Troubleshooting

### Comando não encontrado
Se após `bun link` o comando não funcionar, certifique-se que o diretório de binários globais do Bun está no seu PATH:

```bash
# Adicione ao seu .bashrc, .zshrc, etc
export PATH="$HOME/.bun/bin:$PATH"
```

### Porta em uso
Se as portas 3000 ou 3001 estiverem em uso, você precisará encerrar os processos ou modificar as portas no código.
