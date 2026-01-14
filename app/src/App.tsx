import { useState, useEffect, useRef } from 'react'

interface TestResult {
  id: string
  name: string
  status: 'running' | 'pass' | 'fail' | 'pending'
  duration?: string
  timestamp: number
  filePath?: string
  justPassed?: boolean  // Flag para animação azul temporária
}

interface LogEntry {
  message: string
  stream: 'stdout' | 'stderr'
  timestamp: number
  isErrorBlock?: boolean   // Marca blocos de erro agrupados
}

interface TestFile {
  path: string
  name: string
  expanded: boolean
  tests?: string[]  // Lista de nomes dos testes (vem do backend)
}

type ViewMode = 'split' | 'tests' | 'logs'

// SVG Icons
const PlayIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ChevronRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const ChevronDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const CheckCircleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const XCircleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ClockIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const FileIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const TestTubeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
)

const ExpandAllIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
)

const CollapseAllIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
  </svg>
)

const TestIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

function App() {
  const [connected, setConnected] = useState(false)
  const [tests, setTests] = useState<TestResult[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'complete'>('idle')
  const [currentFile, setCurrentFile] = useState<string>('')
  const [testFiles, setTestFiles] = useState<TestFile[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const wsRef = useRef<WebSocket | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Conecta ao WebSocket do runner
    // Em dev mode, usa o proxy do Vite; em produção, conecta diretamente
    const wsUrl = import.meta.env.DEV 
      ? 'ws://localhost:5050/ws'  // Proxy via Vite dev server
      : 'ws://localhost:5060'      // Direto ao backend em produção
    
    console.log('Connecting to WebSocket:', wsUrl)
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('Connected to runner')
      setConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        handleMessage(message)
      } catch (err) {
        console.error('Failed to parse message:', err)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('Disconnected from runner')
      setConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [])

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleMessage = (message: any) => {
    const { type, payload } = message

    switch (type) {
      case 'connected':
        console.log('Runner ready:', payload.message)
        // Recebe lista de arquivos de teste e seus testes
        if (payload.testFiles && Array.isArray(payload.testFiles)) {
          const testsMap = payload.testsMap || {}
          
          setTestFiles(payload.testFiles.map((path: string) => ({
            path,
            name: path.split('/').pop() || path,
            expanded: false,
            tests: testsMap[path] || []  // Lista de testes do arquivo
          })))
          
          console.log('📂 Received test files with tests:', testsMap)
        }
        break

      case 'run:start':
        setRunStatus('running')
        // Limpa apenas testes do arquivo específico se estiver rodando um arquivo
        if (payload.file) {
          setTests(prev => prev.filter(t => t.filePath !== payload.file))
          // Expande automaticamente o arquivo que está sendo executado
          setTestFiles(prev => prev.map(f => 
            f.path === payload.file ? { ...f, expanded: true } : f
          ))
        } else {
          // Se está rodando todos, limpa tudo e expande todos os arquivos
          setTests([])
          setTestFiles(prev => prev.map(f => ({ ...f, expanded: true })))
        }
        setLogs([])
        setCurrentFile('')
        break

      case 'run:complete':
        setRunStatus('complete')
        break

      case 'file:start':
        setCurrentFile(payload.filePath)
        break

      case 'test:start':
        setTests(prev => [
          ...prev,
          {
            id: `${Date.now()}-${payload.testName}`,
            name: payload.testName,
            status: 'running',
            timestamp: payload.timestamp,
            filePath: payload.filePath || currentFile
          }
        ])
        break

      case 'test:pass':
        console.log('test:pass received:', payload.testName, 'filePath:', payload.filePath, 'currentFile:', currentFile)
        setTests(prev => {
          const existing = prev.find(t => t.name === payload.testName && t.status === 'running')
          if (existing) {
            const updatedTests = prev.map(t =>
              t.id === existing.id
                ? { ...t, status: 'pass' as const, duration: payload.duration, justPassed: true }
                : t
            )
            
            // Remove flag justPassed após 3 segundos
            setTimeout(() => {
              setTests(current => current.map(t => 
                t.id === existing.id ? { ...t, justPassed: false } : t
              ))
            }, 3000)
            
            return updatedTests
          }
          // Se não encontrou running, adiciona novo
          const newTest = {
            id: `${Date.now()}-${payload.testName}`,
            name: payload.testName,
            status: 'pass' as const,
            duration: payload.duration,
            timestamp: payload.timestamp,
            filePath: payload.filePath || currentFile,
            justPassed: true
          }
          console.log('Adding new test:', newTest)
          
          // Remove flag justPassed após 3 segundos
          setTimeout(() => {
            setTests(current => current.map(t => 
              t.id === newTest.id ? { ...t, justPassed: false } : t
            ))
          }, 3000)
          
          return [...prev, newTest]
        })
        break

      case 'test:fail':
        console.log('🔴 test:fail received:', payload.testName, 'filePath:', payload.filePath, 'currentFile:', currentFile)
        setTests(prev => {
          const existing = prev.find(t => t.name === payload.testName && t.status === 'running')
          if (existing) {
            console.log('🔴 Updating existing test to FAIL:', existing.id)
            return prev.map(t =>
              t.id === existing.id
                ? { ...t, status: 'fail' as const, duration: payload.duration, justPassed: false }
                : t
            )
          }
          // Se não encontrou running, adiciona novo
          const newTest = {
            id: `${Date.now()}-${payload.testName}`,
            name: payload.testName,
            status: 'fail' as const,
            duration: payload.duration,
            timestamp: payload.timestamp,
            filePath: payload.filePath || currentFile,
            justPassed: false  // NUNCA fica azul
          }
          console.log('🔴 Adding new FAILED test:', newTest)
          return [...prev, newTest]
        })
        break

      case 'log':
        // Detecta se é um bloco de erro pelo conteúdo
        const msg = payload.message
        
        // Um bloco de erro contém múltiplas linhas com contexto do erro + (fail) no final
        const lines = msg.split('\n')
        const hasErrorKeyword = msg.includes('error:')
        const hasExpectedReceived = msg.includes('Expected:') && msg.includes('Received:')
        const hasCodeLines = lines.some((line: string) => /^\d+\s*\|/.test(line.trim()))
        const hasStackTrace = msg.includes('at <anonymous>') || msg.includes('at ')
        const hasErrorPointer = lines.some((line: string) => /^\s*\^/.test(line))
        const hasFailLine = msg.includes('(fail)')
        
        // É um bloco de erro se tem erro + contexto + (fail)
        const isErrorBlock = hasFailLine && (hasErrorKeyword || hasExpectedReceived) && 
                            (hasCodeLines || hasStackTrace || hasErrorPointer)
        
        setLogs(prev => [
          ...prev,
          {
            message: payload.message,
            stream: payload.stream,
            timestamp: Date.now(),
            isErrorBlock
          }
        ])
        break

      case 'error':
        console.error('Runner error:', payload.message)
        break
    }
  }

  const passCount = tests.filter(t => t.status === 'pass').length
  const failCount = tests.filter(t => t.status === 'fail').length
  const runningCount = tests.filter(t => t.status === 'running').length

  // Função para normalizar paths e garantir comparação correta
  const normalizePath = (path: string | undefined): string => {
    if (!path) return ''
    return path
      .replace(/^\.\//, '')      // Remove ./
      .replace(/\\/g, '/')       // Troca \ por /
      .trim()
  }

  const runTests = (file?: string, testName?: string) => {
    if (!connected || runStatus === 'running') return
    
    // Envia comando para executar testes (todos, arquivo específico, ou teste específico)
    const payload: any = {}
    if (file) payload.file = file
    if (testName) payload.testName = testName
    
    wsRef.current?.send(JSON.stringify({
      type: 'run:request',
      payload
    }))
  }

  const toggleFileExpansion = (filePath: string) => {
    setTestFiles(prev => prev.map(f => 
      f.path === filePath ? { ...f, expanded: !f.expanded } : f
    ))
  }

  const expandAll = () => {
    setTestFiles(prev => prev.map(f => ({ ...f, expanded: true })))
  }

  const collapseAll = () => {
    setTestFiles(prev => prev.map(f => ({ ...f, expanded: false })))
  }

  const clearLogs = () => {
    setLogs([])
  }


  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <TestTubeIcon className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Bun Test UI</h1>
              <p className="text-xs text-muted-foreground">Test runner with live results</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => runTests()}
              disabled={!connected || runStatus === 'running'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                bg-primary text-primary-foreground hover:bg-primary/90
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runStatus === 'running' ? (
                <>
                  <ClockIcon className="w-4 h-4 animate-spin" />
                  <span className="hidden md:inline">Running...</span>
                </>
              ) : (
                <>
                  <PlayIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Run All</span>
                </>
              )}
            </button>
            
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
              ${connected ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-blue-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="hidden md:inline">{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        {tests.length > 0 && (
          <div className="border-b border-border bg-card">
            <div className="flex items-center justify-between px-4 md:px-6 py-3">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-foreground">{tests.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-blue-400">{passCount}</span>
                </div>
                {failCount > 0 && (
                  <div className="flex items-center gap-2">
                    <XCircleIcon className="w-4 h-4 text-red-400" />
                    <span className="font-bold text-red-400">{failCount}</span>
                  </div>
                )}
                {runningCount > 0 && (
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-yellow-400 animate-pulse" />
                    <span className="font-bold text-yellow-400">{runningCount}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={expandAll}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="Expand all"
                >
                  <ExpandAllIcon className="w-4 h-4" />
                </button>
                
                <button
                  onClick={collapseAll}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="Collapse all"
                >
                  <CollapseAllIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-px bg-border">
        {/* Tests Panel */}
        <div className={`flex flex-col bg-card overflow-hidden transition-all duration-300 ${
          viewMode === 'logs' ? 'lg:opacity-100 opacity-0 lg:pointer-events-auto pointer-events-none absolute lg:relative inset-0 lg:inset-auto' : 'opacity-100'
        }`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Test Files</h2>
              <span className="text-xs text-muted-foreground">{testFiles.length} files</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {testFiles.length > 0 ? (
                testFiles.map((file) => {
                  // Normaliza paths antes de comparar
                  const normalizedFilePath = normalizePath(file.path)
                  const fileTests = tests.filter(t => normalizePath(t.filePath) === normalizedFilePath)
                  
                  // Debug: mostrar quando arquivo está expandido
                  if (file.expanded) {
                    console.log('═══════════════════════════════════════')
                    console.log('📂 File expanded:', file.path)
                    console.log('🔄 Normalized file path:', normalizedFilePath)
                    console.log('📊 Total tests in state:', tests.length)
                    console.log('✅ Tests found for this file:', fileTests.length)
                    console.log('📋 All test filePaths (normalized):', [...new Set(tests.map(t => normalizePath(t.filePath)))])
                    if (fileTests.length > 0) {
                      console.log('🎯 Found tests:', fileTests.map(t => t.name))
                    } else {
                      console.log('⚠️ NO TESTS FOUND! Checking all tests:')
                      tests.forEach(t => {
                        const normalizedTestPath = normalizePath(t.filePath)
                        console.log(`  - Test: "${t.name}"`)
                        console.log(`    Original filePath: "${t.filePath}"`)
                        console.log(`    Normalized: "${normalizedTestPath}"`)
                        console.log(`    Expected: "${normalizedFilePath}"`)
                        console.log(`    Matches? ${normalizedTestPath === normalizedFilePath}`)
                      })
                    }
                    console.log('═══════════════════════════════════════')
                  }
                  
                  const filePassCount = fileTests.filter(t => t.status === 'pass').length
                const fileFailCount = fileTests.filter(t => t.status === 'fail').length
                const fileRunningCount = fileTests.filter(t => t.status === 'running').length
                
                return (
                  <div key={file.path} className="rounded-lg border border-border bg-card overflow-hidden">
                    {/* File Header */}
                    <button 
                      onClick={() => toggleFileExpansion(file.path)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {file.expanded ? (
                          <ChevronDownIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <FileIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <span className="text-sm font-semibold truncate">{file.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {fileTests.length > 0 && (
                          <div className="flex items-center gap-2 text-xs font-medium">
                            {filePassCount > 0 && (
                              <span className="flex items-center gap-1 text-blue-400">
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                {filePassCount}
                              </span>
                            )}
                            {fileFailCount > 0 && (
                              <span className="flex items-center gap-1 text-red-400">
                                <XCircleIcon className="w-3.5 h-3.5" />
                                {fileFailCount}
                              </span>
                            )}
                            {fileRunningCount > 0 && (
                              <span className="flex items-center gap-1 text-yellow-400 animate-pulse">
                                <ClockIcon className="w-3.5 h-3.5" />
                                {fileRunningCount}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            runTests(file.path)
                          }}
                          disabled={!connected || runStatus === 'running'}
                          className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors
                            disabled:opacity-50 disabled:cursor-not-allowed"
                          title={`Run ${file.name}`}
                        >
                          <PlayIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </button>
                    
                    {/* Tests List */}
                    {file.expanded && fileTests.length > 0 && (
                      <div className="divide-y divide-border">
                        {fileTests.map((test) => {
                          const Icon = test.status === 'pass' ? CheckCircleIcon :
                                      test.status === 'fail' ? XCircleIcon : ClockIcon
                          const iconColor = test.status === 'pass' ? 'text-blue-400' :
                                           test.status === 'fail' ? 'text-red-400' : 'text-yellow-400'
                          
                          // Animação azul quando acabou de passar
                          const bgColor = test.justPassed 
                            ? 'bg-blue-500/20 border-l-4 border-blue-500' 
                            : 'hover:bg-muted/30'
                          
                          return (
                            <div
                              key={test.id}
                              className={`flex items-center justify-between p-3 md:p-4 transition-all duration-500 group ${bgColor}`}
                            >
                              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor} ${test.status === 'running' ? 'animate-pulse' : ''}`} />
                                <span className="text-sm font-medium text-foreground truncate">{test.name}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {test.duration && (
                                  <span className="text-xs text-muted-foreground hidden md:inline">{test.duration}</span>
                                )}
                                <button 
                                  onClick={() => runTests(file.path, test.name)}
                                  disabled={!connected || runStatus === 'running'}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all
                                    disabled:opacity-0 disabled:cursor-not-allowed"
                                  title="Run this test"
                                >
                                  <PlayIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    
                    {/* Lista de testes do arquivo (se não rodou ainda) */}
                    {file.expanded && fileTests.length === 0 && file.tests && file.tests.length > 0 && (
                      <div className="divide-y divide-border bg-muted/20">
                        {file.tests.map((testName, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/30 transition-colors group"
                          >
                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                              <TestIcon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                              <span className="text-sm font-medium text-muted-foreground truncate">{testName}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground hidden md:inline">Not run</span>
                              <button 
                                onClick={() => runTests(file.path, testName)}
                                disabled={!connected || runStatus === 'running'}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all
                                  disabled:opacity-0 disabled:cursor-not-allowed"
                                title="Run this test"
                              >
                                <PlayIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* No tests in file */}
                    {file.expanded && fileTests.length === 0 && (!file.tests || file.tests.length === 0) && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {tests.filter(t => normalizePath(t.filePath) === normalizedFilePath).length > 0 
                          ? 'No tests match current filter'
                          : runStatus === 'idle' 
                            ? 'Run tests to see results'
                            : 'No tests found in this file'}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <FileIcon className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {connected ? 'No test files found' : 'Connecting to runner...'}
                </p>
              </div>
            )}
            </div>
          </div>

        {/* Logs Panel */}
        <div className={`flex flex-col bg-card overflow-hidden transition-all duration-300 ${
          viewMode === 'tests' ? 'lg:opacity-100 opacity-0 lg:pointer-events-auto pointer-events-none absolute lg:relative inset-0 lg:inset-auto' : 'opacity-100'
        }`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Output</h2>
              <div className="flex items-center gap-3">
                {logs.length > 0 && (
                  <>
                    <span className="text-xs text-muted-foreground">{logs.length} lines</span>
                    <button
                      onClick={clearLogs}
                      className="px-3 py-1 text-xs rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 md:p-4 font-mono text-[10px] md:text-xs">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <svg className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/50 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {runStatus === 'idle' ? 'Run tests to see output' : 'No output yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {logs.map((log, index) => {
                    // Detecta tipo de linha
                    const isPass = log.message.trim().startsWith('(pass)')
                    const isFail = log.message.trim().startsWith('(fail)')
                    const trimmed = log.message.trim()
                    
                    // Detecta se é nome de arquivo de teste
                    const isFileName = /\.(test|spec)\.(ts|js|tsx|jsx):?$/.test(trimmed) || 
                                      /_(test|spec)\.(ts|js|tsx|jsx):?$/.test(trimmed)
                    
                    // Blocos especiais
                    if (log.isErrorBlock) {
                      return (
                        <div
                          key={index}
                          className="my-3 p-4 rounded-lg bg-red-500/10 border-l-4 border-red-500 shadow-sm"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <XCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Test Error</span>
                          </div>
                          <pre className="whitespace-pre-wrap break-words leading-relaxed text-red-200 text-xs font-mono">{log.message}</pre>
                        </div>
                      )
                    }
                    
                    // Nome de arquivo - adiciona espaçamento antes
                    if (isFileName) {
                      return (
                        <div key={index} className="mt-4 first:mt-0">
                          <div className="py-0.5 px-2 rounded hover:bg-muted/30 transition-colors">
                            <pre className="whitespace-pre-wrap break-words leading-relaxed text-foreground font-semibold">{log.message}</pre>
                          </div>
                        </div>
                      )
                    }
                    
                    // Linhas normais
                    const textColor = isPass ? 'text-green-400' : 
                                     isFail ? 'text-red-400' : 
                                     'text-foreground'
                    
                    const bgColor = isPass ? 'hover:bg-green-500/10' : 
                                   isFail ? 'hover:bg-red-500/10' : 
                                   'hover:bg-muted/30'
                    
                    return (
                      <div
                        key={index}
                        className={`py-0.5 px-2 rounded transition-colors ${bgColor}`}
                      >
                        <pre className={`whitespace-pre-wrap break-words leading-relaxed ${textColor}`}>{log.message}</pre>
                      </div>
                    )
                  })}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          </div>
      </div>

      {/* Mobile View Tabs */}
      <div className="lg:hidden border-t border-border bg-card flex-shrink-0">
        <div className="grid grid-cols-3">
          <button
            onClick={() => setViewMode('tests')}
            className={`flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors ${
              viewMode === 'tests' 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-muted-foreground border-b-2 border-transparent'
            }`}
          >
            <FileIcon className="w-4 h-4" />
            <span>Tests</span>
          </button>
          
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors ${
              viewMode === 'split' 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-muted-foreground border-b-2 border-transparent'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4H5a2 2 0 00-2 2v6a2 2 0 002 2h4m0 0v8m0-8h6m-6 0V4m6 8h4a2 2 0 002-2V6a2 2 0 00-2-2h-4m-6 8v8" />
            </svg>
            <span>Split</span>
          </button>
          
          <button
            onClick={() => setViewMode('logs')}
            className={`flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors ${
              viewMode === 'logs' 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-muted-foreground border-b-2 border-transparent'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Output</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
