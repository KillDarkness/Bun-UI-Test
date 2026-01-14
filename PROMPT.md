GEMINI.md          .gitignore         package-lock.json  tsconfig.json
~/Discord/aurelio [main] > buntestui run
🚀 Starting Bun Test UI (Production Mode)...

📡 WebSocket server: ws://localhost:5060
🌐 Frontend: http://localhost:5050

Press Ctrl+C to stop

⚠️  Frontend build not found. Run 'buntestui build' or 'buntestui dev' first.
📡 WebSocket server running on ws://localhost:5060
^C

👋 Stopping Bun Test UI...
~/Discord/aurelio [main] > buntestui build
🏗️  Building frontend...

🔧 Building backend...

$ tsc -b && vite build
  [32ms]  bundle  1 modules
 [411ms] compile  buntestui-runner

✅ Backend built successfully!
vite v7.3.1 building client environment for production...
✓ 29 modules transformed.
dist/index.html                   0.46 kB │ gzip:  0.30 kB
dist/assets/index-QES4zQ8F.css   19.19 kB │ gzip:  4.37 kB
dist/assets/index-BZt__Z-8.js   214.02 kB │ gzip: 65.42 kB
✓ built in 4.77s

✅ Frontend built successfully!

🎉 Build complete!
~/Discord/aurelio [main] > buntestui run
🚀 Starting Bun Test UI (Production Mode)...

📡 WebSocket server: ws://localhost:5060
🌐 Frontend: http://localhost:5050

Press Ctrl+C to stop

⚠️  Frontend build not found. Run 'buntestui build' or 'buntestui dev' first.
📡 WebSocket server running on ws://localhost:5060
^C

👋 Stopping Bun Test UI...
~/Discord/aurelio [main] > buntestui dev
🚀 Starting Bun Test UI (Development Mode)...

📡 WebSocket server: ws://localhost:5060
🌐 Frontend: http://localhost:5050 (with hot reload)

Press Ctrl+C to stop

📡 WebSocket server running on ws://localhost:5060
$ vite

  VITE v7.3.1  ready in 991 ms

  ➜  Local:   http://localhost:5050/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help

