import fetch from 'node-fetch';
import mm from 'music-metadata';
import chalk from 'chalk';
import { access, unlink } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import inquirer from 'inquirer';

import {
    contractName,
    contactType,
    contactsToCreate,
    timeInterval,
    agentList
} from '../gen.js'

import {
    generateChat,
    generateNewChat
} from './generate_chat.js'

import {
    generateCall,
    generateNewCall
} from './generate_call.js'

import { writeLog, clearLog } from './generate_log.js';

const ea_con_gen = "ea Contact Manager"
const helpVersion = '' // when updating, prev version in here so that we know how old help is.
const version = '12.21.2' 


// This function returns the current date
export function getDate() {
    return new Date().toISOString().split('.')[0] + "Z";
}

//Displays the help text
export function showHelp() {
    titleText()
    console.log(chalk.underline.yellow('Help'), chalk.bold.green('V',helpVersion))
    console.log('')
    console.log(chalk.bold.yellow('node gen'), chalk.bold.green('[contract name]'), chalk.bold.blue('[contract name]'))
    console.log('')
    console.log('Adds a new contract and API key to the keyFile.')
    console.log('')
    console.log(chalk.bold.yellow('node gen'), chalk.bold.green('del'), chalk.bold.blue('[contract name]'))
    console.log('')
    console.log(`Deletes the contract and API key from the keyFile.`)
    console.log('')
    console.log(chalk.bold.yellow('node gen'), chalk.bold.green('contacts'))
    console.log('')
    console.log('Creates contacts and sends to evaluagent.')
    console.log('Select the contract from the list.')
    console.log('Confirm contact type, number of contacts and time interval between contacts.')
    console.log('Note that you must have MP3 audio files in the calls directory and the appropriate JSON files in the tickets directory.')
    console.log('')
    console.log(chalk.bold.blue('Contact Types'))
    console.log('')
    console.log('Select from stored calls or tickets.')
    console.log('To generate AI calls or Tickets select the NEW options.')
}

//This function returns the filename without the extension for the metadata
export async function fileNameOnly(filename) {
    // Remove the directory path
    let base = filename.split('/').pop();
    // Remove the file extension
    base = base.split('.').slice(0, -1).join('.');
    return base;
}

//This function returns a delay by the number of seconds
export function delay(seconds) {
    const ms = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, ms));
}

//This function looks for DS_Store in folders and deletes it
export async function deleteDsStoreFile() {
    const directories = ['../calls', '../tickets']
    for (const dir of directories) {
        const filePath = `${dir}/.DS_Store`;
        try {
            await access(filePath);  // Check if the file exists
            await unlink(filePath);  // Delete the file
            let dsData = ({dir,'DS_Store' : "deleted"})
            writeLog(dsData)
        } catch (error) {
            // If the file does not exist, access will throw an error
            if (error.code === 'ENOENT') {
            } else {
                // Log other errors
                let dsData = ({dir,'DS_Store' : error})
                writeLog(dsData)    
                console.error(`Error accessing or deleting .DS_Store in ${dir}:`, error);
            }
        }
    }
}

//This function generates a random metadata tag for status
export function getStatus() {
    let priorities = ['New', 'Open', 'Pending', 'Hold', 'Solved']
    let priority = Math.floor(Math.random() * priorities.length)
    return priorities[priority]
}

// Clears console and puts title back up
export function titleText() {
    console.clear('')
    console.log(chalk.bold.blue(`${ea_con_gen} Ver: ${version}`))
    console.log('')
}

//This function gets the duration of the audio file for the metadata
export async function getMP3Duration(filePath) {
    try {
        const metadata = await mm.parseFile(filePath);
        const duration = metadata.format.duration; // Duration in seconds
        const roundedDuration = Math.round(duration); // Round to nearest whole number
        return roundedDuration;
    } catch (error) {
        console.error("An error occurred:", error.message);
        return null;
    }
}

//Returns Uuid for unique numberical ref
export async function generateUuid() {
    const response = await fetch('https://www.uuidtools.com/api/generate/v1');
    const [uuid] = await response.json();
    return uuid;
}

// Check to ensure that the file passed through exists.  If not, create it.
async function ensureFileExists(file) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, '') // Create the file
        if (file.split('/').pop() === 'keyFile.json') {
            fs.writeFileSync(file, '{}', 'utf8');
        } else {
            // clearOutputLog()
        }
    } else {
        // File exists
    }
}

