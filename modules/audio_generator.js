import fs from "fs";
import path from "path";
import OpenAI from "openai";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import { generateUuid } from './utils.js'
import { writeLog, clearLog } from "./generate_log.js";

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..'); // Go up one level to the repo root


// Log the path of the .env file being loaded
// console.log(`Loading .env from: ${path.join('.env')}`);

// Load environment variables from the .env file in the repo root
dotenv.config({ path: path.join('.env') });

// Initialize OpenAI client
const openAIClient = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'] // Ensure this is the correct key in your .env file
});

const audioFileOutput = await generateAudioFilename()
const outputDir = path.join(__dirname, 'audio_output'); // audio_output directory in ea_con_gen/modules/
const callsDir = path.join(repoRoot, 'calls'); // Directory for final output files in ea_con_gen/calls/
const mergedFilePath = path.join(callsDir, 'merged_output.mp3'); // Save merged file in 'calls' directory
const stereoFilePath = path.join(callsDir, audioFileOutput); // Save stereo file in 'calls' directory

const agentVoice = "nova";
const customerVoice = "onyx";

// Set the ffmpeg and ffprobe binary paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

async function generateAudioFilename() {
  const uuid = await generateUuid()
  return `${uuid}.mp3`
}

async function generateSpeech(message, voice, speaker, index) {
  const speechFile = path.join(outputDir, `${index}_${speaker}.mp3`);
  const mp3 = await openAIClient.audio.speech.create({
    model: "tts-1",
    voice: voice,
    input: message,
  });
  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
  // console.log(`Generated speech for message ${index}: ${speechFile}`);
}

async function processMessages(data) {
  // Ensure the output directories exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  if (!fs.existsSync(callsDir)) {
    fs.mkdirSync(callsDir);
  }
  for (let i = 0; i < data.length; i++) {
    // console.log('Processing message:', data[i].message);
    const { message, speaker_is_customer } = data[i];
    const voice = speaker_is_customer ? customerVoice : agentVoice;
    const speaker = speaker_is_customer ? 'customer' : 'agent';
    await generateSpeech(message, voice, speaker, i + 1);
  }
}

async function mergeAudioFiles() {
  const files = fs.readdirSync(outputDir).filter(file => file.endsWith('.mp3'));

  // Sort files by their sequence number
  files.sort((a, b) => {
    const getIndex = (file) => parseInt(file.split('_')[0], 10);
    return getIndex(a) - getIndex(b);
  });

  // Write the list of files to a temporary file
  const concatFilePath = path.join(__dirname, 'concat_list.txt');
  const concatFileContent = files.map(file => `file '${path.join(outputDir, file)}'`).join('\n');
  fs.writeFileSync(concatFilePath, concatFileContent);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatFilePath)
      .inputFormat('concat')
      .inputOptions('-safe 0')
      .outputOptions('-c copy')
      .on('start', commandLine => console.log(''))
      .on('end', () => {
        fs.unlinkSync(concatFilePath); // Clean up the temporary file
        resolve();
      })
      .on('error', err => {
        fs.unlinkSync(concatFilePath); // Clean up the temporary file
        reject(err);
      })
      .save(mergedFilePath);
  });
}

async function convertToStereo(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .audioChannels(2) // Ensure the output has 2 channels (stereo)
      .on('start', commandLine => console.log(''))
      .on('end', resolve)
      .on('error', reject)
      .save(outputFilePath);
  });
}

async function cleanup() {
  // Delete files in audio_output directory
  const files = fs.readdirSync(outputDir);
  for (const file of files) {
    fs.unlinkSync(path.join(outputDir, file));
  }

  // Delete merged_output.mp3
  if (fs.existsSync(mergedFilePath)) {
    fs.unlinkSync(mergedFilePath);
  }
}

// Process messages to generate the audio files
export async function generateAudio(data) {
  try {
    await processMessages(data);
    await mergeAudioFiles();
    await convertToStereo(mergedFilePath, stereoFilePath);
    await cleanup();
  } catch (error) {
    console.error('Error during audio generation process:', error);
  }
  return audioFileOutput
}
