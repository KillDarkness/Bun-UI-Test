#!/usr/bin/env bun

import { spawn } from "node:child_process";
import { readFile, access } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Função robusta para determinar o diretório raiz do pacote
function getPackageRoot() {
  // 1. Tentar import.meta.dir (Bun específico)
  if (import.meta.dir) {
    return import.meta.dir;
  }

  // 2. Tentar via import.meta.url
  try {
    const __filename = fileURLToPath(import.meta.url);
    return dirname(__filename);
  } catch (e) {}

  // 3. Tentar process.argv[1] (caminho do script)
  try {
    const argvPath = process.argv[1];
    if (argvPath) {
      // Se é um arquivo .ts, usa o diretório dele
      if (argvPath.endsWith('.ts')) {
        return dirname(argvPath);
      }
      
      // Se é um executável, procura node_modules ou cache
      // bunx instala em: ~/.bun/install/cache/bun-ui-tests@version/
      const parts = argvPath.split('/');
      const cacheIndex = parts.findIndex(p => p === 'cache' || p === '.bun' || p === 'node_modules');
      if (cacheIndex !== -1 && cacheIndex + 1 < parts.length) {
        // Pega até o nome do pacote (ex: bun-ui-tests@1.0.5)
        const packagePath = parts.slice(0, cacheIndex + 2).join('/');
        return packagePath;
      }
    }
  } catch (e) {
    console.error('Error resolving from argv[1]:', e);
  }

  // 4. Fallback: usar diretório atual
  return process.cwd();
}

const packageRoot = getPackageRoot();

// Cores ANSI suaves
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m"
};

const COMMANDS = {
  run: "Run the test UI (production mode)",
  dev: "Run in development mode (hot reload)",
  help: "Show this help message"
};

async function findVerifiedRoot(): Promise<string> {
  const possibleRoots = [
    getPackageRoot(),
    process.cwd(),
    dirname(fileURLToPath(import.meta.url)),
  ];

  for (const root of possibleRoots) {
    if (!root) continue;
    const runnerPath = join(root, "ui-runner.ts");
    const distPath = join(root, "app", "dist", "index.html");
    
    if (await Bun.file(runnerPath).exists() && await Bun.file(distPath).exists()) {
      return root;
    }
  }

  // Se não achou, tenta procurar subindo diretórios
  try {
    let current = getPackageRoot();
    for (let i = 0; i < 3; i++) {
      const runnerPath = join(current, "ui-runner.ts");
      if (await Bun.file(runnerPath).exists()) return current;
      current = dirname(current);
    }
  } catch (e) {}

  return getPackageRoot();
}

async function showHelp() {
  console.log(`
${colors.cyan}Bun Test UI${colors.reset} - A beautiful UI for running Bun tests

Usage:
  bunx bun-ui-tests <command>

Commands:
  run       Start the test UI (production mode)
  dev       Start in development mode (hot reload enabled)
  help      Show this help message

Examples:
  bunx bun-ui-tests run      # Run in production mode
  bunx bun-ui-tests dev      # Run in development mode (for testing)
`);
}

async function checkBuildExists(root: string): Promise<boolean> {
  const distPath = join(root, "app", "dist", "index.html");
  
  try {
    return await Bun.file(distPath).exists();
  } catch (err) {
    return false;
  }
}

async function runTestUI() {
  const root = await findVerifiedRoot();
  const buildExists = await checkBuildExists(root);
  
  if (!buildExists) {
    console.log(`\n${colors.yellow}!${colors.reset} Frontend assets not found.\n`);
    console.log("This usually means one of:");
    console.log("  1. The package wasn't built before publishing");
    console.log("  2. You're running from source (run: bun run build first)");
    console.log("  3. Installation issue\n");
    
    process.exit(1);
  }
  
  console.log(`${colors.green}›${colors.reset} Starting Bun Test UI...`);
  console.log(`${colors.gray}→ WebSocket: ws://localhost:5050/ws`);
  console.log(`→ Frontend:  http://localhost:5050${colors.reset}\n`);
  
  const runnerScript = join(root, "ui-runner.ts");
  
  const proc = spawn("bun", ["run", runnerScript], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
    env: { ...process.env, NODE_ENV: "production" }
  });
  
  proc.on("close", (code) => {
    if (code !== 0) {
      console.error(`\n${colors.red}✗${colors.reset} Process exited with code ${code}`);
      process.exit(code || 1);
    }
  });
  
  proc.on("error", (err) => {
    console.error(`${colors.red}✗${colors.reset} Error starting test UI:`, err);
    process.exit(1);
  });
  
  process.on("SIGINT", () => {
    console.log(`\n\n${colors.gray}Stopping Bun Test UI...${colors.reset}`);
    proc.kill("SIGINT");
    process.exit(0);
  });
}

async function runDevMode() {
  const root = await findVerifiedRoot();

  console.log(`${colors.cyan}›${colors.reset} Starting Bun Test UI (Dev Mode)...`);
  console.log(`${colors.gray}→ WebSocket: ws://localhost:5060`);
  console.log(`→ Frontend:  http://localhost:5050${colors.reset}\n`);
  
  const backendPath = join(root, "ui-runner.ts");
  const backendProc = spawn("bun", ["run", backendPath], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: true,
    env: { ...process.env, BUN_TEST_UI_DEV: "true" }
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const appDir = join(root, "app");
  const frontendProc = spawn("bun", ["run", "dev"], {
    cwd: appDir,
    stdio: "inherit",
    shell: true
  });
  
  process.on("SIGINT", () => {
    console.log(`\n\n${colors.gray}Stopping Bun Test UI...${colors.reset}`);
    backendProc.kill("SIGINT");
    frontendProc.kill("SIGINT");
    process.exit(0);
  });
  
  backendProc.on("close", (code) => {
    frontendProc.kill("SIGINT");
    process.exit(code || 1);
  });
  
  frontendProc.on("close", (code) => {
    backendProc.kill("SIGINT");
    process.exit(code || 1);
  });
}

// Main
const command = process.argv[2];

switch (command) {
  case "run":
    runTestUI()
      .catch((err) => {
        console.error(`${colors.red}✗${colors.reset} Failed to start:`, err);
        process.exit(1);
      });
    break;
    
  case "dev":
    runDevMode()
      .catch((err) => {
        console.error(`${colors.red}✗${colors.reset} Failed to start dev mode:`, err);
        process.exit(1);
      });
    break;
    
  case "help":
  case undefined:
    showHelp();
    process.exit(0);
    break;
    
  default:
    console.error(`${colors.red}✗${colors.reset} Unknown command: ${command}\n`);
    showHelp();
    process.exit(1);
}
