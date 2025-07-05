# Codex Installer

A command-line interface for installing and interacting with Codex Storage.

## Features

- Install and manage Codex node
- Run Codex node with custom configuration
- Check node status and connected peers
- Upload and download files
- View local data
- Cross-platform support (Windows, Linux, macOS)

## Installation

```bash
npm install -g codexstorage
```

Or run directly with npx:

```bash
npx codexstorage
```

## Usage

### Interactive Mode

Simply run:

```bash
codexstorage
```

This will start the interactive CLI menu where you can:
1. Download and install Codex
2. Run Codex node
3. Check node status
4. Upload a file
5. Download a file
6. Show local data
7. Uninstall Codex node

### Command Line Mode

Upload a file:
```bash
codexstorage --upload <filename>
```

Download a file:
```bash
codexstorage --download <cid>
```

## Requirements

- Node.js 14 or higher
- For Linux users: libgomp1 library
- For Windows users: curl command available

## Development

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Run the CLI:
```bash
npm start
```

## Trouble?

Is the installer crashing? Make sure these packages are installed:
```
apt-get install	fdisk	procps
```

## License

MIT
