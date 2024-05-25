import fs from 'fs';

import {
    generateUuid,
    getDate,
    fileNameOnly,
    getStatus,
    getMP3Duration
} from './utils.js'

import {
    generateCallTranscript
} from './chat_gen.js'

import {
    generateAudio
} from './audio_generator.js'

import {
    uploadAudio
} from './api_utils.js'
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

//This function creates the call contact template
export async function generateCall(agents) {
    const fsPromises = fs.promises;
    const agentNumber = Math.floor(Math.random() * agents.length)
    callTemplate.data.reference = await generateUuid()
    callTemplate.data.agent_id = agents[agentNumber].agent_id
    callTemplate.data.agent_email = agents[agentNumber].email
    callTemplate.data.contact_date = getDate()
    callTemplate.data.channel = "Chat"
    callTemplate.data.assigned_at = getDate()
    callTemplate.data.solved_at = getDate()
    callTemplate.data.channel = "Telephony"
    callTemplate.data.handling_time = Math.floor(Math.random() * (200 - 100 + 1)) + 100;

    const directoryPath = './calls/';
    const callFiles = [];
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
    getMP3Duration(callFile).then(duration => {
        if (duration) {
            let logEntry = {
                "audio length": duration
            }
        }
    });
    callTemplate.data.metadata.Filename = await fileNameOnly(callFile)
    return callTemplate
}

export async function generateNewCall(agents) {
    const conversation = await generateCallTranscript();
    const audioToBeUploaded = await generateAudio(conversation);
    const agentNumber = Math.floor(Math.random() * agents.length);
    callTemplate.data.reference = await generateUuid();
    callTemplate.data.agent_id = agents[agentNumber].agent_id;
    callTemplate.data.agent_email = agents[agentNumber].email;
    callTemplate.data.contact_date = getDate();
    callTemplate.data.channel = "Call";
    callTemplate.data.assigned_at = getDate();
    callTemplate.data.solved_at = getDate();
    callTemplate.data.channel = "Telephony";
    callTemplate.data.handling_time = Math.floor(Math.random() * (200 - 100 + 1)) + 100;

    const callFile = `./calls/${audioToBeUploaded}`;
    const duration = await getMP3Duration(callFile);
    if (duration) {
        let logEntry = {
            "audio length": duration
        };
    }
    callTemplate.data.metadata.Filename = "Auto Gen";
    callTemplate.data.audio_file_path = await uploadAudio(callFile);
    return callTemplate;
}