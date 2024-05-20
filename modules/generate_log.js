import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

async function writeLog(data) {
    return new Promise((resolve, reject) => {
        // Convert the JavaScript object to a string in JSON format
        const jsonData = JSON.stringify(data, null, 2);

        // Append the JSON string to the file
        fs.appendFile('../modules/log.json', jsonData + '\n', 'utf8', (error) => {
            if (error) {
                console.log(chalk.bold.red('Error: ', error.message))
                reject(error); // Reject the Promise if there's an error
            } else {
                resolve(); // Resolve the Promise when operation is successful
            }
        });
    });
}
// Function to clear the contents of the outputLog
export function clearLog() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const outputLogPath = path.join(__dirname, '../modules/log.json');

    try {
        // let data = getDateAndTime()
        fs.writeFileSync(outputLogPath, '');
        // writeData(data)
    } catch (error) {
        console.error(chalk.red(`Error clearing outputLog.json: ${error.message}`));
    }
}

clearLog()