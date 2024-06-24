// This module checks for dependencies and install those that are needed

import { execSync } from 'child_process';

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
    'child_process',
    'promisify'
];

async function ensureModulesInstalled() {
    modules.forEach(module => {
        try {
            require.resolve(module);
            console.log(`${module} is installed`);
        } catch (err) {
            console.log(`${module} is not installed. Installing...`);
            try {
                const output = execSync(`npm install ${module}`, { stdio: 'pipe' }).toString();
                console.log(output);
                console.log(`${module} has been installed.`);
            } catch (installError) {
                console.error(`Failed to install ${module}:`, installError);
            }
        }
    });
}


export const installation = {
    ensureModulesInstalled
}