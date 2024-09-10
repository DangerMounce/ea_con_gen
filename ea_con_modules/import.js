// This module has all the functions for importing conversations from the folders

import fs, { write } from 'fs'; //
import path from 'path';
import csv from 'csv-parser';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

import { dirs } from './fileHandling.js';
import { instruction } from './variables.js';
import { menu } from './menus.js';
import { generate } from './contactGenerator.js';
import { evaluagent } from './eaApi.js';

let uploadFileType = ".mp3"
let callsToImport = 0;
let ticketsToImport = 0;
let callMetaDataFiles = 0;

// This function builds the import queue
function getImportFileList(uploadDirectory, audioFileType) {
    const fileNamesArray = [];
    return new Promise((resolve, reject) => {
        fs.readdir(uploadDirectory, (err, files) => {
            if (err) {
                reject(`Unable to scan directory: ${err}`);
            } else {
                files.forEach((file) => {
                    fileNamesArray.push(file);
                });
                if (uploadDirectory === dirs.ticket_import) {
                resolve(fileNamesArray.filter(file => file.endsWith('.csv')));
                } else {
                    resolve(fileNamesArray.filter(file => file.endsWith(`.${audioFileType}`)));
                }
            }
        });
    });
}

// This function imports the CSV content from the ticket folder
async function processTickets(importFileList) {
    // For each file, do all of this but with each item in the array
    for (let i = 0; i < importFileList.length; i++) { 
        // Read the filename
        let fileName = importFileList[i]
        const targetFile = path.join(dirs.ticket_import, fileName)
        // Call importConversationAndMetaData and await its result
        try {
            console.clear('')
            console.log('')
            console.log(chalk.bold.yellow(`Processing file ${importFileList.indexOf(fileName) + 1}/${importFileList.length}`))
            console.log(chalk.bold.yellow('File:'), fileName)
            const conversationData = await importConversationAndMetaData(targetFile);
            const responses = conversationData[0]
            const metaDataInFile = conversationData[1]
            console.log('')
            console.log(chalk.bold.yellow('Chat Transcript:'))
            responses.forEach(response => {
                if (response.speaker_is_customer) {
                    console.log(chalk.bold.green('Customer:'), response.message);
                } else {
                    console.log(chalk.bold.cyan('Agent:'), response.message);
                }
            });
            console.log('')
            console.log(chalk.bold.cyan('Meta-Data:'))
            console.log(metaDataInFile)
            await menu.yesOrNo(`OK to send this ticket to ${instruction.contractName}?`)
            //Upload - processing queue start
            const chatTemplate = await generate.csvContactTemplate(evaluagent.agentList, responses, metaDataInFile)
            await evaluagent.sendCsvContact(chatTemplate)
            await menu.yesOrNo('Ready to process next file?')
        } catch (error) {
            console.error(`Error processing file ${fileName}:`, error);

        }
    }
    console.clear('')
    console.log(chalk.bold.yellow('Processing Complete'))

}

// This function brings in the call and related CSV metadata
async function processCallAndCSVContent(importFileList) {
    // For each file, do all of this but with each item in the array
    for (let i = 0; i < importFileList.length; i++) { 
        // Read the filename
        let fileName = importFileList[i]
        const targetFile = path.join(dirs.call_import, fileName)
        const metadataFile = await changeExtensionToCSV(targetFile)
        try {
            console.clear('')
            console.log('')
            console.log(chalk.bold.yellow(`Processing file ${importFileList.indexOf(fileName) + 1}/${importFileList.length}`))
            console.log('')
            console.log(chalk.bold.yellow('Target Audio File:'), fileName)
            const callMetadata = await getMetadataFromCSV(metadataFile)
            process.stdout.write(chalk.bold.cyan(`Metadata found in ${await changeExtensionToCSV(fileName)}:`))
            console.log(callMetadata)
            console.log('')
            await menu.yesOrNo(`OK to upload to ${instruction.contractName}?`)
            //Upload - processing queue start
            const chatTemplate = await generate.callFromImport(fileName, callMetadata)
            await evaluagent.sendImportedContact(chatTemplate)
            await menu.yesOrNo('Ready to process next file?')
        } catch (error) {
            console.error(`Error processing file ${fileName}:`, error);

        }
    }
    console.log('Processing Complete')

}

// Function to change file extension from to .csv
async function changeExtensionToCSV(filePath) {
    return path.format({
        ...path.parse(filePath),
        base: undefined, // Ensures that base is not used when formatting
        ext: '.csv' // Set the new extension
    });
}

// This function gets the metadata from the CSV file in the call import folder
async function getMetadataFromCSV(filePath) {
    return new Promise((resolve, reject) => {
        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            resolve("No additional metadata");
            return;
        }

        const results = [];
        let headers = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                if (headers.length === 0) {
                    headers = Object.keys(row);
                }
                const obj = {};
                headers.forEach(header => {
                    obj[header] = row[header];
                });
                results.push(obj);
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(`Error reading CSV file: ${error.message}`);
            });
    });
}

async function importConversationAndMetaData(targetFile) {
    const responseData = await createResponseArray(targetFile);
    const responseArray = responseData[0];
    const metaDataArray = responseData[1];

    if (!Array.isArray(responseArray) || !Array.isArray(metaDataArray)) {
        throw new Error('Failed to create import array array')
    }

    return [responseArray, metaDataArray]

}

// This function creates the response array needed for the chat template.
async function createResponseArray(targetFile) {
    try {
        const { results, additionalData } = await parseCSVFile(targetFile);
        // console.log('Parsed CSV data:', results, additionalData);
        return [results, additionalData]
        // return results;
    } catch (error) {
        console.error('Error creating response array:', error);
        return `FAIL - ${error}`;
    }
}

// This function gets the data from the CSV file
async function parseCSVFile(filePath) {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const results = [];
    const additionalData = [];
    let headers = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('headers', (hdrs) => {
                headers = hdrs;
            })
            .on('data', (data) => {
                const message = data[headers[0]];
                const speakerIsCustomer = data[headers[1]];

                // Check if both fields are present and valid
                if (message && speakerIsCustomer !== undefined) {
                    results.push({
                        message: message,
                        speaker_is_customer: speakerIsCustomer.toLowerCase() === 'true'
                    });

                    const additionalCols = {};
                    headers.slice(2).forEach((header) => {
                        if (data[header]) {
                            additionalCols[header] = data[header];
                        }
                    });

                    if (Object.keys(additionalCols).length > 0) {
                        additionalData.push(additionalCols);
                    }
                } else {
                    console.warn(chalk.yellow(`Warning: Skipping row with missing or invalid data: ${JSON.stringify(data)}`));
                }
            })
            .on('end', () => {
                resolve({ results, additionalData });
            })
            .on('error', (error) => {
                reject(new Error(`File reading error: ${error.message}`));
            });
    });
}

// This function builds the required chat template from the responses in the CSV
export async function buildChatTemplate(chatResponses) {
    const now = new Date();
    return chatResponses.map((response, index) => {
        const timestamp = new Date(now.getTime() + index * 60000);
        return {
            "speaker_email": response.speaker_is_customer ? "customer@example.com" : "agent@example.com",
            "response_id": (index + 1).toString(),
            "message": response.message,
            "speaker_is_customer": response.speaker_is_customer,
            "channel": "Chat",
            "message_created_at": timestamp.toISOString(),
        };
    });
}

export const importer = {
    getImportFileList,
    uploadFileType,
    callMetaDataFiles,
    processTickets,
    buildChatTemplate,
    processCallAndCSVContent
}

export const number = {
    callsToImport,
    ticketsToImport
}