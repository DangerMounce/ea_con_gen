// This module contains all functions relating to generating a contact template.
import fs from 'fs'
import path from 'path';
import * as mm from 'music-metadata';
import { fileURLToPath } from 'url';
import { fileHandling } from './filesAndFolders.js';
import { display } from './display.js';
import { eaApi } from './eaApi.js';
import { importer } from './importer.js';

// Chat Template
export let chatTemplate = {
    "data": {
        "reference": "",
        "agent_id": "",
        "agent_email": "",
        "contact_date": "",
        "channel": "",
        "assigned_at": "",
        "solved_at": "",
        "external_url": "https://www.evaluagent.com",
        "responses_stored_externally": "true",
        "responses": [],
        "metadata": {
            "Filename": "",
            "Status": "",
            "AgentResponses": "",
            "Contact": "Ticket"
        }
    }
}

// Call Template
export let callTemplate = {
    "data": {
        "reference": "",
        "agent_id": "",
        "agent_email": "",
        "contact_date": "",
        "channel": "Telephony",
        "assigned_at": "",
        "solved_at": "",
        "external_url": "https://www.evaluagent.com",
        "responses_stored_externally": "true",
        "channel": "Telephony",
        "handling_time": 120,
        "customer_telephone_number": "01753 877212",
        "audio_file_path": "",
        "metadata": {
            "Filename": "",
            "Contact": "Call"
        }
    }
}

//Returns Uuid for unique numberical ref
export async function generateUuid() {
    const response = await fetch('https://www.uuidtools.com/api/generate/v1');
    const [uuid] = await response.json();
    return uuid;
}

// This function returns the current date
export function getDate() {
    return new Date().toISOString().split('.')[0] + "Z";
}

//This function returns the filename without the extension for the metadata
export async function fileNameOnly(filename) {
    // Remove the directory path
    let base = filename.split('/').pop();
    // Remove the file extension
    base = base.split('.').slice(0, -1).join('.');

    // Check if the base is a UUID and change it to "Auto-Gen" if it is
    if (isUUID(base)) {
        base = "Auto-Gen";
    }
    return base;
}

//This function generates a random metadata tag for status
export function getStatus() {
    let priorities = ['New', 'Open', 'Pending', 'Hold', 'Solved']
    let priority = Math.floor(Math.random() * priorities.length)
    return priorities[priority]
}

//This function creates the chat contact template
export async function generateChat() {
    let agents = eaApi.agentList
    const fsPromises = fs.promises;
    const agentNumber = Math.floor(Math.random() * agents.length)
    chatTemplate.data.reference = await generateUuid()
    chatTemplate.data.agent_id = agents[agentNumber].agent_id
    chatTemplate.data.agent_email = agents[agentNumber].email
    chatTemplate.data.contact_date = getDate()
    chatTemplate.data.channel = "Chat"
    chatTemplate.data.assigned_at = getDate()
    chatTemplate.data.solved_at = getDate()
    // Need to sort responses now
    const directoryPath = './tickets/';
    const chatFiles = await getChatFileList();
    let responseFile = chatFiles[Math.floor(Math.random() * chatFiles.length)]
    try {
        let data = await fsPromises.readFile(responseFile, 'utf-8')
        chatTemplate.data.responses = JSON.parse(data)
    } catch (err) {
        console.log('An error occured reading ', responseFile, " ", err)
        throw err;
    }
    chatTemplate.data.responses.forEach(response => {
        if (!response.speaker_is_customer) {
            response.speaker_email = chatTemplate.data.agent_email;
        }
    });
    chatTemplate.data.metadata.Filename = await fileNameOnly(responseFile);
    chatTemplate.data.metadata.Status = getStatus()
    const agentResponsesCount = chatTemplate.data.responses.filter(response => !response.speaker_is_customer).length;
    chatTemplate.data.metadata.AgentResponses = agentResponsesCount;
    await writeToLog(chatTemplate)
    return chatTemplate
}

// This function writes the data to data.log
export async function writeToLog(data) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const logPath = fileHandling.dataLog
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

// Get the list of files in the chat directory
async function getChatFileList() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const ticketsDir = path.join(__dirname, '../tickets');
    let jsonFiles = [];

    try {
        if (fs.existsSync(ticketsDir) && fs.lstatSync(ticketsDir).isDirectory()) {
            const filesInTickets = fs.readdirSync(ticketsDir);
            jsonFiles = filesInTickets
                .filter(file => path.extname(file) === '.json')
                .map(file => path.join(ticketsDir, file));
        } else {
            console.error(`Directory not found: ${ticketsDir}`);
        }
    } catch (error) {
        console.error(`Error reading directory: ${error.message}`);
    }

    return jsonFiles;
}


function isUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

//This function creates the call contact template
export async function generateCall() {
    let agents = eaApi.agentList
    const fsPromises = fs.promises;
    const agentNumber = Math.floor(Math.random() * agents.length)
    callTemplate.data.reference = await generateUuid()
    callTemplate.data.agent_id = agents[agentNumber].agent_id
    callTemplate.data.agent_email = agents[agentNumber].email
    callTemplate.data.contact_date = getDate()
    callTemplate.data.assigned_at = getDate()
    callTemplate.data.solved_at = getDate()
    callTemplate.data.channel = "Telephony"


    const directoryPath = './calls/';
    const callFiles = await getCallFileList();
    try {
        const files = await fsPromises.readdir(directoryPath);
        files.forEach((file) => {
            const filePath = './calls/' + file;
            callFiles.push(filePath);
        });
    } catch (err) {
        console.log('Error reading directory:', err)
    }
    
    let callFile = callFiles[Math.floor(Math.random() * callFiles.length)]
    callTemplate.data.metadata.Filename = await fileNameOnly(callFile)
    callTemplate.data.audio_file_path = await eaApi.uploadAudio(callFile);
    callTemplate.data.handling_time = await getMP3Duration(callFile)
    return callTemplate
}

// Get the list of files in the chat directory
async function getCallFileList() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const callsDir = path.join(__dirname, '../calls');
    let mp3Files = [];

    try {
        if (fs.existsSync(callsDir) && fs.lstatSync(callsDir).isDirectory()) {
            const filesInCalls = fs.readdirSync(callsDir);
            mp3Files = filesInCalls
                .filter(file => path.extname(file) === '.mp3')
                .map(file => path.join(callsDir, file));
        } else {
            display.showError(`Directory not found: ${callsDir}`);
        }
    } catch (error) {
        display.showError(`Error reading directory: ${error.message}`);
    }

    return mp3Files;
}



//This function creates the chat contact template using the import from the CSV
export async function generateChatFromCSV(agents, data, mData) {
    const fsPromises = fs.promises;
    const agentNumber = Math.floor(Math.random() * agents.length)
    chatTemplate.data.reference = await generateUuid()
    chatTemplate.data.agent_id = agents[agentNumber].agent_id
    chatTemplate.data.agent_email = agents[agentNumber].email
    chatTemplate.data.contact_date = getDate()
    chatTemplate.data.channel = "Chat"
    chatTemplate.data.assigned_at = getDate()
    chatTemplate.data.solved_at = getDate()
    chatTemplate.data.responses = await importer.buildChatTemplate(data)
    chatTemplate.data.responses.forEach(response => {
        if (!response.speaker_is_customer) {
            response.speaker_email = chatTemplate.data.agent_email;
        }
    });

    if (mData.length > 0) {
        const metadata = mData[0]; //
        for (const key in metadata) {
          if (metadata.hasOwnProperty(key)) {
            chatTemplate.data.metadata[key] = metadata[key];
          }
        }
      }

    // Gives the Agent Responses in the meta data
    const agentResponsesCount = chatTemplate.data.responses.filter(response => !response.speaker_is_customer).length;
    chatTemplate.data.metadata.AgentResponses = agentResponsesCount;
    return chatTemplate
}

//This function creates the call contact template
export async function generateCallFromImport(callFile, metaData) {
    callFile = `./import_calls/${callFile}`
    let agents = eaApi.agentList
    const fsPromises = fs.promises;
    const agentNumber = Math.floor(Math.random() * agents.length)
    callTemplate.data.reference = await generateUuid()
    callTemplate.data.agent_id = agents[agentNumber].agent_id
    callTemplate.data.agent_email = agents[agentNumber].email
    callTemplate.data.contact_date = getDate()
    callTemplate.data.assigned_at = getDate()
    callTemplate.data.solved_at = getDate()
    callTemplate.data.channel = "Telephony"
    callTemplate.data.metadata.Filename = await fileNameOnly(callFile)
    callTemplate.data.audio_file_path = await eaApi.uploadAudio(callFile);
    callTemplate.data.handling_time = await getMP3Duration(callFile)
    if (metaData.length > 0) {
        const metadataForCall = metaData[0]; // Assuming you only want the first object in the array
        for (const key in metadataForCall) {
          if (metadataForCall.hasOwnProperty(key)) {
            callTemplate.data.metadata[key] = metadataForCall[key];
          }
        }
      }

    await writeToLog(callTemplate)
    return callTemplate
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

export const contact = {
    generateChat,
    generateChatFromCSV,
    generateCallFromImport
}

export const debug = {
    writeToLog
}