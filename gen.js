import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import crypto from 'crypto';
import axios from 'axios';
import { time } from 'console';
import fetch from 'node-fetch';
import btoa from 'btoa';
import mm from 'music-metadata';
import FormData from 'form-data';

const version = '11.1'
const TARGET_FILE = 'keyFile.json'
const API_URL = 'https://api.evaluagent.com/v1';

let args = process.argv.slice(2);
let encryptionKey = null
let keyFileEncrypted
let password
let agentRoleId
let key
let agentList = [];
let contractName = null;
let contactType = null;
let contactsToCreate = null;
let timeInterval = null;

// Chat Template
let chatTemplate = {
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
let callTemplate = {
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

// Check to ensure that the file passed through exists.  If not, create it.
async function ensureFileExists(file) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, '')
        console.log(chalk.white(file.split('/').pop(), chalk.bold.blue('CREATED')))
        if (file.split('/').pop() === 'keyFile.json') {
            fs.writeFileSync(file, '{}', 'utf8');
            keyFileEncrypted = false
            if (!keyFileEncrypted) { // keyFile is not encrypted
                let password = await promptForPassword()
                encryptFile(password)
                keyFileEncrypted = true
            }
        } else {
            clearOutputLog()
        }
    } else {
        keyFileEncrypted = true
        console.log(chalk.white(file.split('/').pop(), chalk.bold.green('✅')))
    }
}

//Encrypts the keyfile
async function encryptFile(password) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const filePath = path.join(__dirname, TARGET_FILE);
    const salt = crypto.randomBytes(16); // Generate a new, random salt for each encryption
    try {
        const key = crypto.scryptSync(password, salt, 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

        const data = fs.readFileSync(filePath, 'utf8');
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const result = salt.toString('hex') + iv.toString('hex') + encrypted; // Store salt, IV, and encrypted data
        fs.writeFileSync(filePath, result, 'utf8');
        keyFileEncrypted = true
    } catch (error) {
        console.error('Error during encryption:', error.message);
    }
}

// Clears console and puts title back up
function titleText() {
    console.clear('')
    console.log(chalk.bold.blue('evaluagent Contact Generator', version))
    console.log('')
}

// Prompts for the password to encrypt the keyfile
async function promptForPassword() {
    console.log('')
    try {
        const response = await inquirer.prompt([
            {
                name: 'password',
                type: 'password',
                message: 'Enter password for the keyFile:',
                mask: '*'
            }
        ])
        return response.password
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`))
        process.exit(1)
    }
}

// Decrypyts the keyFile
async function decryptFile(password) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const filePath = path.join(__dirname, TARGET_FILE);
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const salt = Buffer.from(data.substring(0, 32), 'hex'); // Retrieve the salt
        const iv = Buffer.from(data.substring(32, 64), 'hex'); // Retrieve the IV
        const encryptedData = data.substring(64);

        const key = crypto.scryptSync(password, salt, 32);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        fs.writeFileSync(filePath, decrypted, 'utf8');
    } catch (error) {
        console.error('Error during decryption:', error.message);
        process.exit(1)
    }
}

// Function to clear the contents of the outputLog
function clearOutputLog() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const outputLogPath = path.join(__dirname, 'outputLog.json');

    try {
        let data = getDateAndTime()
        fs.writeFileSync(outputLogPath, '');
        writeData(data)
    } catch (error) {
        console.error(chalk.red(`Error clearing outputLog.json: ${error.message}`));
    }
}

// Writes to the output log
function writeData(data) {
    return new Promise((resolve, reject) => {
        // Convert the JavaScript object to a string in JSON format
        const jsonData = JSON.stringify(data, null, 2);

        // Append the JSON string to the file
        fs.appendFile('outputLog.json', jsonData + '\n', 'utf8', (error) => {
            if (error) {
                console.log(chalk.bold.red('Error: ', error.message))
                reject(error); // Reject the Promise if there's an error
            } else {
                resolve(); // Resolve the Promise when operation is successful
            }
        });
    });
}

// Just returns the date and time
function getDateAndTime() {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const now = new Date();
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    let data = `${dayName} ${day} ${month} - ${hours}:${minutes}`
    return { "ea contact generator": data }
}

//Displays the help text
function showHelp() {
    titleText()
    console.log(chalk.underline.yellow('Help'))
    console.log('')
    console.log(chalk.bold.yellow('node gen init'))
    console.log('')
    console.log(`Creates calls and tickets directories if they don't exists.`)
    console.log(`Also creates outputLog and keyFile if they don't exists.`)
    console.log(`The keyFile will be encrypted so you'll be prompted to create a password.`)
    console.log('')
    console.log(chalk.bold.yellow('node gen add [contract name] [api key]'))
    console.log('')
    console.log('Adds a new contract and API key to the keyFile.')
    console.log(`You'll be prompted for the keyFile password before the contract and API key is added.`)
    console.log('')
    console.log(chalk.bold.yellow('node gen del [contract name]'))
    console.log('')
    console.log(`Deletes the contract and API key from the keyFile.`)
    console.log(`You'll be prompted for the keyFile password.`)
    console.log('')
    console.log(chalk.bold.yellow('node gen contacts'))
    console.log('')
    console.log('Creates contacts and sends to evaluagent.')
    console.log(`You'll be prompted for the keyFile password.`)
    console.log('Select the contract from the list.')
    console.log('Confirm contact type, number of contacts and time interval between contacts.')
    console.log('Note that you must have MP3 audio files in the calls directory and the appropriate JSON files in the tickets directory.')
}

//Gets everything going
async function checkFilesAndFoldersExsists() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const directories = ['calls', 'tickets'];
    const keyFilePath = path.join(__dirname, 'keyFile.json');
    const outputLogPath = path.join(__dirname, 'outputLog.json');
    titleText()
    directories.forEach(directory => {
        const dirPath = path.join(__dirname, directory)
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true })
            console.log(chalk.white(directory, 'directory', chalk.bold.blue('CREATED')))
        } else {
            console.log(chalk.white(directory, 'directory', chalk.bold.green('✅')))
        }
    })
    await ensureFileExists(outputLogPath)
    await ensureFileExists(keyFilePath)
}

