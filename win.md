# Setting up and running on Win11

## Setup
- Download and run Nodejs installer 'node-v22.14.0-x64.msi' from https://nodejs.org/en/download

## Enable npm for powershell
- Open ps in admin mode
- Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned`
- Close admin ps

## Powershell
- 'node --version' returns 'v22.14.0`
- 'npm --version' returns '10.9.2'

### In repository root
- 'npm install' successfully installs package
- 'npm start' run the CLI tool

### Using CLI tool
- After installing Codex: Restart of terminal was required.
- Attempt to start Codex failed: command for firewall modification failed.
- Disabled firewall commands and tried again: tool reports Codex is running and to open a new terminal to interact with it. Then (with no action) the tool stops. (No Codex process is running.)
