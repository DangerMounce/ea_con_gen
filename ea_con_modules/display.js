// This module contains display related functions

import chalk from 'chalk';
import { yesOrNo } from './menus.js';
import { instructions } from './filesAndFolders.js';
import figlet from 'figlet';
import gradient from 'gradient-string';
import inquirer from 'inquirer';
import { instruction } from '../gen.js';
import { ai } from './openAiContacts.js';

let message = '';

export async function showError(message) {
    console.clear();
    console.log('');
    console.log(`${chalk.bold.red('Oops!')} ${message}`);
    console.log('');
    console.log(`${chalk.bold.yellow('Type')} node gen help`);
    console.log('');
    process.exit(0);
}

export async function statusMessage() {

    console.log(chalk.bold.yellow(display.message));
    console.log('');
}

export function figletText(text) {
    return new Promise((resolve, reject) => {
        figlet(text, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            console.log(gradient.pastel.multiline(data));
            resolve();
        });
    });
}

export async function summary() {
    console.clear();
    await statusMessage();
    await figletText(instruction);
    console.log('')
    console.log(`${chalk.bold.yellow('Contract:')} ${instructions.contractName}`);
    if (instruction != 'import') {
        console.log(`${chalk.bold.yellow('Contact Type:')} ${instructions.contactType}`);
        if (ai.language != null) {
            console.log(`${chalk.bold.yellow('Language:')} ${ai.language}`);
        }
        console.log(`${chalk.bold.yellow('Number of Contacts:')} ${instructions.numberOfContacts}`);
    }
    if (instructions.numberOfContacts > 1) {
        console.log(`${chalk.bold.yellow('Time Interval:')} ${instructions.numberOfContacts}`);
    }
}

export async function getReadyToUpload() {
    const answers = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'readyToUpload',
            message: 'Ready to begin upload?',
            default: false
        }
    ]);
    return answers.readyToUpload;
}

export const display = {
    showError,
    statusMessage,
    message,
    summary,
    getReadyToUpload,
    figletText
};

