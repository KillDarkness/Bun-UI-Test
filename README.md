# Bun UI Test

A modern web-based interface for running and monitoring Bun tests in real-time.

## Overview

Bun UI Test provides a clean and efficient dashboard for your Bun test suites. It automatically discovers test files, allows for selective execution, and displays live output through a unified WebSocket server.

## Features

- Real-time Updates: Monitor test progress live via WebSocket communication.
- Automated Discovery: Recursively finds test files including .test, .spec, and _test patterns.
- Selective Execution: Run individual tests, specific files, or the entire suite.
- Comprehensive Reporting: Track pass/fail statistics and execution duration.
- Unified Server: Serves both the web interface and WebSocket data on a single port (5050) in production.
- Zero Configuration: Works out of the box with standard Bun test patterns.

## Installation

### Global Installation
Install the package globally using npm or bun:

```bash
npm install -g bun-ui-tests
# or
bun add -g bun-ui-tests
```

### Direct Execution
Run it without installation using bunx:

```bash
bunx bun-ui-tests run
```

## Usage

### Production Mode
Navigate to your project directory and run:

```bash
bun-ui-tests run
```
Access the interface at http://localhost:5050.

### Development Mode
For contributors working on the UI itself:

```bash
bun-ui-tests dev
```

## Supported Patterns

The runner automatically detects the following file patterns:
- *.test.ts, *.test.js, *.test.tsx, *.test.jsx
- *.spec.ts, *.spec.js, *.spec.tsx, *.spec.jsx
- *_test.ts, *_test.js, *_test.tsx, *_test.jsx
- *_spec.ts, *_spec.js, *_spec.tsx, *_spec.jsx

## Architecture

Bun UI Test operates by spawning the native `bun test` command as a child process, parsing the stdout/stderr streams, and broadcasting the results to the web frontend. This approach ensures compatibility with all Bun test features without requiring internal API access.

## Links

- GitHub Repository: [https://github.com/KillDarkness/Bun-UI-Test](https://github.com/KillDarkness/Bun-UI-Test)
- NPM Package: [https://www.npmjs.com/package/bun-ui-tests](https://www.npmjs.com/package/bun-ui-tests)

## License

MIT