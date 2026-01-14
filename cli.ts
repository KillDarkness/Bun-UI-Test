#!/usr/bin/env bun

import { spawn } from "node:child_process";
import { readFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COMMANDS = {
  build: "Build the frontend and backend",
  run: "Run the test UI (production mode - uses built files)",
  dev: "Run in development mode (hot reload)",
  help: "Show this help message"
};

async function showHelp() {
  console.log(`
🧪 Bun Test UI - A beautiful UI for running Bun tests

Usage:
  buntestui <command>

Commands:
  build     Build the frontend and backend for production
  run       Start the test UI (production mode - uses built files)
  dev       Start in development mode (hot reload enabled)
  help      Show this help message

Examples:
  buntestui build    # Build frontend + backend
  buntestui run      # Run in production mode
  buntestui dev      # Run in development mode (for testing)
`);
}

async function buildFrontend() {
  console.log("🏗️  Building frontend...\n");
  
  const appDir = join(__dirname, "app");
  
  return new Promise<void>((resolve, reject) => {
    const proc = spawn("bun", ["run", "build"], {
      cwd: appDir,
      stdio: "inherit",
      shell: true
    });
    
    proc.on("close", (code) => {
      if (code === 0) {
        console.log("\n✅ Frontend built successfully!");
        resolve();
      } else {
        reject(new Error(`Frontend build failed with code ${code}`));
      }
    });
    
    proc.on("error", (err) => {
      reject(err);
    });
  });
}

async function buildBackend() {
  console.log("🔧 Building backend...\n");
  
  return new Promise<void>((resolve, reject) => {
    const proc = spawn("bun", ["build", "--compile", "--outfile", "buntestui-runner", "./ui-runner.ts"], {
      cwd: __dirname,
      stdio: "inherit",
      shell: true
    });
    
    proc.on("close", (code) => {
      if (code === 0) {
        console.log("\n✅ Backend built successfully!");
        resolve();
      } else {
        reject(new Error(`Backend build failed with code ${code}`));
      }
    });
    
    proc.on("error", (err) => {
      reject(err);
    });
  });
}

async function checkBuildExists(): Promise<boolean> {
  try {
    const distPath = join(__dirname, "app", "dist", "index.html");
    await access(distPath);
    return true;
  } catch {
    return false;
  }
}

async function runTestUI() {
  // Verifica se o build existe
  const buildExists = await checkBuildExists();
  
  if (!buildExists) {
    console.log("⚠️  Frontend not built yet. Building now...\n");
    await buildFrontend();
    console.log("");
  }
  
  // Verifica se o executável do backend existe
  const runnerExecutable = join(__dirname, "buntestui-runner");
  try {
    await access(runnerExecutable);
  } catch {
    console.log("⚠️  Backend not built yet. Building now...\n");
    await buildBackend();
    console.log("");
  }
  
  console.log("🚀 Starting Bun Test UI (Production Mode)...\n");
  console.log("📡 WebSocket server: ws://localhost:5050/ws");
  console.log("🌐 Frontend: http://localhost:5050\n");
  console.log("Press Ctrl+C to stop\n");
  
  // Roda o executável compilado
  const proc = spawn(runnerExecutable, [], {
    cwd: process.cwd(), // Roda no diretório atual do usuário
    stdio: "inherit",
    shell: false
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
  console.log("🚀 Starting Bun Test UI (Development Mode)...\n");
  console.log("📡 WebSocket server: ws://localhost:5060");
  console.log("🌐 Frontend: http://localhost:5050 (with hot reload)\n");
  console.log("Press Ctrl+C to stop\n");
  
  // Inicia o backend (ui-runner.ts) com bun run e flag de dev mode
  const backendPath = join(__dirname, "ui-runner.ts");
  const backendProc = spawn("bun", ["run", backendPath], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: true,
    env: { ...process.env, BUN_TEST_UI_DEV: "true" }
  });
  
  // Aguarda um pouco para o backend iniciar
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Inicia o frontend em modo dev
  const appDir = join(__dirname, "app");
  const frontendProc = spawn("bun", ["run", "dev"], {
    cwd: appDir,
    stdio: "inherit",
    shell: true
  });
  
  // Handle Ctrl+C
  process.on("SIGINT", () => {
    console.log("\n\n👋 Stopping Bun Test UI...");
    backendProc.kill("SIGINT");
    frontendProc.kill("SIGINT");
    process.exit(0);
  });
  
  // Se um processo terminar, termina o outro também
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
  case "build":
    Promise.all([buildFrontend(), buildBackend()])
      .then(() => {
        console.log("\n🎉 Build complete!");
        process.exit(0);
      })
      .catch((err) => {
        console.error("❌ Build failed:", err);
        process.exit(1);
      });
    break;
    
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
