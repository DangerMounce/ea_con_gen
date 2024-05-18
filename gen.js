import { time } from 'console';
import fetch from 'node-fetch';
import btoa from 'btoa';
import {
    checkFilesAndFoldersExsists,
    showHelp,
    nodeArguments,
    addNewApiKey,
    deleteApiKey,
    apiKeyMenu,
    showSelectionSummary,
    clearOutputLog,
    writeData,
    deleteDsStoreFile
} from './modules/utils.js';

import {
    promptForPassword,
    promptContactType,
    promptNumberOfContacts,
    promptTimeInterval,
    promptYesOrNo
} from './modules/user_prompts.js';

import {
    getAgentDetails,
    sendContacts
} from './modules/api_utils.js'

import {
    checkForUpdates
} from './modules/auto_update.jss'

let password = null;
export let agentList = [];
let contractNameAndApiKey = [];
export let contactType = null;
export let contactsToCreate = null;
export let timeInterval = null;

// let args = process.argv.slice(2);
// let encryptionKey = null
// let keyFileEncrypted
// let password
// let agentRoleId
// let key
// let agentList = [];
// let contractName = null;

const args = process.argv.slice(2);
const instruction = args[0] // Can be "init", "add", "del", "help" or "contacts"
export let contractName = args[1] // Can only be a contract name
export let apiKey = args[2] // Can only be an api key

await checkFilesAndFoldersExsists();
deleteDsStoreFile()
clearOutputLog()
// deal with the instruction
if (instruction.toLowerCase() === "add") { 
    // Adding a new API Key
    // Check if arguments are no more than 3
    if (args.length > 3) {
        nodeArguments('Too many arguments.')
        process.exit(1)
    } else {
        addNewApiKey(contractName, apiKey)
    }
} else if (instruction.toLowerCase() === "del") {  
    // Deleting an existing API key
    // Check if arguments are no more than 3
    if (args.length > 3) {
        nodeArguments('Too many arguments.')
        process.exit(1)
    } else {
        deleteApiKey(contractName)
    }
} else if (instruction.toLowerCase() === "help") {  
    // Show help screen
    showHelp()
} else if (instruction.toLowerCase() === "contacts") {  
    // Add contacts
    contractNameAndApiKey = await apiKeyMenu()
    contractName = contractNameAndApiKey[0]
    apiKey = contractNameAndApiKey[1]
    agentList = await getAgentDetails(apiKey)
    contactType = await promptContactType()
    contactsToCreate = await promptNumberOfContacts()
    timeInterval = await promptTimeInterval()
    showSelectionSummary()
    await promptYesOrNo()
    showSelectionSummary()
    sendContacts(contactsToCreate)
} else if (instruction.toLowerCase() === "lock") {  

} else if (instruction.toLowerCase() === "unlock") {  
    
} else {
    nodeArguments('Invalid Arguments.')
}
// if it's add then we'll be adding and API


await checkForUpdates()

async function archiveMain() {
if (process.argv.length <= 2) {
    titleText()
    console.log('Error:', chalk.bold.red(`Arguments missing.  Type`), chalk.yellow('node gen help'))
    console.log('')
} else if (args[0].toLowerCase() === 'help') {
    showHelp()
} else if (args[0].toLowerCase() === 'add') {
    if (args.length === 3) {
        console.log('12345')
    } else {
        console.log('Error: ', chalk.red('Invalid arguments.  Type'), chalk.yellow('node gen help'))
    }
    await checkFilesAndFoldersExsists()
    let contract = args[1]
    let apiKey = args[2]
    console.log('')
    await addNewApiKey(contract, apiKey)

} else if (args[0].toLowerCase() === 'del') { // Delete a key
    await checkFilesAndFoldersExsists()
    await deleteApiKey(args[1])
} else if (args[0].toLowerCase() === 'init') { // Setup files
    checkFilesAndFoldersExsists()
} else if (args[0].toLowerCase() === 'contacts') { // for contacts
    await checkFilesAndFoldersExsists()
    key = await selectApiKey()
    await getAgentDetails()
    titleText()
    console.log('Contract:', chalk.green(contractName))
    contactType = await promptContactType()
    contactsToCreate = await promptNumberOfContacts()
    timeInterval = await promptTimeInterval()
    titleText()
    console.log('Contract:', chalk.green(contractName))
    console.log('Number of contacts:', chalk.green(contactsToCreate))
    console.log('Contact Type:', chalk.green(contactType))
    console.log('Time interval:', chalk.green(`${timeInterval} seconds`))
    console.log('')
    await promptYesOrNo()
    sendContacts(contactsToCreate)
} else if (args[0].toLowerCase() === 'lock') { // Just so I can lock the file
    password = await promptForPassword()
} else {
    console.log('Error: ', chalk.red('Invalid arguments.  Type'), chalk.yellow('node gen help'))
}
}
