import boxen from 'boxen';
import chalk from 'chalk';

export function showSuccessMessage(message) {
    return boxen(chalk.green(message), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        title: '✅ SUCCESS',
        titleAlignment: 'center'
    });
}

export function showErrorMessage(message) {
    return boxen(chalk.red(message), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'red',
        title: '❌ ERROR',
        titleAlignment: 'center'
    });
}

export function showInfoMessage(message) {
    return boxen(chalk.cyan(message), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        title: 'ℹ️  INFO',
        titleAlignment: 'center'
    });
} 