const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

const ROOT = __dirname;
const ENV_PATH = path.join(ROOT, '.env');

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

const env = loadEnv();
const ADB_HOST = env.ADB_HOST || '127.0.0.1';
const ADB_PORT = env.ADB_PORT || '5037';
const M1_API_URL = env.M1_API_URL || 'http://localhost:5000';

const ACTION_TO_ADB = {
  "enable_dnd":            "adb shell settings put global zen_mode 1",
  "disable_dnd":           "adb shell settings put global zen_mode 0",
  "mute_notifications":    "adb shell settings put global notification_sound \"\"",
  "enable_focus":          "adb shell am start -a android.intent.action.MAIN -n com.android.settings/.Settings",
  "open_calendar":         "adb shell am start -a android.intent.action.VIEW -d content://com.android.calendar/events",
  "mute_social_apps":      "adb shell pm disable-user --user 0 com.instagram.android",
  "block_notifications":   "adb shell settings put global heads_up_notifications_enabled 0",
  "set_brightness_high":   "adb shell settings put system screen_brightness 200",

  "reduce_notifications":  "adb shell settings put global heads_up_notifications_enabled 0",
  "set_brightness_low":    "adb shell settings put system screen_brightness 30",
  "enable_night_mode":     "adb shell settings put secure ui_night_mode 2",
  "open_meditation_app":   "adb shell am start -a android.intent.action.MAIN -n com.calm.android/.MainActivity",
  "play_ambient_sound":    "adb shell am broadcast -a android.media.VOLUME_CHANGED_ACTION",

  "open_fitness_app":      "adb shell am start -a android.intent.action.MAIN -n com.google.android.apps.fitness/.MainActivity",
  "enable_screen_on":      "adb shell settings put system screen_off_timeout 600000",
  "start_activity_track":  "adb shell am broadcast -a com.fitness.START_TRACKING",

  "silence_all":           "adb shell settings put global ringer_mode 0",
  "enable_night_filter":   "adb shell settings put secure accessibility_display_daltonizer_enabled 1",
  "set_brightness_min":    "adb shell settings put system screen_brightness 0",

  "enable_power_saver":    "adb shell settings put global low_power 1",
  "reduce_updates":        "adb shell settings put global wifi_scan_interval_background_s 300",
  "disable_animations":    "adb shell settings put global window_animation_scale 0",

  "enable_notifications":  "adb shell settings put global heads_up_notifications_enabled 1",
  "open_messaging":        "adb shell am start -a android.intent.action.MAIN -c android.intent.category.APP_MESSAGING",
};

function printHelp() {
  console.log(`
M2 Android ADB Executor

Usage:
  node index.js --help
  node index.js --list-actions
  node index.js --file <path>
  node index.js --json '<json-string>'
  node index.js --url <decision-url>

Options:
  --help            Show help and exit.
  --list-actions    Print all supported action keys and exit.
  --file <path>     Execute actions from a local decision JSON file.
  --json <string>   Execute actions from a JSON string.
  --url <url>       Fetch a decision document from a REST endpoint.
  --dry-run         Print the ADB commands without executing them.

Environment:
  ADB_HOST         ADB server host (default: 127.0.0.1)
  ADB_PORT         ADB server port (default: 5037)
  M1_API_URL       Base PI Engine URL for reference (default: http://localhost:5000)

Examples:
  node index.js --file ./sample-decision.json
  node index.js --json '{"actions":["enable_dnd","open_calendar"]}' --dry-run
  node index.js --url ${M1_API_URL}/decision/latest --dry-run
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

function prepareAdbEnv() {
  return {
    ...process.env,
    ADB_SERVER_PORT: String(ADB_PORT),
  };
}

function runShellCommand(command, envVars) {
  return new Promise((resolve, reject) => {
    exec(command, { env: envVars }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command failed: ${command}\n${stderr || stdout || error.message}`));
      } else {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      }
    });
  });
}

async function connectToAdb() {
  if (isLocalHost(ADB_HOST)) {
    return;
  }
  const connectCommand = `adb connect ${ADB_HOST}:${ADB_PORT}`;
  await runShellCommand(connectCommand, prepareAdbEnv());
}

async function executeAction(action, options) {
  const command = ACTION_TO_ADB[action];
  if (!command) {
    console.warn(`⚠️  Unknown action: ${action}`);
    return;
  }
  if (options.dryRun) {
    console.log(`⏱ dry-run: ${action} -> ${command}`);
    return;
  }
  console.log(`▶ Executing action '${action}'`);
  await runShellCommand(command, prepareAdbEnv());
  console.log(`✅ Executed '${action}'`);
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

  for (const action of actions) {
    try {
      await executeAction(action, options);
    } catch (error) {
      console.error(`❌ Failed action '${action}': ${error.message}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || Object.keys(args).length === 1 && args.dryRun === false && args.listActions === undefined && !args.file && !args.json && !args.url) {
    printHelp();
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
