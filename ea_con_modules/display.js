// This module contains all modules relating to displaying things
import chalk from 'chalk'
import logUpdate from 'log-update'
import { instruction } from './variables.js';
import { number, importer } from './import.js';
import { ai } from './AiContacts.js';
import figlet from 'figlet';
import gradient from 'gradient-string'

let message = ''
let index = 0;
let intervalId;

const frames = [
    "-",
    "\\",
    "|",
    "/"
]

const frame1 = [
    "∙∙∙",
    "●∙∙",
    "∙●∙",
    "∙∙●",
    "∙∙∙"
]

const stopAnimation = () => {
    clearInterval(intervalId);
    logUpdate.clear(); // This clears the last update from the console if you are using log-update library
};

const connectingToEndPoint = () => {
    intervalId = setInterval(() => {
        const frame = frames[index = ++index % frames.length];

        logUpdate(chalk.bold.yellow(`Getting agent list ${frame}`)
        );
    }, 80);
};

const generatingChat = () => {
    intervalId = setInterval(() => {
        const frame = frame1[index = ++index % frames.length];

        logUpdate(chalk.bold.yellow(`Generating Chat Transcript ${frame}`)
        );
    }, 80);
}

const syncingLibrary = () => {
    intervalId = setInterval(() => {
        const frame = frame1[index = ++index % frames.length];

        logUpdate(chalk.bold.yellow(`Syncing Library ${frame}`)
        );
    }, 80);
}

const generatingCall = () => {
    intervalId = setInterval(() => {
        const frame = frame1[index = ++index % frames.length];

        logUpdate(chalk.bold.yellow(`Generating Call ${frame}`)
        );
    }, 80);
}

export function figletText(text) {
    return new Promise((resolve, reject) => {
        figlet(text, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            console.log(gradient.pastel.multiline(data));
            resolve();
        });
    });
}

async function summary() {
    console.clear()
    await figletText('ea_con_gen');
    display.statusMessage()
    console.log(`${chalk.bold.yellow('Contract:')} ${instruction.contractName}`)
    if (instruction.main === "contacts") {
        console.log(`${chalk.bold.yellow('Contact Type:')} ${instruction.contactType}`)
        console.log(`${chalk.bold.yellow('Number of Contacts:')} ${instruction.numberOfContacts}`)
        if (instruction.numberOfContacts > 1) {
            console.log(`${chalk.bold.yellow('Interval between sending contacts:')} ${instruction.interval}`)
        }
    }

    if (instruction.main === "import") {
        if (instruction.importSource === "Calls") {
            console.log(`${chalk.bold.yellow('Calls in upload queue:')} ${number.callsToImport.length}`)
            if (importer.callMetaDataFiles.length != 0) {
                console.log(`${chalk.bold.yellow('Metadata files found:')} ${importer.callMetaDataFiles.length}`)
            }
        } else if (instruction.importSource === "Tickets") {
            console.log(`${chalk.bold.yellow('Tickets in upload queue:')} ${number.ticketsToImport.length}`)
        }
    }

    if (instruction.main === "new") {
        console.log(`${chalk.bold.yellow('Contact Type:')} ${ai.contactType}`)
        console.log(`${chalk.bold.yellow('Model:')} ${ai.model}`)
        console.log(`${chalk.bold.yellow('Number of Contacts:')} ${instruction.numberOfContacts}`)
        if (instruction.numberOfContacts > 1) {
            console.log(`${chalk.bold.yellow('Interval between sending contacts:')} ${instruction.interval}`)
        }
    }

}


//Error Message and Quitting
async function error(message) {
    console.clear();
    console.log('');
    console.log(`${chalk.bold.red('Oops!')} ${message}`);
    console.log('');
    process.exit(0);
}

async function statusMessage() {

    console.log(display.message);
    console.log('');
}


export const display = {
    error, statusMessage, message, connectingToEndPoint, stopAnimation, summary, generatingChat, generatingCall, syncingLibrary
}