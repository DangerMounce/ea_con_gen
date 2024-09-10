// This module contains all functions relating to user prompts and menus 
import inquirer from 'inquirer'
import chalk from 'chalk'
import path from 'path'
import { fileURLToPath } from 'url';
import fs from 'fs'

import { api, instruction } from './variables.js';
import { display } from './display.js';
import { file, dirs, init } from './fileHandling.js';
import { importer, number } from './import.js';


// Prompt for cluster
async function clusterSelection() {
    console.clear()
    display.statusMessage()
    try {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'clusterType',
                message: chalk.bold.yellow('Select Cluster:'),
                choices: [
                    {
                        name: 'EU Cluster',
                        value: 'EU Cluster',
                    },
                    {
                        name: 'Austrailian Cluster',
                        value: 'Austrailian Cluster',
                    },
                    {
                        name: 'North American Cluster',
                        value: 'North American Cluster',
                    },
                    {
                        name: chalk.green('Exit'),
                        value: 'Exit'
                    }
                ]
            }
        ]);

        const clusterType = answers.clusterType;
        if (clusterType === 'Exit') {
            console.clear('')
            process.exit(0)
        } else if (clusterType === 'EU Cluster') {
            return api.euUrl
        } else if (clusterType === 'Austrailian Cluster') {
            return api.ausUrl
        } else if (clusterType === 'North American Cluster') {
            return api.usUrl
        }

    } catch (error) {
        display.error(error)
    }
}

// Prompt for contract selection
async function contractSelection() {
    let keyFilePath = file.keyFile
    console.clear()
    display.statusMessage()
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    // Read the existing content of the keyFile.json
    let keyFileData = {};
    try {
        const data = fs.readFileSync(keyFilePath, 'utf8');
        keyFileData = data.trim() ? JSON.parse(data) : {};
    } catch (err) {
        display.error(err.message)
    }
    // List all keys in a numbered menu format
    const keys = Object.keys(keyFileData);
    if (keys.length === 0) {
        display.error(`There's no contracts found in the keyFile.`)
    } else {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedKey',
                message: chalk.bold.yellow('Select Contract:'),
                choices: keys.map((key, index) => ({
                    name: `${index + 1}. ${key}`,
                    value: key
                }))
            }
        ]);
        const selectedKey = answers.selectedKey;
        instruction.contractName = selectedKey;
        return keyFileData[selectedKey]
    }
}

// Function to prompt for stored contact type
async function storedContactType() {
    // Validation required
    const callsAvailable = !await init.isCallsFolderEmpty(); // true if there are files
    const ticketsAvailable = !await init.isTicketsFolderEmpty(); // true if there are files
    const bothAvailable = callsAvailable && ticketsAvailable; // true if both folders have files

    console.log(callsAvailable, ticketsAvailable, bothAvailable)
    display.statusMessage();
    try {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'contactType',
                message: chalk.bold.yellow('Select contact source:'),
                choices: [
                    {
                        name: 'Calls',
                        value: 'Calls',
                        disabled: !callsAvailable ? chalk.bold.red('X') : false
                    },
                    {
                        name: 'Tickets',
                        value: 'Tickets',
                        disabled: !ticketsAvailable ? chalk.bold.red('X') : false
                    },
                    {
                        name: 'Combination',
                        value: 'Combination',
                        disabled: !bothAvailable ? chalk.bold.red('X') : false
                    },
                    {
                        name: chalk.green('Exit'),
                        value: 'Exit'
                    }
                ]
            }
        ]);


        const { contactType } = answers;

        if (contactType === 'Exit') {
            console.clear();
            process.exit(0);
        }
        return contactType;

    } catch (error) {
        display.error(error);
    }
}

// Function to prompt for stored contact type
async function importContactType() {
    number.ticketsToImport = await importer.getImportFileList(dirs.ticket_import)
    display.statusMessage()
    try {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'importContactType',
                message: chalk.bold.yellow('Select import source:'),
                choices: [
                    {
                        name: `Calls`,
                        value: 'Calls',
                        // disabled: !importedCallsAvailable ? chalk.bold.red('X') : false
                    },
                    {
                        name: `Tickets`,
                        value: 'Tickets',
                        // disabled: !importedTicketsAvailable ? chalk.bold.red('X') : false
                    },
                    {
                        name: chalk.green('Exit'),
                        value: 'Exit'
                    }
                ]
            }
        ]);

        const selectedImportType = answers.importContactType;
        if (selectedImportType === 'Tickets' && number.ticketsToImport.length === 0) {
            display.error('No tickets found in /ticket_import')
        }  
        if (selectedImportType === 'Exit') {
            console.clear();
            process.exit(0);
        }
        return selectedImportType;
    } catch (error) {
        display.error(error);
    }
}

