// This modules contains all conversations relating to openAI generated conversations

import OpenAI from 'openai';
import readlineSync from 'readline-sync';
import chalk from 'chalk';
import fs from 'fs';
import { promises as fsP } from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve('ea_con_modules/.env') });
import { display } from './display.js';
import { contact } from './contactGenerator.js';

const language = null

export async function ensureEnvFileAndApiKey() {
    const envPath = path.join('ea_con_modules', '.env');
    const placeholderKey = 'OPENAI_API_KEY = "placeholder-for-api-key"\n';

    try {
        // Check if .env exists
        if (fs.existsSync(envPath)) {
            // Read the content of .env
            const envContent = await fsP.readFile(envPath, 'utf8');
            // Check if OPENAI_API_KEY exists in the content
            if (!envContent.includes('OPENAI_API_KEY')) {
                // If key does not exist, append it
                await fsP.appendFile(envPath, placeholderKey);
                // writeLog('==>OPENAI_API_KEY added to existing .env file.');
            } else {
                // writeLog('==>OPENAI_API_KEY already exists in .env file.');
            }
        } else {
            // If .env does not exist, create it and add the placeholder key
            await fsP.writeFile(envPath, placeholderKey);
            // writeLog('==>.env file created with OPENAI_API_KEY placeholder.');
        }
    } catch (error) {
        console.error('Error handling .env file:', error);
    }
}

let openAIClient
const apiKey = process.env['OPENAI_API_KEY']
if (apiKey != 'placeholder-for-api-key') {
    openAIClient = new OpenAI({
        apiKey: apiKey
    })
} else {
    display.showError('OpenAI API Key missing or invalid.')
}

async function formatChatHistory(responseMessage) {
    const messageArray = JSON.parse(responseMessage);
    return messageArray;
}

export async function generateChatTranscript() {
    try {
        const chatCompletion = await openAIClient.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: prompt
        });
        const responseMessage = chatCompletion.choices[0].message.content // Just gets the message
        let transcriptArray = await formatChatHistory(responseMessage) // Returns the responses in an array
        const formattedChatData = transcriptArray.map(formatChatMessage);
        writeLog(`==> Formatted Chat Data:`)
        writeLog(formattedChatData)
        return formattedChatData
    } catch (error) {
        console.error(chalk.white('Error - main() -'),chalk.red(error))
    }
}


export const ai = {
    ensureEnvFileAndApiKey,
    apiKey,
    language,
    generateChatTranscript
}