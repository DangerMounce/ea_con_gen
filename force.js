import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

// Configuration
const repoOwner = 'DangerMounce';
const repoName = 'ea_con_gen';
const branchName = 'version_16.1';
const downloadUrl = `https://github.com/${repoOwner}/${repoName}/archive/refs/heads/${branchName}.zip`;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const updateDir = __dirname;  // Change this to update directly in the current directory
const versionFilePath = path.resolve(updateDir, 'version.log');
const installJsPath = path.resolve(updateDir, 'install.js'); // Path to the install.js file to be deleted

async function checkForUpdates() {
    console.clear();
    console.log('Checking for updates...');
    const updateAgreed = await promptUserToUpdate();
    if (updateAgreed) {
        await updateRepository();
        console.log('Install completed successfully.');
        console.log('Type: node gen help');
        process.exit(0);  // Changed to exit code 0 for successful completion
    }
}

async function updateRepository() {
    try {
        const zipPath = path.resolve(__dirname, 'repo.zip');
        await downloadFile(downloadUrl, zipPath);
        await extractZip(zipPath, updateDir);
        fs.unlinkSync(zipPath);  // Clean up the zip file after extraction
        // fs.unlinkSync(installJsPath); // Delete install.js file
        console.log('Repository installed successfully.');
    } catch (error) {
        console.error('Error installing the repository:', error);
    }
}

async function downloadFile(url, dest) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    const fileStream = fs.createWriteStream(dest);
    await new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on('error', (err) => reject(err));
        fileStream.on('finish', () => resolve());
    });
}

async function extractZip(zipPath, dest) {
    const zip = new AdmZip(zipPath);
    const tempDir = path.resolve(dest, 'temp');
    zip.extractAllTo(tempDir, true);
    const extractedDir = path.resolve(tempDir, `${repoName}-${branchName}`);
    const files = fs.readdirSync(extractedDir);
    for (const file of files) {
        const srcPath = path.resolve(extractedDir, file);
        const destPath = path.resolve(dest, file);
        if (fs.existsSync(destPath)) {
            fs.rmSync(destPath, { recursive: true, force: true });
        }
        fs.renameSync(srcPath, destPath);
        console.log(`Updated ${destPath}...`);
    }
    fs.rmSync(tempDir, { recursive: true, force: true }); // Clean up temporary directory
}

async function promptUserToUpdate() {
    console.clear('')
    console.log('ea_con_gen Installer v1.1')
    console.log('')
    const answers = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmation',
            message: 'Install ea_con_gen?',
            default: false
        }
    ]);
    return answers.confirmation;
}



// Call the function to install the packages

checkForUpdates();