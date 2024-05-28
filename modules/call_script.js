import fs from 'fs';
import path from 'path';
// import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const eaConGenDir = path.join(__dirname, '../ea_con_gen');
const csvFilePath = path.join(eaConGenDir, 'script.csv');

export async function parseCSVFile(filePath) {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const results = [];

    return new Promise((resolve, reject) => {
        let isFirstRow = true; // To skip the header row

        fs.createReadStream(filePath)
            .pipe(csv({ headers: ['message', 'speaker_is_customer'], skipLines: 1 }))
            .on('data', (data) => {
                const message = data['message'];
                const speakerIsCustomer = data['speaker_is_customer'];

                // Check if both fields are present and valid
                if (message && speakerIsCustomer !== undefined) {
                    results.push({
                        message: message,
                        speaker_is_customer: speakerIsCustomer.toLowerCase() === 'true'
                    });
                } else {
                    console.warn(chalk.yellow(`Warning: Skipping row with missing or invalid data: ${JSON.stringify(data)}`));
                }
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                writeLog(`==> File reading error: ${error.message}`)
                reject(new Error(`File reading error: ${error.message}`));
            });
    });
}