//Checks for required folders
export async function checkFilesAndFoldersExsists() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const directories = ['../calls', '../tickets'];
    const keyFilePath = path.join(__dirname, '../keyFile.json');
    const outputLogPath = path.join(__dirname, '../modules/log.json');
    directories.forEach(directory => {
        const dirPath = path.join(__dirname, directory)
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true }) // Create the files
        } else {
            // The file exists
        }
    })
    await ensureFileExists(outputLogPath)
    await ensureFileExists(keyFilePath)
}

// Function to add a new API key to the keyFile.json
export async function addNewApiKey(contractName, apiKey) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const keyFilePath = path.join(__dirname, '../keyFile.json');

    // Read the existing content of the keyFile.json
    let keyFileData = {};
    try {
        const data = fs.readFileSync(keyFilePath, 'utf8');
        keyFileData = JSON.parse(data);
    } catch (err) {
        console.error(chalk.red('Error reading or parsing keyFile.json:', err.message));
        return;
    }

    // Check if the contract already exists
    if (keyFileData.hasOwnProperty(contractName)) {
        console.log(chalk.red(`The contract '${contractName}' already exists in keyFile.json.`));
        return;
    }

    // Add the new API key
    keyFileData[contractName] = apiKey;

    // Write the updated content back to keyFile.json
    try {
        fs.writeFileSync(keyFilePath, JSON.stringify(keyFileData, null, 2), 'utf8');
        console.log('')
        console.log(chalk.green(`Successfully added '${contractName}' to keyFile.json.`));
        console.log('')
    } catch (err) {
        console.log('')
        console.error(chalk.red('Error writing to keyFile.json:', err.message));
        console.log('')
    }
}

// Function to delete an API key from the keyFile.json
export async function deleteApiKey(contractName) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const keyFilePath = path.join(__dirname, '../keyFile.json');

    // Ensure the file exists before modifying
    if (!fs.existsSync(keyFilePath)) {
        console.log(chalk.red('Error: keyFile.json does not exist.'));
        return;
    }

    // Read the existing content of the keyFile.json
    let keyFileData = {};
    try {
        const data = fs.readFileSync(keyFilePath, 'utf8');
        keyFileData = data.trim() ? JSON.parse(data) : {};
    } catch (err) {
        console.error(chalk.red('Error reading or parsing keyFile.json:', err.message));
        return;
    }

    // Check if the contract exists and delete the key-value pair
    if (keyFileData.hasOwnProperty(contractName)) {
        delete keyFileData[contractName];
        try {
            fs.writeFileSync(keyFilePath, JSON.stringify(keyFileData, null, 2), 'utf8');
            console.log(chalk.green(`Successfully deleted '${contractName}' from keyFile.json.`));
            console.log('')
        } catch (err) {
            console.error(chalk.red('Error writing to keyFile.json:', err.message));
        }
    } else {
        console.log(chalk.red(`The contract '${contractName}' does not exist in keyFile.json.`));
    }
}

// Function to list all keys in a numbered menu
export async function apiKeyMenu() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const keyFilePath = path.join(__dirname, '../keyFile.json');
    // Read the existing content of the keyFile.json
    let keyFileData = {};
    try {
        const data = fs.readFileSync(keyFilePath, 'utf8');
        keyFileData = data.trim() ? JSON.parse(data) : {};
    } catch (err) {
        console.error(chalk.red('Error reading or parsing keyFile.json:', err.message));
        return;
    }
    // List all keys in a numbered menu format
    const keys = Object.keys(keyFileData);
    if (keys.length === 0) {
        console.log(chalk.yellow('No API keys found in keyFile.json.'));
        process.exit(1)
    } else {
        console.clear('')
        titleText()
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedKey',
                message: 'Select a contract:',
                choices: keys.map((key, index) => ({
                    name: `${index + 1}. ${key}`,
                    value: key
                }))
            }
        ]);
        const selectedKey = answers.selectedKey;
        const selectedValue = keyFileData[selectedKey];
        return [selectedKey, selectedValue]
    }
}

//This function checks if either the calls or tickets directory is empty
async function directoryIsEmpty(directory) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const directoryPath = path.join(__dirname, directory);

    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                console.error(`An error occurred while reading the directory: ${err}`);
                reject(err); // Reject the promise if there's an error
                return;
            }

            // Resolve the promise with the result of whether the directory is empty
            resolve(files.length === 0);
        });
    });
}

