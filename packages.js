// This script checks for dependencies and installs those that are needed

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
        } catch (err) {
            //console.log(`Installing ${module}`);
            try {
                const output = execSync(`npm install ${module}`, { stdio: 'pipe' }).toString();
                // console.log(output);
                console.log(`> ${module} has been installed.`);
            } catch (installError) {
                console.error(`> Failed to install ${module}:`, installError);
            }
        }
    });
    console.log('')
    console.log('Installation complete.')
}

ensureModulesInstalled()