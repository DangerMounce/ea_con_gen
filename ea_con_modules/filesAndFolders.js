// This module handles all folder and file functions 

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

import { display } from './display.js'

const contractName = null;
let eaApiKey = null;
let contactType = null;
let numberOfContacts = null;
let timeInterval = 0;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keyFilePath = './ea_con_modules/keyFile.json'
const dataLog = './ea_con_modules/dataLog.json'
const devToken = path.join(__dirname, '../dev.tok')

const requiredDirectories = ['./calls', './tickets', './import_tickets', './import_calls'];
const requiredFiles = [
    { name: 'keyFile.json', content: '{}' },
    { name: 'test.json', content: '{}' },
    { name: 'dataLog.json', content: ''}
];

function checkAndCreateDirectory(dirPath) {
    try {
        // Ensure the directory path is absolute
        const absolutePath = path.resolve(dirPath);

        // Check if the directory exists
        if (!fs.existsSync(absolutePath)) {
            // Create the directory
            fs.mkdirSync(absolutePath, { recursive: true });
        } else {
        }
    } catch (error) {
        console.error(`Error checking/creating directory: ${error.message}`);
    }
}


function createDirectories() {
    requiredDirectories.forEach(dir => {
        checkAndCreateDirectory(dir);
    });
}

// If required files don't exist, create them.
export async function createFiles() {
    requiredFiles.forEach((file) => {
        const filePath = path.join(__dirname, file.name);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, file.content);
        } else {
            return
        }
    });
}

// Add a contract and api key to the keyfile
export async function addContractToKeyFile() {
    const contractName = instructions.contractName;
    const apiKey = instructions.eaApiKey;
    try {
        // Read the keyFile.json if it exists, otherwise create an empty object
        let keyFileData = {};
        if (fs.existsSync(keyFilePath)) {
            const rawData = fs.readFileSync(keyFilePath);
            keyFileData = JSON.parse(rawData);
        }

        // Check if the contractName already exists
        if (keyFileData.hasOwnProperty(contractName)) {
            display.showError(`The contract name '${contractName}' already exists in keyFile.json.`);
        } else {
            // Add the new contractName and apiKey
            keyFileData[contractName] = apiKey;

            // Write the updated data back to keyFile.json
            fs.writeFileSync(keyFilePath, JSON.stringify(keyFileData, null, 2));
            console.clear()
            console.log('')
            console.log(chalk.bold.yellow(`${contractName} has been added to the keyFile.`))
            console.log('')
        }
    } catch (error) {
        display.showError(error)
    }
}

// Delete a contract and api key from the keyfile
export async function deleteContractFromKeyFile() {
    try {
    const contractName = instructions.contractName

    const rawData = fs.readFileSync(keyFilePath);
    let keyFileData = JSON.parse(rawData);


        // Check if the contractName exists
        if (keyFileData.hasOwnProperty(contractName)) {
            // Delete the contractName
            delete keyFileData[contractName];

            // Write the updated data back to keyFile.json
            fs.writeFileSync(keyFilePath, JSON.stringify(keyFileData, null, 2));
            console.clear()
            console.log('')
            console.log(chalk.bold.yellow(`${contractName} has been removed from the keyFile.`))
            console.log('')
        } else {
            display.showError(`${contractName} doesn't exist in the keyFile.`)
        }
    } catch (error) {
        display.showError(error)
    }
}

// Check for mp3 and jsons in the calls and tickets directories
async function checkConversationsInDirectories() {
    const callsDir = path.join(__dirname, '../calls');
    const ticketsDir = path.join(__dirname, '../tickets');

    let hasMp3Files = false;
    let hasJsonFiles = false;

    // Check for .mp3 files in the "calls" directory
    if (fs.existsSync(callsDir) && fs.lstatSync(callsDir).isDirectory()) {
        const filesInCalls = fs.readdirSync(callsDir);
        hasMp3Files = filesInCalls.some(file => path.extname(file) === '.mp3');
    }

    // Check for .json files in the "tickets" directory
    if (fs.existsSync(ticketsDir) && fs.lstatSync(ticketsDir).isDirectory()) {
        const filesInTickets = fs.readdirSync(ticketsDir);
        hasJsonFiles = filesInTickets.some(file => path.extname(file) === '.json');
    }

    return {
        hasMp3Files,
        hasJsonFiles
    };
}

// Check for file existing
async function checkFileExists(filePath) {
    try {
        // Check if the path exists and is a file
        return fs.existsSync(filePath) && fs.lstatSync(filePath).isFile();
    } catch (error) {
        // Log error message for debugging
        console.error(`Error checking file existence: ${error.message}`);
        return false;
    }
}

export const instructions = {
    contractName,
    eaApiKey,
    contactType,
    numberOfContacts,
    timeInterval
}

export const fileHandling = {
    createDirectories,
    createFiles,
    addContractToKeyFile,
    deleteContractFromKeyFile,
    checkConversationsInDirectories,
    checkFileExists,
    devToken,
    dataLog
};
