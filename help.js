// Displays help 

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';

export function figletHelpText() {
    return new Promise((resolve, reject) => {
        figlet("Help", (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            console.log(gradient.pastel.multiline(data));
            resolve();
        });
    });
}

export async function displayHelp() {
    console.clear()
    await figletHelpText()
    const filePath = path.join('ea_con_modules', 'help.me');
    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        const lines = data.split('\n');
        lines.forEach(line => {
            if (line.includes('Overview')) {
                console.log(chalk.bold.green(line));
            } else if (line.includes('**')) {
                console.log(chalk.bold.yellow(line));
            } else if (line.includes('How to use')) {
                console.log(chalk.bold.green(line));
            } else if (line.includes('!!')) {
                console.log(chalk.bold.red(line))
            } else if (line.includes('node')) {
                console.log(chalk.bold.yellow(line))
            }
            else {
                console.log(line);
            }
        });
    } catch (error) {
        console.error('Change Log not found.');
    }
}

displayHelp()