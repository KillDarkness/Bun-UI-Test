/**
 * UI Runner for Bun Test
 * 
 * Este runner NÃO usa APIs internas do bun:test (que não existem publicamente).
 * Ele apenas spawna um processo `bun test` e faz parsing do stdout/stderr.
 * 
 * Arquitetura:
 * - Spawna `bun test` como processo filho
 * - Captura stdout/stderr em tempo real
 * - Faz parsing básico da saída (✓, ✗, nomes de testes)
 * - Emite eventos via WebSocket para a UI
 */

import { spawn } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Determina o diretório do executável ou script
const getBaseDir = () => {
  // 1. Tentar import.meta.dir (Bun específico)
  if (import.meta.dir) {
    return import.meta.dir;
  }

  // 2. Tentar via import.meta.url
  try {
    const __filename = fileURLToPath(import.meta.url);
    return dirname(__filename);
  } catch (e) {}
  
  // 3. Try process.argv[1] to find real path
  try {
     const argvPath = process.argv[1];
     if (argvPath) {
       // Se rodando como executável compilado, pega o diretório onde o CLI foi instalado
       if (import.meta.path && !import.meta.path.endsWith('.ts')) {
         return dirname(process.execPath);
       }
       return dirname(argvPath);
     }
  } catch (e) {}

  // Se tudo falhar
  return process.cwd();
};

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m"
};

const baseDir = getBaseDir();
const distPath = join(baseDir, "app", "dist");
const isDevMode = process.env.BUN_TEST_UI_DEV === "true";

// WebSocket Handler (lógica compartilhada)
const websocketHandler = {
  async open(ws: any) {
    console.log(`${colors.green}✓${colors.reset} UI connected`);
    
    // Escaneia arquivos de teste
    const testFiles = await scanTestFiles();
    
    // Escaneia todos os testes de cada arquivo
    const testsMap = await scanAllTests();
    
    // Envia evento de conexão com lista de arquivos e testes
    ws.send(JSON.stringify({
      type: "connected",
      payload: { 
        message: "Runner ready",
        testFiles,
        testsMap // { "test/example.test.ts": ["test1", "test2", ...] }
      }
    }));
    
    console.log(`${colors.gray}› Found ${testFiles.length} test files with ${Object.values(testsMap).flat().length} tests total${colors.reset}`);
  },
  message(ws: any, message: any) {
    try {
      const data = JSON.parse(message.toString());
      
      // Processa comandos da UI
      if (data.type === "run:request") {
        const file = data.payload?.file;
        const testName = data.payload?.testName;
        
        if (testName) {
          console.log(`${colors.cyan}▶${colors.reset} Running test: ${colors.gray}${testName}${colors.reset} in ${file}`);
        } else if (file) {
          console.log(`${colors.cyan}▶${colors.reset} Running file: ${file}`);
        } else {
          console.log(`${colors.cyan}▶${colors.reset} Running all tests`);
        }
        
        runTests(ws, file, testName);
      }
    } catch (err) {
      console.error("Error processing message:", err);
    }
  },
  close(ws: any) {
    console.log(`${colors.red}✗${colors.reset} UI disconnected`);
  },
};

if (isDevMode) {
  // === MODO DESENVOLVIMENTO ===
  Bun.serve({
    port: 5060,
    fetch(req, server) {
      if (server.upgrade(req)) return; 
      return new Response("Bun Test UI Backend (Dev Mode)", { status: 200 });
    },
    websocket: websocketHandler
  });
} else {
  // === MODO PRODUÇÃO ===
  const PORT = 5050;
  
  Bun.serve({
    port: PORT,
    async fetch(req, server) {
      const url = new URL(req.url);
      
      // 1. WebSocket Upgrade (/ws)
      if (url.pathname === "/ws") {
        if (server.upgrade(req)) return;
        return new Response("WebSocket upgrade failed", { status: 400 });
      }
      
      // 2. Arquivos Estáticos (Frontend)
      const file = Bun.file(join(distPath, url.pathname === "/" ? "/index.html" : url.pathname));
      if (await file.exists()) return new Response(file);
      
      // SPA fallback
      if (!url.pathname.includes(".")) {
        const indexFile = Bun.file(join(distPath, "index.html"));
        if (await indexFile.exists()) return new Response(indexFile);
      }
      
      return new Response("Frontend build not found.", { status: 404 });
    },
    websocket: websocketHandler
  });
  
  console.log(`${colors.green}✓${colors.reset} Server running on http://localhost:${PORT}`);
}


