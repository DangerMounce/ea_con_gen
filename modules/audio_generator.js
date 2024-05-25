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
const projectDir = path.join(__dirname, '..'); // Move up to the project root
const callsDir = path.join(projectDir, 'calls');
const repoRoot = path.resolve(__dirname, '..', '..');

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
// const mergedFilePath = path.join(callsDir, 'merged_output.mp3'); // Save merged file in 'calls' directory
// const stereoFilePath = path.join(callsDir, audioFileOutput); // Save stereo file in 'calls' directory

const agentVoice = "nova";
const customerVoice = "onyx";

// Set the ffmpeg and ffprobe binary paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

async function generateAudioFilename() {
  const uuid = await generateUuid();
  return `${uuid}.mp3`;
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
    const { message, speaker_is_customer } = data[i];
    const voice = speaker_is_customer ? 'onyx' : 'nova';
    const speaker = speaker_is_customer ? 'customer' : 'agent';
    await generateSpeech(message, voice, speaker, i + 1);
  }
}

async function concatenateAudioFiles(fileList, outputFile) {
  const inputListFile = path.join(path.dirname(outputFile), 'input_files.txt');
  const fileListContent = fileList.map(file => `file '${file}'`).join('\n');
  fs.writeFileSync(inputListFile, fileListContent);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputListFile)
      .inputOptions('-f', 'concat', '-safe', '0')
      .outputOptions('-c', 'copy')
      .on('end', () => {
        fs.unlinkSync(inputListFile);
        resolve();
      })
      .on('error', (err) => {
        fs.unlinkSync(inputListFile);
        reject(err);
      })
      .save(outputFile);
  });
}

async function deleteFilesInDirectory(directory) {
  const files = await fs.promises.readdir(directory);
  for (const file of files) {
    await fs.promises.unlink(path.join(directory, file));
  }
}

async function processAndConcatenateAudio(audioFileOutput) {
  const inputDir = path.join(__dirname, 'audio_output');
  const outputDir = path.join(__dirname, 'processed_output');
  const callsDir = path.join(projectDir, 'calls');
  const finalOutputFilePath = path.join(callsDir, audioFileOutput);

  // Create output and calls directories if they don't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  if (!fs.existsSync(callsDir)) {
    fs.mkdirSync(callsDir);
  }

  // Get all mp3 files from the input directory
  const audioFiles = fs.readdirSync(inputDir).filter(file => file.endsWith('.mp3'));

  // Process and categorize files
  const processedFiles = [];
  let filesProcessed = 0;

  const processFile = (file) => {
    return new Promise((resolve, reject) => {
      const inputFilePath = path.join(inputDir, file);
      const outputFilePath = path.join(outputDir, file);

      if (file.includes('agent')) {
        audioToLeftChannel(inputFilePath, outputFilePath, (err) => {
          if (err) return reject(err);
          resolve();
        });
      } else if (file.includes('customer')) {
        audioToRightChannel(inputFilePath, outputFilePath, (err) => {
          if (err) return reject(err);
          resolve();
        });
      } else {
        resolve();
      }

      processedFiles.push({ file: outputFilePath, order: parseInt(file) });
    });
  };

  for (const file of audioFiles) {
    await processFile(file);
    filesProcessed += 1;
  }

  if (filesProcessed === audioFiles.length) {
    processedFiles.sort((a, b) => a.order - b.order);
    const sortedFilePaths = processedFiles.map(item => item.file);
    await concatenateAudioFiles(sortedFilePaths, finalOutputFilePath);

    await deleteFilesInDirectory(inputDir);
    await deleteFilesInDirectory(outputDir);
  }
}

// Function to process audio to left channel
function audioToLeftChannel(inputFile, outputFile, callback) {
  ffmpeg(inputFile)
    .audioChannels(2)
    .complexFilter([
      '[0:a]channelsplit=channel_layout=stereo[left][right]',
      '[right]volume=0[right_mute]',
      '[left][right_mute]amerge=inputs=2[a]'
    ])
    .outputOptions('-map', '[a]')
    .on('end', () => {
      console.log(`Processing (left channel) for ${inputFile} finished successfully`);
      callback();
    })
    .on('error', (err) => {
      console.error('Error:', err.message);
      callback(err);
    })
    .save(outputFile);
}

// Function to process audio to right channel
function audioToRightChannel(inputFile, outputFile, callback) {
  ffmpeg(inputFile)
    .audioChannels(2)
    .complexFilter([
      '[0:a]channelsplit=channel_layout=stereo[left][right]',
      '[left]volume=0[left_mute]',
      '[left_mute][right]amerge=inputs=2[a]'
    ])
    .outputOptions('-map', '[a]')
    .on('end', () => {
      console.log(`Processing (right channel) for ${inputFile} finished successfully`);
      callback();
    })
    .on('error', (err) => {
      console.error('An error occurred: ' + err.message);
      callback(err);
    })
    .save(outputFile);
}

// Generate audio files based on conversation data
export async function generateAudio(data) {
  try {
    await processMessages(data);
    const audioFileOutput = await generateAudioFilename();
    await processAndConcatenateAudio(audioFileOutput);
    return audioFileOutput;
  } catch (error) {
    console.error('Error during audio generation process:', error);
    throw error;
  }
}