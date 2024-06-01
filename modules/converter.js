import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { writeLog } from './generate_log.js';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const eaConGenDir = path.join(__dirname, '../ea_con_gen/');
const csvFilePath = path.join('script.csv');

// This function gets the data from the CSV file
export async function parseCSVFile(filePath) {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        await writeLog(`==> script.csv not found at ${filePath}`);
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
async function createResponseArray() {
    try {
        const { results, additionalData } = await parseCSVFile(csvFilePath);
        // console.log('Parsed CSV data:', results, additionalData);
        writeLog([results, additionalData])
        return [results, additionalData]
        // return results;
    } catch (error) {
        console.error('Error creating response array:', error);
        return `FAIL - ${error}`;
    }
}

// This function does all the business
export async function importConversation() {
    const responseData = await createResponseArray();
    const responseArray = responseData[0];
    const metaDataArray = responseData[1];

    if (!Array.isArray(responseArray)) {
        throw new Error('Failed to create response array');
    }
    const chatArray = await buildChatTemplate(responseArray);
    return chatArray;
}

export async function importMetaData(){
    const responseData = await createResponseArray();
    const metaDataArray = responseData[1];
    if (!Array.isArray(metaDataArray)) {
        throw new Error('Failed to create response array');
    }
    return metaDataArray;
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
