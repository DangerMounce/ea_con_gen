// This module handles all the functions relating to automatically updating when the main branch has ipdated

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { spinner } from './progress.js';
import { display } from './display.js'
import { menu } from './menus.js';



// Configuration
const repoOwner = 'DangerMounce';
const repoName = 'ea_con_gen';

const branchName = 'version_16.1' // 'main'


const gitHubUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/commits/${branchName}`;
const downloadUrl = `https://github.com/${repoOwner}/${repoName}/archive/refs/heads/${branchName}.zip`;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const updateDir = path.resolve(__dirname, '..');  //`auto_update.js` is in the `modules` directory
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
    return data.sha;
}

async function getCurrentVersion() {
    if (fs.existsSync(versionFilePath)) {
        const version = fs.readFileSync(versionFilePath, 'utf-8').trim();
        return version;
    }
    return null;
}

function writeCurrentVersion(version) {
    fs.writeFileSync(versionFilePath, version, 'utf-8');
    // console.log(chalk.bold.yellow('==>'), `Current version (${version}) written to version.log`);
}

async function checkForUpdates() {
    const currentVersion = await getCurrentVersion();
    const latestVersion = await getLatestVersion();
    if (currentVersion !== latestVersion) {
        console.clear('')
        console.log('')
        console.log(chalk.yellow('Hey 👋 - an update for ea_con_gen is available.'));
        console.log('')
        const updateAgreed = await promptUserToUpdate();
        if (updateAgreed) {
            spinner.updatingApp()
            await updateRepository();
            writeCurrentVersion(latestVersion);
            spinner.stopAnimation()
            console.clear()
            await display.figletText('ea_con_gen');
            console.log('');
            // await displayChangeLog(); // Await this function to ensure the change log is displayed
            console.log('');
            console.log(chalk.bold.yellow('Update completed successfully.'));
            console.log(chalk.bold.yellow('Please restart the script to apply the updates.'));
            process.exit(1);
        }
        return;
    } else {
    }
}

async function updateRepository() {
    try {
        const zipPath = path.resolve(__dirname, 'repo.zip');
        await downloadFile(downloadUrl, zipPath);
        await extractZip(zipPath, updateDir);
    } catch (error) {
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

export async function displayChangeLog() {
    const filePath = path.join('ea_con_modules', 'change.log');
    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        const lines = data.split('\n');
        lines.forEach(line => {
            if (line.includes('Enhancements')) {
                console.log(chalk.bold.green(line));
            } else if (line.includes('Bug Fixes')) {
                console.log(chalk.bold.green(line));
            } else if (line.includes('Info')) {
                console.log(chalk.bold.green(line));
            } else if (line.includes('Version')) {
                console.log(chalk.bold.yellow(line))
            } else {
                console.log(line);
            }
        });
    } catch (error) {
        console.error('Change Log not found.');
    }
}

async function handleFirstRun() {
    const firstRunFilePath = path.join(__dirname,'first.run')

    try {
        // Check if the "first.run" file exists
        if (fs.existsSync(firstRunFilePath)) {
            await display.figletText('ea_con_gen')
            console.log('')
            await displayChangeLog();

            // Delete the "first.run" file
            fs.unlink(firstRunFilePath, (err) => {
                if (err) {
                } else {
                }
            });
            console.log('')
            await menu.yesOrNo('Continue?')
        } else {
        }
    } catch (error) {
    }
}

export const update = {
    forceUpdate,
    checkForUpdates,
    displayChangeLog,
    handleFirstRun
}