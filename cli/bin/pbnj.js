#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { basename, extname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const CONFIG_FILE = `${process.env.HOME}/.pbnj`;

const MAX_IMAGES_PER_PASTE = 20;
const MAX_IMAGE_BYTES = 1_990_000;
const BULK_DELETE_LIMIT = 50;

// Image types the server accepts, by file extension
const IMAGE_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

// Language detection from file extension
const LANG_MAP = {
  '.js': 'javascript',
  '.ts': 'typescript',
  '.py': 'python',
  '.rb': 'ruby',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.cpp': 'cpp',
  '.c': 'c',
  '.cs': 'csharp',
  '.php': 'php',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.html': 'html',
  '.css': 'css',
  '.json': 'json',
  '.xml': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
  '.sql': 'sql',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.scala': 'scala',
  '.r': 'r',
  '.R': 'r',
  '.lua': 'lua',
  '.pl': 'perl',
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.erl': 'erlang',
  '.hs': 'haskell',
  '.ml': 'ocaml',
  '.clj': 'clojure',
  '.vim': 'vim',
  '.dockerfile': 'dockerfile',
  '.toml': 'toml',
  '.ini': 'ini',
  '.txt': 'plaintext',
};

function getConfig() {
  if (existsSync(CONFIG_FILE)) {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    const config = {};
    for (const line of content.split('\n')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        config[key.trim()] = valueParts.join('=').trim();
      }
    }
    return config;
  }
  return {};
}

function detectLanguage(filename) {
  if (!filename) return 'plaintext';
  const ext = extname(filename).toLowerCase();
  return LANG_MAP[ext] || 'plaintext';
}

async function copyToClipboard(text) {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      await execAsync(`echo "${text}" | pbcopy`);
    } else if (platform === 'linux') {
      // Try xclip first, then xsel
      try {
        await execAsync(`echo "${text}" | xclip -selection clipboard`);
      } catch {
        await execAsync(`echo "${text}" | xsel --clipboard --input`);
      }
    } else if (platform === 'win32') {
      await execAsync(`echo ${text} | clip`);
    }
    return true;
  } catch {
    return false;
  }
}

async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        data += chunk;
      }
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
}