// Function to add a new API key to the keyFile.json
async function addNewApiKey(contract, apiKey) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const keyFilePath = path.join(__dirname, 'keyFile.json');

    // Read the existing content of the keyFile.json
    let keyFileData = {};
    try {
        const data = fs.readFileSync(keyFilePath, 'utf8');
        keyFileData = JSON.parse(data);
    } catch (err) {
        console.error(chalk.red('Error reading or parsing keyFile.json:', err.message));
        return;
    }

    // Check if the contract already exists
    if (keyFileData.hasOwnProperty(contract)) {
        console.log(chalk.red(`The contract '${contract}' already exists in keyFile.json.`));
        return;
    }

    // Add the new API key
    keyFileData[contract] = apiKey;

    // Write the updated content back to keyFile.json
    try {
        fs.writeFileSync(keyFilePath, JSON.stringify(keyFileData, null, 2), 'utf8');
        console.log('')
        console.log(chalk.green(`Successfully added '${contract}' to keyFile.json.`));
    } catch (err) {
        console.error(chalk.red('Error writing to keyFile.json:', err.message));
    }
}

// Function to delete an API key from the keyFile.json
async function deleteApiKey(contract) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const keyFilePath = path.join(__dirname, 'keyFile.json');

    // Ensure the file exists before modifying
    if (!fs.existsSync(keyFilePath)) {
        console.log(chalk.red('Error: keyFile.json does not exist.'));
        return;
    }

    // Read the existing content of the keyFile.json
    let keyFileData = {};
    try {
        const data = fs.readFileSync(keyFilePath, 'utf8');
        keyFileData = data.trim() ? JSON.parse(data) : {};
    } catch (err) {
        console.error(chalk.red('Error reading or parsing keyFile.json:', err.message));
        return;
    }

    // Check if the contract exists and delete the key-value pair
    if (keyFileData.hasOwnProperty(contract)) {
        delete keyFileData[contract];
        try {
            fs.writeFileSync(keyFilePath, JSON.stringify(keyFileData, null, 2), 'utf8');
            console.log('')
            console.log(chalk.green(`Successfully deleted '${contract}' from keyFile.json.`));
        } catch (err) {
            console.error(chalk.red('Error writing to keyFile.json:', err.message));
        }
    } else {
        console.log(chalk.red(`The contract '${contract}' does not exist in keyFile.json.`));
    }
}

