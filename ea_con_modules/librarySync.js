import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { display } from './display.js';

process.removeAllListeners('warning');


// Configuration
const repoOwner = 'DangerMounce';
const repoName = 'chat-library';
const callRepoName = 'call_library';
const branchName = 'main';
const gitHubUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/commits/${branchName}`;
const callGitHubUrl = `https://api.github.com/repos/${repoOwner}/${callRepoName}/commits/${branchName}`;
const downloadUrl = `https://github.com/${repoOwner}/${repoName}/archive/refs/heads/${branchName}.zip`;
const callDownloadUrl = `https://github.com/${repoOwner}/${callRepoName}/archive/refs/heads/${branchName}.zip`;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const updateChatDir = path.resolve(__dirname, '../tickets/');
const updateCallDir = path.resolve(__dirname, '../calls/');
const chatVersionFilePath = path.resolve(updateChatDir, '../ea_con_modules/chatVersion.log');
const callVersionFilePath = path.resolve(updateCallDir, '../ea_con_modules/callVersion.log');

export let callStatusMessage = '';
export let statusMessage = '';

async function promptUserToUpdateChats() {
    try {
        const readyToUpdate = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmation',
                message: chalk.bold.cyan('Update chat library?'),
                default: false // Set default value as needed
            }
        ]);

        return readyToUpdate.confirmation;
    } catch (error) {
        console.error(chalk.bold.red(`Error: ${error.message}`));
        process.exit(1);
    }
}

async function getLatestVersion() {
    const response = await fetch(gitHubUrl);
    const data = await response.json();
    return data.sha;
}

async function getCurrentVersion() {
    if (fs.existsSync(chatVersionFilePath)) {
        const version = fs.readFileSync(chatVersionFilePath, 'utf-8').trim();

        return version;
    }
    return null;
}

function writeCurrentVersion(version) {
    try {
        if (typeof version !== 'string' || !version) {
            throw new Error('Invalid version provided to writeCurrentCallVersion');
        }
        fs.writeFileSync(chatVersionFilePath, version, 'utf-8');
    } catch (error) {
        console.error(`Error writing current call version: ${error.message}`);
        throw error;
    }
}

async function chatUpdates() {
    const logFilePath = path.join(__dirname, '../ea_con_modules/chatVersion.log');

    // Check if the file exists
    if (!fs.existsSync(logFilePath)) {
        // Create the file
        fs.writeFileSync(logFilePath, '', 'utf8');
    } else {
    }
    const currentVersion = await getCurrentVersion();
    const latestVersion = await getLatestVersion();
    if (currentVersion !== latestVersion) {
        console.clear('');
        console.log('');
        console.log(chalk.bold.cyan('There are new chats available.'));
        console.log('');
        const updateAgreed = await promptUserToUpdateChats();
        if (updateAgreed) {
            display.syncingLibrary()
            await updateRepository();
            writeCurrentVersion(latestVersion);
            display.stopAnimation()
            statusMessage = 'Chat repository updated successfully.';
        }
    
        return;
    } else {
    }
}

async function updateRepository() {
    try {
        const zipPath = path.resolve(__dirname, 'repo.zip');
        await downloadFile(downloadUrl, zipPath);
        await extractZip(zipPath, updateChatDir);
        if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath); // Clean up the zip file
        }
    } catch (error) {
        console.error('Error updating the repository.', error);
    }
}

async function downloadFile(url, dest) {
    const response = await fetch(url);
    const fileStream = fs.createWriteStream(dest);
    return new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on('error', reject);
        fileStream.on('finish', resolve);
    });
}

async function extractZip(zipPath, dest) {
    const zip = new AdmZip(zipPath);
    const tempDir = path.resolve(dest, 'temp');
    zip.extractAllTo(tempDir, true); // Extract to a temporary directory

    // Move contents from temp/auto_update-main to dest
    const extractedDir = path.resolve(tempDir, `${repoName}-${branchName}`);
    const files = fs.readdirSync(extractedDir);
    for (const file of files) {
        const srcPath = path.resolve(extractedDir, file);
        const destPath = path.resolve(dest, file);
        if (fs.existsSync(destPath)) {
            fs.rmSync(destPath, { recursive: true, force: true }); // Remove existing file/folder
        }
        fs.renameSync(srcPath, destPath);
    }

    // Clean up the temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
}

async function callUpdates() {
    const logFilePath = path.join(__dirname, '../ea_con_modules/callVersion.log');

    // Check if the file exists
    if (!fs.existsSync(logFilePath)) {
        fs.writeFileSync(logFilePath, '', 'utf8');
    } else {
    }
    const currentVersion = await getCurrentCallVersion();
    const latestVersion = await getLatestCallVersion();
    if (currentVersion !== latestVersion) {
        // writelog('==>Call Library up to date')
        console.clear('');
        console.log('');
        console.log(chalk.bold.green('There are new calls available.'));
        console.log('');
        const updateAgreed = await promptUserToUpdateCalls();
        if (updateAgreed) {
            display.syncingLibrary()
            await updateCallRepository();
            writeCurrentCallVersion(latestVersion);
            display.stopAnimation()
            callStatusMessage = 'Call repository updated successfully.';
        }
        return;
    } else {
    }
}

async function getCurrentCallVersion() {
    if (fs.existsSync(callVersionFilePath)) {
        const version = fs.readFileSync(callVersionFilePath, 'utf-8').trim();
        return version;
    }
    return null;
}

async function getLatestCallVersion() {
    const response = await fetch(callGitHubUrl);
    const data = await response.json();
    return data.sha;
}

async function promptUserToUpdateCalls() {
    try {
        const readyToUpdate = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmation',
                message: chalk.bold.green('Update call library?'),
                default: false // Set default value as needed
            }
        ]);

        return readyToUpdate.confirmation;
    } catch (error) {
        console.error(chalk.bold.red(`Error: ${error.message}`));
        process.exit(1);
    }
}

async function updateCallRepository() {
    try {
        const zipPath = path.resolve(__dirname, 'repo.zip');
        await downloadFile(callDownloadUrl, zipPath);
        await extractCallZip(zipPath, updateCallDir);
        if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath); // Clean up the zip file
        }
    } catch (error) {
        console.error('Error updating the repository.', error);
    }
}

function writeCurrentCallVersion(version) {
    try {
        if (typeof version !== 'string' || !version) {
            throw new Error('Invalid version provided to writeCurrentCallVersion');
        }
        fs.writeFileSync(callVersionFilePath, version, 'utf-8');
    } catch (error) {
        console.error(`Error writing current call version: ${error.message}`);
        throw error;
    }
}

async function extractCallZip(zipPath, dest) {
    const zip = new AdmZip(zipPath);
    const tempDir = path.resolve(dest, 'temp');
    zip.extractAllTo(tempDir, true); // Extract to a temporary directory

    // Move contents from temp/auto_update-main to dest
    const extractedDir = path.resolve(tempDir, `${callRepoName}-${branchName}`);
    const files = fs.readdirSync(extractedDir);
    for (const file of files) {
        const srcPath = path.resolve(extractedDir, file);
        const destPath = path.resolve(dest, file);
        if (fs.existsSync(destPath)) {
            fs.rmSync(destPath, { recursive: true, force: true }); // Remove existing file/folder
        }
        fs.renameSync(srcPath, destPath);
    }

    // Clean up the temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });

    // Delete the zip file
    if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
    } else {

    }
}

export const librarySync = { 
    chatUpdates, 
    callUpdates 
};