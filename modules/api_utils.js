import chalk from 'chalk';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import {
    apiKey,
    timeInterval
} from '../gen.js'
import {
    createContact,
    delay
} from './utils.js';
import { clearLog, writeLog } from './generate_log.js';
const API_URL = 'https://api.evaluagent.com/v1';
let agentRoleId = null;
let agentList = [];

// This function connects to the end point and returns the response
async function fetchApi(endpoint) {
    const url = `${API_URL}${endpoint}`
    const response = await axios.get(url, {
        headers: { Authorization: `Basic ${Buffer.from(apiKey).toString('base64')}` }
    })
    writeLog(response.data.data)
    return response.data.data
}

//This functions sends the contacts
export async function sendContacts(number) {
    console.log('');
    console.log(chalk.bold.blue(`Status:`));

    for (let c = 0; c < number; c++) {
        const exportContact = await createContact();
        const conUrl = "https://api.evaluagent.com/v1/quality/imported-contacts";
        // Use process.stdout.write to avoid new line
        process.stdout.write(`${c + 1} | ${exportContact.data.reference} | ${exportContact.data.metadata["Contact"]} (${exportContact.data.metadata["Filename"]}) |  (${exportContact.data.agent_email.split('@')[0]}) - `);

        try {
            const response = await fetch(conUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Basic " + btoa(apiKey)
                },
                body: JSON.stringify(exportContact)
            });
            const result = await response.json();
            if (result.message) {
                let serverResponse = result.message;
                writeLog(serverResponse)
                // Append server response on the same line
                console.log(chalk.bold.green(serverResponse));
            } else {
                let serverResponse = result.errors[0].title;
                let logData = { "failed": result };
                writeLog(logData)
                // Append error response on the same line
                console.log(chalk.bold.red(serverResponse));
            }

            if (c + 1 === number) {
                console.log('\n' + chalk.bold.green(`Job complete.`));
                writeLog("Job Complete")
                process.exit(0); 
            }
        } catch (error) {
            let dsData = {'ERROR': error.message}
            console.error(chalk.bold.red(`\nError: ${error.message}`));
        }
        await delay(timeInterval);
    }
}

// Need to get the agent ID and the agent list
export async function getAgentDetails(key) {
    try {
        const roleResponse = await fetchApi('/org/roles')
        if (roleResponse) {
            const agentRole = roleResponse.find(role => role.attributes.name === 'agent')
            if (!agentRole) {
                throw new Error("Agent role was not found.");
                process.exit(1)
            }
            if (agentRole) {
                agentRoleId = agentRole.id
            }
            const users = await fetchApi('/org/users')
            agentList = users.filter(user =>
                user.relationships.roles.data.some(role => role.id === agentRoleId && user.attributes.active)).map(agent => ({
                    name: agent.attributes.fullname,
                    email: agent.attributes.email,
                    agent_id: agent.id
                }))
            // get rid of any agents that have no email address
            let filteredList = agentList.filter(agent => agent.email !== 'null');
            writeLog(filteredList)
            return filteredList
            
        }
    } catch (error) {
        console.log(chalk.bold.red(`There was an error getting the agent details.  Check your API key.`))
        writeLog(error)
        process.exit(1)
    }
}

//This function uploads the audio file
export async function uploadAudio(audioSelection) {
    const url = 'https://api.evaluagent.com/v1/quality/imported-contacts/upload-audio';
    const headers = {
        'Authorization': 'Basic ' + Buffer.from(apiKey).toString('base64')
    };

    const formData = new FormData();
    formData.append('audio_file', fs.createReadStream(audioSelection));

    try {
        const response = await axios.post(url, formData, { headers: { ...formData.getHeaders(), ...headers } });
        writeLog({'Audio Upload' : response.data.path})
        return response.data.path;
    } catch (error) {
        writeLog({audioSelection : error.message})
        console.error(`There was a problem with the audio upload for `, chalk.bold.white(audioSelection), ' : ', chalk.bold.red(error.message))
        console.log(chalk.bold.red('Aborting job to prevent blank call uploads'))
        process.exit()
    }
}
