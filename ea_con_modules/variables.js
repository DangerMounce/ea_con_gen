// Module for variables

let ea = null;
let openAi = null;
let eaUrl = null;
let main = null;
let contractName = null;
let numberOfContacts = null;
let interval = 0;
let isDev = null;
let contactType = null;
let extension = '';
let importSource = '';

const euUrl = 'https://api.evaluagent.com/v1'
const ausUrl = 'https://api.aus.evaluagent.com/v1'
const usUrl = 'https://api.us-east.evaluagent.com/v1'

export const audio = {
    extension
}

export const apiKey = { // Anything to do with API keys
    ea, openAi
}

export const instruction = { // Anything to do with instructions or arguments
    main, contractName, numberOfContacts, interval, contactType, importSource
}

export const api = { // Anything to do with the API url
    eaUrl, euUrl, ausUrl, usUrl
}

export const user = {
    isDev
}
