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
                        name: 'Stored Calls',
                        value: 'Stored Calls',
                        disabled: isStoredCallsFeatureDisabled ? chalk.bold.red('not available') : false
                    },
                    {
                        name: 'Stored Tickets',
                        value: 'Stored Tickets',
                        disabled: isStoredTicketsFeatureDisabled ? chalk.bold.red('not available') : false
                    },
                    {
                        name: 'Stored Calls & Tickets',
                        value: 'Stored Calls & Tickets',
                        disabled: isStoredTicketsAndCallsFeatureDisabled ? chalk.bold.red('not available') : false
                    },
                    {
                        name: chalk.blue('New Tickets', chalk.bold.blue('BETA')),
                        value: 'New Tickets',
                        disabled: clientIsValid ? chalk.bold.red('not available - API key missing') : false
                    },
                    {
                        name: chalk.blue('New Calls', chalk.bold.blue('BETA')),
                        value: 'New Calls [BETA]',
                        disabled: clientIsValid ? chalk.bold.red('not available - API key missing') : false
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