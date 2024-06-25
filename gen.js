// Check for files and folders
// Need tickets, calls folder
import { update } from './ea_con_modules/autoUpdate.js';
await update.handleFirstRun()

process.removeAllListeners('warning');
process.on('warning', (warning) => {
    // Log the warning to the console
    display.message = `${warning.name} - ${warning.message}`
});

import {
    fileHandling,
    instructions
} from './ea_con_modules/filesAndFolders.js'
import { display } from './ea_con_modules/display.js'
import { utils } from './ea_con_modules/utils.js';
import { sync } from './ea_con_modules/librarySync.js'

import { ai } from './ea_con_modules/openAiContacts.js';


const args = process.argv.slice(2);
export const instruction = args[0].toLowerCase()
instructions.contractName = args[1]
instructions.eaApiKey = args[2]

// If required dirs don't exist, create them.
await fileHandling.createDirectories()

// If required files don't exist, create them.
await fileHandling.createFiles()
// await ai.ensureEnvFileAndApiKey()

// Check for dev token and enable dev mode
const isDeveloper = await fileHandling.checkFileExists(fileHandling.devToken)
if (isDeveloper && !display.message.includes("DeprecationWarning")) {
        display.message = '•͡˘㇁•͡˘ Dev Mode Enabled'
    
}


export const user = {
    isDeveloper
}


// Check instruction
switch (instruction) {
    case "add": // Adding an API key
        // Check that contractName and apiKey is present
        if (args.length != 3) {
            display.showError('Invalid arguments.')
        } else {
            await fileHandling.addContractToKeyFile()
        };
        break;
    case "del": // Deleting and API key
        // Check that contractName is present
        if (args.length != 2) {
            display.showError('Invalid arguments')
        } else {
            await fileHandling.deleteContractFromKeyFile()
        }
        break;
    case "contacts":
        if (!isDeveloper) {
            await update.checkForUpdates()
            await sync.checkForCallUpdates()
            await sync.checkForChatUpdates()
        }
        utils.instructionContacts()
        break;
    case "import":
        if (!isDeveloper) {
            await update.checkForUpdates()
            await sync.checkForCallUpdates()
            await sync.checkForChatUpdates()
        }
        if (args.length != 1) {
            display.showError('Invalid arguments')
        } else {
            utils.instructionImport()
        }
        break;
    case "sync":
        utils.syncLibraries()
        break;
    case "changelog":
        if (!isDeveloper) {
            await update.checkForUpdates()
            await sync.checkForCallUpdates()
            await sync.checkForChatUpdates()
        }
        console.clear()
        await display.figletText('ea_con_gen')
        console.log('')
        update.displayChangeLog()
        break;
    case "new":
        await ai.ensureEnvFileAndApiKey()
        utils.newContact()
        break;
    case "contacts1":
        console.clear()
        display.figletText('ea_con_gen')
        console.log('')
        displayChangeLog()
        break;
    default:
        display.showError('Invalid arguments')
    // Add any logic for other cases here
}
