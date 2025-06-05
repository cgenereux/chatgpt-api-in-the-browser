// Improved ChatGPT API Client for VS Code
// Save this as improved-chatgpt-client.js

const https = require('https');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Configuration
const CONFIG_FILE = 'chatgpt-config.json';
const TRANSCRIPT_FILE = 'transcript.txt';
let config = {
  apiKey: '',
  model: 'gpt-4.5',
  temperature: 0.7,
  conversation: []
};

// Create a file for input if it doesn't exist
const INPUT_FILE = 'chatgpt-input.txt';
const OUTPUT_FILE = 'chatgpt-response.txt';

// Load configuration if exists
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      const loadedConfig = JSON.parse(data);
      config = { ...config, ...loadedConfig };
      console.log('Configuration loaded successfully.');
    } else {
      console.log('No configuration file found. Creating a new one.');
      saveConfig();
    }
  } catch (error) {
    console.error('Error loading configuration:', error.message);
  }
}

// Save configuration
function saveConfig() {
  try {
    const { conversation, ...configToSave } = config;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configToSave, null, 2), 'utf8');
    console.log('Configuration saved.');
  } catch (error) {
    console.error('Error saving configuration:', error.message);
  }
}

// Write transcript file
function writeTranscript() {
  let transcript = '';
  config.conversation.forEach(msg => {
    if (msg.role === 'user') {
      transcript += 'you said:\n' + msg.content + '\n\n';
    } else if (msg.role === 'assistant') {
      transcript += 'chatgpt said:\n' + msg.content + '\n\n';
    }
  });
  try {
    fs.writeFileSync(TRANSCRIPT_FILE, transcript, 'utf8');
    console.log(`Transcript updated to ${TRANSCRIPT_FILE}`);
  } catch (error) {
    console.error('Error writing transcript:', error.message);
  }
}

// Create input file if it doesn't exist
function createInputFile() {
  if (!fs.existsSync(INPUT_FILE)) {
    fs.writeFileSync(INPUT_FILE, '# Type or paste your message to ChatGPT here.\n# Save this file when you\'re done.\n# The response will appear in chatgpt-response.txt\n\n', 'utf8');
    console.log(`Created ${INPUT_FILE} for your input.`);
  }
}

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask for API key if not set
function setupApiKey() {
  return new Promise(resolve => {
    if (!config.apiKey) {
      rl.question('Please enter your OpenAI API key: ', answer => {
        config.apiKey = answer.trim();
        saveConfig();
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Send message to ChatGPT API
function sendMessage(userMessage) {
  return new Promise((resolve, reject) => {
    config.conversation.push({ role: 'user', content: userMessage });
    const data = JSON.stringify({
      model: config.model,
      messages: config.conversation,
      temperature: config.temperature
    });
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, res => {
      let responseData = '';
      res.on('data', chunk => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          if (response.error) {
            reject(new Error(response.error.message));
            return;
          }
          const assistantMessage = response.choices[0].message.content;
          config.conversation.push({ role: 'assistant', content: assistantMessage });
          resolve(assistantMessage);
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on('error', error => reject(error));
    req.write(data);
    req.end();
  });
}

// Display available commands
function showHelp() {
  console.log('\n--- Improved ChatGPT Client Commands ---');
  console.log('/input - Open input file for editing (type or paste your message)');
  console.log('/send - Send the content of the input file to ChatGPT');
  console.log('/clear - Clear conversation history');
  console.log('/save [filename] - Save conversation to file');
  console.log('/model [model-name] - Change the model (e.g., gpt-4-turbo, gpt-3.5-turbo)');
  console.log('/temp [0-1] - Set temperature (0 = deterministic, 1 = creative)');
  console.log('/exit - Exit the application');
  console.log('/help - Show this help message');
  console.log('---------------------------------------\n');
}

// Open file in VS Code
function openFileInVSCode(filePath) {
  const fullPath = path.resolve(filePath);
  const exec = require('child_process').exec;
  exec(`code "${fullPath}"`, error => {
    if (error) {
      console.error(`Failed to open ${filePath} in VS Code:`, error.message);
      console.log(`Please manually open ${fullPath} to edit your message.`);
    }
  });
}

// Read input file content
function readInputFile() {
  try {
    const content = fs.readFileSync(INPUT_FILE, 'utf8');
    return content
      .split('\n')
      .filter(line => !line.trim().startsWith('#'))
      .join('\n')
      .trim();
  } catch (error) {
    console.error('Error reading input file:', error.message);
    return '';
  }
}

// Write to output file
function writeOutputFile(content) {
  try {
    fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
    console.log(`Response saved to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error writing output file:', error.message);
  }
}

// Handle commands
async function handleCommand(input) {
  const args = input.split(' ');
  const command = args[0].toLowerCase();
  switch (command) {
    case '/input':
      createInputFile();
      openFileInVSCode(INPUT_FILE);
      console.log(`Opening ${INPUT_FILE} for editing. Save the file when done and use /send to send your message.`);
      return true;
    case '/send':
      const message = readInputFile();
      if (message) {
        try {
          console.log('\nSending your message to ChatGPT...');
          const response = await sendMessage(message);
          console.log('\nResponse received:');
          console.log('-'.repeat(50));
          console.log(response);
          console.log('-'.repeat(50));
          writeOutputFile(response);
          writeTranscript();
          openFileInVSCode(OUTPUT_FILE);
        } catch (error) {
          console.error('Error:', error.message);
        }
      } else {
        console.log('Input file is empty or contains only comments. Use /input to edit it.');
      }
      return true;
    case '/clear':
      config.conversation = [];
      console.log('Conversation history cleared.');
      writeTranscript();
      return true;
    case '/save':
      const filename = args[1] || `conversation-${Date.now()}.json`;
      try {
        fs.writeFileSync(filename, JSON.stringify(config.conversation, null, 2), 'utf8');
        console.log(`Conversation saved to ${filename}`);
      } catch (error) {
        console.error('Error saving conversation:', error.message);
      }
      return true;
    case '/model':
      if (args[1]) {
        config.model = args[1];
        console.log(`Model changed to ${config.model}`);
        saveConfig();
      } else {
        console.log(`Current model: ${config.model}`);
      }
      return true;
    case '/temp':
      if (args[1] && !isNaN(parseFloat(args[1]))) {
        config.temperature = parseFloat(args[1]);
        console.log(`Temperature set to ${config.temperature}`);
        saveConfig();
      } else {
        console.log(`Current temperature: ${config.temperature}`);
      }
      return true;
    case '/exit':
      rl.close();
      process.exit(0);
    case '/help':
      showHelp();
      return true;
    default:
      return false;
  }
}

// Main chat loop
async function startChat() {
  console.log('Improved ChatGPT Client Started.');
  showHelp();
  createInputFile();
  const promptCommand = () => {
    rl.question('\nEnter command (or /help): ', async input => {
      if (input.startsWith('/')) {
        await handleCommand(input);
      } else {
        console.log('Unknown command. Use /help to see available commands.');
      }
      promptCommand();
    });
  };
  promptCommand();
}

// Initialize and start the application
async function initialize() {
  loadConfig();
  await setupApiKey();
  startChat();
}

initialize();