/**
 * Escaneia recursivamente todo o projeto e retorna lista de arquivos de teste
 * Suporta os padrões do Bun: .test.ts, .test.js, .test.tsx, .test.jsx, _test.ts, _test.js, etc
 */
async function scanTestFiles(): Promise<string[]> {
  const testFiles: string[] = [];
  const rootDir = process.cwd();
  
  // Pastas a ignorar durante a busca recursiva
  const ignoreDirs = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '.svelte-kit',
    'coverage',
    '.turbo',
    '.cache',
    'out',
    '.vercel',
    '.netlify'
  ]);
  
  // Padrões de arquivos de teste suportados pelo Bun
  const testPatterns = [
    /\.test\.(ts|tsx|js|jsx)$/,     // file.test.ts, file.test.js, etc
    /\.spec\.(ts|tsx|js|jsx)$/,     // file.spec.ts, file.spec.js, etc
    /_test\.(ts|tsx|js|jsx)$/,      // file_test.ts, file_test.js, etc
    /_spec\.(ts|tsx|js|jsx)$/,      // file_spec.ts, file_spec.js, etc
  ];
  
  async function scanDirectory(dir: string): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Ignora diretórios na lista de ignorados
          if (!ignoreDirs.has(entry.name)) {
            await scanDirectory(fullPath);
          }
        } else if (entry.isFile()) {
          // Verifica se o arquivo corresponde a algum padrão de teste
          if (testPatterns.some(pattern => pattern.test(entry.name))) {
            // Retorna path relativo ao diretório raiz
            const relativePath = relative(rootDir, fullPath);
            testFiles.push(relativePath);
          }
        }
      }
    } catch (err) {
      // Ignora erros de leitura de diretórios (permissões, etc)
      console.error(`Error scanning directory ${dir}:`, err);
    }
  }
  
  await scanDirectory(rootDir);
  
  // Ordena os arquivos alfabeticamente
  testFiles.sort();
  
  return testFiles;
}

/**
 * Extrai os nomes dos testes de um arquivo sem executá-lo
 * Faz parsing do código para encontrar test(), it() e describe()
 */
