// This module checks for dependencies and install those that are needed

import { execAsync } from 'child_process';

const modules = [
    'path',
    'fs',
    'chalk',
    'url',
    'inquirer',
    'axios',
    'form-data',
    'log-update',
    'chalk-animation',
    'figlet',
    'gradient-string',
    'music-metadata',
    'csv-parser',
    'adm-zip',
    'node-fetch',
    'readline-sync',
    'openai',
    'dotenv',
    'child_process'
];

async function ensureModulesInstalled() {

    const packagesString = modules.join(' ');

    try {
        console.log(`Installing packages...`);
        const { stdout, stderr } = await execAsync(`npm install ${packagesString}`);
        console.log(stdout);
        if (stderr) {
            console.error('Errors during npm install:', stderr);
        } else {
            console.log('All packages installed successfully.');
        }
    } catch (error) {
        console.error('Failed to install packages:', error);
    }
}


export const installation = {
    ensureModulesInstalled
}