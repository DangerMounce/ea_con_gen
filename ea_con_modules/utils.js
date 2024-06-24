// This module contains the high level instruction functions
import {
    instructions
} from './filesAndFolders.js'
import { apiUrl, eaApi } from './eaApi.js';
import { menu } from './menus.js'
import { spinner } from './progress.js';
import { display } from './display.js';
import { importer, dirs } from './importer.js'
import chalk from 'chalk'
import { writeToLog } from './contactGenerator.js';
import { sync, library} from './librarySync.js';
import fs from 'fs'
import { ai } from './openAiContacts.js';

async function instructionContacts() {
    // Select the cluster
    apiUrl.ea = await menu.clusterSelection()
    // Select the contract
    await menu.contractSelection()
    // Get the agent list
    console.clear()
    spinner.connectingToEndPoint()
    eaApi.agentList = await eaApi.getAgentDetails()
    spinner.stopAnimation()
    // Select the contact type
    instructions.contactType = await menu.storedContactType()
    // Select the number of contacts
    instructions.numberOfContacts = await menu.numberOfContactsToCreate()
    // Get time interval if number of contacts is more than 1
    if (instructions.numberOfContacts > 1) {
        instructions.timeInterval = await menu.delayBetweenContacts()
    }
    await display.summary()
    await menu.yesOrNo('Ready to begin upload?')
    eaApi.sendContactsToEvaluagent(instructions.numberOfContacts)
}

async function instructionImport() {

    apiUrl.ea = await menu.clusterSelection()
    await menu.contractSelection()
    console.clear()
    spinner.connectingToEndPoint()
    eaApi.agentList = await eaApi.getAgentDetails()
    spinner.stopAnimation()
    let numberOfTicketUploads = await importer.getImportFileList(dirs.ticketImport)
    let numberOfCallUploads = await importer.getImportFileList(dirs.callImport)
    numberOfTicketUploads = numberOfTicketUploads.length
    numberOfCallUploads = numberOfCallUploads.length
    const callOrTicket = await menu.importFolder(numberOfTicketUploads, numberOfCallUploads)
    await writeToLog(callOrTicket)
    if (callOrTicket === "import_tickets") {
        const importFileList = await importer.getImportFileList(dirs.ticketImport)
        if (importFileList.length === 0) {
            display.showError('Import folder empty.')
        }
        await display.summary()
        console.log(`${chalk.bold.yellow('Number of files in queue:')} ${importFileList.length}`)
        await menu.yesOrNo('Ready to begin processing queue?')
        importer.processCSVContent(importFileList)
    } else if (callOrTicket === 'import_calls') {
         eaApi.agentList = await eaApi.getAgentDetails()
         spinner.stopAnimation()
         const importFileList = await importer.getImportFileList(dirs.callImport)
         if (importFileList.length === 0) {
             display.showError('Import folder empty.')
         }
         await display.summary()
         console.log(`${chalk.bold.yellow('Number of files in queue:')} ${importFileList.length}`)
         await menu.yesOrNo('Ready to begin processing queue?')
         importer.processCallAndCSVContent(importFileList)
    } else {
        display.showError('Invalid arguments')
    }
}

async function syncLibraries() {

    await deleteFile(library.callVersionFilePath)
    await deleteFile(library.chatVersionFilePath)
    display.summary()
    await sync.checkForCallUpdates()
    display.summary()
    await sync.checkForChatUpdates()
}

async function deleteFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                reject(new Error(`File does not exist: ${filePath}`));
                return;
            }
            
            fs.unlink(filePath, (err) => {
                if (err) {
                    reject(new Error(`Error deleting file: ${err.message}`));
                } else {
                    resolve();
                }
            });
        });
    });
}

async function newContact() {
    // Select the cluster
    apiUrl.ea = await menu.clusterSelection()
    // Select the contract
    await menu.contractSelection()
    // Get the agent list
    console.clear()
    spinner.connectingToEndPoint()
    eaApi.agentList = await eaApi.getAgentDetails()
    spinner.stopAnimation()
    // Select the contact type
    instructions.contactType = await menu.newContactSelection()
    // Select the language
    ai.language = await menu.languageSelection()
    // Select the number of contacts
    instructions.numberOfContacts = await menu.numberOfContactsToCreate()
    // Get time interval if number of contacts is more than 1
    if (instructions.numberOfContacts > 1) {
        instructions.timeInterval = await menu.delayBetweenContacts()
    }
    await display.summary()
    await menu.yesOrNo('Ready to begin upload?')
}

export const utils = {
    instructionContacts,
    instructionImport,
    syncLibraries,
    newContact
}