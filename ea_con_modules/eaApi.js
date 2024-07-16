// This module contains all functions a variables relating to the evaluagent API 

import chalk from 'chalk';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// Importing the stuff we need
import { instruction, apiKey, api } from './variables.js'; // Variables like instruction, apiKeys and api URLs
import { display } from './display.js'; // Things relating to displaying info
import { generate } from './contactGenerator.js';
import { ai } from './AiContacts.js';


let agentRoleId = null;
let agentList = []

async function fetchApi(endpoint) {
    const url = `${api.eaUrl}${endpoint}`
    const response = await axios.get(url, {
        headers: { Authorization: `Basic ${Buffer.from(apiKey.ea).toString('base64')}` }
    })
    return response.data.data
}


// Get the agent details
async function getAgents() {
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
            agentList = agentList.filter(agent => agent.email !== 'null');
            return agentList

        }
    } catch (error) {
        display.error(error)
    }
}

// This function sends the contactTemplate to evaluagent
async function sendContacts(number) {
    console.log('');
    console.log(chalk.bold.green(`Job List:`));
    let exportContact = null
    for (let c = 0; c < number; c++) {

        switch (instruction.contactType) {
            case "Tickets":
                exportContact = await generate.chatContactTemplate()
                break;
            case "Calls":
                exportContact = await generate.callContactTemplate()
                break;
            case "Combination":
                let contactTypeArray = ["Tickets", "Calls"]
                const randomContactType = contactTypeArray[Math.floor(Math.random() * contactTypeArray.length)]
                if (randomContactType === "Tickets") {
                    exportContact = await generate.chatContactTemplate()
                } else if (randomContactType === "Calls") {
                    exportContact = await generate.chatContactTemplate()
                } else {
                    display.error(`Problem with combination generator.`)
                }
                break;
            case "New Tickets":
                display.generatingChat()
                exportContact = await generate.newChat(instruction.numberOfContacts)
                display.stopAnimation()
                break;
            case "New Calls":
                display.generatingCall()
                exportContact = await generate.newCall(instruction.numberOfContacts)
                display.stopAnimation()
                break;
            default:
                break;
        }

        if (ai.save) {
            console.log(chalk.yellow(`${c + 1}/${number} | ${exportContact.data.metadata["Contact"]} (${exportContact.data.metadata["Filename"]}) | `), chalk.green('Saved'));
        } else {
            const conUrl = `${api.eaUrl}/quality/imported-contacts`;
            process.stdout.write(chalk.yellow(`${c + 1}/${number} | ${exportContact.data.reference} | ${exportContact.data.metadata["Contact"]} (${exportContact.data.metadata["Filename"]}) |  (${exportContact.data.agent_email.split('@')[0]}) | `));
            try {
                const response = await fetch(conUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Basic " + btoa(apiKey.ea)
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

                display.error(error)
            }
        }
            await delay(instruction.interval);
        }
    }

    //This function returns a delay by the number of seconds
    function delay(seconds) {
        const ms = seconds * 1000
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    //This function uploads the audio file
    async function uploadAudio(audioSelection) {
        const url = `${api.eaUrl}/quality/imported-contacts/upload-audio`;
        const headers = {
            'Authorization': 'Basic ' + Buffer.from(apiKey.ea).toString('base64')
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

        const conUrl = `${api.eaUrl}/quality/imported-contacts`;
        const agentEmail = chatTemplate.data.agent_email || 'email_required@example.com'; // Provide a default value
        const agentName = agentEmail.split('@')[0]; // Extract the part before @

        // Use process.stdout.write to avoid new line
        process.stdout.write(chalk.yellow(`CSV Import | ${chatTemplate.data.reference} | ${chatTemplate.data.metadata["Contact"]} (${chatTemplate.data.metadata["Filename"]}) |  (${agentName}) | - `));

        try {
            const response = await fetch(conUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Basic " + btoa(apiKey.ea)
                },
                body: JSON.stringify(chatTemplate)
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
            console.log('\n' + chalk.bold.green(`Job complete.`));
        } catch (error) {
            console.error(chalk.bold.red(`\nError: ${error.message}`));
        }
    }

    // This function sends the imported contact
    async function sendImportedContact(chatTemplate) {
        console.log('');
        console.log(chalk.bold.blue(`Status:`));

        const conUrl = `${api.eaUrl}/quality/imported-contacts`;
        const agentEmail = chatTemplate.data.agent_email || 'email_required@example.com'; // Provide a default value
        const agentName = agentEmail.split('@')[0]; // Extract the part before @

        // Use process.stdout.write to avoid new line
        process.stdout.write(chalk.yellow(`Call Import | ${chatTemplate.data.reference} | ${chatTemplate.data.metadata["Contact"]} (${chatTemplate.data.metadata["Filename"]}) |  (${agentName}) | - `));

        try {
            const response = await fetch(conUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Basic " + btoa(apiKey.ea)
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
            console.error(chalk.bold.red(`${error.message}`));
        }
    }


    export const evaluagent = {
        getAgents,
        agentRoleId,
        agentList,
        sendContacts,
        uploadAudio,
        sendCsvContact,
        sendImportedContact
    }