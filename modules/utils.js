import fetch from 'node-fetch';
import mm from 'music-metadata';
import chalk from 'chalk';
import { access, unlink } from 'fs/promises';

const version = '11.2' 

export async function generateUuid() {
    const response = await fetch('https://www.uuidtools.com/api/generate/v1');
    const [uuid] = await response.json();
    return uuid;
}

//This function gets the duration of the audio file for the metadata
export async function getMP3Duration(filePath) {
    try {
        const metadata = await mm.parseFile(filePath);
        const duration = metadata.format.duration; // Duration in seconds
        const roundedDuration = Math.round(duration); // Round to nearest whole number
        return roundedDuration;
    } catch (error) {
        console.error("An error occurred:", error.message);
        return null;
    }
}

//This function generates the date for solved, assigned dates in the contact template
export function generateDate() {
    return new Date().toISOString().split('.')[0] + "Z";
}

// Clears console and puts title back up
export function titleText() {
    console.clear('')
    console.log(chalk.bold.blue('evaluagent Contact Generator', version))
    console.log('')
}

// Just returns the date and time
export function getDateAndTime() {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const now = new Date();
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    let data = `${dayName} ${day} ${month} - ${hours}:${minutes}`
    return { "ea contact generator": data }
}

//Displays the help text
export function showHelp() {
    titleText()
    console.log(chalk.underline.yellow('Help'))
    console.log('')
    console.log(chalk.bold.yellow('node gen init'))
    console.log('')
    console.log(`Creates calls and tickets directories if they don't exists.`)
    console.log(`Also creates outputLog and keyFile if they don't exists.`)
    console.log(`The keyFile will be encrypted so you'll be prompted to create a password.`)
    console.log('')
    console.log(chalk.bold.yellow('node gen add [contract name] [api key]'))
    console.log('')
    console.log('Adds a new contract and API key to the keyFile.')
    console.log(`You'll be prompted for the keyFile password before the contract and API key is added.`)
    console.log('')
    console.log(chalk.bold.yellow('node gen del [contract name]'))
    console.log('')
    console.log(`Deletes the contract and API key from the keyFile.`)
    console.log(`You'll be prompted for the keyFile password.`)
    console.log('')
    console.log(chalk.bold.yellow('node gen contacts'))
    console.log('')
    console.log('Creates contacts and sends to evaluagent.')
    console.log(`You'll be prompted for the keyFile password.`)
    console.log('Select the contract from the list.')
    console.log('Confirm contact type, number of contacts and time interval between contacts.')
    console.log('Note that you must have MP3 audio files in the calls directory and the appropriate JSON files in the tickets directory.')
}

//This function takes the filename and adds it to the metadata
export async function extractChatName(filename) {
    // Remove the directory path
    let base = filename.split('/').pop();
    // Remove the file extension 
    base = base.split('.').slice(0, -1).join('.');
    return base;
}

//This function generates a random metadata tag for status
export function getStatus() {
    let priorities = ['New', 'Open', 'Pending', 'Hold', 'Solved']
    let priority = Math.floor(Math.random() * priorities.length)
    return priorities[priority]
}

//This function returns the filename without the extension for the metadata
export async function extractBaseName(filename) {
    // Remove the directory path
    let base = filename.split('/').pop();
    // Remove the file extension
    base = base.split('.').slice(0, -1).join('.');
    return base;
}

//This function creates the time interval between the next contact being created
export function delay(seconds) {
    const ms = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function deleteDsStoreFile() {
    const directories = ['../calls', '../tickets']
    for (const dir of directories) {
        const filePath = `${dir}/.DS_Store`;
        try {
            await access(filePath);  // Check if the file exists
            await unlink(filePath);  // Delete the file
        } catch (error) {
            // If the file does not exist, access will throw an error
            if (error.code === 'ENOENT') {
            } else {
                // Log other errors
                console.error(`Error accessing or deleting .DS_Store in ${dir}:`, error); //
            }
        }
    }
}