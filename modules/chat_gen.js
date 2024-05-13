import readlineSync from 'readline-sync'
import chalk from 'chalk'
import { write } from "fs"
import fs from 'fs'
import { promises as fsP } from 'fs';
import fetch from 'node-fetch';
import {prompt} from './prompt.js'
import { join, dirname } from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openAIClient = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY']
});


export async function generateChatTranscript() {
    try {
        const chatCompletion = await openAIClient.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: prompt
        });
        const responseMessage = chatCompletion.choices[0].message.content // Just gets the message
        let transcriptArray = await formatChatHistory(responseMessage) // Returns the responses in an array
        const formattedChatData = transcriptArray.map(formatChatMessage);
        writeHistory(formattedChatData)
        return formattedChatData
    } catch (error) {
        console.error(chalk.white('Error - main() -'),chalk.red(error))
    }
}

function writeHistory(data) {
    clearHistory()
    return new Promise((resolve, reject) => {
        // Convert the JavaScript object to a string in JSON format
        const jsonData = JSON.stringify(data, null, 2);
        // Append the JSON string to the file
        fs.appendFile('chatHistory.json', jsonData + '\n', 'utf8', (error) => {
            if (error) {
                console.error('An error occurred while creating history:', error.message);
                reject(error); // Reject the Promise if there's an error
            } else {
                resolve(); // Resolve the Promise when operation is successful
            }
        });
    });
}

async function clearHistory() {
    try {
        await fsP.writeFile('chatHistory.json', '', 'utf8');
    } catch (error) {
        console.error('Error clearing the file:', error);
    }
}

async function formatChatHistory(responseMessage) {
    const messageArray = JSON.parse(responseMessage);
    return messageArray;
}

function formatChatMessage(message, index, array) {
    const baseTime = new Date();
    return {
      "speaker_email": message.speaker_is_customer ? "customer@example.com" : "agent@example.com",
      "response_id": (index + 1).toString(),
      "message": message.message,
      "speaker_is_customer": message.speaker_is_customer,
      "channel": "Chat",
      "message_created_at": new Date(baseTime.getTime() + index * 60000).toISOString()  // increment 1 minute per message
    };
  }

async function loadChatHistory() {
    try {
        const data = await fsP.readFile('./chatHistory.json', { encoding: 'utf8' });
        const chatHistory = JSON.parse(data);
        return chatHistory;
    } catch (error) {
        console.error('Failed to read or parse chat history');
        return []; // Return an empty array if there's an error
    }
}


async function generateUuid() {
    const response = await fetch('https://www.uuidtools.com/api/generate/v1');
    const [uuid] = await response.json();
    return uuid;
}

export async function writeChatDataToFile(data) {
    const uuid = await generateUuid();
    const directory = './tickets';
    const fileName = `${uuid}.json`;
    const fullPath = join(dirname(''), directory, fileName);

    try {
        await fsP.writeFile(fullPath, JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error writing file:', error);
    }
}
