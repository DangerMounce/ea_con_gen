import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk'

// Just returns the date and time
export async function getDateAndTime() {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const now = new Date();
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    let dataAndTime = `${dayName} ${day} ${month} - ${hours}:${minutes}`
    return dataAndTime
}

export async function writeLog(data) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const logPath = path.join(__dirname, 'log.json'); // Adjust the path as necessary
    return new Promise((resolve, reject) => {
        const jsonData = JSON.stringify(data, null, 2);
        fs.appendFile(logPath, jsonData + '\n', 'utf8', (error) => {
            if (error) {
                console.error(chalk.red('Error writing log:', error.message));
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

export async function clearLog() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const logPath = path.join(__dirname, 'log.json');
    try {
        let data = await getDateAndTime();
        fs.writeFileSync(logPath, '');
        await writeLog({ "Log Created": data });
    } catch (error) {
        console.error(chalk.red('Error clearing log:', error.message));
    }
}