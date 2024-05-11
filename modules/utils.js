import fetch from 'node-fetch';

export async function generateUuid() {
    const response = await fetch('https://www.uuidtools.com/api/generate/v1');
    const [uuid] = await response.json();
    return uuid;
}

