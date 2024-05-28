import { time } from 'console';
import fetch from 'node-fetch';
import btoa from 'btoa';
import fs from 'fs';
import chalk from 'chalk';
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
    displayChangeLog,
    showVersion
} from './modules/utils.js';

import { checkForChatUpdates, checkForCallUpdates, statusMessage } from './modules/library_sync.js';
import { parseCSVFile, checkAndInstallCsvParser } from './modules/call_script.js'

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
    sendContacts,
} from './modules/api_utils.js'

import {
    checkForUpdates,
    forceUpdate
} from './modules/auto_update.js';

import { writeLog, clearLog } from './modules/generate_log.js'
import { version } from 'os';
import { generateAudio } from './modules/audio_generator.js';

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



if (args.length === 0) {
    nodeArguments('Missing arguments')
}

// deal with the instruction
if (instruction.toLowerCase() === "add") {
    await checkFilesAndFoldersExsists();
    await ensureEnvFileAndApiKey();
    await deleteDsStoreFile()
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
    await checkFilesAndFoldersExsists();
    await ensureEnvFileAndApiKey();
    await deleteDsStoreFile()
    await checkForUpdates()
    // Deleting an existing API key
    // Check if arguments are no more than 3
    if (args.length > 3) {
        nodeArguments('Too many arguments.')
        process.exit(1)
    } else {
        deleteApiKey(contractName)
    }
} else if (instruction.toLowerCase() === "changelog") {
    // Show  changelog
    await displayChangeLog()
    process.exit(0)
} else if (instruction.toLowerCase() === "help") {
    // Show help screen
    showHelp()
} else if (instruction.toLowerCase() === "contacts") {
    await checkFilesAndFoldersExsists();
    await ensureEnvFileAndApiKey();
    await clearLog()
    await deleteDsStoreFile()
    await checkForUpdates()
    await checkForChatUpdates()
    await checkForCallUpdates()
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
        await writeLog('==>Chat directory cleared')
        process.exit(0)
    } else if (contractName === 'log') {
        await clearLog()
        console.log('Log cleared')
        process.exit(0)
    } else {
        await clearDirectory("calls")
        const callVersionLogPath = path.join('./modules/callVersion.log');
        await deleteFile(callVersionLogPath);
        await writeLog('==>Calls directory cleared')
        process.exit(0)
    }
} else if (instruction.toLowerCase() === "log") {
    const logFilePath = path.join('modules', 'log.json');

    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the log file:', err.message);
            return;
        }

        console.log('Log file contents:');
        console.log(data);
    });
} else if (instruction.toLowerCase() === "ver") {
    await writeLog('==>showVesion')
    showVersion();
} else if (instruction.toLowerCase() === "create") {
    await checkAndInstallCsvParser()
    const data = await parseCSVFile('script.csv')
    await writeLog('==> Message Array from CSV:')
    await writeLog(data)
    console.log(chalk.bold('Transcript loaded from CSV:'))
    data.forEach(item => {
        if (item.speaker_is_customer) {
            console.log(chalk.bold.green('Customer:'), item.message);
        } else {
            console.log(chalk.bold.yellow('Agent:'), item.message);
        }
    });
    const createConfirmation = await promptYesOrNo()
    generateAudio(data)
} else {
    nodeArguments('Invalid Arguments.')
}




