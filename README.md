# evaluagent Contact Generator

This script facilitates the automation of contact generation processes within the evaluagent platform, offering functionalities such as audio uploads, API key management, and dynamic contact template generation based on user interactions.

## Features

- **API key Management**: Add or remove contract names and associated API keys.
- **Contact Management**: Generates and uploads contact data to EvaluAgent, supporting both calls and tickets formats.
- **Audio Handling**: Manages audio files for calls, including uploading and assigning metadata.
- **Chat Transcript and Call Generation**: Utlises OpenAI to generate new chat transcripts and call files.
- **Automated syncing of contacts**: Syncs with library of chats and calls.

## Prerequisites

- Node.js installed (visit [Node.js official site](https://nodejs.org) for installation instructions).
- npm (Node Package Manager), installed along with Node.js.

## Installation

Clone the repository and install the dependencies:

```bash
npm install chalk inquirer axios node-fetch btoa music-metadata form-data openai csv-parser
```
## Usage

Navigate to the script directory and run the script with the following commands:

`node gen help` - Display help information<br>
`node gen add [CONTRACT NAME] [API KEY]` - Add a contract name and api key to the keyFile.<br>
`node gen del [CONTRACT NAME]` - Delete a contract and API key from the keyFile.<br>
`node gen contacts` Initiate the contact generation process.<br>

## Commands Overview
`node gen`...<br>
`update`: Forces an update to latest version<br>
`clear chats [or] calls`: Removes all chats and calls from directories<br>
`log`: Displays the event log<br>
`changelog`: Displays current version's change log<br>
