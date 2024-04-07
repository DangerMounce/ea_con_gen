const version = "10_0"
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const readline = require('readline');
const mm = require('music-metadata');
const path = require('path');
const { json } = require('stream/consumers');
const { log } = require('console');
const args = process.argv.slice(2);
// ANSI escape codes for text color
const red = '\x1b[31m';
const green = '\x1b[32m';
const blue = "\x1b[34m";
const reset = '\x1b[0m';
const API_URL = 'https://api.evaluagent.com/v1';
let key = '';
let agentList = [];
let finalAgentList = [];
let contactType = '';
let numberOfContacts = '';


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

// Requirements: 
// calls, directories, outputLog.json, keyFile.json
// check if each of these exists, if not, function should be called to create
function checkForRequiredFiles() {
    const directories = ['calls', 'tickets']
    const logFilePath = path.join(__dirname, 'outputLog.json');
    const keyFile = path.join(__dirname, 'keyFile.json')
    console.clear('')
    console.log(blue + 'evaluagent API contact generator' + reset)
    directories.forEach(directory => {
        const dirPath = path.join(__dirname, directory)

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true })
            console.log(`>${green}${directory} directory created.${reset}`)
        }
    })

    if (fs.existsSync(logFilePath)) {
        console.log('output.log exists. Clearing its contents...');
        // Using fs.truncateSync to clear the contents
        fs.truncateSync(logFilePath, 0);
        console.log('>' + green + 'output.log has been cleared.' + reset);
        let data = getDateAndTime()
        writeData(data)
    } else {
        // Creating a new, empty file
        fs.writeFileSync(logFilePath, '', 'utf8');
        console.log('>' + green + 'output.log has been created.' + reset);
        let data = getDateAndTime()
        writeData(data)
    }

    if (fs.existsSync(keyFile)) {
        console.log('>' + green + 'keyFile exists' + reset)
        console.log('end')
    } else {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        fs.writeFileSync(keyFile, '', 'utf8');
        console.log('>' + green + 'keyFile created' + reset)
        let testKey = { "blank": "1234:5678" }
        addKey(testKey)
        rl.question('Please enter an encyption key: ', (password) => {
            rl.close()
            encryptAndOverwriteFile(password)
        })
    }
}

// Just gets the date and time
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

// Writes to the output log
function writeData(data) {
    return new Promise((resolve, reject) => {
        // Convert the JavaScript object to a string in JSON format
        const jsonData = JSON.stringify(data, null, 2);

        // Append the JSON string to the file
        fs.appendFile('outputLog.json', jsonData + '\n', 'utf8', (error) => {
            if (error) {
                console.log("\x1b[31m");
                console.error('An error occurred while creating log:', error.message);
                console.log("\x1b[0m");
                reject(error); // Reject the Promise if there's an error
            } else {
                resolve(); // Resolve the Promise when operation is successful
            }
        });
    });
}

// Adds a new key to the keyfile
function addKey(data) {
    return new Promise((resolve, reject) => {
        // Convert the JavaScript object to a string in JSON format
        const jsonData = JSON.stringify(data, null, 2);
        // Append the JSON string to the file
        fs.appendFile('keyFile.json', jsonData + '\n', 'utf8', (error) => {
            if (error) {
                console.log("\x1b[31m");
                console.error('An error occurred while adding key:', error.message);
                console.log("\x1b[0m");
                reject(error); // Reject the Promise if there's an error
            } else {
                resolve(); // Resolve the Promise when operation is successful
            }
        });
    });
}

//This function lists all the keys from the keyFile
function getKeyFileKeys(encryptionKey) {
    decryptAndOverwriteFile(encryptionKey)
    const keyFilePath = path.join(__dirname, 'keyFile.json');

    return new Promise((resolve, reject) => {
        fs.readFile(keyFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('An error occurred while reading the keyFile:', err);
                reject(err);
                return;
            }

            let jsonData;
            try {
                jsonData = JSON.parse(data);
                const keys = Object.keys(jsonData);
                console.clear()
                console.log(`${blue}ea contact generator`)
                console.log(reset)
                console.log('Contracts:', keys);
            } catch (parseErr) {
                console.error('An error occurred while parsing the keyFile:', parseErr);
                reject(parseErr);
                return;
            }
            encryptAndOverwriteFile(encryptionKey)
            // Extract and return the keys
            resolve(Object.keys(jsonData));
        });
    });
}

