import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function installNpmPackages() {

    const packages = [
        'btoa', 'chalk', 'fs', 'openai', 'dotenv',
        'fluent-ffmpeg', 'ffmpeg-static', 'ffprobe-static',
        'path', 'axios', 'form-data', 'readline-sync', 'music-metadata', 'csv-parser'
    ];
    const packagesString = packages.join(' ');

    try {
        console.log('==> Installing packages...');
        const { stdout, stderr } = await execAsync(`npm install ${packagesString}`);
        console.log(stdout);
        if (stderr) {
            console.error('==> Errors during npm install:', stderr);
        } else {
            console.log('==> All packages installed successfully.');
        }
    } catch (error) {
        console.error('==> Failed to install packages:', error);
    }
}

// Usage
installNpmPackages();