// Function to list all keys in a numbered menu
async function selectApiKey() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const keyFilePath = path.join(__dirname, 'keyFile.json');
    // Read the existing content of the keyFile.json
    let keyFileData = {};
    try {
        const data = fs.readFileSync(keyFilePath, 'utf8');
        keyFileData = data.trim() ? JSON.parse(data) : {};
    } catch (err) {
        console.error(chalk.red('Error reading or parsing keyFile.json:', err.message));
        return;
    }
    // List all keys in a numbered menu format
    const keys = Object.keys(keyFileData);
    if (keys.length === 0) {
        console.log(chalk.yellow('No API keys found in keyFile.json.'));
        process.exit(1)
    } else {
        console.clear('')
        titleText()
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedKey',
                message: 'Select a contract:',
                choices: keys.map((key, index) => ({
                    name: `${index + 1}. ${key}`,
                    value: key
                }))
            }
        ]);
        encryptFile(password)
        const selectedKey = answers.selectedKey;
        const selectedValue = keyFileData[selectedKey];
        contractName = selectedKey
        return selectedValue
    }
}

// This function connects to the end point and returns the response
async function fetchApi(endpoint) {
    const url = `${API_URL}${endpoint}`
    const response = await axios.get(url, {
        headers: { Authorization: `Basic ${Buffer.from(key).toString('base64')}` }
    })
    return response.data.data
}

// Function to prompt the user to select "Calls", "Tickets", or "Both"
async function promptContactType() {
    try {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'contactType',
                message: 'Select a contact type:',
                choices: ['Calls', 'Tickets', 'Both']
            }
        ]);

        const selectedType = answers.contactType;
        return selectedType;
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1)
    }
}

// Function to prompt the user for the number of contacts to create
async function promptTimeInterval() {
    try {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'timeInterval',
                message: 'Time interval in seconds?',
                validate: function (value) {
                    const valid = !isNaN(parseFloat(value)) && isFinite(value) && parseInt(value, 10) > 0;
                    return valid || 'Please enter a positive number';
                },
                filter: Number
            }
        ]);

        const timeInterval = answers.timeInterval;
        return timeInterval;
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1)
    }
}

// Function to prompt the user for the number of contacts to create
async function promptNumberOfContacts() {
    try {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'numberOfContacts',
                message: 'How many contacts would you like to create?',
                validate: function (value) {
                    const valid = !isNaN(parseFloat(value)) && isFinite(value) && parseInt(value, 10) > 0;
                    return valid || 'Please enter a positive number';
                },
                filter: Number
            }
        ]);

        const numberOfContacts = answers.numberOfContacts;
        return numberOfContacts;
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
    }
}

// Function to prompt the user for a Yes or No response
async function promptYesOrNo() {
    try {
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmation',
                message: 'Ready?',
                default: false // Set default value as needed
            }
        ]);

        const confirmation = answers.confirmation;
        if (!confirmation) {
            process.exit(1)
        } else {
            return}
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1)
    }
}

// Need to get the agent ID and the agent list
async function getAgentDetails(key) {
    try {
        const roleResponse = await fetchApi('/org/roles')
        if (roleResponse) {
            const agentRole = roleResponse.find(role => role.attributes.name === 'agent')
            if (!agentRole) {
                console.log(chalk.green('Connected to end point.'))
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
            agentList = filteredList
            writeData(agentList)
            
        }
    } catch (error) {
        console.log(chalk.bold.red(`There was an error getting the agent details.`))
        process.exit(1)
    }
}

//This function checks if either the calls or tickets directory is empty
async function directoryIsEmpty(directory) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const directoryPath = path.join(__dirname, directory);

    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                console.error(`An error occurred while reading the directory: ${err}`);
                reject(err); // Reject the promise if there's an error
                return;
            }

            // Resolve the promise with the result of whether the directory is empty
            resolve(files.length === 0);
        });
    });
}