//This function deletes a contract from the keyFile
async function deleteKeyFromFile(contract, encryptionKey) {
    const keyFilePath = path.join(__dirname, 'keyFile.json');
    decryptAndOverwriteFile(encryptionKey)
    
    try {
        // Read the content of the file
        const data = await fs.promises.readFile(keyFilePath, 'utf8');
        const jsonData = JSON.parse(data);

        // Check if the key exists in the JSON data
        if (jsonData.hasOwnProperty(contract)) {
            // Delete the key-value pair
            delete jsonData[contract];
            // Write the updated JSON data back to the file
            await fs.promises.writeFile(keyFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
            encryptAndOverwriteFile(encryptionKey)
            console.clear()
            console.log(green)
            console.log(`The key '${contract}' has been removed from keyFile.json.`);
            console.log(reset)
        } else {
            encryptAndOverwriteFile(encryptionKey)
            console.clear()
            console.log(red)
            console.log(`The key '${contract}' does not exist in keyFile.json.`);
            console.log(reset)
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

// Function to encrypt the keyfile and overwrite the same file
function encryptAndOverwriteFile(key) {
    const inputFile = "keyFile.json"
    const data = fs.readFileSync(inputFile, 'utf8');
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encryptedData = cipher.update(data, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    fs.writeFileSync(inputFile, encryptedData, 'hex');
}

// Function to decrypt an encrypted JSON file and overwrite the same file
function decryptAndOverwriteFile(key) {
    const inputFile = "keyFile.json"
    try {
        const encryptedData = fs.readFileSync(inputFile, 'hex');
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
        decryptedData += decipher.final('utf8');
        fs.writeFileSync(inputFile, decryptedData, 'utf8');
        let logEntry = {
            "keyFile decryption": "complete"
        }
        // console.clear()
    } catch (error) {
        console.log(red)
        console.error('Decryption failed or decryption key missing.');
        let decryptError = {
            "keyFile decryption": "failed"
        }
        process.exit(1)
    }
}

// Function to add a new API key to the keyfile
function addNewApiKey(contract, apiKey, encyptionKey) {
    const keyFilePath = path.join(__dirname, 'keyFile.json')
    decryptAndOverwriteFile(encyptionKey)
    // Read content of the file
    fs.readFile(keyFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.log(red)
            console.error('An error occurred reading the keyFile: ', err)
            console.log(reset)
            return
        }

        // Parse the JSON data from the file
        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (parseErr) {
            console.log(red)
            console.error('An error occurred while parsing the keyFile: ', parseErr)
            console.log(reset)
            encryptAndOverwriteFile(encyptionKey)
            console.clear()
            return;
        }

        // Check if the contract already exists
        if (jsonData.hasOwnProperty(contract)) {
            console.log(red)
            console.error(`An error occurred: The key '${contract}' already exists.`)
            console.log(reset)
            encryptAndOverwriteFile(encyptionKey)
            return;
        }

        // Add the new key-value pair
        jsonData[contract] = apiKey;

        // Convert modified object back into JSON string
        const updatedJsonData = JSON.stringify(jsonData, null, 2);

        // Write the updated JSON string back to the file
        fs.writeFile(keyFilePath, updatedJsonData, 'utf8', (writeErr) => {
            if (writeErr) {
                console.log(red)
                console.error('An error occurred writing back to the keyFile: ', writeErr)
                console.log(reset)
                return
            }
            encryptAndOverwriteFile(encyptionKey)
            console.clear()
            console.log(green)
            console.log(`API key '${contract}' added to keyfile.`)
            console.log(reset)

        })
    })
}

// This function connects to the end point and returns the response
async function fetchApi(endpoint) {
    const url = `${API_URL}${endpoint}`
    const response = await axios.get(url, {
        headers: { Authorization: `Basic ${Buffer.from(key).toString('base64')}` }
    })
    return response.data.data
}

// Function to validate the arguments if adding contacts
function validateArgs(args) {
    //Check if number of contacts and interval are integers.
    const areBothNumbers = !isNaN(parseFloat(args[3])) && isFinite(args[3]) &&
        !isNaN(parseFloat(args[4])) && isFinite(args[4]);
    if (!areBothNumbers) {
        console.log(red)
        console.log('Error: number of contacts and/or interval values are invalid.')
        return
    }
    //Check if contact type is (c)all, (t)icket, or (b)oth
    // Validate contactType
    if (!['t', 'c', 'b'].includes(args[2])) {
        console.log(red)
        console.log('Error: Invalid contact type: ', args[2])
        process.exit(1)
    }
    getApiKey(args[1])
}

// Function to get the API key from the keyFile
function getApiKey(contractName) {
    const keyFilePath = path.join(__dirname, 'keyFile.json');
    decryptAndOverwriteFile(args[5])
    //Read and parse the keyFile
    fs.readFile(keyFilePath, 'utf8', (err, data) => {
        if (err) {
            console.log(red)
            console.log('An error occured reading the keyFile: ', err)
            console.log(reset)
            return;
        }
        let jsonData;
        try {
            jsonData = JSON.parse(data)
        } catch (parseErr) {
            console.log(red)
            console.error('An error occured while parsing the keyFile: ', parseErr);
            encryptAndOverwriteFile(args[5])
            return;
        }
        //Check if key exists and return it's value
        if (jsonData.hasOwnProperty(contractName)) {
            encryptAndOverwriteFile(args[5])
            key = jsonData[contractName]
            console.clear()
            console.log(`${blue}EA Contact Generator - version ${version}`)
            console.log('')
            console.log(`${reset}Contract Name - ${green} ${contractName}`)
            console.log(`${reset}Contact Type - ${green} ${args[2]}`)
            console.log(`${reset}Number of Contacts - ${green} ${args[3]}`)
            console.log(`${reset}Interval - ${green} ${args[4]} seconds`)
            // writing to log
            let logData = {
                "contract": contractName,
                "contact type": args[2],
                "number of contacts": args[3],
                "interval": args[4]
            }
            writeData(logData)
            checkEndPoint(key)
        }
        else {
            console.log(`The key '${contractName}' was not found in keyFile.json.`);
            encryptAndOverwriteFile(args[5])
            return null;
        }
    })
}

// Thsi function checks that we can connect using the credentials
async function checkEndPoint(key) {
    try {
        const response = await fetchApi('/org/roles')
        if (response) {
            const agentRole = response.find(role => role.attributes.name === 'agent')
            if (!agentRole) {
                console.log('\x1b[32m')
                console.log('Connected to end point.')
                console.log('\x1b[31m')
                throw new Error("Agent role was not found.");
                return
            }
            if (agentRole) {
                let logEntry = {
                    "agentRole.id": agentRole.id
                }
                console.log(`${reset}Agent ID - ${green} ${agentRole.id}`)
                getUserList(agentRole.id)
            }
        }
    } catch (error) {
        console.log(`${red}Error: ${error.response.data.errors[0].detail}`)
        console.log(reset)
        process.exit(1)
    }
}

// This function gets the user list
async function getUserList(agentRoleId) {
    const users = await fetchApi('/org/users')
    agentList = users.filter(user =>
        user.relationships.roles.data.some(role => role.id === agentRoleId && user.attributes.active)).map(agent => ({
            name: agent.attributes.fullname,
            email: agent.attributes.email,
            agent_id: agent.id
        }))
    console.log(`${reset}Agents found: ${green} ${agentList.length}`)
    promptForConfirmation()
}

//This function finds agents with no email address and removes them from the list
async function removeAgentsWithNullEmail(agentList) {
    // return agentList.filter(agent => agent.email !== null);
    // Filter out agents with non-null emails and log removed ones
    const filteredList = agentList.filter(agent => {
        if (agent.email === null) {
            let logEntry = {
                "Removed Agent": agent,
            }
            writeData(logEntry)
            // console.log('Removed object:', agent);
            return false; // Exclude this agent
        }
        return true; // Include this agent
    });

    return filteredList;
}

//This function checks for confirmation from the user before starting creating contacts
function promptForConfirmation() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    console.log("\x1b[0m")
    rl.question('Ready? (y/n) ', (answer) => {
        if (answer.toLowerCase() === 'y') {
            let logEntry = {
                "confirmation": "yes",
                "rl.close": false
            }
            sendContacts(args[3])

        } else if (answer.toLowerCase() === 'n') {
            console.log(blue)
            console.log('Goodbye.');
            console.log(reset)
            rl.close();
        } else {
            console.log('\x1b[31m')
            console.log('Invalid input.');
            rl.close()
        }


    });
}

//This function checks if either the calls or tickets directory is empty
async function directoryIsEmpty(directory) {
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

async function sendContacts(number) {
    console.log(blue)
    console.log(`Status:`)
    for (let c = 0; c < number; c++) {
        const exportContact = await createContact()
        writeData(exportContact)
        const conUrl = "https://api.evaluagent.com/v1/quality/imported-contacts";
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
            let serverResponse = null
            if (result.message) {
                serverResponse = result.message
                let logData = {
                    "result": result.message
                }
                writeData(logData)
                console.log(reset, `${c + 1} | ${exportContact.data.reference} | ${exportContact.data.metadata["Contact"]} (${exportContact.data.metadata["Filename"]}) |  (${exportContact.data.agent_email}) - ${green}${serverResponse}`);
            } else {
                serverResponse = result.errors[0].title
                let logData = {
                    "failed": result
                }
                writeData(logData)
                console.log(reset, `${c + 1} | ${exportContact.data.reference} | ${red}Error${reset} - ${red}${serverResponse}`);
            }

            if (c + 1 === parseInt(args[3], 10)) {
                console.log(blue);
                console.log(`Job complete.`);
                console.log(reset)
                process.exit(1)
            }
        } catch (error) {
            console.error(error);
        }
        await delay(args[4])
    }
}

//This function generates the contact template
async function createContact() {
    let contactTemplate;
    const finalAgentList = await removeAgentsWithNullEmail(agentList)
    let callDirectoryEmpty = await directoryIsEmpty('calls')
    let ticketDirectoryEmpty = await directoryIsEmpty('tickets')
    if (args[2] === "c") {

        if (callDirectoryEmpty) {
            console.log(`${red}Call directory is empty`)
            console.log(reset)
            process.exit(1)
        }
        contactTemplate = await generateCall(agentList)
    } else if (args[2] === "t") {
        if (ticketDirectoryEmpty) {
            console.log(`${red}Ticket directory is empty`)
            console.log(reset)
            process.exit(1)
        }

        contactTemplate = await generateChat(finalAgentList)
    } else {
        // Generate a random number (0 or 1)
        const randomChoice = Math.floor(Math.random() * 2);
        // Call generateCall or generateChat based on the random number
        if (randomChoice === 0) {
            if (ticketDirectoryEmpty) {
                console.log(`${red}Ticket directory is empty`)
                console.log(reset)
                process.exit(1)
            }
            contactTemplate = await generateCall(finalAgentList);

        } else {
            if (callDirectoryEmpty) {
                console.log(`${red}Call directory is empty`)
                console.log(reset)
                process.exit(1)
            }
            contactTemplate = await generateChat(finalAgentList);

        }
    }
    return contactTemplate
}

//This function creates the call contact template
async function generateCall(agents) {
    const fs1 = require('fs').promises;
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
        const files = await fs1.readdir(directoryPath);
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
        console.error(`${reset}There was a problem with the audio upload for '${audioSelection}': ${error.message}`);
        console.log(`${red}Aborting job to prevent blank call uploads`)
        process.exit()
    }
}

//This function returns the filename without the extension for the metadata
async function extractBaseName(filename) {
    // Remove the directory path
    let base = filename.split('/').pop();
    // Remove the file extension
    base = base.split('.').slice(0, -1).join('.');
    return base;
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

//This function creates the chat contact template
async function generateChat(agents) {
    const fs1 = require('fs').promises;
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
        const files = await fs1.readdir(directoryPath);
        files.forEach((file) => {
            const filePath = './tickets/' + file;
            chatFiles.push(filePath);
        });
    } catch (err) {
        console.log('Error reading directory:', err)
    }
    let responseFile = chatFiles[Math.floor(Math.random() * chatFiles.length)]
    try {
        let data = await fs1.readFile(responseFile, 'utf-8')
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

//This funtion generates a contact reference
function generateReference() {
    let contactRef = new Date().toISOString()
    contactRef = contactRef.replace(/-/g, '')
    contactRef = contactRef.replace(/:/g, '')
    contactRef = contactRef.replace('.', '')
    contactRef = `rd${version}_${contactRef}`
    return contactRef
}

//This function generates the date for solved, assigned dates in the contact template
function generateDate() {
    return new Date().toISOString().split('.')[0] + "Z";
}

//This function creates the time interval between the next contact being created
function delay(seconds) {
    const ms = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, ms));
}

//This function clears the log and calls the function to add the date and time
function setLog() {
    fs.writeFile('outputLog.json', '', 'utf8', (error) => {
        if (error) {
            console.log("\x1b[31m"); // Set text color to red
            console.error('An error occurred initialising the log:', error.message);
            console.log("\x1b[0m"); // Reset text color
        }
    });
}


console.clear('')
console.log(blue + 'evaluagent API contact generator' + reset)

setLog()
let logTitle = getDateAndTime()
writeData(logTitle)
// checking arguments passed in from command line
if (args[0] === "init") {
    checkForRequiredFiles()
} else if (args[0] === "add") {
    if (args.length > 4) {
        console.log(red)
        console.log('Error: too many arguments')
    } else {
        addNewApiKey(args[1], args[2], args[3])
    }
} else if (args[0] === "list"){
    if (args.length > 2) {
        console.log(red)
        console.log('Error: too many arguments')
    } else {
        getKeyFileKeys(args[1])
    }
} else if (args[0] === "del"){
    if (args.length > 3) {
        console.log(red)
        console.log('Error: too many arguments')
    } else {
        deleteKeyFromFile(args[1], args[2])
    }
}else if (args[0] === "contacts") {
    if (args.length != 6) {
        console.log(red)
        console.log('Invalid arguments' + reset)
        console.log()
        console.log('Usage: [contacts] [contract name] [contact type] [number of contacts] [interval] [decryption key]')
    } else {
        validateArgs(args)
    }
} else if (args[0] === 'decrypt') {
    decryptAndOverwriteFile(args[1])
} else if (args[0] === 'encrypt') {
    encryptAndOverwriteFile(args[1])
} else {
    console.log()
    console.log(red + "Error: invalid arguments" + reset)
}
