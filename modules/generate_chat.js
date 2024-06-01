import fs from 'fs';

import {
    generateUuid,
    getDate,
    fileNameOnly,
    getStatus
} from './utils.js';

import { writeLog } from './generate_log.js';

import {
    generateChatTranscript,
    writeChatDataToFile
} from './chat_gen.js'

import {
    buildChatTemplate
} from './converter.js'

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

//This function creates the chat contact template
export async function generateChat(agents) {
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
    const chatFiles = [];
    try {
        const files = await fsPromises.readdir(directoryPath);
        files.forEach((file) => {
            const filePath = './tickets/' + file;
            chatFiles.push(filePath);
        });
    } catch (err) {
        console.log('Error reading directory:', err)
    }
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
    return chatTemplate
}

//This function creates a new chat contact template
export async function generateNewChat(agents) {
    const fsPromises = fs.promises;
    const agentNumber = Math.floor(Math.random() * agents.length)
    chatTemplate.data.reference = await generateUuid()
    chatTemplate.data.agent_id = agents[agentNumber].agent_id
    chatTemplate.data.agent_email = agents[agentNumber].email
    chatTemplate.data.contact_date = getDate()
    chatTemplate.data.channel = "Chat"
    chatTemplate.data.assigned_at = getDate()
    chatTemplate.data.solved_at = getDate()
    chatTemplate.data.responses = await generateChatTranscript()
    chatTemplate.data.metadata.Filename = "Auto-Gen"
    chatTemplate.data.metadata.Status = getStatus()
    const agentResponsesCount = chatTemplate.data.responses.filter(response => !response.speaker_is_customer).length;
    chatTemplate.data.metadata.AgentResponses = agentResponsesCount;
    await writeChatDataToFile(chatTemplate.data.responses)
    chatTemplate.data.responses.forEach(response => {
        if (!response.speaker_is_customer) {
            response.speaker_email = chatTemplate.data.agent_email;
        }
    });
    return chatTemplate
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
    chatTemplate.data.responses = await buildChatTemplate(data)
    chatTemplate.data.responses.forEach(response => {
        if (!response.speaker_is_customer) {
            response.speaker_email = chatTemplate.data.agent_email;
        }
    });

    // Meta data is here.  mData
    writeLog('==> mData')
    await writeLog(mData)
    if (mData.length > 0) {
        const metadata = mData[0]; // Assuming you only want the first object in the array
        for (const key in metadata) {
          if (metadata.hasOwnProperty(key)) {
            chatTemplate.data.metadata[key] = metadata[key];
          }
        }
      }

    // Gives the Agent Responses in the meta data
    const agentResponsesCount = chatTemplate.data.responses.filter(response => !response.speaker_is_customer).length;
    chatTemplate.data.metadata.AgentResponses = agentResponsesCount;
    writeLog('==>chatTemplate')
    await writeLog(chatTemplate)
    return chatTemplate
}