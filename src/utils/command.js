import { exec } from 'child_process';
import { promisify } from 'util';

export const execAsync = promisify(exec);

export async function runCommand(command) {
    try {
        const { stdout, stderr } = await execAsync(command);
        return stdout;
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}