// Function to prompt the user for the number of contacts to create
async function numberOfContactsToCreate() {
    console.clear();
    display.statusMessage();
    try {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'numberOfContacts',
                message: chalk.bold.yellow('How many contacts would you like to create?'),
                validate: function (value) {
                    const valid = !isNaN(parseFloat(value)) && isFinite(value) && parseInt(value, 10) > 0;
                    return valid || 'Please enter a positive number';
                },
                filter: Number
            }
        ]);

        const numberOfContacts = answers.numberOfContacts;
        return numberOfContacts;
    } catch (error) {
        display.error(error)
    }
}

// Function to prompt for the time interval between contacts
async function delayBetweenContacts() {
    console.clear();
    display.statusMessage();
    try {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'timeInterval',
                message: chalk.bold.yellow('Time interval between contacts (in seconds)?'),
                validate: function (value) {
                    const valid = !isNaN(parseFloat(value)) && isFinite(value) && parseInt(value, 10) > 0;
                    return valid || 'Please enter a positive number';
                },
                filter: Number
            }
        ]);

        const timeInterval = answers.timeInterval;
        return timeInterval;
    } catch (error) {
        display.error(error)
    }
}

// This function prompts for the audio file type
async function audioFileExtension() {
    try {
        const answer = await inquirer.prompt([
            {
                type: 'input',
                name: 'extension',
                message: chalk.bold.yellow('Please enter the audio file extension (ie mp3/wav etc):'),
                validate: function (input) {
                    // Basic validation to ensure the input is not empty
                    if (input.trim() === '') {
                        return 'Extension cannot be empty.';
                    }
                    return true;
                }
            }
        ]);

        // Extract the extension from the answer
        const { extension } = answer;
        return extension;

    } catch (error) {
        display.error('Error asking for audio file extension:', error);
    }
}

async function languageForConversation() {
    try {
        const answer = await inquirer.prompt([
            {
                type: 'input',
                name: 'language',
                message: chalk.bold.yellow('Please enter the conversation language:'),
                default: 'English', // Default language
                validate: function (input) {
                    // Basic validation to ensure the input is not empty
                    if (input.trim() === '') {
                        return 'Invalid';
                    }
                    return true;
                }
            }
        ]);

        // Extract the language from the answer
        const { language } = answer;
        return language;

    } catch (error) {
        display.error(error);
    }
}

// Function to prompt the user for a Yes or No response
async function yesOrNo(question) {
    console.log('') 
    try {
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmation',
                message: chalk.bold.yellow(question),
                default: false // Set default value as needed
            }
        ]);

        const confirmation = answers.confirmation;
        if (!confirmation) {
            process.exit(1)
        } else {
            return}
    } catch (error) {
        display.error(error)
    }
}

// Function to prompt for stored contact type
async function promptGptModel() {
    //validation required
    console.clear()
    display.statusMessage()
    try {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'modelType',
                message: chalk.bold.yellow('Select GPT model:'),
                choices: [
                    {
                        name: `gpt-4o`,
                        value: 'gpt-4o',
                    },
                    {
                        name: `gpt-4-turbo`,
                        value: 'gpt-4-turbo',
                    },
                    {
                        name: 'gpt-4',
                        value: 'gpt-4',

                    },
                    {
                        name: 'gpt-3.5-turbo',
                        value: 'gpt-3.5-turbo',

                    },
                    {
                        name: chalk.green('Exit'),
                        value: 'Exit'
                    }
                ]
            }
        ]);

        const selectedModel = answers.modelType;
        if (selectedModel === 'Exit') {
            console.clear();
            process.exit(0);
        }
        return selectedModel;
    } catch (error) {
        display.error(error);
    }
}

// Function to prompt for ai contact type
async function promptAiContactType() {
    console.clear()
    //validation required

    display.statusMessage()
    try {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'contactType',
                message: chalk.bold.yellow('Select contact type:'),
                choices: [
                    {
                        name: `Calls`,
                        value: 'New Calls',
                    },
                    {
                        name: `Tickets`,
                        value: 'New Tickets',
                    },
                    {
                        name: chalk.green('Exit'),
                        value: 'Exit'
                    }
                ]
            }
        ]);

        const selectedContactType = answers.contactType;
        if (selectedContactType === 'Exit') {
            console.clear();
            process.exit(0);
        }
        return selectedContactType;
    } catch (error) {
        display.error(error);
    }
}

export const menu = {
    clusterSelection,
    contractSelection,
    storedContactType,
    numberOfContactsToCreate,
    delayBetweenContacts,
    yesOrNo,
    importContactType,
    audioFileExtension,
    promptGptModel,
    promptAiContactType,
    languageForConversation
}