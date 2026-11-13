# CLI Reference

## Installation

```bash
npm install -g @pbnjs/cli
```

## Configuration

Run the setup wizard:
```bash
pbnj --init
```

This creates ~/.pbnj with your configuration:
```
PBNJ_HOST=https://your-pbnj.workers.dev
PBNJ_AUTH_KEY=your-secret-key
```

You can also set these as environment variables.

View your current configuration:
```bash
pbnj --show-config
```

This displays your host URL.

## Usage

### Upload a file
```bash
pbnj script.py
```

### Pipe content
```bash
cat logs.txt | pbnj
echo "hello world" | pbnj
```

### Read from stdin
```bash
pbnj -
pbnj - < file.txt
```

## Options

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
--hide-modified          Hide the modified time at the end of the note
--show-modified          Show the modified time again (update only)
-n, --no-copy            Don't copy URL to clipboard
-u, --update <id>        Update an existing paste by ID
-l, --list [n]           List recent pastes (default: 10, or specify count)
-d, --delete <id> [id...] Delete one or more pastes by ID
-D, --delete-all         Delete all pastes
-h, --help               Show help
-v, --version            Show version
--init                   Configure your pbnj instance
--show-config            Show current configuration

## Examples

### Upload with custom language
```bash
pbnj -L python script.txt
```

### Upload with custom filename
```bash
cat code | pbnj -f "app.js"
```

### Create a private paste
```bash
pbnj -p secret.txt
```

### Create a private paste with auto-generated key
```bash
pbnj -p -k secret.txt
# Returns: https://your-pbnj.workers.dev/abc123?key=xyz789
```

### Create a private paste with custom key
```bash
pbnj -p -k "mypassword" secret.txt
```

### Create a paste that expires
```bash
pbnj -e 1h secret.txt
# Expires one hour after creation. Accepts 10m, 1h, 1d, or 1w.
```

### Create an unlisted paste
```bash
pbnj -U script.py
# Public and shareable, but not shown on the homepage to logged-out visitors.
```

### Password-protect a paste
```bash
pbnj -P hunter2 secret.txt
```

### Create a paste that self-destructs
```bash
pbnj -r 3 secret.txt
# Deleted after its third read.
```

### Attach images
```bash
pbnj -i diagram.png -i screenshot.jpg notes.md
# For Markdown notes, each image is also added to the end of the note as ![image](/i/<id>).
```

### List recent pastes
```bash
pbnj -l
```

### Update an existing paste
```bash
pbnj -u crunchy-peanut-butter-sandwich updated_file.py
```

### Change an existing paste's visibility or expiry
```bash
pbnj -u crunchy-peanut-butter-sandwich --public updated_file.py
pbnj -u crunchy-peanut-butter-sandwich -e 1d updated_file.py
pbnj -u crunchy-peanut-butter-sandwich --clear-password --no-expire updated_file.py
```

### Delete a paste
```bash
pbnj -d crunchy-peanut-butter-sandwich
```

### Delete several pastes
```bash
pbnj -d crunchy-peanut-butter-sandwich another-paste-id
```

### Delete all pastes
```bash
pbnj -D
```

## Clipboard

The URL is automatically copied to your clipboard after upload. Use `-n` or `--no-copy` to disable this.

Supported on:
- macOS (pbcopy)
- Linux (xclip or xsel)
- Windows (clip)

---
Next: 05_api.md - HTTP API reference
