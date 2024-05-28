import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { displayChangeLog } from './utils.js'
import { writeLog } from './generate_log.js';

// Configuration
const repoOwner = 'DangerMounce';
const repoName = 'ea_con_gen';
const branchName = 'main';
const gitHubUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/commits/${branchName}`;
const downloadUrl = `https://github.com/${repoOwner}/${repoName}/archive/refs/heads/${branchName}.zip`;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const updateDir = path.resolve(__dirname, '..');  // Assuming `auto_update.js` is in the `modules` directory
const versionFilePath = path.resolve(updateDir, 'version.log');

async function promptUserToUpdate() {
    try {
        const readyToUpdate = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmation',
                message: chalk.bold.yellow('Update?'),
                default: false // Set default value as needed
            }
        ]);

        const confirmation = readyToUpdate.confirmation;
        return confirmation;
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
    }
}

async function getLatestVersion() {
    const response = await fetch(gitHubUrl);
    const data = await response.json();
    await writeLog(`==>latest ea_con_gen version: ${data.sha}`)
    return data.sha;
}

async function getCurrentVersion() {
    if (fs.existsSync(versionFilePath)) {
        const version = fs.readFileSync(versionFilePath, 'utf-8').trim();
        await writeLog(`==>Current ea_con_gen version: ${version}`)
        return version;
    }
    return null;
}

function writeCurrentVersion(version) {
    fs.writeFileSync(versionFilePath, version, 'utf-8');
    console.log(chalk.bold.yellow('==>'), `Current version (${version}) written to version.log`);
}

async function checkForUpdates() {
    const currentVersion = await getCurrentVersion();
    const latestVersion = await getLatestVersion();
    if (currentVersion !== latestVersion) {
        await writeLog(`==>Update offered`)
        console.clear('')
        console.log('')
        console.log(chalk.yellow('Hey 👋 - an update for ea_con_gen is available.'));
        console.log('')
        const updateAgreed = await promptUserToUpdate();
        if (updateAgreed) {
            await writeLog(`==>Update agreed`)
            await updateRepository();
            writeCurrentVersion(latestVersion);
            await displayChangeLog()
            console.log('')
            console.log(chalk.bold.green(`Update completed successfully. 🫡`));
            console.log(chalk.bold.green(`Please restart the script to apply the updates.🫣`));
            process.exit(1)
        }
        await writeLog('==>Update not agreed')
        return;
    } else {
        await writeLog(`==>latest ea_con_gen version up to date`)
    }
}

async function updateRepository() {
    try {
        const zipPath = path.resolve(__dirname, 'repo.zip');
        await downloadFile(downloadUrl, zipPath);
        await extractZip(zipPath, updateDir);
        // fs.unlinkSync(zipPath);  // Clean up the zip file
        console.log(chalk.bold.yellow('==>'), 'Repository updated.');
        console.log(chalk.bold.yellow('==>'), `Update directory: ${updateDir}`);
        console.log(chalk.bold.yellow('==>'), `Version file path: ${versionFilePath}`);

    } catch (error) {
        writeLog(error)
        console.error(chalk.bold.yellow('==>'), 'Error updating the repository.');
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
        console.log(chalk.bold.yellow('==>'), `Updating ${destPath}...`);  // Add logging for debugging
        if (fs.existsSync(destPath)) {
            fs.rmSync(destPath, { recursive: true, force: true }); // Remove existing file/folder
        }
        fs.renameSync(srcPath, destPath);
    }

    // Clean up the temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
}

async function forceUpdate() {
    const updateAgreed = await promptUserToUpdate();
    const chatVersionFilePath = path.join('chatVersion.log');
    const callVersionFilePath = path.join('callVersion.log');

    if (updateAgreed) {
        await updateRepository();
        // writeCurrentVersion(latestVersion);

        console.log(chalk.white(`Update completed successfully.`));
        console.log(chalk.bold.green(`Please restart the script to apply the updates.`));
        process.exit(0)
    }

    const files = [chatVersionFilePath, callVersionFilePath];
    
    files.forEach(file => {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            console.log(chalk.green(`Deleted file: ${file}`));
        } else {
            console.log(chalk.yellow(`File not found: ${file}`));
        }
    });
}

export { checkForUpdates, forceUpdate };