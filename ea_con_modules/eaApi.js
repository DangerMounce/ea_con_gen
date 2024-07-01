// This module contains all functions a variables relating to the evaluagent API 

import chalk from 'chalk';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

import { instructions } from './filesAndFolders.js';
import { display } from './display.js';
import { generateChat, generateCall, writeToLog } from './contactGenerator.js';
import { debug } from './contactGenerator.js';

import { spinner } from './progress.js'

let agentRoleId = null;
let agentList = []

const eu = 'https://api.evaluagent.com/v1'
const aus = 'https://api.aus.evaluagent.com/v1'
const us = 'https://api.us-east.evaluagent.com/v1'
let ea = null

async function fetchApi(endpoint) {
    const url = `${apiUrl.ea}${endpoint}`
    const response = await axios.get(url, {
        headers: { Authorization: `Basic ${Buffer.from(instructions.eaApiKey).toString('base64')}`}
    })
    return response.data.data
}

// Get the agent details
export async function getAgentDetails() {
    let key = instructions.eaApiKey
    try {
        const roleResponse = await fetchApi('/org/roles')
        if (roleResponse) {
            const agentRole = roleResponse.find(role => role.attributes.name === 'agent')
            if (!agentRole) {
                display.showError(`Agent role wasn't found.`)
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
            return filteredList
            
        }
    } catch (error) {
        display.showError(`Can't retrieve agent details.  Check your API key.`)
    }
}

// This function sends the contactTemplate
async function sendContactsToEvaluagent(number) {
    console.log('');
    console.log(chalk.bold.blue(`Job List:`));
    let exportContact = null
    for (let c = 0; c < number; c++) {
        // const exportContact = await createContact();
        if (instructions.contactType === "Tickets") {
            exportContact = await generateChat()
        } else if (instructions.contactType === "Calls") {
            exportContact = await generateCall()
        } else if (instructions.contactType === "Combination") {
            let contactTypeArray = ["Tickets", "Calls"]
            const randomContactType = contactTypeArray[Math.floor(Math.random() * contactTypeArray.length)]
            if (randomContactType === "Tickets") {
                exportContact = await generateChat()
            } else if (randomContactType === "Calls") {
                exportContact = await generateCall()
            } else {
                display.showError(`Problem with combination generator.`)
            }
        }

        const conUrl = `${apiUrl.ea}/quality/imported-contacts`;
        process.stdout.write(chalk.yellow(`${c + 1}/${number} | ${exportContact.data.reference} | ${exportContact.data.metadata["Contact"]} (${exportContact.data.metadata["Filename"]}) |  (${exportContact.data.agent_email.split('@')[0]}) | `));
        try {
            const response = await fetch(conUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Basic " + btoa(instructions.eaApiKey)
                },
                body: JSON.stringify(exportContact)
            });
            const result = await response.json();
            if (result.message) {
                let serverResponse = result.message;
                // Append server response on the same line
                console.log(chalk.bold.green(serverResponse));
            } else {
                let serverResponse = result.errors[0].title;
                // Append error response on the same line
                console.log(chalk.bold.red(serverResponse));
            }

            if (c + 1 === number) {
                console.log('\n' + chalk.bold.green(`Job complete.`));
                process.exit(0); 
            }
        } catch (error) {

            console.error(chalk.bold.red(`\nError: ${error.message}`));
        }
         await delay(instructions.timeInterval);
    }
}

//This function returns a delay by the number of seconds
export function delay(seconds) {
    const ms = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, ms));
}

//This function uploads the audio file
export async function uploadAudio(audioSelection) {
    const url = `${apiUrl.ea}/quality/imported-contacts/upload-audio`;
    const headers = {
        'Authorization': 'Basic ' + Buffer.from(instructions.eaApiKey).toString('base64')
    };

    const formData = new FormData();
    formData.append('audio_file', fs.createReadStream(audioSelection));

    try {
        const response = await axios.post(url, formData, { headers: { ...formData.getHeaders(), ...headers } });
        return response.data.path;
    } catch (error) {
        console.error(`There was a problem with the audio upload for `, chalk.bold.white(audioSelection), ' : ', chalk.bold.red(error.message))
        console.log(chalk.bold.red('Aborting job to prevent blank call uploads'))
        process.exit()
    }
}

// This function sends the imported contact from the CSV
export async function sendCsvContact(chatTemplate) {
    console.log('');
    console.log(chalk.bold.blue(`Status:`));

    const conUrl = `${apiUrl.ea}/quality/imported-contacts`;
    const agentEmail = chatTemplate.data.agent_email || 'email_required@example.com'; // Provide a default value
    const agentName = agentEmail.split('@')[0]; // Extract the part before @

    // Use process.stdout.write to avoid new line
    process.stdout.write(chalk.yellow(`CSV Import | ${chatTemplate.data.reference} | ${chatTemplate.data.metadata["Contact"]} (${chatTemplate.data.metadata["Filename"]}) |  (${agentName}) | - `));

    try {
        const response = await fetch(conUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Basic " + btoa(instructions.eaApiKey)
            },
            body: JSON.stringify(chatTemplate)
        });
        const result = await response.json();
        if (result.message) {
            let serverResponse = result.message;
            // Append server response on the same line
            console.log(chalk.bold.green(serverResponse));
        } else {
            await debug.writeToLog(result)
            let serverResponse = result.errors[0].title;
            // Append error response on the same line
            console.log(chalk.bold.red(serverResponse));
        }
        console.log('\n' + chalk.bold.green(`Job complete.`));
    } catch (error) {
        console.error(chalk.bold.red(`\nError: ${error.message}`));
    }
}

// This function sends the imported contact
export async function sendImportedContact(chatTemplate) {
    console.log('');
    console.log(chalk.bold.blue(`Status:`));

    const conUrl = `${apiUrl.ea}/quality/imported-contacts`;
    const agentEmail = chatTemplate.data.agent_email || 'email_required@example.com'; // Provide a default value
    const agentName = agentEmail.split('@')[0]; // Extract the part before @

    // Use process.stdout.write to avoid new line
    process.stdout.write(chalk.yellow(`Call Import | ${chatTemplate.data.reference} | ${chatTemplate.data.metadata["Contact"]} (${chatTemplate.data.metadata["Filename"]}) |  (${agentName}) | - `));

    try {
        const response = await fetch(conUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Basic " + btoa(instructions.eaApiKey)
            },
            body: JSON.stringify(chatTemplate)
        });
        const result = await response.json();
        if (result.message) {
            let serverResponse = result.message;
            // Append server response on the same line
            console.log(chalk.bold.green(serverResponse));
        } else {
            await debug.writeToLog(result)
            let serverResponse = result.errors[0].title;
            // Append error response on the same line
            await writeToLog(serverResponse)
            await writeToLog(data.handling)
            console.log(chalk.bold.red(serverResponse));
        }
        console.log('\n' + chalk.bold.green(`Job complete.`));
    } catch (error) {
        console.error(chalk.bold.red(`${error.message}`));
    }
}


export const apiUrl = {
    eu,
    aus,
    us,
    ea
}

export const eaApi = {
    getAgentDetails,
    agentList,
    agentRoleId,
    sendContactsToEvaluagent,
    uploadAudio,
    sendCsvContact,
    sendImportedContact
}