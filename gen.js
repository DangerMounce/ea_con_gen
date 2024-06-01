import { time } from 'console';
import fetch from 'node-fetch';
import btoa from 'btoa';
import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
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
    showVersion,
    getImportFileList
} from './modules/utils.js';

import { generateChatFromCSV } from './modules/generate_chat.js'

import {
    importConversationAndMetaData
} from './modules/converter.js'

import { checkForChatUpdates, checkForCallUpdates, statusMessage } from './modules/library_sync.js';

await ensureEnvFileAndApiKey();

import {
    promptForPassword,
    promptContactType,
    promptNumberOfContacts,
    promptTimeInterval,
    promptYesOrNo,
    promptCluster,
    promptForOpenAiKey,
    readyToUpload,
    readyToProcessQueue,
    readyForNextOne
} from './modules/user_prompts.js';

import {
    getAgentDetails,
    sendContacts,
    sendCsvContact
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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const importDir = path.join(__dirname, 'import');



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

    if (contactsToCreate > 1) {
        titleText()
        timeInterval = await promptTimeInterval()
    } else { timeInterval = 0 }
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
} else if (instruction.toLowerCase() === "import") {
    await checkFilesAndFoldersExsists();
    await ensureEnvFileAndApiKey();
    await checkForUpdates()
    titleText()
    API_URL = await promptCluster()
    titleText()
    contractNameAndApiKey = await apiKeyMenu()
    titleText()
    contractName = contractNameAndApiKey[0]
    apiKey = contractNameAndApiKey[1]
    agentList = await getAgentDetails(apiKey)
    titleText()
    console.log(chalk.bold.white('Contract Name:', chalk.blue(contractName)))
    const importFileList = await getImportFileList()
    console.log(chalk.bold.white(`Files in the import queue:`, chalk.blue(importFileList.length)))
    if (importFileList.length === 0) {
        console.log(chalk.bold.red('No files found in the import folder.'))
        process.exit(0)
    }
    const createConfirmation = await readyToProcessQueue() // Ready to start processing the queue?

    // For each file, do all of this but with each item in the array
    for (let i = 0; i < importFileList.length; i++) {
        // Read the filename
        let fileName = importFileList[i]
        console.log(fileName)
        const targetFile = path.join(importDir, fileName)
        // Call importConversationAndMetaData and await its result
        try {
            console.clear('')
            console.log('')
            console.log(`${chalk.bold.white(importFileList.indexOf(fileName) + 1)}/${chalk.bold.white(importFileList.length)} - ${fileName}`)
            const conversationData = await importConversationAndMetaData(targetFile);
            const responses = conversationData[0]
            const metaDataInFile = conversationData[1]
            await writeLog('==> Message Array from CSV:')
            await writeLog(responses)
            await writeLog(metaDataInFile)
            console.log('')
            console.log(chalk.bold.underline('Transcript loaded from CSV:'))
            responses.forEach(response => {
                if (response.speaker_is_customer) {
                    console.log(chalk.bold.green('Customer:'), response.message);
                } else {
                    console.log(chalk.bold.yellow('Agent:'), response.message);
                }
            });
            console.log('')
            console.log(chalk.bold.cyan('Meta-Data:'))
            console.log(metaDataInFile)

            await readyToUpload()

            //Upload - processing queue start
            const chatTemplate = await generateChatFromCSV(agentList, responses, metaDataInFile)
            contactsToCreate = 1
            await sendCsvContact(chatTemplate)
            await readyForNextOne()
        } catch (error) {
            console.error(`Error processing file ${fileName}:`, error);

        }
    }
    console.log('Processing Complete')

} else {
    nodeArguments('Invalid Arguments.')
}



