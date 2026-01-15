# Bun UI Test

[![npm version](https://img.shields.io/npm/v/bun-ui-tests.svg?style=flat-square)](https://www.npmjs.com/package/bun-ui-tests)
[![License](https://img.shields.io/npm/l/bun-ui-tests.svg?style=flat-square)](https://github.com/KillDarkness/Bun-UI-Test/blob/main/LICENSE)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat-square&logo=bun&logoColor=white)](https://bun.sh)

A professional, real-time web interface for the Bun test runner.

Bun UI Test provides a streamlined dashboard to visualize test execution, debug failures with structured logging, and manage large test suites through an interactive WebSocket-based UI. It is designed to enhance the developer experience by offering granular control over test execution without leaving the browser.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Interface Overview](#interface-overview)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Real-Time WebSocket Feedback**: Test results and logs are streamed instantly from the Bun runtime to the browser.
- **Granular Execution Control**: Run the entire suite, specific test files, or individual test cases with a single click.
- **Smart Error Formatting**: Automatically parses stack traces and assertion errors, grouping them into readable blocks.
- **Responsive Design**: Adaptive interface that works effectively on both desktop and mobile viewports.
- **Zero Configuration**: Automatically detects standard test file patterns (`.test.ts`, `.spec.js`, etc.) without requiring a config file.
- **Unified Server**: Runs the static frontend and WebSocket server on a single port (5050) for simplified networking.

## Prerequisites

- **Bun Runtime**: v1.0.0 or higher.
- **Node.js**: Not required (this tool is Bun-native).

## Installation

### Global Installation (Recommended)

Install the package globally to use it across all your projects.

```bash
# Using npm
npm install -g bun-ui-tests

# Using Bun
bun add -g bun-ui-tests
```

### Temporary Execution (bunx)

If you prefer not to install the package globally, you can run it on-demand:

```bash
bunx bun-ui-tests run
```

## Usage

Navigate to the root of your project (where your `package.json` is located) and execute the runner.

### Start the Dashboard

```bash
bun-ui-tests run
```

The interface will be accessible at **http://localhost:5050**.

### Development Mode

If you are contributing to the `bun-ui-tests` codebase itself, use the development mode to enable hot-reloading for the React frontend:

```bash
bun-ui-tests dev
```

## Interface Overview

The dashboard is divided into two primary panels:

### 1. Test Explorer (Left Panel)
Displays a hierarchical view of all detected test files.
- **File Status Indicators**: Visual cues for passed (Green), failed (Red), or running (Yellow) states.
- **Expand/Collapse**: Group tests by file to reduce noise.
- **Individual Triggers**: Click the "Play" icon next to any file or specific test case to run only that scope.

### 2. Execution Log (Right Panel)
A live console output window.
- **Structured Logging**: Standard stdout/stderr streams are captured.
- **Error Blocks**: Stack traces and failure details are highlighted in red blocks for immediate visibility.
- **Auto-Scroll**: The view automatically follows the latest output during execution.

## Architecture

This tool uses a decoupled architecture to ensure stability and performance:

1.  **CLI Entry Point**: The `bun-ui-tests` command starts a Bun-native HTTP server.
2.  **Process Management**: When a test run is triggered, the server spawns a child process executing the native `bun test` command.
3.  **Stream Parsing**: The stdout and stderr streams from the child process are intercepted and parsed in real-time to identify test lifecycle events (start, pass, fail).
4.  **WebSocket Broadcast**: Parsed events are serialized and sent to the React frontend via WebSocket.

This approach ensures that `bun-ui-tests` remains compatible with all standard Bun testing features, as it acts as a wrapper around the native runner rather than replacing it.

## Troubleshooting

### Port Conflicts
The application attempts to bind to port **5050**. If this port is in use, the application will fail to start. Ensure port 5050 is free before running the tool.

```bash
# Check port usage on Linux/macOS
lsof -i :5050
```

### No Tests Found
If the dashboard shows "No test files found", ensure:
1.  You are running the command from the project root.
2.  Your test files match standard patterns (e.g., `*.test.ts`, `*.spec.js`).
3.  Your test files are not inside `node_modules` or `dist` folders.

## Contributing

Contributions are welcome. Please follow these steps to set up your local development environment:

1.  Clone the repository:
    ```bash
    git clone https://github.com/KillDarkness/Bun-UI-Test.git
    ```
2.  Install dependencies:
    ```bash
    bun install
    cd app && bun install
    ```
3.  Start the development server:
    ```bash
    bun run dev
    ```

## Links

- **GitHub Repository**: [https://github.com/KillDarkness/Bun-UI-Test](https://github.com/KillDarkness/Bun-UI-Test)
- **NPM Package**: [https://www.npmjs.com/package/bun-ui-tests](https://www.npmjs.com/package/bun-ui-tests)

## License

This project is licensed under the MIT License.