//This function generates the contact template
async function createContact() {
    let contactTemplate;
    let callDirectoryEmpty = await directoryIsEmpty('calls')
    let ticketDirectoryEmpty = await directoryIsEmpty('tickets')

    if (contactType === "Calls") {
        if (callDirectoryEmpty) {
            console.log(chalk.red('No calls found in directory.'))
            process.exit(1)
        } else {
            contactTemplate = await generateCall(agentList)
        }
    } else if (contactType === "Tickets") {
        if (ticketDirectoryEmpty) {
            console.log(chalk.red('No chats found in directory.'))
            process.exit(1)
        } else {
            contactTemplate = await generateChat(agentList)
        }
    } else {
        if (callDirectoryEmpty) {
            console.log(chalk.red('No calls found in directory.'))
            process.exit(1)
        }
        if (ticketDirectoryEmpty) {
            console.log(chalk.red('No chats found in directory.'))
            process.exit(1)
        }
        const randomChoice = Math.floor(Math.random() * 2)
        if (randomChoice === 0) {
            contactTemplate = await generateChat(agentList)
        } else {
            contactTemplate = await generateCall(agentList)
        }
    }
    return contactTemplate
}

//This function creates the chat contact template
async function generateChat(agents) {
    const fsPromises = fs.promises;
    const agentNumber = Math.floor(Math.random() * agents.length)
    chatTemplate.data.reference = generateReference() + Math.floor(Math.random() * 100) // Generates random contact refrence
    chatTemplate.data.agent_id = agents[agentNumber].agent_id
    chatTemplate.data.agent_email = agents[agentNumber].email
    chatTemplate.data.contact_date = generateDate()
    chatTemplate.data.channel = "Chat"
    chatTemplate.data.assigned_at = generateDate()
    chatTemplate.data.solved_at = generateDate()
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
    chatTemplate.data.metadata.Filename = await extractChatName(responseFile);
    chatTemplate.data.metadata.Status = getStatus()
    const agentResponsesCount = chatTemplate.data.responses.filter(response => !response.speaker_is_customer).length;
    chatTemplate.data.metadata.AgentResponses = agentResponsesCount;
    return chatTemplate
}

//This function takes the filename and adds it to the metadata
async function extractChatName(filename) {
    // Remove the directory path
    let base = filename.split('/').pop();
    // Remove the file extension 
    base = base.split('.').slice(0, -1).join('.');
    return base;
}

//This function generates a random metadata tag for status
function getStatus() {
    let priorities = ['New', 'Open', 'Pending', 'Hold', 'Solved']
    let priority = Math.floor(Math.random() * priorities.length)
    return priorities[priority]
}

//This function returns the filename without the extension for the metadata
async function extractBaseName(filename) {
    // Remove the directory path
    let base = filename.split('/').pop();
    // Remove the file extension
    base = base.split('.').slice(0, -1).join('.');
    return base;
}

//This funtion generates a contact reference
function generateReference() {
    let contactRef = new Date().toISOString()
    contactRef = contactRef.replace(/-/g, '')
    contactRef = contactRef.replace(/:/g, '')
    contactRef = contactRef.replace('.', '')
    return contactRef
}

//This function generates the date for solved, assigned dates in the contact template
function generateDate() {
    return new Date().toISOString().split('.')[0] + "Z";
}


async function sendContacts(number) {
    console.log('');
    console.log(chalk.bold.blue(`Status:`));

    for (let c = 0; c < number; c++) {
        const exportContact = await createContact();
        writeData(exportContact);
        const conUrl = "https://api.evaluagent.com/v1/quality/imported-contacts";

        // Use process.stdout.write to avoid new line
        process.stdout.write(`${c + 1} | ${exportContact.data.reference} | ${exportContact.data.metadata["Contact"]} (${exportContact.data.metadata["Filename"]}) |  (${exportContact.data.agent_email}) - `);

        try {
            const response = await fetch(conUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Basic " + btoa(key)
                },
                body: JSON.stringify(exportContact)
            });
            const result = await response.json();

            if (result.message) {
                let serverResponse = result.message;
                let logData = { "result": result.message };
                writeData(logData);
                // Append server response on the same line
                console.log(chalk.bold.green(serverResponse));
            } else {
                let serverResponse = result.errors[0].title;
                let logData = { "failed": result };
                writeData(logData);
                // Append error response on the same line
                console.log(chalk.bold.red(serverResponse));
            }

            if (c + 1 === number) {
                console.log('\n' + chalk.bold.green(`Job complete.`));
                process.exit(1); // Consider using process.exit(0) if the exit is normal without errors
            }
        } catch (error) {
            console.error(chalk.bold.red(`\nError: ${error.message}`));
        }
        await delay(timeInterval);
    }
}

