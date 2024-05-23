import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { writeLog } from './generate_log.js';
// Configuration
const repoOwner = 'DangerMounce';
const repoName = 'chat-library';
const branchName = 'main';
const gitHubUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/commits/${branchName}`;
const downloadUrl = `https://github.com/${repoOwner}/${repoName}/archive/refs/heads/${branchName}.zip`;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const updateChatDir = path.resolve(__dirname, '../tickets/');
const chatVersionFilePath = path.resolve(updateChatDir, '../modules/chatVersion.log');

export let statusMessage = ''

async function promptUserToUpdateChats() {
    try {
        const readyToUpdate = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmation',
                message: chalk.bold.yellow('Update chat library?'),
                default: false // Set default value as needed
            }
        ]);

        const confirmation = readyToUpdate.confirmation;
        return confirmation;
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
    fs.writeFileSync(chatVersionFilePath, version, 'utf-8');
    console.log(`Current version (${version}) written to chatVersion.log`);
}

async function checkForChatUpdates() {
    const currentVersion = await getCurrentVersion();
    const latestVersion = await getLatestVersion();
    if (currentVersion !== latestVersion) {
        console.clear('')
        console.log('')
        console.log(chalk.bold.yellow('There are new chats available.'))
        console.log('')
        const updateAgreed = await promptUserToUpdateChats();
        if (updateAgreed) {
            await updateRepository();
            writeCurrentVersion(latestVersion);
            statusMessage = "Chat repository updated successfully."
            writeLog({"Chat Update" : statusMessage})
        }
        return;
    } else {
        // console.log('You are using the latest version.');
    }
}

async function updateRepository() {
    try {
        const zipPath = path.resolve(__dirname, 'repo.zip');
        await downloadFile(downloadUrl, zipPath);
        await extractZip(zipPath, updateChatDir);
        fs.unlinkSync(zipPath);  // Clean up the zip file
        console.log(chalk.green('Repository updated.'));
        console.log(chalk.green(`Update directory: ${updateChatDir}`));
        console.log(chalk.green(`Version file path: ${chatVersionFilePath}`));

    } catch (error) {
        writeLog(error)
        console.error('Error updating the repository.' ,error);
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
    zip.extractAllTo(tempDir, true);  // Extract to a temporary directory

    // Move contents from temp/auto_update-main to dest
    const extractedDir = path.resolve(tempDir, `${repoName}-${branchName}`);
    const files = fs.readdirSync(extractedDir);
    for (const file of files) {
        const srcPath = path.resolve(extractedDir, file);
        const destPath = path.resolve(dest, file);
        console.log(`Adding ${destPath}...`);  // Add logging for debugging
        // if (fs.existsSync(destPath)) {
        //     fs.rmSync(destPath, { recursive: true, force: true }); // Remove existing file/folder
        // }
        fs.renameSync(srcPath, destPath);
    }

    // Clean up the temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
}

export { checkForChatUpdates };