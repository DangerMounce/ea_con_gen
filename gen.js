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
    encryptFile,
    decryptFile
} from './modules/encryption.js';

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
} from './modules/api_utils.js';

import {
    checkForUpdates
} from './modules/auto_update.js'

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


await checkForUpdates()

await checkFilesAndFoldersExsists();
deleteDsStoreFile()
clearOutputLog()
// deal with the instruction
if (args.length === 0) {
    nodeArguments('There\'s no arguments!')
    process.exit(1)
}
if (instruction.toLowerCase() === "add") { 
    // Adding a new API Key
    // Check if arguments are no more than 3
    if (args.length > 3) {
        nodeArguments('Too many arguments.')
        process.exit(1)
    } else {
        password = await promptForPassword()
        decryptFile(password)
        addNewApiKey(contractName, apiKey)
        encryptFile(password)
    }
} else if (instruction.toLowerCase() === "del") {  
    // Deleting an existing API key
    // Check if arguments are no more than 3
    if (args.length > 3) {
        nodeArguments('Too many arguments.')
        process.exit(1)
    } else {
        password = await promptForPassword()
        decryptFile(password)
        deleteApiKey(contractName)
        encryptFile(password)
    }
} else if (instruction.toLowerCase() === "help") {  
    // Show help screen
    showHelp()
} else if (instruction.toLowerCase() === "contacts") {  
    // Add contacts
    const password = await promptForPassword()
    decryptFile(password)
    contractNameAndApiKey = await apiKeyMenu()
    contractName = contractNameAndApiKey[0]
    apiKey = contractNameAndApiKey[1]
    encryptFile(password)
    agentList = await getAgentDetails(apiKey)
    contactType = await promptContactType()
    contactsToCreate = await promptNumberOfContacts()
    timeInterval = await promptTimeInterval()
    showSelectionSummary()
    await promptYesOrNo()
    showSelectionSummary()
    sendContacts(contactsToCreate)
} else if (instruction.toLowerCase() === "lock") {  
    // for testing - to lock the keyfile
    const password = await promptForPassword()
    encryptFile(password)
} else if (instruction.toLowerCase() === "unlock") {  
    // for testing - to unlock the keyfile
    const password = await promptForPassword()
    decryptFile(password)
} else {
    nodeArguments('Invalid Arguments.')

}


// if it's add then we'll be adding and API