//This function creates the time interval between the next contact being created
function delay(seconds) {
    const ms = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, ms));
}

//This function creates the call contact template
async function generateCall(agents) {
    const fsPromises = fs.promises;
    const agentNumber = Math.floor(Math.random() * agents.length)
    callTemplate.data.reference = generateReference() + Math.floor(Math.random() * 100) // Generates random contact refrence
    callTemplate.data.agent_id = agents[agentNumber].agent_id
    callTemplate.data.agent_email = agents[agentNumber].email
    callTemplate.data.contact_date = generateDate()
    callTemplate.data.channel = "Chat"
    callTemplate.data.assigned_at = generateDate()
    callTemplate.data.solved_at = generateDate()
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
    callTemplate.data.metadata.Filename = await extractBaseName(callFile)
    callTemplate.data.audio_file_path = await uploadAudio(callFile)
    return callTemplate
}

//This function uploads the audio file
async function uploadAudio(audioSelection) {

    const url = 'https://api.evaluagent.com/v1/quality/imported-contacts/upload-audio';
    const headers = {
        'Authorization': 'Basic ' + Buffer.from(key).toString('base64')
    };

    const formData = new FormData();
    formData.append('audio_file', fs.createReadStream(audioSelection));

    try {
        const response = await axios.post(url, formData, { headers: { ...formData.getHeaders(), ...headers } });
        return response.data.path;
    } catch (error) {
        let logEntry = {
            "audio upload": error.message
        }
        writeData(logEntry)
        console.error(`There was a problem with the audio upload for `, chalk.bold.white(audioSelection), ' : ', chalk.bold.red(error.message))
        console.log(chalk.bold.red('Aborting job to prevent blank call uploads'))
        process.exit()
    }
}

//This function gets the duration of the audio file for the metadata
async function getMP3Duration(filePath) {
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


if (process.argv.length <= 2) {
    titleText()
    console.log('Error:', chalk.bold.red(`Arguments missing.  Type`), chalk.yellow('node gen help'))
    console.log('')
} else if (args[0].toLowerCase() === 'help') {
    showHelp()
} else if (args[0].toLowerCase() === 'add') {
    if (args.length === 3) {
        console.log('12345')
    } else {
        console.log('Error: ', chalk.red('Invalid arguments.  Type'), chalk.yellow('node gen help'))
    }
    await checkFilesAndFoldersExsists()
    let contract = args[1]
    let apiKey = args[2]
    password = await promptForPassword()
    console.log('')
    await decryptFile(password)
    console.log('')
    await addNewApiKey(contract, apiKey)
    encryptFile(password)

} else if (args[0].toLowerCase() === 'del') { // Delete a key
    await checkFilesAndFoldersExsists()
    password = await promptForPassword()
    await decryptFile(password)
    await deleteApiKey(args[1])
    encryptFile(password)
} else if (args[0].toLowerCase() === 'init') { // Setup files
    checkFilesAndFoldersExsists()
} else if (args[0].toLowerCase() === 'contacts') { // for contacts
    await checkFilesAndFoldersExsists()
    password = await promptForPassword()
    await decryptFile(password)
    key = await selectApiKey()
    await getAgentDetails()
    titleText()
    console.log('Contract:', chalk.green(contractName))
    console.log('Agent ID:', chalk.green(agentRoleId))
    contactType = await promptContactType()
    contactsToCreate = await promptNumberOfContacts()
    timeInterval = await promptTimeInterval()
    titleText()
    console.log('Contract:', chalk.green(contractName))
    console.log('Agent ID:', chalk.green(agentRoleId))
    console.log('Contact Type:', chalk.green(contactType))
    console.log('Time interval:', chalk.green(`${timeInterval} seconds`))
    console.log('')
    await promptYesOrNo()
    sendContacts(contactsToCreate)
} else if (args[0].toLowerCase() === 'create') { // Just so I can lock the file
    console.log('🥸')
} else {
    console.log('Error: ', chalk.red('Invalid arguments.  Type'), chalk.yellow('node gen help'))
}
