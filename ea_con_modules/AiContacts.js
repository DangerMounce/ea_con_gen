// This module contains all conversations relating to openAI generated conversations

import OpenAI from 'openai';
import readlineSync from 'readline-sync';
import chalk from 'chalk';
import fs from 'fs';
import { promises as fsP } from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve('ea_con_modules/.env') });

import { display } from './display.js';
import { prompt } from './prompt.js';
import { generateUuid } from './contactGenerator.js';

// Define __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let openAIClient;
let model = null;
let contactType = null;

export async function ensureEnvExistsWithOpenAiApiKey() {
    const envPath = path.join(__dirname, 'ea_con_modules', '.env');
    const placeholderKey = 'OPENAI_API_KEY=placeholder-for-api-key\n';

    try {
        // Check if .env exists
        if (fs.existsSync(envPath)) {
            // Read the content of .env
            const envContent = await fsP.readFile(envPath, 'utf8');
            // Check if OPENAI_API_KEY exists in the content
            if (!envContent.includes('OPENAI_API_KEY')) {
                // If key does not exist, append it
                await fsP.appendFile(envPath, placeholderKey);
            }
        } else {
            // If .env does not exist, create it and add the placeholder key
            await fsP.writeFile(envPath, placeholderKey);
        }
    } catch (error) {
        console.error('Error handling .env file:', error);
    }
}

async function generateChatTranscript() {
    const chatCompletion = await ai.openAIClient.chat.completions.create({
        model: ai.model,
        messages: prompt
    });
    const responseMessage = chatCompletion.choices[0].message.content; // Just gets the message
    let transcriptArray = await formatChatHistory(responseMessage); // Returns the responses in an array
    const formattedChatData = transcriptArray.map(formatChatMessage);
    return formattedChatData;
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

async function writeChatDataToFile(data) {
    const uuid = await generateUuid();
    const directory = path.join(__dirname, '../tickets');
    const fileName = `${uuid}.json`;
    const fullPath = path.join(directory, fileName);

    try {
        await fsP.writeFile(fullPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing file:', error);
    }
}

export const ai = {
    ensureEnvExistsWithOpenAiApiKey,
    model,
    contactType,
    generateChatTranscript,
    writeChatDataToFile,
    openAIClient
}