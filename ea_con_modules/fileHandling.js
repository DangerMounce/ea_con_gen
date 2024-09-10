import fs from 'fs';
import { promises as fs1 } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk'

import { display } from './display.js';
import { instruction, apiKey } from './variables.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories Required
const calls = 'calls';
const tickets = 'tickets';
const call_import = 'call_import';
const ticket_import = 'ticket_import';

const keyFile = path.join('./ea_con_modules/keyFile.json');
const devToken = path.join('dev.tok')

// Function tp check and create directory
async function checkAndCreateDirectory(dirPath) {
    // Check if the directory exists
    if (!fs.existsSync(dirPath)) {
        // Create the directory if it doesn't exist
        fs.mkdirSync(dirPath, { recursive: true });
    } 
}


// Function to check and create the file
async function checkAndCreateFile(file, contents) {
    // Check if the file exists
    fs.access(file, fs.constants.F_OK, (err) => {
        if (err) {
            // File does not exist, create it with {}
            fs.writeFile(file, contents, (err) => {
                if (err) {
                    console.error(`Error creating file: ${err}`);
                }
            });
        } 
    });
}

// Function to get the values of an object and return them in an array
async function getArrayOn(obj) {
    return Object.values(obj);
}

// Function to check if file exists
async function fileExists(filePath) {
    try {
        fs.accessSync(filePath, fs.constants.F_OK);
        return true;
    } catch (err) {
        return false;
    }
}

// Add a contract and api key to the keyfile
async function addContract() {
    const contractName = instruction.contractName
    const key = apiKey.ea
    try {
        // Read the keyFile.json if it exists, otherwise create an empty object
        let keyFileData = {};
        if (fs.existsSync(keyFile)) {
            const rawData = fs.readFileSync(keyFile);
            keyFileData = JSON.parse(rawData);
        }

        // Check if the contractName already exists
        if (keyFileData.hasOwnProperty(contractName)) {
            display.error(`The contract name '${contractName}' already exists in keyFile.json.`);
        } else {
            // Add the new contractName and apiKey
            keyFileData[contractName] = key;

            // Write the updated data back to keyFile.json
            fs.writeFileSync(keyFile, JSON.stringify(keyFileData, null, 2));
            console.clear()
            console.log('')
            console.log(chalk.bold.yellow(`${contractName} has been added to the keyFile.`))
            console.log('')
        }
    } catch (error) {
        display.error(error)
    }
}

// Delete a contract and api key from the keyfile
async function deleteContract() {
    try {
    const contractName = instruction.contractName

    const rawData = fs.readFileSync(keyFile);
    let keyFileData = JSON.parse(rawData);


        // Check if the contractName exists
        if (keyFileData.hasOwnProperty(contractName)) {
            // Delete the contractName
            delete keyFileData[contractName];

            // Write the updated data back to keyFile.json
            fs.writeFileSync(keyFile, JSON.stringify(keyFileData, null, 2));
            console.clear()
            console.log('')
            console.log(chalk.bold.yellow(`${contractName} has been removed from the keyFile.`))
            console.log('')
        } else {
            display.error(`${contractName} doesn't exist in the keyFile.`)
        }
    } catch (error) {
        display.error(error)
    }
}

async function countFilesInDirectory(directoryPath) {
    try {
        const files = await fs.readdir(directoryPath);
        let fileCount = 0;

        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const stats = await fs.stat(filePath);

            if (stats.isFile()) {
                fileCount++;
            }
        }

        return fileCount;
    } catch (error) {
        console.error(error)
        //display.error('Error reading directory:', error);
    }
}

function isCallsFolderEmpty() {
    const callsFolderPath = path.join('.', 'calls');

    try {
        const files = fs.readdirSync(callsFolderPath);
        return files.length === 0;
    } catch (error) {
        console.error(`Error checking if folder is empty: ${error.message}`);
        return false;
    }
}

function isTicketsFolderEmpty() {
    const ticketsFolderPath = path.join('.', 'tickets'); // Fixed the variable name

    try {
        const files = fs.readdirSync(ticketsFolderPath);
        return files.length === 0;
    } catch (error) {
        console.error(`Error checking if folder is empty: ${error.message}`);
        return false;
    }
}


export const init = {
    checkAndCreateFile,
    checkAndCreateDirectory,
    getArrayOn,
    fileExists,
    countFilesInDirectory,
    isCallsFolderEmpty,
    isTicketsFolderEmpty
};

export const dirs = {
    calls,
    tickets,
    call_import,
    ticket_import
};

export const file = {
    keyFile,
    devToken
};

export const amendKeyFile = {
    addContract,
    deleteContract
}