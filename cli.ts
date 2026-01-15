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

let packageRoot = getPackageRoot();

const COMMANDS = {
  run: "Run the test UI (production mode)",
  dev: "Run in development mode (hot reload)",
  help: "Show this help message"
};

async function findVerifiedRoot(): Promise<string> {
  const possibleRoots = [
    packageRoot,
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

  // Se não achou, tenta procurar subindo diretórios (útil se estiver em node_modules/.bin)
  try {
    let current = packageRoot;
    for (let i = 0; i < 3; i++) {
      const runnerPath = join(current, "ui-runner.ts");
      if (await Bun.file(runnerPath).exists()) return current;
      current = dirname(current);
    }
  } catch (e) {}

  return packageRoot;
}

async function showHelp() {
  console.log(`
🧪 Bun Test UI - A beautiful UI for running Bun tests

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
  
  console.log(`🔍 Debug Info:`);
  console.log(`   - process.argv[1]: ${process.argv[1]}`);
  console.log(`   - Resolved packageRoot: ${root}`);
  console.log(`   - Looking for: ${distPath}`);
  
  try {
    const exists = await Bun.file(distPath).exists();
    if (!exists) {
      console.log(`   - File exists: NO ❌`);
    } else {
      console.log(`   - File exists: YES ✓`);
    }
    return exists;
  } catch (err) {
    console.error(`❌ Error checking path:`, err);
    return false;
  }
}

async function runTestUI() {
  // Encontra o root real onde estão os arquivos
  packageRoot = await findVerifiedRoot();

  // Verifica se o build do frontend existe
  const buildExists = await checkBuildExists(packageRoot);
  
  if (!buildExists) {
    console.log("\n⚠️  Frontend assets not found.\n");
    console.log("This usually means one of:");
    console.log("  1. The package wasn't built before publishing (contact maintainer)");
    console.log("  2. You're running from source (run: bun run build first)");
    console.log("  3. Installation issue (try: npm cache clean --force)\n");
    
    console.log("💡 Temporary workaround:");
    console.log("   git clone https://github.com/KillDarkness/Bun-UI-Test.git");
    console.log("   cd Bun-UI-Test");
    console.log("   bun install");
    console.log("   cd app && bun install && bun run build && cd ..");
    console.log("   bun run ui-runner.ts\n");
    
    process.exit(1);
  }
  
  console.log("🚀 Starting Bun Test UI (Production Mode)...\n");
  console.log("📡 WebSocket server: ws://localhost:5050/ws");
  console.log("🌐 Frontend: http://localhost:5050\n");
  console.log("Press Ctrl+C to stop\n");
  
  // Roda o script do backend diretamente com Bun
  const runnerScript = join(packageRoot, "ui-runner.ts");
  
  const proc = spawn("bun", ["run", runnerScript], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
    env: { ...process.env, NODE_ENV: "production" }
  });
  
  proc.on("close", (code) => {
    if (code !== 0) {
      console.error(`\n❌ Process exited with code ${code}`);
      process.exit(code || 1);
    }
  });
  
  proc.on("error", (err) => {
    console.error("❌ Error starting test UI:", err);
    process.exit(1);
  });
  
  // Handle Ctrl+C
  process.on("SIGINT", () => {
    console.log("\n\n👋 Stopping Bun Test UI...");
    proc.kill("SIGINT");
    process.exit(0);
  });
}

async function runDevMode() {
  // Encontra o root real onde estão os arquivos
  packageRoot = await findVerifiedRoot();

  console.log("🚀 Starting Bun Test UI (Development Mode)...\n");
  console.log("📡 WebSocket server: ws://localhost:5060");
  console.log("🌐 Frontend: http://localhost:5050 (with hot reload)\n");
  console.log("Press Ctrl+C to stop\n");
  
  const backendPath = join(packageRoot, "ui-runner.ts");
  const backendProc = spawn("bun", ["run", backendPath], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: true,
    env: { ...process.env, BUN_TEST_UI_DEV: "true" }
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const appDir = join(packageRoot, "app");
  const frontendProc = spawn("bun", ["run", "dev"], {
    cwd: appDir,
    stdio: "inherit",
    shell: true
  });
  
  process.on("SIGINT", () => {
    console.log("\n\n👋 Stopping Bun Test UI...");
    backendProc.kill("SIGINT");
    frontendProc.kill("SIGINT");
    process.exit(0);
  });
  
  backendProc.on("close", (code) => {
    console.log("\n❌ Backend stopped");
    frontendProc.kill("SIGINT");
    process.exit(code || 1);
  });
  
  frontendProc.on("close", (code) => {
    console.log("\n❌ Frontend stopped");
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
        console.error("❌ Failed to start:", err);
        process.exit(1);
      });
    break;
    
  case "dev":
    runDevMode()
      .catch((err) => {
        console.error("❌ Failed to start dev mode:", err);
        process.exit(1);
      });
    break;
    
  case "help":
  case undefined:
    showHelp();
    process.exit(0);
    break;
    
  default:
    console.error(`❌ Unknown command: ${command}\n`);
    showHelp();
    process.exit(1);
}
