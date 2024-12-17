import { showErrorMessage } from '../utils/messages.js';

export function handleCommandLineOperation() {
    return process.argv.length > 2;
}

export function parseCommandLineArgs() {
    const args = process.argv.slice(2);
    if (args.length === 0) return null;

    switch (args[0]) {
        case '--upload':
            if (args.length !== 2) {
                console.log(showErrorMessage('Usage: npx codexstorage --upload <filename>'));
                process.exit(1);
            }
            return { command: 'upload', value: args[1] };
        
        case '--download':
            if (args.length !== 2) {
                console.log(showErrorMessage('Usage: npx codexstorage --download <cid>'));
                process.exit(1);
            }
            return { command: 'download', value: args[1] };
        
        default:
            console.log(showErrorMessage(
                'Invalid command. Available commands:\n\n' +
                'npx codexstorage\n' +
                'npx codexstorage --upload <filename>\n' +
                'npx codexstorage --download <cid>'
            ));
            process.exit(1);
    }
} 