function showConfig() {
  const config = getConfig();
  const host = process.env.PBNJ_HOST || config.PBNJ_HOST;
  const authKey = process.env.PBNJ_AUTH_KEY || config.PBNJ_AUTH_KEY;

  console.log('\nCurrent Configuration:\n');

  if (host) {
    console.log(`  Host: ${host}`);
    if (process.env.PBNJ_HOST) {
      console.log('        (from environment variable)');
    } else {
      console.log(`        (from ${CONFIG_FILE})`);
    }
  } else {
    console.log('  Host: not configured');
  }

  console.log('');

  if (!host || !authKey) {
    console.log('Run `pbnj --init` to configure your pbnj instance.\n');
  }
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function showHelp() {
  console.log(`
pbnj - CLI for pbnj.sh pastebin

Usage:
  pbnj <file>              Upload a file
  pbnj -                   Read from stdin
  cat file | pbnj          Pipe content
  pbnj -u <id> <file>      Update an existing paste
  pbnj -l [n]              List recent pastes (default: 10, or specify count)
  pbnj -d <id> [id...]     Delete one or more pastes
  pbnj -D                  Delete all pastes
  pbnj --init              Configure your pbnj instance
  pbnj --show-config       Show current configuration

Options:
  -L, --language <lang>    Override language detection
  -f, --filename <name>    Set filename for the paste
  -p, --private            Make private (not listed on homepage)
  -k, --key [key]          Require a key to view (auto-generates if no key given; new pastes only)
  -P, --password <pw>      Password-protect the paste (makes it private)
  -U, --unlisted           Public, but hidden from the homepage (update: also clears key and password)
  -e, --expire <duration>  Expire after 10m, 1h, 1d, or 1w
  -r, --max-reads <n>      Self-destruct after n reads (new pastes only)
  -i, --image <file>       Attach an image: PNG, JPEG, WebP, or GIF (up to 20 per paste; repeatable)
  --public                 Make a paste public (update only; clears key and password)
  --clear-password         Remove the password (update only)
  --no-expire              Remove the expiry (update only)
  -n, --no-copy            Don't copy URL to clipboard
  -u, --update <id>        Update an existing paste by ID
  -l, --list [n]           List recent pastes (default: 10)
  -d, --delete <id>        Delete one or more pastes by ID
  -D, --delete-all         Delete all pastes
  -h, --help               Show this help
  -v, --version            Show version
  --init                   Set up configuration
  --show-config            Show current configuration

Configuration (~/.pbnj):
  PBNJ_HOST=https://your-pbnj-instance.workers.dev
  PBNJ_AUTH_KEY=your-secret-key

Examples:
  pbnj script.py                    # Upload Python file
  cat logs.txt | pbnj -L plaintext  # Pipe with language
  pbnj -f "app.js" - < code.txt     # Custom filename from stdin
  pbnj -p script.py                 # Upload as private
  pbnj -p -k script.py              # Private with auto-generated key
  pbnj -p -k "mykey" script.py      # Private with custom key
  pbnj -P hunter2 script.py         # Password-protected
  pbnj -U script.py                 # Unlisted: public, but not on the homepage for visitors
  pbnj -r 3 script.py               # Self-destructs after 3 reads
  pbnj -e 1h script.py              # Upload, expires in 1 hour
  pbnj -i diagram.png notes.md      # Attach an image (Markdown notes also get an inline reference)
  pbnj -u crunchy-peanut-butter file.py  # Update a paste
  pbnj -u crunchy-peanut-butter -e 1d file.py  # Update a paste and expire it in 1 day
  pbnj -u crunchy-peanut-butter --public file.py  # Make an existing paste public
  pbnj -l                           # Show recent pastes
  pbnj -d crunchy-peanut-butter     # Delete a paste
  pbnj -d id1 id2 id3               # Delete several pastes
`);
}

async function initConfig() {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (q) => new Promise((resolve) => rl.question(q, resolve));

  console.log(`
                                ███████
                          ███▓           ███
                    ████                     ██░
              ████                               ███
       ▒███▓                                         ████
   ██░                                                     ███▒
 █                                                              ███
 ██                                                                █
 █▒███                                                             ██
 █▒▒▒▒▒███                                                     ███▒█
 █▒▒▒▒▒▒▒▒▒▒▒███                                          ███▒▒▒▒▒▒█
  ███▒▒▒▒▒▒▒▒▒▒▒▒▒██                             ░  ████▒▒▒▒▒▒▒▒▒▒▒█
 ██▒█████▒▒▒▒▒▒▒▒▒▒▒██                         ███▒▒▒▒▒▒▒▒▒▒▒▒▒████
███████████████▒▒▒▒▒▒▒▒██                 ███▒▒▒▒▒▒▒▒▒▒▒▒▒███████▓██
███░░  ▒██░████████▒▒▒▓▒▒▒████      ▒███▓▒▒▒▒▒▒▒▒▒▓▒▒██████████████░█
██▒▒███░░████████████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▒▒▓▒▒▒▒▒▒▓███████████████░░▒░██
██▒▒▒▒▒█░░░░░   ░███████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒████████████░░░░░░░░░██▒▒█
 ██▒▒▒▒▓▓██████░ ░██████████▒▒▒▒▒▒▒▒▒▒▒██████████████░ ▒▒▒░███▒▒▒▒▒▒█
    ██▒▒▒▒▒▒▒▒▒▓█░░░███████████████████████████████░░░██▓▓▒▒▒▒▒▒▒▒▒█
       ████▓▒▒▒▒▓██░░░   ░█████████████████░  ▒▒░░▒██▒▒▒▒▒▒▒▒▒▒███
            ███▒▒▒▒▓▓███▒░░░████████████░░ ▒▒██▓▓▓▓▒▒▓▒▒▒▒████
                ██▒▒▒▒▒▒▒█░░ ░░░░░  ░▒▒▒▒▒██▒▒▒▒▓▒▒▒▒███
                   ██▒▒▒▒▒▒▓██████████▓▓▓▓▒▒▓▒▒▒███
                     ██▒▒▒▒▒▒▒▒▒▒▒▒▒▓▒▒▒▒▒▒▓███
                        ██▒▒▒▒▒▒▒▒▒▒▓▒▒▒███
                            ██████████

                            p b n j . s h
`);

  console.log('Configuring pbnj CLI\n');

  const host = await question('Host URL: ');
  const authKey = await question('Auth Key: ');

  rl.close();

  const config = `PBNJ_HOST=${host}\nPBNJ_AUTH_KEY=${authKey}\n`;

  const { writeFileSync } = await import('fs');
  writeFileSync(CONFIG_FILE, config, { mode: 0o600 });

  console.log(`\nConfiguration saved to ${CONFIG_FILE}`);
}

async function deleteAllPastes(config) {
  const host = process.env.PBNJ_HOST || config.PBNJ_HOST;
  const authKey = process.env.PBNJ_AUTH_KEY || config.PBNJ_AUTH_KEY;

  if (!host) {
    console.error('Error: No host configured.');
    console.error('Run `pbnj --init` or set PBNJ_HOST environment variable.');
    process.exit(1);
  }

  if (!authKey) {
    console.error('Error: No auth key configured.');
    console.error('Run `pbnj --init` or set PBNJ_AUTH_KEY environment variable.');
    process.exit(1);
  }

  try {
    const response = await fetch(`${host}/api/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error(`Error: ${error.error || response.statusText}`);
      process.exit(1);
    }

    console.log('🗑️  [all pastes deleted]');
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function deletePaste(id, config) {
  const host = process.env.PBNJ_HOST || config.PBNJ_HOST;
  const authKey = process.env.PBNJ_AUTH_KEY || config.PBNJ_AUTH_KEY;

  if (!host) {
    console.error('Error: No host configured.');
    console.error('Run `pbnj --init` or set PBNJ_HOST environment variable.');
    process.exit(1);
  }

  if (!authKey) {
    console.error('Error: No auth key configured.');
    console.error('Run `pbnj --init` or set PBNJ_AUTH_KEY environment variable.');
    process.exit(1);
  }

  try {
    const response = await fetch(`${host}/api/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error(`Error: ${error.error || response.statusText}`);
      process.exit(1);
    }

    console.log(`🗑️  [deleted: ${id}]`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function updatePaste(id, code, language, filename, config, options = {}) {
  const host = process.env.PBNJ_HOST || config.PBNJ_HOST;
  const authKey = process.env.PBNJ_AUTH_KEY || config.PBNJ_AUTH_KEY;

  if (!host) {
    console.error('Error: No host configured.');
    console.error('Run `pbnj --init` or set PBNJ_HOST environment variable.');
    process.exit(1);
  }

  if (!authKey) {
    console.error('Error: No auth key configured.');
    console.error('Run `pbnj --init` or set PBNJ_AUTH_KEY environment variable.');
    process.exit(1);
  }

  const body = { code };
  if (language) body.language = language;
  if (filename) body.filename = filename;
  // Omitted fields keep their current values, so only send visibility when asked for
  if (options.makePublic) {
    body.private = false;
    body.unlisted = false;
  } else if (options.isPrivate) {
    body.private = true;
  } else if (options.isUnlisted) {
    body.unlisted = true;
  }
  if (options.password) body.password = options.password;
  else if (options.clearPassword) body.password = null;
  if (options.expires) body.expires = options.expires;
  else if (options.clearExpires) body.expires = null;
  if (options.imageIds) body.images = options.imageIds;

  try {
    const response = await fetch(`${host}/api/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error(`Error: ${error.error || response.statusText}`);
      process.exit(1);
    }

    return `${host}/${id}`;
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function listPastes(config, limit = 10) {
  const host = process.env.PBNJ_HOST || config.PBNJ_HOST;

  if (!host) {
    console.error('Error: No host configured.');
    console.error('Run `pbnj --init` or set PBNJ_HOST environment variable.');
    process.exit(1);
  }

  try {
    const response = await fetch(`${host}/api`);

    if (!response.ok) {
      console.error(`Error: ${response.statusText}`);
      process.exit(1);
    }

    const { pastes } = await response.json();

    if (pastes.length === 0) {
      console.log('📭 [no pastes found]');
      return;
    }

    const displayPastes = pastes.slice(0, limit);

    // Calculate column widths
    const idWidth = Math.max(2, ...displayPastes.map(p => p.id.length));
    const langWidth = Math.max(4, ...displayPastes.map(p => p.language.length));
    const ageWidth = 8;

    // Print header
    const idHeader = 'ID'.padEnd(idWidth);
    const langHeader = 'LANG'.padEnd(langWidth);
    const ageHeader = 'AGE'.padStart(ageWidth);
    console.log(`${idHeader}  ${langHeader}  ${ageHeader}  NAME`);

    for (const paste of displayPastes) {
      const name = paste.filename || `${paste.id}.${paste.language}`;
      const age = formatAge(paste.updated);
      const id = paste.id.padEnd(idWidth);
      const lang = paste.language.padEnd(langWidth);
      const ageStr = age.padStart(ageWidth);
      console.log(`${id}  ${lang}  ${ageStr}  ${name}`);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

function formatAge(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

async function uploadPaste(code, language, filename, config, options = {}) {
  const host = process.env.PBNJ_HOST || config.PBNJ_HOST;
  const authKey = process.env.PBNJ_AUTH_KEY || config.PBNJ_AUTH_KEY;

  if (!host) {
    console.error('Error: No host configured.');
    console.error('Run `pbnj --init` or set PBNJ_HOST environment variable.');
    process.exit(1);
  }

  if (!authKey) {
    console.error('Error: No auth key configured.');
    console.error('Run `pbnj --init` or set PBNJ_AUTH_KEY environment variable.');
    process.exit(1);
  }

  const body = { code, language };
  if (filename) body.filename = filename;
  if (options.isPrivate) body.private = true;
  if (options.isUnlisted) body.unlisted = true;
  if (options.secretKey) body.key = options.secretKey;
  if (options.password) body.password = options.password;
  if (options.expires) body.expires = options.expires;
  if (options.maxReads) body.maxReads = Number(options.maxReads);
  if (options.imageIds) body.images = options.imageIds;

  try {
    const response = await fetch(`${host}/api`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error(`Error: ${error.error || response.statusText}`);
      process.exit(1);
    }

    const result = await response.json();
    return result.url;
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

function getConnection(config) {
  const host = process.env.PBNJ_HOST || config.PBNJ_HOST;
  const authKey = process.env.PBNJ_AUTH_KEY || config.PBNJ_AUTH_KEY;

  if (!host) fail('No host configured. Run `pbnj --init` or set PBNJ_HOST environment variable.');
  if (!authKey) fail('No auth key configured. Run `pbnj --init` or set PBNJ_AUTH_KEY environment variable.');

  return { host, authKey };
}

async function deletePastes(ids, config) {
  if (ids.length === 1) {
    await deletePaste(ids[0], config);
    return;
  }

  const { host, authKey } = getConnection(config);
  let deleted = 0;

  for (let i = 0; i < ids.length; i += BULK_DELETE_LIMIT) {
    try {
      const response = await fetch(`${host}/api/bulk-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: ids.slice(i, i + BULK_DELETE_LIMIT) }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        fail(error.error || response.statusText);
      }

      const result = await response.json();
      deleted += result.deleted;
    } catch (err) {
      fail(err.message);
    }
  }

  console.log(`🗑️  [deleted: ${deleted} of ${ids.length}]`);
}

function readImage(file) {
  if (!existsSync(file)) fail(`File not found: ${file}`);

  const type = IMAGE_TYPES[extname(file).toLowerCase()];
  if (!type) fail(`Unsupported image type: ${file} (use PNG, JPEG, WebP, or GIF)`);

  const data = readFileSync(file);
  if (data.length > MAX_IMAGE_BYTES) fail(`Image too large: ${file} (max ${MAX_IMAGE_BYTES} bytes)`);

  return { name: basename(file), type, data };
}

async function uploadImage(image, config) {
  const { host, authKey } = getConnection(config);
  const form = new FormData();
  form.append('file', new Blob([image.data], { type: image.type }), image.name);

  try {
    const response = await fetch(`${host}/api/images`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authKey}` },
      body: form,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      fail(error.error || response.statusText);
    }

    const result = await response.json();
    return result.id;
  } catch (err) {
    fail(err.message);
  }
}

async function fetchImageIds(id, config) {
  const { host, authKey } = getConnection(config);

  try {
    const response = await fetch(`${host}/api/${id}`, {
      headers: { 'Authorization': `Bearer ${authKey}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      fail(error.error || response.statusText);
    }

    const result = await response.json();
    return result.images;
  } catch (err) {
    fail(err.message);
  }
}

function appendImageRefs(code, ids) {
  const refs = ids.map((id) => `![image](/i/${id})`).join('\n');
  const separator = code.endsWith('\n') ? '\n' : '\n\n';
  return `${code}${separator}${refs}\n`;
}

async function main() {
  const args = process.argv.slice(2);

  // Parse flags
  let language = null;
  let filename = null;
  let inputFile = null;
  let isPrivate = false;
  let secretKey = null;
  let expires = null;
  let updateId = null;
  let noCopy = false;
  let isUnlisted = false;
  let password = null;
  let clearPassword = false;
  let maxReads = null;
  let makePublic = false;
  let clearExpires = false;
  const imageFiles = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      showHelp();
      process.exit(0);
    }

    if (arg === '-v' || arg === '--version') {
      const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
      console.log(pkg.version);
      process.exit(0);
    }

    if (arg === '--init') {
      await initConfig();
      process.exit(0);
    }

    if (arg === '--show-config') {
      showConfig();
      process.exit(0);
    }

    if (arg === '-l' || arg === '--list') {
      // Check if next arg is a number (limit)
      const nextArg = args[i + 1];
      let limit = 10;
      if (nextArg && /^\d+$/.test(nextArg)) {
        limit = parseInt(nextArg, 10);
        i++;
      }
      const config = getConfig();
      await listPastes(config, limit);
      process.exit(0);
    }

    if (arg === '-D' || arg === '--delete-all') {
      const config = getConfig();
      await deleteAllPastes(config);
      process.exit(0);
    }

    if (arg === '-d' || arg === '--delete') {
      const ids = [];
      while (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        ids.push(args[++i]);
      }
      if (ids.length === 0) {
        console.error('Error: Paste ID required for delete');
        process.exit(1);
      }
      const config = getConfig();
      await deletePastes(ids, config);
      process.exit(0);
    }

    if (arg === '-L' || arg === '--language') {
      language = args[++i];
      continue;
    }

    if (arg === '-f' || arg === '--filename') {
      filename = args[++i];
      continue;
    }

    if (arg === '-u' || arg === '--update') {
      updateId = args[++i];
      if (!updateId) {
        console.error('Error: Paste ID required for update');
        process.exit(1);
      }
      continue;
    }

    if (arg === '-p' || arg === '--private') {
      isPrivate = true;
      continue;
    }

    if (arg === '-e' || arg === '--expire') {
      expires = args[++i];
      if (!expires) {
        console.error('Error: Duration required for --expire (e.g. 10m, 1h, 1d, 1w)');
        process.exit(1);
      }
      continue;
    }

    if (arg === '-U' || arg === '--unlisted') {
      isUnlisted = true;
      continue;
    }

    if (arg === '-P' || arg === '--password') {
      password = args[++i];
      if (!password) {
        fail('Password required for --password');
      }
      isPrivate = true; // A password makes the paste private
      continue;
    }

    if (arg === '-r' || arg === '--max-reads') {
      maxReads = args[++i];
      // The server treats a non-numeric value as "no limit", so reject it here
      if (!maxReads || !/^\d+$/.test(maxReads)) {
        fail('Read count required for --max-reads (1 to 1000000)');
      }
      continue;
    }

    if (arg === '-i' || arg === '--image') {
      const file = args[++i];
      if (!file) {
        fail('File required for --image');
      }
      imageFiles.push(file);
      continue;
    }

    if (arg === '--public') {
      makePublic = true;
      continue;
    }

    if (arg === '--clear-password') {
      clearPassword = true;
      continue;
    }

    if (arg === '--no-expire') {
      clearExpires = true;
      continue;
    }

    if (arg === '-n' || arg === '--no-copy') {
      noCopy = true;
      continue;
    }

    if (arg === '-k' || arg === '--key') {
      // Check if next arg is a value (not another flag or file)
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('-') && nextArg !== '-') {
        // Check if it looks like a key value (not a filename)
        // If it has no extension or is alphanumeric only, treat as key
        if (!nextArg.includes('.') || /^[a-zA-Z0-9_-]+$/.test(nextArg)) {
          secretKey = nextArg;
          i++;
        } else {
          // No key value provided, auto-generate
          secretKey = true;
        }
      } else {
        // No key value provided, auto-generate
        secretKey = true;
      }
      isPrivate = true; // -k implies -p
      continue;
    }

    // Non-flag argument is the file
    if (!arg.startsWith('-') || arg === '-') {
      inputFile = arg;
    }
  }

  // Reject flag combinations the server would ignore or contradict
  if (updateId) {
    if (secretKey) fail('-k applies to new pastes only');
    if (maxReads) fail('-r applies to new pastes only');
  } else {
    if (makePublic) fail('--public only works with -u');
    if (clearPassword) fail('--clear-password only works with -u');
    if (clearExpires) fail('--no-expire only works with -u');
  }
  if (makePublic && (isPrivate || isUnlisted)) fail('--public cannot be combined with -p, -P, -k, or -U');
  if (isUnlisted && isPrivate) fail('-U cannot be combined with -p, -P, or -k');
  if (clearPassword && password) fail('--clear-password cannot be combined with -P');
  if (clearExpires && expires) fail('--no-expire cannot be combined with -e');
  if (imageFiles.length > MAX_IMAGES_PER_PASTE) fail(`A paste can have at most ${MAX_IMAGES_PER_PASTE} images`);

  const config = getConfig();
  let code;

  // Check if stdin has data (piped input)
  const stdinIsTTY = process.stdin.isTTY;

  if (inputFile === '-' || (!inputFile && !stdinIsTTY)) {
    // Read from stdin
    code = await readStdin();
    if (!language) language = 'plaintext';
  } else if (inputFile) {
    // Read from file
    if (!existsSync(inputFile)) {
      console.error(`Error: File not found: ${inputFile}`);
      process.exit(1);
    }
    code = readFileSync(inputFile, 'utf-8');
    if (!filename) filename = basename(inputFile);
    if (!language) language = detectLanguage(inputFile);
  } else {
    showHelp();
    process.exit(1);
  }

  if (!code || code.trim() === '') {
    console.error('Error: No content to upload');
    process.exit(1);
  }

  // Check every image before uploading anything
  const images = imageFiles.map(readImage);
  let imageIds;
  let imageUrls = [];
  if (images.length > 0) {
    const { host } = getConnection(config);
    // The server replaces the image list on update, so keep the existing images
    const existingIds = updateId ? await fetchImageIds(updateId, config) : [];
    if (existingIds.length + images.length > MAX_IMAGES_PER_PASTE) {
      fail(`A paste can have at most ${MAX_IMAGES_PER_PASTE} images (it already has ${existingIds.length})`);
    }

    const newIds = [];
    for (const image of images) {
      newIds.push(await uploadImage(image, config));
    }
    imageIds = [...existingIds, ...newIds];
    imageUrls = newIds.map((id) => `${host}/i/${id}`);
    if (language === 'markdown') {
      code = appendImageRefs(code, newIds);
    }
  }

  let url;
  if (updateId) {
    // Update existing paste
    url = await updatePaste(updateId, code, language, filename, config, {
      isPrivate,
      isUnlisted,
      makePublic,
      password,
      clearPassword,
      expires,
      clearExpires,
      imageIds,
    });
    console.log(url);
    console.log('✏️  [updated]');
  } else {
    // Create new paste
    url = await uploadPaste(code, language, filename, config, {
      isPrivate,
      isUnlisted,
      secretKey,
      password,
      expires,
      maxReads,
      imageIds,
    });

    console.log(url);
    if (isPrivate) {
      console.log('🔒 [private paste - not listed on homepage]');
    }
    if (isUnlisted) {
      console.log('🔗 [unlisted - public, but not listed on homepage for visitors]');
    }
    if (expires) {
      console.log(`⏳ [expires in ${expires}]`);
    }
    if (maxReads) {
      console.log(`👁️  [self-destructs after ${maxReads} reads]`);
    }
  }

  for (const imageUrl of imageUrls) {
    console.log(`🖼️  [image: ${imageUrl}]`);
  }

  // Try to copy to clipboard (unless --no-copy)
  if (!noCopy) {
    const copied = await copyToClipboard(url);
    if (copied) {
      console.log('📋 [copied to clipboard]');
    }
  }
}

main();
