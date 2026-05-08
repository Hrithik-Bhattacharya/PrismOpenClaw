const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

const ROOT = __dirname;
const ENV_PATH = path.join(ROOT, '.env');

// Configuration
const env = loadEnv();
const ADB_HOST = env.ADB_HOST || '127.0.0.1';
const ADB_PORT = env.ADB_PORT || '5037';
const M1_API_URL = env.M1_API_URL || 'http://localhost:5000';
const M1_ACK_URL = `${M1_API_URL.replace(/\/\/$/, '')}/ack`;
const RETRY_ATTEMPTS = parseInt(env.RETRY_ATTEMPTS) || 2;
const RETRY_DELAY = parseInt(env.RETRY_DELAY) || 1000;
const DANGEROUS_ACTIONS = ['silence_all', 'set_brightness_min', 'enable_power_saver'];
const CONFIRM_DANGEROUS = env.CONFIRM_DANGEROUS !== 'false';

// Load actions from JSON file
let ACTION_TO_ADB;
try {
  ACTION_TO_ADB = loadActionsFromFile(path.join(ROOT, 'actions.json'));
} catch (error) {
  console.error(`Failed to load actions.json: ${error.message}`);
  process.exit(1);
}

// Utility functions
function parseDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const text = fs.readFileSync(filePath, 'utf8');
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const [key, ...rest] = line.split('=');
        return [key.trim(), rest.join('=').trim()];
      })
  );
}

function loadEnv() {
  return {
    ...parseDotEnv(ENV_PATH),
    ...process.env,
  };
}

function loadActionsFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Actions file not found: ${filePath}`);
  }
  const text = fs.readFileSync(filePath, 'utf8');
  const actions = JSON.parse(text);

  // Validate that it's an object with string values
  if (typeof actions !== 'object' || actions === null) {
    throw new Error('Actions file must contain a JSON object');
  }

  for (const [key, value] of Object.entries(actions)) {
    if (typeof value !== 'string') {
      throw new Error(`Action "${key}" must have a string value (ADB command)`);
    }
  }

  log('info', `Loaded ${Object.keys(actions).length} actions from ${filePath}`);
  return actions;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] ${level.toUpperCase()}`;
  console.log(`${prefix} ${message}`);
  if (data) console.log(`${prefix} Details:`, data);
}

function validateAction(action) {
  if (!action || typeof action !== 'string') {
    throw new Error(`Invalid action: ${action} (must be non-empty string)`);
  }
  if (!ACTION_TO_ADB[action]) {
    throw new Error(`Unknown action: ${action} (not in actions.json mapping)`);
  }
  return true;
}

function isDangerousAction(action) {
  return DANGEROUS_ACTIONS.includes(action);
}

async function confirmDangerousAction(action) {
  if (!CONFIRM_DANGEROUS || !isDangerousAction(action)) return true;

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`⚠️  DANGEROUS ACTION: ${action}\n   This may significantly impact device behavior.\n   Continue? (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

function printHelp() {
  console.log(`
M2 Android ADB Executor

Usage:
  node index.js --help
  node index.js --list-actions
  node index.js --device-info
  node index.js --status
  node index.js --history
  node index.js --file <path>
  node index.js --json '<json-string>'
  node index.js --url <decision-url>

Options:
  --help            Show help and exit.
  --list-actions    Print all supported action keys and exit.
  --device-info     Show information about connected Android devices.
  --status          Show executor status and configuration.
  --history         Show execution history (last 10 actions).
  --file <path>     Execute actions from a local decision JSON file.
  --json <string>   Execute actions from a JSON string.
  --url <url>       Fetch a decision document from a REST endpoint.
  --dry-run         Print the ADB commands without executing them.

Environment Variables:
  ADB_HOST         ADB server host (default: 127.0.0.1)
  ADB_PORT         ADB server port (default: 5037)
  M1_API_URL       Base PI Engine URL for reference (default: http://localhost:5000)
  RETRY_ATTEMPTS   Number of retry attempts for failed commands (default: 2)
  RETRY_DELAY      Delay between retries in ms (default: 1000)
  CONFIRM_DANGEROUS Whether to confirm dangerous actions (default: true)

Examples:
  node index.js --file ./sample-decision.json
  node index.js --json '{"actions":["enable_dnd","open_calendar"]}' --dry-run
  node index.js --url ${M1_API_URL}/decision/latest --dry-run
  node index.js --device-info
  node index.js --status
`);
}

function parseArgs(argv) {
  const args = { dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--list-actions') {
      args.listActions = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--device-info') {
      args.deviceInfo = true;
    } else if (arg === '--status') {
      args.status = true;
    } else if (arg === '--history') {
      args.history = true;
    } else if (arg === '--file') {
      args.file = argv[i + 1];
      i += 1;
    } else if (arg === '--json') {
      args.json = argv[i + 1];
      i += 1;
    } else if (arg === '--url') {
      args.url = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function loadJsonFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Decision file not found: ${filePath}`);
  }
  const text = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(text);
}

