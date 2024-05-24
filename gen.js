import { time } from 'console';
import fetch from 'node-fetch';
import btoa from 'btoa';
import path from 'path';
import {
    checkFilesAndFoldersExsists,
    showHelp,
    nodeArguments,
    addNewApiKey,
    deleteApiKey,
    apiKeyMenu,
    showSelectionSummary,
    deleteDsStoreFile,
    ensureEnvFileAndApiKey,
    titleText,
    updateOpenAIKeyInEnv,
    clearDirectory,
    deleteFile,
    displayChangeLog
} from './modules/utils.js';

import { checkForChatUpdates, statusMessage } from './modules/library_sync.js'

await ensureEnvFileAndApiKey();

import {
    promptForPassword,
    promptContactType,
    promptNumberOfContacts,
    promptTimeInterval,
    promptYesOrNo,
    promptCluster,
    promptForOpenAiKey
} from './modules/user_prompts.js';

import {
    getAgentDetails,
    sendContacts
} from './modules/api_utils.js'

import {
    checkForUpdates,
    forceUpdate
} from './modules/auto_update.js';

import { writeLog, clearLog } from './modules/generate_log.js'

let password = null;
export let agentList = [];
let contractNameAndApiKey = [];
export let contactType = null;
export let contactsToCreate = null;
export let timeInterval = null;

export let cluster = null

const args = process.argv.slice(2);
export const instruction = args[0] // Can be "init", "add", "del", "help" or "contacts"
export let contractName = args[1] // Can only be a contract name
export let apiKey = args[2] // Can only be an api key
export let API_URL = null

await checkFilesAndFoldersExsists();
await ensureEnvFileAndApiKey();
await clearLog()
deleteDsStoreFile()

if (args.length === 0) {
    nodeArguments('Missing arguments')
}

// deal with the instruction
if (instruction.toLowerCase() === "add") {
    // Adding a new API Key
    // Check if arguments are no more than 3
    if (args.length > 3) {
        nodeArguments('Too many arguments.')
        process.exit(1)
    } else if (args.length === 1) {
        nodeArguments('Contact Name or API Key missing.')
    } else {
        addNewApiKey(contractName, apiKey)
    }
} else if (instruction.toLowerCase() === "del") {
    await checkForUpdates()
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
    await checkForUpdates()
    await checkForChatUpdates()
    titleText()
    API_URL = await promptCluster()
    titleText()
    contractNameAndApiKey = await apiKeyMenu()
    titleText()
    contractName = contractNameAndApiKey[0]
    apiKey = contractNameAndApiKey[1]
    agentList = await getAgentDetails(apiKey)
    titleText()
    contactType = await promptContactType()
    titleText()
    contactsToCreate = await promptNumberOfContacts()
    titleText()
    timeInterval = await promptTimeInterval()
    showSelectionSummary()
    await promptYesOrNo()
    showSelectionSummary()
    sendContacts(contactsToCreate)
} else if (instruction.toLowerCase() === "update") {
    await forceUpdate()
} else if (instruction.toLowerCase() === "openai") {
    const ApiKeyForOpenAI = await promptForOpenAiKey()
    updateOpenAIKeyInEnv(ApiKeyForOpenAI)
} else if (instruction.toLowerCase() === "clear") {
    if (contractName === "chats") {
        await clearDirectory("tickets")
        const chatVersionLogPath = path.join('./modules/chatVersion.log');
        await deleteFile(chatVersionLogPath);
        process.exit(0)
    } else {
        // await clearDirectory("calls")
        // const callVersionLogPath = path.join('./modules/callVersion.log');
        // await deleteFile(callVersionLogPath);
        // process.exit(0)
    }
} else {
    nodeArguments('Invalid Arguments.')
}




