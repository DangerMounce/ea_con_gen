import chalk from 'chalk';
import inquirer from 'inquirer';

import { 
    isStoredCallsAvailable,
    isStoredTicketsAvailable,
    isStoredTicketsAndsCallsAvailable,
    hasOpenAIAPIKey
 } from './utils.js'


import { clientIsValid } from './chat_gen.js'

// Prompts for the password to encrypt the keyfile
export async function promptForPassword() {
    try {
        const response = await inquirer.prompt([
            {
                name: 'password',
                type: 'password',
                message: 'Enter password for the keyFile:',
                mask: '*'
            }
        ])
        console.log('')
        return response.password
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`))
        process.exit(1)
    }
}

// Function to prompt the user to select "Calls", "Tickets", or "Both"
export async function promptContactType() {
    let isStoredCallsFeatureDisabled = await isStoredCallsAvailable();
    let isStoredTicketsFeatureDisabled = await isStoredTicketsAvailable();
    let isStoredTicketsAndCallsFeatureDisabled = await isStoredTicketsAndsCallsAvailable();;
    let isOpenAiAvailable = await hasOpenAIAPIKey();
    try {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'contactType',
                message: 'Select contact source:',
                choices: [
                    {
                        name: 'Existing Calls',
                        value: 'Stored Calls',
                        disabled: isStoredCallsFeatureDisabled ? chalk.bold.red('no calls found') : false
                    },
                    {
                        name: 'Existing Tickets',
                        value: 'Stored Tickets',
                        disabled: isStoredTicketsFeatureDisabled ? chalk.bold.red('no tickets found') : false
                    },
                    {
                        name: 'Stored Calls & Tickets',
                        value: 'Stored Calls & Tickets',
                        disabled: isStoredTicketsAndCallsFeatureDisabled ? chalk.bold.red('not available') : false
                    },
                    {
                        name: 'New Tickets',
                        value: 'New Tickets',
                        disabled: clientIsValid ? chalk.bold.red('no OpenAI API key') : false
                    },
                    {
                        name: 'New Calls',
                        value: 'New Calls',
                        disabled: clientIsValid ? chalk.bold.red('no OpenAI API key') : false
                    },
                    {
                        name: chalk.green('Exit'),
                        value: 'Exit'
                    }
                ]
            }
        ]);

        const selectedType = answers.contactType;
        console.log(selectedType)
        if (selectedType === 'Exit') {
            console.clear('')
            process.exit(0)
        }
        return selectedType;
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1)
    }
}

// Function to prompt the user for the number of contacts to create
export async function promptTimeInterval() {
    try {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'timeInterval',
                message: 'Time interval in seconds? (does not include new chat generation time)',
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
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1)
    }
}

// Function to prompt the user for the number of contacts to create
export async function promptNumberOfContacts() {
    try {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'numberOfContacts',
                message: 'How many contacts would you like to create?',
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
        console.error(chalk.red(`Error: ${error.message}`));
    }
}

// Function to prompt the user for a Yes or No response
export async function promptYesOrNo() {
    console.log('')
  
    try {
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmation',
                message: 'Ready?',
                default: false // Set default value as needed
            }
        ]);

        const confirmation = answers.confirmation;
        if (!confirmation) {
            process.exit(1)
        } else {
            return}
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1)
    }
}

// Function to prompt the user for cluster"
export async function promptCluster() {
    try {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'clusterType',
                message: 'Select cluster::',
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
            return 'https://api.evaluagent.com/v1'
        } else if (clusterType === 'Austrailian Cluster') {
            return 'https://api.aus.evaluagent.com/v1'
        } else if (clusterType === 'North American Cluster') {
            return 'https://api.us-east.evaluagent.com/v1'
        }

    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1)
    }
}

//Prompts user for openAi API key
// Prompts for the password to encrypt the keyfile
export async function promptForOpenAiKey() {
    try {
        const response = await inquirer.prompt([
            {
                name: 'openAiApiKey',
                type: 'openAiApiKey',
                message: 'Enter your OpenAI API Key:',
            }
        ])
        console.log('')
        return response.openAiApiKey
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`))
        process.exit(1)
    }
}

// Function to prompt the user for a Yes or No response
export async function readyToUpload() {
    console.log('')
  
    try {
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmation',
                message: chalk.bold.green('Ready to upload?'),
                default: false // Set default value as needed
            }
        ]);

        const confirmation = answers.confirmation;
        if (!confirmation) {
            process.exit(1)
        } else {
            return}
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1)
    }
}

export async function readyToProcessQueue() {
    console.log('')
  
    try {
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmation',
                message: chalk.bold.green('Ready to begin processing queue?'),
                default: false // Set default value as needed
            }
        ]);

        const confirmation = answers.confirmation;
        if (!confirmation) {
            process.exit(1)
        } else {
            return}
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1)
    }
}

export async function readyForNextOne() {
    console.log('')
  
    try {
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmation',
                message: chalk.bold.green('Ready for next one?'),
                default: false // Set default value as needed
            }
        ]);

        const confirmation = answers.confirmation;
        if (!confirmation) {
            process.exit(1)
        } else {
            return}
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1)
    }
}