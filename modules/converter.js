// This script will take in a CSV in a specific format and create the response array

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import chalk from 'chalk'
import { fileURLToPath } from 'url';
import { writeLog } from './generate_log.js'

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const eaConGenDir = path.join(__dirname, '../ea_con_gen/');
const csvFilePath = path.join('script.csv');

// This function gets the data from the CSV file
export async function parseCSVFile(filePath) {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        await writeLog(`==> script.csv not found at ${filePath}`)
        throw new Error(`File not found: ${filePath}`);
    }

    const results = [];

    return new Promise((resolve, reject) => {
        let isFirstRow = true; // To skip the header row

        fs.createReadStream(filePath)
            .pipe(csv({ headers: ['messages', 'speaker_is_customer'], skipLines: 1 })) // Define headers and skip the first line
            .on('data', (data) => {
                const message = data['messages'];
                const speakerIsCustomer = data['speaker_is_customer'];

                // Check if both fields are present and valid
                if (message && speakerIsCustomer !== undefined) {
                    results.push({
                        message: message,
                        speaker_is_customer: speakerIsCustomer.toLowerCase() === 'true'
                    });
                } else {
                    console.warn(`Warning: Skipping row with missing or invalid data: ${JSON.stringify(data)}`);
                }
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(new Error(`File reading error: ${error.message}`));
            });
    });
}

// This functions creates the response array needed for the chat template.
async function createResponseArray() {
    try {
        const data = await parseCSVFile(csvFilePath);
        return data;
    } catch (error) {
        return `FAIL - ${error}`
    }
}

// This functions does all the business
export async function importConversation() {
    const responseArray = await createResponseArray()
    const chatArray = await buildChatTemplate(responseArray)
    return chatArray
}

// This function builds the required chat template from the responses in the CSV
export async function buildChatTemplate(chatResponses) {
    const now = new Date();
    return chatResponses.map((response, index) => {
        const timestamp = new Date(now.getTime() + index * 60000);
        return {
            "speaker_email" : response.speaker_is_customer ? "customer@example.com" : "agent@example.com",
            "response_id" : (index + 1).toString(),
            "message" : response.message,
            "speaker_is_customer" : response.speaker_is_customer,
            "channel" : "Chat",
            "message_created_at" : timestamp.toISOString(), 
        }
    })
}

