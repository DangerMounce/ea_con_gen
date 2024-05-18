import fetch from 'node-fetch';
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import {
    confirmedYesToUpdate
} from './user_prompts.js'
import {
    titleText
} from './utils.js'

// Configuration
const repoOwner = 'DangerMounce';
const repoName = 'ea_con_gen';
const branchName = 'main';
const localDirectory = path.dirname(fileURLToPath(import.meta.url));
const versionFilePath = path.resolve(localDirectory, 'version.txt');


export async function getLatestVersion() {
    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits/${branchName}`);
    const data = await response.json();
    return data.sha;
}

export async function getCurrentVersion() {
    if (fs.existsSync(versionFilePath)) {
        const version = fs.readFileSync(versionFilePath, 'utf-8').trim();
        return version;
    }
    console.log('version.txt not found. No current version available.');
    return null;
}

export function getLocalVersionSHA() {
    try {
        const sha = execSync('git rev-parse HEAD').toString().trim();
        return sha;
    } catch (error) {
        console.error('Error getting the local version SHA:', error);
        throw error;
    }
}

export async function checkForUpdates() {

    const currentVersion = await getCurrentVersion()
    const latestVesion = await getLatestVersion()
    titleText()
    if (currentVersion != latestVesion) {
        const wantsToUpdate = await confirmedYesToUpdate()
        if (wantsToUpdate) {
            console.log('Ok, gonna update.')
            process.exit(1)
        }
        
    }
}