async function getJsonFromUrl(url) {
  if (typeof fetch === 'function') {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? require('https') : require('http');
    client.get(url, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(new Error(`Invalid JSON from ${url}: ${error.message}`));
          }
        } else {
          reject(new Error(`Failed to fetch ${url}: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    }).on('error', reject);
  });
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const client = url.startsWith('https://') ? require('https') : require('http');
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = client.request(options, res => {
      let responseBody = '';
      res.on('data', chunk => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseBody));
          } catch (error) {
            resolve({});
          }
        } else {
          reject(new Error(`POST ${url} failed: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function validateDecision(decision) {
  if (!decision || typeof decision !== 'object') {
    throw new Error('Decision payload must be a JSON object.');
  }
  if (!Array.isArray(decision.actions)) {
    throw new Error('Decision payload must include an "actions" array.');
  }
}

function isLocalHost(host) {
  const normalized = String(host).trim().toLowerCase();
  return ['127.0.0.1', 'localhost', '::1', '0.0.0.0'].includes(normalized);
}

async function detectDevices() {
  try {
    const result = await runShellCommand('adb devices', prepareAdbEnv());
    const lines = result.stdout.trim().split('\n').slice(1); // Skip "List of devices attached"
    const devices = lines
      .map(line => line.trim())
      .filter(line => line && !line.includes('offline') && !line.includes('unauthorized'))
      .map(line => line.split('\t')[0]);

    return devices;
  } catch (error) {
    log('error', 'Failed to detect devices', error.message);
    return [];
  }
}

async function getDeviceInfo() {
  try {
    const devices = await detectDevices();
    if (devices.length === 0) {
      return { connected: false, devices: [] };
    }

    const deviceInfo = [];
    for (const device of devices) {
      try {
        const model = await runShellCommand(`adb -s ${device} shell getprop ro.product.model`, prepareAdbEnv());
        const androidVersion = await runShellCommand(`adb -s ${device} shell getprop ro.build.version.release`, prepareAdbEnv());
        const battery = await runShellCommand(`adb -s ${device} shell dumpsys battery | grep level`, prepareAdbEnv());

        deviceInfo.push({
          id: device,
          model: model.stdout.trim(),
          androidVersion: androidVersion.stdout.trim(),
          batteryLevel: battery.stdout.trim().match(/level: (\d+)/)?.[1] || 'unknown'
        });
      } catch (error) {
        deviceInfo.push({
          id: device,
          error: error.message
        });
      }
    }

    return { connected: true, devices: deviceInfo };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

function prepareAdbEnv() {
  return {
    ...process.env,
    ADB_SERVER_PORT: String(ADB_PORT),
  };
}

async function runShellCommand(command, envVars, retries = RETRY_ATTEMPTS) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        exec(command, { env: envVars }, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Command failed: ${command}\n${stderr || stdout || error.message}`));
          } else {
            resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
          }
        });
      });
    } catch (error) {
      if (attempt < retries) {
        log('warn', `Command failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${RETRY_DELAY}ms`, error.message);
        await sleep(RETRY_DELAY);
      } else {
        throw error;
      }
    }
  }
}

async function connectToAdb() {
  if (isLocalHost(ADB_HOST)) {
    return;
  }
  const connectCommand = `adb connect ${ADB_HOST}:${ADB_PORT}`;
  await runShellCommand(connectCommand, prepareAdbEnv());
}

async function connectToAdb() {
  if (isLocalHost(ADB_HOST)) {
    return;
  }
  const connectCommand = `adb connect ${ADB_HOST}:${ADB_PORT}`;
  await runShellCommand(connectCommand, prepareAdbEnv());
}

async function executeAction(action, options) {
  try {
    // Validate action
    validateAction(action);

    const command = ACTION_TO_ADB[action];
    if (!command) {
      throw new Error(`No ADB command mapping found for action: ${action}`);
    }

    // Check for dangerous actions
    if (!await confirmDangerousAction(action)) {
      log('info', `Skipped dangerous action: ${action}`);
      return { success: false, skipped: true, reason: 'user_cancelled' };
    }

    if (options.dryRun) {
      console.log(`⏱ dry-run: ${action} -> ${command}`);
      return { success: true, dryRun: true };
    }

    log('info', `Executing action '${action}'`);
    console.log(`▶ Executing action '${action}'`);

    const startTime = Date.now();
    await runShellCommand(command, prepareAdbEnv());
    const duration = Date.now() - startTime;

    log('info', `Successfully executed '${action}' in ${duration}ms`);
    console.log(`✅ Executed '${action}' (${duration}ms)`);

    return {
      success: true,
      action,
      command,
      duration,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    log('error', `Failed action '${action}'`, error.message);
    console.error(`❌ Failed action '${action}': ${error.message}`);

    return {
      success: false,
      action,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function sendAck(actionsExecuted, errors) {
  if (!M1_ACK_URL) {
    return;
  }

  const payload = {
    ack: true,
    actions_executed: actionsExecuted,
    errors
  };

  try {
    console.log(`📨 Sending ack to M1: ${M1_ACK_URL}`);
    await postJson(M1_ACK_URL, payload);
    console.log('✅ Ack sent successfully');
  } catch (err) {
    console.warn(`⚠️ Failed to send ack to M1: ${err.message}`);
  }
}

async function executeDecision(decision, options) {
  validateDecision(decision);
  const envVars = prepareAdbEnv();

  if (!options.dryRun) {
    console.log(`Connecting to ADB ${ADB_HOST}:${ADB_PORT}...`);
    await connectToAdb();
  }

  const actions = decision.actions;
  if (actions.length === 0) {
    console.log('No actions to execute.');
    return;
  }

  const executedActions = [];
  const errors = [];

  for (const action of actions) {
    try {
      await executeAction(action, options);
      executedActions.push(action);
    } catch (error) {
      console.error(`❌ Failed action '${action}': ${error.message}`);
      errors.push({ action, message: error.message });
    }
  }

  if (!options.dryRun && M1_ACK_URL) {
    await sendAck(executedActions, errors);
  }
}

async function handleDeviceInfo() {
  console.log('🔍 Detecting connected Android devices...\n');
  const deviceInfo = await getDeviceInfo();

  if (!deviceInfo.connected) {
    console.log('❌ No devices connected or ADB not available');
    if (deviceInfo.error) {
      console.log(`   Error: ${deviceInfo.error}`);
    }
    return;
  }

  console.log(`✅ Found ${deviceInfo.devices.length} device(s):\n`);
  deviceInfo.devices.forEach((device, index) => {
    console.log(`Device ${index + 1}:`);
    console.log(`  ID: ${device.id}`);
    console.log(`  Model: ${device.model || 'Unknown'}`);
    console.log(`  Android Version: ${device.androidVersion || 'Unknown'}`);
    console.log(`  Battery Level: ${device.batteryLevel || 'Unknown'}%`);
    if (device.error) {
      console.log(`  ⚠️  Error getting info: ${device.error}`);
    }
    console.log('');
  });
}

async function handleStatus() {
  console.log('📊 M2 Android ADB Executor Status\n');

  // Check ADB connection
  try {
    const devices = await detectDevices();
    console.log(`ADB Devices: ${devices.length} connected`);
    devices.forEach(device => console.log(`  - ${device}`));
  } catch (error) {
    console.log(`ADB Status: ❌ Error - ${error.message}`);
  }

  // Check M1 API
  try {
    const response = await fetch(`${M1_API_URL}/health`);
    if (response.ok) {
      console.log('M1 API: ✅ Connected');
    } else {
      console.log('M1 API: ⚠️  Responding but not healthy');
    }
  } catch (error) {
    console.log('M1 API: ❌ Not reachable');
  }

  // Configuration
  console.log('\nConfiguration:');
  console.log(`  ADB Host: ${ADB_HOST}:${ADB_PORT}`);
  console.log(`  M1 API URL: ${M1_API_URL}`);
  console.log(`  Retry Attempts: ${RETRY_ATTEMPTS}`);
  console.log(`  Retry Delay: ${RETRY_DELAY}ms`);
  console.log(`  Dangerous Action Confirmation: ${CONFIRM_DANGEROUS ? 'Enabled' : 'Disabled'}`);
}

async function handleHistory() {
  console.log('📜 Action History (Last 10 executions)\n');
  // This would require persistent storage - for now, show a placeholder
  console.log('History tracking not yet implemented.');
  console.log('Future enhancement: Store execution results in a local database.');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || Object.keys(args).length === 1 && args.dryRun === false && args.listActions === undefined && !args.file && !args.json && !args.url && !args.deviceInfo && !args.status && !args.history) {
    printHelp();
    return;
  }

  // Handle special commands
  if (args.deviceInfo) {
    await handleDeviceInfo();
    return;
  }

  if (args.status) {
    await handleStatus();
    return;
  }

  if (args.history) {
    await handleHistory();
    return;
  }

  if (args.listActions) {
    console.log('Supported actions:');
    Object.keys(ACTION_TO_ADB).forEach(action => console.log(`  - ${action}`));
    return;
  }

  let decision;

  if (args.file) {
    decision = loadJsonFromFile(args.file);
  } else if (args.json) {
    decision = JSON.parse(args.json);
  } else if (args.url) {
    decision = await getJsonFromUrl(args.url);
  } else {
    throw new Error('No input source provided. Use --file, --json, or --url.');
  }

  await executeDecision(decision, { dryRun: args.dryRun });
}

main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
