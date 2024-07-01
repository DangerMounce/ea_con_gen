import fs, { write } from 'fs'; //
import path from 'path';
import csv from 'csv-parser';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { menu } from './menus.js'
import { instructions } from './filesAndFolders.js';
import { contact, writeToLog } from './contactGenerator.js';
import { eaApi } from './eaApi.js'

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ticketImport = path.join(__dirname, '../import_tickets');
const callImport = path.join(__dirname, '../import_calls');

export const dirs = {
    ticketImport,
    callImport
}



// This function gets the data from the CSV file
export async function parseCSVFile(filePath) {
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

export async function importConversationAndMetaData(targetFile) {
    const responseData = await createResponseArray(targetFile);
    const responseArray = responseData[0];
    const metaDataArray = responseData[1];

    if (!Array.isArray(responseArray) || !Array.isArray(metaDataArray)) {
        throw new Error('Failed to create import array array')
    }

    return [responseArray, metaDataArray]

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

// This function builds the import queue
export function getImportFileList(uploadDirectory) {
    const fileNamesArray = [];
    return new Promise((resolve, reject) => {
        fs.readdir(uploadDirectory, (err, files) => {
            if (err) {
                reject(`Unable to scan directory: ${err}`);
            } else {
                files.forEach((file) => {
                    fileNamesArray.push(file);
                });
                if (uploadDirectory === dirs.ticketImport) {
                resolve(fileNamesArray.filter(file => file.endsWith('.csv')));
                } else {
                    resolve(fileNamesArray.filter(file => file.endsWith('.mp3')));
                }
            }
        });
    });
}

async function processCSVContent(importFileList) {
    // For each file, do all of this but with each item in the array
    for (let i = 0; i < importFileList.length; i++) { 
        // Read the filename
        let fileName = importFileList[i]
        const targetFile = path.join(dirs.ticketImport, fileName)
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
            await menu.yesOrNo(`OK to upload to ${instructions.contractName}?`)
            //Upload - processing queue start
            const chatTemplate = await contact.generateChatFromCSV(eaApi.agentList, responses, metaDataInFile)
            await eaApi.sendCsvContact(chatTemplate)
            await menu.yesOrNo('Ready to process next file?')
        } catch (error) {
            console.error(`Error processing file ${fileName}:`, error);

        }
    }
    console.log('Processing Complete')

}

async function processCallAndCSVContent(importFileList) {
    // For each file, do all of this but with each item in the array
    for (let i = 0; i < importFileList.length; i++) { 
        // Read the filename
        let fileName = importFileList[i]
        const targetFile = path.join(dirs.callImport, fileName)
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
            await menu.yesOrNo(`OK to upload to ${instructions.contractName}?`)
            //Upload - processing queue start
            const chatTemplate = await contact.generateCallFromImport(fileName, callMetadata)
            await eaApi.sendImportedContact(chatTemplate)
            await menu.yesOrNo('Ready to process next file?')
        } catch (error) {
            console.error(`Error processing file ${fileName}:`, error);

        }
    }
    console.log('Processing Complete')

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

// Function to change file extension from .mp3 to .csv
async function changeExtensionToCSV(filePath) {
    return path.format({
        ...path.parse(filePath),
        base: undefined, // Ensures that base is not used when formatting
        ext: '.csv' // Set the new extension
    });
}


export const importer = {
    getImportFileList,
    processCSVContent,
    buildChatTemplate,
    processCallAndCSVContent,
    getMetadataFromCSV
}