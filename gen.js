import chalk from 'chalk'
import path from 'path'
import { fileURLToPath } from 'url';
import { config } from 'dotenv'
import OpenAI from 'openai';
import { apiKey, instruction, api, user } from "./ea_con_modules/variables.js";
import { init, dirs, file, amendKeyFile } from "./ea_con_modules/fileHandling.js";
import { display } from "./ea_con_modules/display.js";
import { menu } from "./ea_con_modules/menus.js";
import { evaluagent } from './ea_con_modules/eaApi.js';
import { importer, number } from './ea_con_modules/import.js';
import { ai } from './ea_con_modules/AiContacts.js';
import { librarySync } from './ea_con_modules/librarySync.js';
import { update } from './ea_con_modules/autoUpdate.js';

process.removeAllListeners('warning');

const dirsArray = await init.getArrayOn(dirs)

dirsArray.forEach(dir => {
    init.checkAndCreateDirectory(dir)
});


await init.checkAndCreateFile(file.keyFile, '{}')


user.isDev = await init.fileExists(file.devToken)

if (user.isDev) {
    process.on('warning', (warning) => {
        // Log the warning to the console
        display.message = chalk.bold.red(`*DEV MESSAGE* ${warning.name} - ${warning.message}`)
        console.log(display.message)
    });
    display.message = chalk.bold.green('*DEV*')
}


const args = process.argv.slice(2)

instruction.main = args[0].toLowerCase()


switch (instruction.main) {
    case "add": //Adding an API key
        // Validate the arguments
        if (args.length === 3) {
            instruction.contractName = args[1]
            apiKey.ea = args[2]
            amendKeyFile.addContract()
        } else {
            display.error('node gen add [contract_name] [api_key] is required.  Something was missing.')
        }
        break;
    case "del": // Deleting an API key
        // Validate the arguments
        if (args.length === 2) {
            instruction.contractName = args[1]
            amendKeyFile.deleteContract()
        } else {
            display.error('node gen del [contract_name] is required.  Something was missing.')
        }
        break;
    case "contacts": // Sending Contacts from the Libaries
        if (!user.isDev) {
            await update.checkForUpdates()
            await update.handleFirstRun()
        }
        await librarySync.chatUpdates()
        await librarySync.callUpdates()
        // Validate the arguments
        if (args.length === 1) {
            api.eaUrl = await menu.clusterSelection()
            apiKey.ea = await menu.contractSelection()
            console.clear()
            display.connectingToEndPoint()
            let filteredAgentList = await evaluagent.getAgents()
            evaluagent.agentList = filteredAgentList
            display.stopAnimation()
            instruction.contactType = await menu.storedContactType()
            instruction.numberOfContacts = await menu.numberOfContactsToCreate()
            if (instruction.numberOfContacts > 1) {
                instruction.interval = await menu.delayBetweenContacts()
            }
            await display.summary()
            await menu.yesOrNo('Ready to begin?')
            evaluagent.sendContacts(instruction.numberOfContacts)

        } else {
            display.error(`node gen contacts is required.  Something wasn't right there.`)
        }
        break;
    case "import": // Import Contacts from the import folders
        if (!user.isDev) {
            await update.checkForUpdates()
            await update.handleFirstRun()
        }
        // Validate the arguments
        if (args.length === 1) {
            api.eaUrl = await menu.clusterSelection()
            apiKey.ea = await menu.contractSelection()
            console.clear()
            display.connectingToEndPoint()
            let filteredAgentList = await evaluagent.getAgents()
            evaluagent.agentList = filteredAgentList
            display.stopAnimation()
            instruction.importSource = await menu.importContactType()
            if (instruction.importSource === 'Calls') {
                importer.uploadFileType = await menu.audioFileExtension()
                number.callsToImport = await importer.getImportFileList(dirs.call_import, importer.uploadFileType)
            }
            importer.callMetaDataFiles = await importer.getImportFileList(dirs.call_import, 'csv')
            await display.summary()
            await menu.yesOrNo('Ready to process import queue?')
            if (instruction.importSource === 'Calls') {
                console.log('Processing calls')
                importer.processCallAndCSVContent(number.callsToImport)
            } else {
                importer.processTickets(number.ticketsToImport)
            }
        } else {
            display.error(`node gen import is required.  Something wasn't right there.`)
        }
        break;
    case "new":
        if (!user.isDev) {
            await update.checkForUpdates()
            await update.handleFirstRun()
        }
        api.eaUrl = await menu.clusterSelection()
        apiKey.ea = await menu.contractSelection()
        console.clear()
        display.connectingToEndPoint()
        let filteredAgentList = await evaluagent.getAgents()
        evaluagent.agentList = filteredAgentList
        display.stopAnimation()
        await ai.ensureEnvExistsWithOpenAiApiKey()
        // Define __dirname and __filename
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        // Load environment variables from the .env file located in the ea_con_modules directory
        const envPath = path.join(__dirname, 'ea_con_modules', '.env');
        config({ path: envPath });

        apiKey.openAi = process.env['OPENAI_API_KEY'];

        if (apiKey && apiKey !== 'placeholder-for-api-key') {
            ai.openAIClient = new OpenAI({
                apiKey: apiKey.openAi
            });
            // console.log('OpenAI Client initialised successfully.');
        } else {
            display.error(`Can't initiliase OpenAI Client with defined key`);
        }
        console.clear()
        ai.model = await menu.promptGptModel()
        instruction.contactType = await menu.promptAiContactType()
        ai.contactType = instruction.contactType
        instruction.numberOfContacts = await menu.numberOfContactsToCreate()
        if (instruction.numberOfContacts > 1) {
            instruction.interval = await menu.delayBetweenContacts()
        }
        await display.summary()
        await menu.yesOrNo('Ready to begin?')
        evaluagent.sendContacts(instruction.numberOfContacts)
        break;
    default:
        display.error(`Invalid arguments.`)
}

