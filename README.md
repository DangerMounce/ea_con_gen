# EvaluAgent Contact Generator

This script facilitates the automation of contact generation processes within the EvaluAgent platform, offering functionalities such as audio uploads, API key management, and dynamic contact template generation based on user interactions.

## Features

- **File Initialization**: Prepares essential directories and files for operation.
- **Encryption & Decryption**: Secures API keys using encryption and provides decryption capabilities for access management.
- **Contact Management**: Generates and uploads contact data to EvaluAgent, supporting both calls and tickets formats.
- **Audio Handling**: Manages audio files for calls, including uploading and assigning metadata.

## Prerequisites

- Node.js installed (visit [Node.js official site](https://nodejs.org) for installation instructions).
- npm (Node Package Manager), installed along with Node.js.

## Installation

Clone the repository and install the dependencies:

```bash
npm install chalk inquirer axios node-fetch btoa music-metadata form-data openai
```
## Usage

Navigate to the script directory and run the script with the following commands:

node gen help         # Display help information<br>
node gen init         # Initialize necessary files and directories<br>
node gen add <contract name> <api key> # Add a new API key<br>
node gen del <contract name> # Delete an API key<br>
node gen contacts     # Initiate the contact generation process<br>

## Commands Overview

help: Shows help information for command usage.<br>
init: Sets up required directories and files, including outputLog.json and keyFile.json.<br>
add: Securely adds a new API key to the encrypted keyFile.json.<br>
del: Removes an API key from the encrypted keyFile.json.<br>
contacts: Generates contacts based on predefined templates and uploads them to the EvaluAgent API.
