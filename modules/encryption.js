import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const TARGET_FILE = '../keyFile.json';
let keyFileEncrypted


//Encrypts the keyfile
export async function encryptFile(password) {
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

// Decrypyts the keyFile
export async function decryptFile(password) {
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