//This function generates the contact template
export async function createContact() {
    let contactTemplate;
    let callDirectoryEmpty = await directoryIsEmpty('../calls')
    let ticketDirectoryEmpty = await directoryIsEmpty('../tickets')

    if (contactType === "Stored Calls") {
        if (callDirectoryEmpty) {
            console.log(chalk.red('No calls found in directory.'))
            let dsData = ({"Stored Calls" : "empty"})
            writeLog(dsData)
            process.exit(1)
        } else {
            contactTemplate = await generateCall(agentList)
        }
    } else if (contactType === "Stored Tickets") {
        if (ticketDirectoryEmpty) {
            console.log(chalk.red('No chats found in directory.'))
            let dsData = ({"Stored Chats" : "empty"})
            writeLog(dsData)
            process.exit(1)
        } else {
            contactTemplate = await generateChat(agentList)
        }
    } else if (contactType === "New Tickets") {
        contactTemplate = await generateNewChat(agentList)
    } else if (contactType === "New Calls [BETA]") {
        contactTemplate = await generateNewCall(agentList)
    }
    
    else { // If Stored Calls & Tickets
        if (callDirectoryEmpty) {
            console.log(chalk.red('No calls found in directory.'))
            let dsData = ({"Stored Calls" : "empty"})
            writeLog(dsData)
            process.exit(1)
        }
        if (ticketDirectoryEmpty) {
            console.log(chalk.red('No chats found in directory.'))
            let dsData = ({"Stored Chats" : "empty"})
            writeLog(dsData)
            process.exit(1)
        }
        const randomChoice = Math.floor(Math.random() * 2)
        if (randomChoice === 0) {
            contactTemplate = await generateChat(agentList)
        } else {
            contactTemplate = await generateCall(agentList)
        }
    }
    writeLog(contactTemplate)
    return contactTemplate
}

//This function handles the arguments from the node call
export async function nodeArguments(argumentError) {
    titleText()
    console.log(chalk.white('Error:',chalk.red(argumentError), chalk.white('Type'), chalk.yellow('node gen help')))
    console.log('')
}

//This function creates the summary of menu options
export async function showSelectionSummary() {
    titleText()
    console.log(chalk.bold.white('Contract Name:', chalk.blue(contractName)))
    console.log(chalk.bold.white('Contact Source:', chalk.blue(contactType)))
    console.log(chalk.bold.white('Number of Contacts:',chalk.blue(contactsToCreate)))
    console.log(chalk.bold.white('Time interval:', chalk.blue(timeInterval)))
    let dsData = ({"Contract Name" : contractName},
        {"Contact Source" : contactType},
        {"Number of Contacts" : contactsToCreate},
        {"Time Interval" : timeInterval})
    writeLog(dsData)
}

export function isCallsFolderEmpty() {
    const callsFolderPath = path.join('.', 'calls');

    try {
        const files = fs.readdirSync(callsFolderPath);
        return files.length === 0;
    } catch (error) {
        console.error(`Error checking if folder is empty: ${error.message}`);
        return false;
    }
}

export async function isStoredCallsAvailable() {
if (isCallsFolderEmpty()) {
    return true
} else {
    return false
}
}

export function isTicketsFolderEmpty() {
    const callsFolderPath = path.join('.', 'tickets');
    try {
        const files = fs.readdirSync(callsFolderPath);
        return files.length === 0;
    } catch (error) {
        console.error(`Error checking if folder is empty: ${error.message}`);
        return false;
    }
}

export async function isStoredTicketsAvailable() {
if (isTicketsFolderEmpty()) {
    return true
} else {
    return false
}
}

export async function isStoredTicketsAndsCallsAvailable() {
    const storedCallsAvailable = await isStoredTicketsAvailable()
    const storedTicketsAvailable = await isStoredCallsAvailable()

    if (storedCallsAvailable === true || storedTicketsAvailable === true) {
        return true 
    } else {
        return false
    }
}

export async function hasOpenAIAPIKey() {
    let openAIClient;
    try {
        openAIClient = new OpenAI({
            apiKey: process.env['OPENAI_API_KEY']
        });
    } catch (error) {
        return false
    }
}

export async function ensureEnvFileAndApiKey() {
    const envPath = path.join('./.env'); 
    const placeholderKey = 'OPENAI_API_KEY=placeholder_for_missing_api_key\n';
    
    try {
        // Check if .env exists
        if (fs.existsSync(envPath)) {
            // Read the content of .env
            const envContent = fs.readFileSync(envPath, 'utf8');
            // Check if OPENAI_API_KEY exists in the content
            if (!envContent.includes('OPENAI_API_KEY')) {
                // If key does not exist, append it
                fs.appendFileSync(envPath, placeholderKey);
                console.log('OPENAI_API_KEY added to existing .env file.');
            } else {
                console.log('OPENAI_API_KEY already exists in .env file.');
            }
        } else {
            // If .env does not exist, create it and add the placeholder key
            fs.writeFileSync(envPath, placeholderKey);
            console.log('.env file created with OPENAI_API_KEY placeholder.');
        }
    } catch (error) {
        console.error('Error handling .env file:', error);
    }
    }
    
