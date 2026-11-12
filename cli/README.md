<div align="center">

![pbnj logo](../assets/pbnj_logo.png)

# @pbnjs/cli

[![npm version](https://img.shields.io/npm/v/@pbnjs/cli?color=cb3837)](https://www.npmjs.com/package/@pbnjs/cli)
[![npm downloads](https://img.shields.io/npm/dm/@pbnjs/cli?color=blue)](https://www.npmjs.com/package/@pbnjs/cli)
[![License](https://img.shields.io/github/license/bhavnicksm/pbnj)](../LICENSE)

_The official CLI for [pbnj](https://github.com/bhavnicksm/pbnj) - paste code from your terminal_

</div>

## Installation

```bash
npm install -g @pbnjs/cli
```

Or use without installing:

```bash
npx @pbnjs/cli myfile.py
```

## Quick Start

```bash
# Configure your pbnj instance
pbnj --init

# Show current configuration
pbnj --show-config

# Paste a file
pbnj script.py
# → https://pbnj.sh/crunchy-peanut-butter-toast (copied to clipboard)

# Pipe content
cat error.log | pbnj

# List your pastes
pbnj -l

# Update an existing paste
pbnj -u crunchy-peanut-butter-toast newfile.py

# Delete a paste
pbnj -d crunchy-peanut-butter-toast
```

## Setup

Configure your pbnj instance:

```bash
pbnj --init
```

This will prompt you for:
- **Host URL**: Your pbnj instance URL
- **Auth Key**: Your secret key for creating pastes

Configuration is saved to `~/.pbnj`.

Alternatively, use environment variables:

```bash
export PBNJ_HOST=https://your-instance.workers.dev
export PBNJ_AUTH_KEY=your-secret-key
```

## Commands

### Create a paste

```bash
# From a file
pbnj script.py

# From stdin
cat error.log | pbnj
echo "console.log('hello')" | pbnj -L javascript

# With custom filename
pbnj -f "app.js" - < code.txt

# Unlisted: public, but hidden from the homepage for visitors
pbnj -U script.py

# Password-protected (makes the paste private)
pbnj -P hunter2 secret.txt

# Self-destructs after 3 reads
pbnj -r 3 secret.txt

# Attach images (PNG, JPEG, WebP, or GIF; up to 20 per paste)
pbnj -i diagram.png notes.md
```

For Markdown notes (`-L markdown` or a `.md` file), each attached image is also added to the end of the note as `![image](/i/<id>)`, so it shows inline. Other pastes get the image URLs printed for you to use.

### Update a paste

```bash
# Update with new file content
pbnj -u <paste-id> newfile.py

# Update from stdin
cat updated.log | pbnj -u <paste-id>

# Change visibility, expiry, or password (content is still required)
pbnj -u <paste-id> --public newfile.py
pbnj -u <paste-id> -U newfile.py
pbnj -u <paste-id> -P newpassword newfile.py
pbnj -u <paste-id> --clear-password --no-expire newfile.py
pbnj -u <paste-id> -e 1d newfile.py

# Add images to an existing paste (kept alongside the current images)
pbnj -u <paste-id> -i screenshot.png notes.md
```

`--public` and `-U` on update also clear the key and password, as the server does.

### List pastes

```bash
# List recent pastes (default: 10)
pbnj -l

# List more pastes
pbnj -l 20
```

### Delete a paste

```bash
pbnj -d <paste-id>

# Several at once
pbnj -d <paste-id> <paste-id-2> <paste-id-3>
```

Every argument after `-d` up to the next flag is treated as a paste ID, so don't put a file name there.

## Options

| Option | Description |
|--------|-------------|
| `-L, --language <lang>` | Override automatic language detection |
| `-f, --filename <name>` | Set filename for the paste |
| `-u, --update <id>` | Update an existing paste |
| `-d, --delete <id> [id...]` | Delete one or more pastes by ID |
| `-l, --list [n]` | List recent pastes (default: 10, or specify count) |
| `-n, --no-copy` | Don't copy URL to clipboard after creating paste |
| `-p, --private` | Make the paste private (not listed on homepage) |
| `-k, --key [key]` | Require a key to view. Auto-generates if no key given (new pastes only) |
| `-P, --password <pw>` | Password-protect the paste (makes it private) |
| `-U, --unlisted` | Public, but hidden from the homepage for visitors |
| `-e, --expire <duration>` | Expire the paste after 10m, 1h, 1d, or 1w |
| `-r, --max-reads <n>` | Self-destruct after n reads (new pastes only) |
| `-i, --image <file>` | Attach an image (PNG, JPEG, WebP, or GIF). Repeatable, up to 20 per paste |
| `--public` | Make an existing paste public, clearing its key and password (update only) |
| `--clear-password` | Remove the password (update only) |
| `--no-expire` | Remove the expiry (update only) |
| `-h, --help` | Show help |
| `-v, --version` | Show version |
| `--init` | Configure your pbnj instance |
| `--show-config` | Show current host URL configuration |

## Supported Languages

The CLI automatically detects language from file extensions:

- JavaScript (`.js`, `.jsx`)
- TypeScript (`.ts`, `.tsx`)
- Python (`.py`)
- Rust (`.rs`)
- Go (`.go`)
- Ruby (`.rb`)
- And 30+ more...

## License

MIT