async function extractTestsFromFile(filePath: string): Promise<string[]> {
  try {
    const fullPath = join(process.cwd(), filePath);
    const content = await readFile(fullPath, "utf-8");
    const tests: string[] = [];
    
    // Regex para capturar test("nome"), it("nome"), describe("nome")
    // Suporta aspas simples e duplas
    const testRegex = /(?:test|it|describe)\s*\(\s*[`"'](.+?)[`"']/g;
    
    let match;
    while ((match = testRegex.exec(content)) !== null) {
      tests.push(match[1]);
    }
    
    return tests;
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return [];
  }
}

/**
 * Escaneia todos os arquivos e retorna um mapa de arquivo -> testes
 */
async function scanAllTests(): Promise<Record<string, string[]>> {
  const testFiles = await scanTestFiles();
  const testsMap: Record<string, string[]> = {};
  
  for (const file of testFiles) {
    const tests = await extractTestsFromFile(file);
    testsMap[file] = tests;
  }
  
  return testsMap;
}

/**
 * Executa bun test e faz parsing da saída
 * @param ws WebSocket connection
 * @param file Arquivo específico para testar (opcional)
 * @param testName Nome do teste específico (opcional, requer file)
 */
function runTests(ws: any, file?: string, testName?: string) {
  const args = ["test"];
  
  if (file) {
    args.push(file);
  }
  
  if (testName) {
    const escapedName = testName.replace(/[.*+?^${}()|[\\]/g, '\\$&');
    args.push("--test-name-pattern", escapedName);
  }
  
  // Emite evento de início
  ws.send(JSON.stringify({
    type: "run:start",
    payload: { 
      timestamp: Date.now(),
      file: file || null,
      testName: testName || null
    }
  }));
  
  const bunTest = spawn("bun", args, {
    cwd: process.cwd(),
    env: { ...process.env, FORCE_COLOR: "0" },
  });
  
  let currentTestFile = "";
  let buffer = "";
  let errorBlock: string[] = [];  // Acumula linhas de erro
  let summaryBlock: string[] = []; // Acumula linhas de resumo
  let inErrorBlock = false;
  let inSummaryBlock = false;
  
  // Função para verificar se é linha de bloco de erro
  const isErrorLine = (line: string): boolean => {
    const trimmed = line.trim();
    // Linha que é só espaços seguidos de ^ (indicador de erro)
    const hasErrorPointer = /^\s*\^/.test(line);
    
    return (
      /^\d+\s*\|/.test(trimmed) ||       // Linha de código: "72 |"
      trimmed.startsWith('error:') ||     // "error: expect..."
      trimmed.startsWith('Expected:') ||  // "Expected: 3"
      trimmed.startsWith('Received:') ||  // "Received: 2"
      trimmed.includes('at <anonymous>') || // Stack trace
      hasErrorPointer ||                  // Seta de erro "      ^"
      /^\s+at\s/.test(line) ||            // "    at ..." stack trace
      trimmed.startsWith('(fail)')        // Linha de fail - FAZ PARTE DO BLOCO!
    );
  };
  
  // Função para verificar se é linha de resumo
  const isSummaryLine = (line: string): boolean => {
    const trimmed = line.trim();
    return (
      /^\d+\s+pass$/.test(trimmed) ||               // "19 pass"
      /^\d+\s+fail$/.test(trimmed) ||               // "1 fail"
      /^\d+\s+expect\(\)\s+calls/.test(trimmed) ||  // "33 expect() calls"
      /^Ran\s+\d+/.test(trimmed)                    // "Ran 20 tests..."
    );
  };
  
  // Função para enviar bloco de erro
  const flushErrorBlock = () => {
    if (errorBlock.length > 0) {
      ws.send(JSON.stringify({
        type: "log",
        payload: { message: errorBlock.join('\n'), stream: "stdout" }
      }));
      errorBlock = [];
      inErrorBlock = false;
    }
  };
  
  // Função para enviar bloco de resumo
  const flushSummaryBlock = () => {
    if (summaryBlock.length > 0) {
      ws.send(JSON.stringify({
        type: "log",
        payload: { message: summaryBlock.join('\n'), stream: "stdout" }
      }));
      summaryBlock = [];
      inSummaryBlock = false;
    }
  };
  
  // Processa stdout linha por linha
  bunTest.stdout.on("data", (data) => {
    const text = data.toString();
    buffer += text;
    
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    
    for (const line of lines) {
      currentTestFile = processLine(line, ws, currentTestFile);
      const trimmed = line.trim();
      
      if (isErrorLine(line)) {
        flushSummaryBlock();
        inErrorBlock = true;
        errorBlock.push(line);
        continue;
      }
      
      if (inErrorBlock && !trimmed) {
        errorBlock.push(line);
        continue;
      }
      
      if (isSummaryLine(line)) {
        flushErrorBlock();
        inSummaryBlock = true;
        summaryBlock.push(line);
        continue;
      }
      
      flushErrorBlock();
      flushSummaryBlock();
      
      if (trimmed) {
        ws.send(JSON.stringify({
          type: "log",
          payload: { message: line, stream: "stdout" }
        }));
      }
    }
  });
  
  bunTest.stderr.on("data", (data) => {
    const text = data.toString();
    
    // Envia stderr linha por linha também
    const lines = text.split("\n").filter(line => line.trim());
    for (const line of lines) {
      ws.send(JSON.stringify({
        type: "log",
        payload: { message: line, stream: "stderr" }
      }));
    }
  });
  
  bunTest.on("close", (code) => {
    // Processa buffer pendente antes de finalizar
    if (buffer.trim()) {
      const lines = buffer.split("\n");
      for (const line of lines) {
        if (line.trim()) {
          currentTestFile = processLine(line, ws, currentTestFile);
          
          const trimmed = line.trim();
          
          if (isErrorLine(line)) {
            inErrorBlock = true;
            errorBlock.push(line);
          } else if (inErrorBlock && !trimmed) {
            errorBlock.push(line);
          } else if (isSummaryLine(line)) {
            flushErrorBlock();
            inSummaryBlock = true;
            summaryBlock.push(line);
          } else {
            flushErrorBlock();
            flushSummaryBlock();
            ws.send(JSON.stringify({
              type: "log",
              payload: { message: line, stream: "stdout" }
            }));
          }
        }
      }
    }
    
    // Envia blocos pendentes antes de finalizar
    flushErrorBlock();
    flushSummaryBlock();
    
    ws.send(JSON.stringify({
      type: "run:complete",
      payload: { 
        exitCode: code,
        timestamp: Date.now()
      }
    }));
  });
  
  bunTest.on("error", (error) => {
    console.error("Error running bun test:", error);
    
    ws.send(JSON.stringify({
      type: "error",
      payload: { message: error.message }
    }));
  });
}

/**
 * Faz parsing de uma linha de saída do bun test
 * 
 * Formatos esperados (baseado na saída real do bun test):
 * - ✓ test name [0.00ms]
 * - ✗ test name [0.00ms]
 * - test/file.test.ts:
 * 
 * @returns O currentTestFile atualizado
 */
function processLine(line: string, ws: any, currentTestFile: string): string {
  const trimmed = line.trim();
  
  if (!trimmed) return currentTestFile;
  
  // Detecta arquivo de teste (com suporte a todos os padrões)
  if (trimmed.match(/\.(test|spec)\.(ts|js|tsx|jsx):/) || trimmed.match(/_(test|spec)\.(ts|js|tsx|jsx):/)) {
    const filePath = trimmed.replace(":", "");
    
    // Envia quebra de linha antes do nome do arquivo para separar visualmente
    ws.send(JSON.stringify({
      type: "log",
      payload: { message: "", stream: "stdout" }
    }));
    
    ws.send(JSON.stringify({
      type: "file:start",
      payload: { filePath }
    }));
    return filePath; // Atualiza o arquivo atual
  }
  
  // Detecta teste que passou - formato: (pass) test name [0.00ms]
  const passMatch = trimmed.match(/^\(pass\)\s+(.+?)\s+\[(.+?)\]/);
  if (passMatch) {
    const [, testName, duration] = passMatch;
    
    ws.send(JSON.stringify({
      type: "test:pass",
      payload: {
        testName: testName.trim(),
        duration: duration.trim(),
        timestamp: Date.now(),
        filePath: currentTestFile
      }
    }));
    return currentTestFile;
  }
  
  // Detecta teste que falhou - formato: (fail) test name [0.00ms]
  const failMatch = trimmed.match(/^\(fail\)\s+(.+?)(?:\s+\[(.+?)\])?/);
  if (failMatch) {
    const [, testName, duration] = failMatch;
    
    ws.send(JSON.stringify({
      type: "test:fail",
      payload: {
        testName: testName.trim(),
        duration: duration?.trim() || "N/A",
        timestamp: Date.now(),
        filePath: currentTestFile
      }
    }));
    return currentTestFile;
  }
  
  // Detecta início de teste (quando aparece sem ✓ ou ✗)
  // Isso pode variar dependendo da versão do Bun
  if (trimmed.match(/^(test|it|describe)\s/)) {
    ws.send(JSON.stringify({
      type: "test:start",
      payload: {
        testName: trimmed,
        timestamp: Date.now(),
        filePath: currentTestFile
      }
    }));
  }
  
  return currentTestFile;
}