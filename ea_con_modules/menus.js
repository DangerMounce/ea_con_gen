// This module contains all functions relating to user prompts and menus
import inquirer from 'inquirer'
import chalk from 'chalk'
import path from 'path'
import { fileURLToPath } from 'url';
import fs from 'fs'

import { apiUrl } from './eaApi.js';
import { display } from './display.js';
import {
    instructions,
    fileHandling
} from './filesAndFolders.js';

// Prompt the user for cluster
export async function clusterSelection() {
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
        console.log(clusterType)
        console.log(clusterType)
        if (clusterType === 'Exit') {
            console.clear('')
            process.exit(0)
        } else if (clusterType === 'EU Cluster') {
            return apiUrl.eu
        } else if (clusterType === 'Austrailian Cluster') {
            return apiUrl.aus
        } else if (clusterType === 'North American Cluster') {
            return apiUrl.us
        }

    } catch (error) {
        display.showError(error)
    }
}

// Prompt for contract selection
export async function contractSelection() {
    console.clear()
    display.statusMessage()
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const keyFilePath = './ea_con_modules/keyFile.json'
    // Read the existing content of the keyFile.json
    let keyFileData = {};
    try {
        const data = fs.readFileSync(keyFilePath, 'utf8');
        keyFileData = data.trim() ? JSON.parse(data) : {};
    } catch (err) {
        display.showError(err.message)
    }
    // List all keys in a numbered menu format
    const keys = Object.keys(keyFileData);
    if (keys.length === 0) {
        display.showError(`There's no contracts found in the keyFile.`)
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
        instructions.contractName = selectedKey;
        instructions.eaApiKey = keyFileData[selectedKey];
    }
}

// Function to prompt the user to select "Calls", "Tickets", or "Both"
export async function storedContactType() {
    // Validate
    const conversationDirectories = await fileHandling.checkConversationsInDirectories();
    const callsAvailable = conversationDirectories.hasMp3Files;
    const ticketsAvailable = conversationDirectories.hasJsonFiles;
    let bothAvailable = callsAvailable && ticketsAvailable;

    if (!callsAvailable || !ticketsAvailable) {
        display.message = `Calls in directory: ${callsAvailable} | Tickets in directory: ${ticketsAvailable}`;
    }
    console.clear();
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
                        disabled: !callsAvailable ? chalk.bold.red('⬤') : false
                    },
                    {
                        name: 'Tickets',
                        value: 'Tickets',
                        disabled: !ticketsAvailable ? chalk.bold.red('⬤') : false
                    },
                    {
                        name: 'Combination',
                        value: 'Combination',
                        disabled: !bothAvailable ? chalk.bold.red('⬤') : false
                    },
                    {
                        name: chalk.green('Exit'),
                        value: 'Exit'
                    }
                ]
            }
        ]);

        const selectedType = answers.contactType;
        console.log(selectedType);
        if (selectedType === 'Exit') {
            console.clear();
            process.exit(0);
        }
        return selectedType;
    } catch (error) {
        display.showError(error);
    }
}

// Function to prompt the user for the number of contacts to create
export async function numberOfContactsToCreate() {
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
        display.showError(error)
    }
}

// Function to prompt for the time interval between contacts
export async function delayBetweenContacts() {
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
        display.showError(error)
    }
}

// Function to prompt the user for a Yes or No response
export async function yesOrNo(question) {
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
        display.showError(error)
    }
}

// Prompt for import type
export async function importFolder(numberOfTicketUploads, numberOfCallUploads) {
    const callsAvailable = () => numberOfCallUploads !== 0;
    const ticketsAvailable = () => numberOfTicketUploads !== 0;
    console.clear()
    display.statusMessage()
    try {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'importType',
                message: chalk.bold.yellow('Select import folder:'),
                choices: [
                    {
                        name: `Calls (${numberOfCallUploads})`,
                        value: 'Calls',
                        disabled: !callsAvailable() ? chalk.bold.red('Import folder empty') : false
                    },
                    {
                        name: `Tickets (${numberOfTicketUploads})`,
                        value: 'Tickets',
                        disabled: !ticketsAvailable() ? chalk.bold.red('Import folder empty') : false
                    },
                    {
                        name: chalk.green('Exit'),
                        value: 'Exit'
                    }
                ]
            }
        ]);

        const importType = answers.importType;
        if (importType === 'Exit') {
            console.clear('')
            process.exit(0)
        } else if (importType === 'Calls') {
            return "import_calls"
        } else if (importType === 'Tickets') {
            return "import_tickets"
        } 
    } catch (error) {
        display.showError(error)
    }
}

export const menu = {
    clusterSelection,
    contractSelection,
    storedContactType,
    numberOfContactsToCreate,
    delayBetweenContacts,
    yesOrNo,
    importFolder
}