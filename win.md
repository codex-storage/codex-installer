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
