# EvaluAgent API Contact Generator

This script is designed to generate and send contact information to the EvaluAgent API. It handles various operations such as creating contacts, adding new API keys, listing keys, and deleting keys from a keyfile.

## Features

- Generate chat and call contact templates.
- Add, list, and delete API keys in a keyfile.
- Send generated contacts to the EvaluAgent API.
- Encrypt and decrypt keyfile for secure storage of API keys.

## Requirements

- Node.js
- Dependencies: `fs`, `axios`, `crypto`, `FormData`, `readline`, `music-metadata`, `path`, `stream/consumers`, 'chalk', and `console`.

## Setup

1. Clone the repository or download the script.
2. Ensure you have Node.js installed on your machine.
3. Install required Node.js packages: `npm install axios crypto form-data music-metadata chalk@4.1.0`.

## Usage

The script can be executed from the command line with various arguments to perform different tasks:

1. Initialize required files and directories: `node gen.js init`.
2. Add a new API key: `node gen.js add [contract_name] [api key:secret key] [encryption_key]`.
3. List all keys in the keyfile: `node gen.js list [encryption_key]`.
4. Delete a key from the keyfile: `node gen.js del [contract_name] [encryption_key]`.
5. Generate and send contacts: `node gen.js contacts [contract_name] [contact_type] [number_of_contacts] [interval] [decryption_key]`.

### Contact Generation

- `contract_name`: The name of the contract.
- `contact_type`: Type of contact to generate - 'c' for calls, 't' for tickets, or 'b' for both.
- `number_of_contacts`: Number of contacts to generate.
- `interval`: Time interval between contact generations.
- `encryption_key`: Key used to encrypt and decrypt the keyfile.

## Contributing

Feel free to fork the repository and submit pull requests.

## Acknowledgments

- EvaluAgent API for providing the endpoint.
- All contributors who have helped to enhance this script.
