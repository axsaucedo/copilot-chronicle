# Copilot CLI Timeline Viewer

An interactive timeline viewer for GitHub Copilot CLI session logs. Drop a `.jsonl` file to explore AI agent tool calls, messages, and session events with filtering and search.

Inspired by [Simon Willison's Claude Code Timeline Viewer](https://tools.simonwillison.net/claude-code-timeline).

## Features

- 📁 **File Input**: Drop a `.jsonl` file, paste content, or fetch from URL
- 🔍 **Filtering**: Search events, filter by type, hide verbose entries
- 🕐 **Timezone Support**: Toggle between local and UTC timestamps
- 📋 **Copy Tools**: Copy JSON or raw line to clipboard
- 🔗 **URL Sharing**: Share sessions via URL (for smaller files)
- 📱 **Responsive**: Works on desktop and mobile

## Usage

1. Find your Copilot CLI session logs (typically in your home directory)
2. Drop a `.jsonl` file onto the viewer
3. Click events to view details
4. Use filters to find specific events

## GitHub Pages Deployment

This project is configured for easy GitHub Pages deployment.

### Option 1: GitHub Actions (Recommended)

The workflow file is already included at `.github/workflows/deploy.yml`. Just push to the `main` branch and GitHub Actions will build and deploy automatically.

To enable:
1. Go to your repo Settings → Pages
2. Under "Build and deployment", select "GitHub Actions"
3. Push to main branch

### Option 2: Manual Build

```bash
# Install dependencies
npm install

# Build for production
npm run build

# The 'dist' folder can now be deployed to any static host
```

### Custom Base Path

If deploying to a subdirectory (e.g., `https://username.github.io/repo-name/`), update `vite.config.ts`:

```ts
base: '/repo-name/',
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Copilot CLI JSONL Format

The viewer expects JSONL files with events like:

```json
{"type":"session.start","data":{"sessionId":"...","copilotVersion":"0.0.367"},"id":"...","timestamp":"2024-01-01T00:00:00.000Z","parentId":null}
{"type":"user.message","data":{"content":"Your prompt here"},"id":"...","timestamp":"...","parentId":"..."}
{"type":"assistant.message","data":{"content":"...","toolRequests":[...]},"id":"...","timestamp":"...","parentId":"..."}
{"type":"tool.execution_start","data":{"toolCallId":"...","toolName":"view","arguments":{...}},"id":"...","timestamp":"...","parentId":"..."}
{"type":"tool.execution_complete","data":{"toolCallId":"...","success":true,"result":{"content":"..."}},"id":"...","timestamp":"...","parentId":"..."}
```

## Technology Stack

- React + TypeScript
- Vite (for fast builds and GitHub Pages compatibility)
- Tailwind CSS + shadcn/ui
- No backend required - runs entirely in the browser

## License

MIT
