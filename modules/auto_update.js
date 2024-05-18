import fetch from 'node-fetch';
import fs from 'fs'
import dotenv from 'dotenv';
dotenv.config();
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
const gitHubUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/commits/${branchName}`
const localDirectory = path.dirname(fileURLToPath(import.meta.url));
const versionFilePath = path.resolve(localDirectory, 'version.txt');

// Test
const GITHUB_KEY = process.env['GITHUB_TOKEN']
export async function getLatestVersion() {
    const response = await fetch(gitHubUrl);
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
            const fileChanges = await getFilesChangedInCommit(latestVesion)
            console.log(fileChanges)
            process.exit(1)
        }
        
    }
}

async function getFilesChangedInCommit(sha) {
    console.log(sha)
    try {
        console.log(GITHUB_KEY)
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits/${sha}`, {
            headers: {
                'Authorization': `token ${GITHUB_KEY}`
            }})

        // const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits/${sha}`);
        
        if (!response.ok) {
            throw new Error(`GitHub API responded with status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.files) {
            throw new Error('No files property in the API response');
        }

        return data.files.map(file => file.filename);
    } catch (error) {
        console.error('Error fetching files changed in commit:', error);
        return [];
    }
}
