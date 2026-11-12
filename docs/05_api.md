# API Reference

## Authentication

pbnj supports two authentication methods:

### Bearer Token (CLI/API)

For programmatic access via CLI or API, use a Bearer token:
```
Authorization: Bearer YOUR_AUTH_KEY
```

### Session Cookie (Web)

The web interface uses secure HttpOnly session cookies. When you log in via the web, a session is created that expires after 30 days. The session cookie is automatically sent with requests from the browser.

Both authentication methods are accepted by all authenticated endpoints.

## Endpoints

### Create Paste

POST /api

#### JSON Request
```bash
curl -X POST https://your-pbnj.workers.dev/api \
  -H "Authorization: Bearer YOUR_AUTH_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "console.log(\"hello\")",
    "language": "javascript",
    "filename": "hello.js"
  }'
```

#### Form Data Request (File Upload)
```bash
curl -X POST https://your-pbnj.workers.dev/api \
  -H "Authorization: Bearer YOUR_AUTH_KEY" \
  -F "file=@script.py"
```

#### Request Body (JSON)

| Field    | Type    | Required | Description                          |
|----------|---------|----------|--------------------------------------|
| code     | string  | Yes      | The content to paste                 |
| language | string  | No       | Language for syntax highlighting     |
| filename | string  | No       | Display filename                     |
| private  | boolean | No       | If true, not listed on homepage      |
| unlisted | boolean | No       | If true, public but not listed on homepage for logged-out visitors. Ignored when `private` is true |
| key      | string/boolean | No | Secret key (true = auto-generate) |
| expires  | string  | No       | Lifetime: `10m`, `1h`, `1d`, or `1w`. Expired pastes return 404 |
| maxReads | number  | No       | Burns the paste after this many reads, from 1 to 1000000. Only unlocked page views by logged-out visitors count |
| password | string  | No       | Viewers must enter this to open the paste. Makes the paste private |
| images   | string[] | No      | Image IDs from `POST /api/images` to attach to the paste. Up to 20 |

#### Response
```json
{
  "id": "crunchy-peanut-butter-sandwich",
  "url": "https://your-pbnj.workers.dev/crunchy-peanut-butter-sandwich",
  "private": false,
  "unlisted": false,
  "expiresAt": null,
  "maxReads": null
}
```

With key:
```json
{
  "id": "crunchy-peanut-butter-sandwich",
  "url": "https://your-pbnj.workers.dev/crunchy-peanut-butter-sandwich?key=abc123",
  "private": true,
  "unlisted": false,
  "expiresAt": null,
  "maxReads": null
}
```

### List Pastes

GET /api

Returns recent public pastes, excluding unlisted ones.

#### Query Parameters

| Param  | Type   | Description                    |
|--------|--------|--------------------------------|
| cursor | number | Offset for pagination          |

#### Response
```json
{
  "pastes": [
    {
      "id": "crunchy-peanut-butter-sandwich",
      "language": "javascript",
      "updated": 1701648000000,
      "filename": "hello.js",
      "preview": "console.log(\"hello\")..."
    }
  ],
  "nextCursor": 20
}
```

### Get Paste

GET /api/{id}

Requires authentication. Returns the paste's content and settings for editing. The password hash and key are never returned.

```bash
curl https://your-pbnj.workers.dev/api/crunchy-peanut-butter-sandwich \
  -H "Authorization: Bearer YOUR_AUTH_KEY"
```

#### Response
```json
{
  "id": "crunchy-peanut-butter-sandwich",
  "code": "console.log(\"hello\")",
  "language": "javascript",
  "filename": "hello.js",
  "private": true,
  "unlisted": false,
  "hasPassword": true,
  "images": ["3f9c0a1b2d4e5f60718293a4b5c6d7e8"]
}
```

### Update Paste

PUT /api/{id}

Requires authentication.

```bash
curl -X PUT https://your-pbnj.workers.dev/api/crunchy-peanut-butter-sandwich \
  -H "Authorization: Bearer YOUR_AUTH_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "console.log(\"updated\")",
    "language": "javascript",
    "filename": "hello.js"
  }'
```

#### Request Body (JSON)

| Field    | Type           | Required | Description                                                                                                  |
|----------|----------------|----------|--------------------------------------------------------------------------------------------------------------|
| code     | string         | Yes      | The new content                                                                                              |
| language | string         | No       | Language for syntax highlighting                                                                             |
| filename | string         | No       | Display filename                                                                                             |
| private  | boolean        | No       | `true` makes the paste private, `false` makes it public. Turning it off also removes the key and password    |
| unlisted | boolean        | No       | `true` makes the paste public but not listed on the homepage for logged-out visitors. Turning it on also removes the key and password |
| password | string or null | No       | Sets a new password, which also makes the paste private. `null` or `""` removes the password                 |
| expires  | string or null | No       | Restarts the expiry with a duration (`10m`, `1h`, `1d`, `1w`). `null` or `""` removes the expiry             |
| images   | string[]       | No       | The paste's full image list. Images not listed are deleted. Omit to leave the images unchanged                |

Fields you leave out keep their current values. An invalid `expires`, non-boolean `private` or `unlisted`, or invalid `images` returns 400. `maxReads` can only be set when creating a paste.

#### Response
```json
{
  "id": "crunchy-peanut-butter-sandwich",
  "url": "https://your-pbnj.workers.dev/crunchy-peanut-butter-sandwich"
}
```

### Delete Paste

DELETE /api/{id}

Requires authentication.

```bash
curl -X DELETE https://your-pbnj.workers.dev/api/crunchy-peanut-butter-sandwich \
  -H "Authorization: Bearer YOUR_AUTH_KEY"
```

### Delete All Pastes

DELETE /api

Requires authentication. Deletes all pastes from the database.

```bash
curl -X DELETE https://your-pbnj.workers.dev/api \
  -H "Authorization: Bearer YOUR_AUTH_KEY"
```

#### Response
```json
{
  "message": "All pastes deleted"
}
```

### Delete Multiple Pastes

POST /api/bulk-delete

Requires authentication. Deletes up to 50 pastes and their images in one request. The homepage multi-select uses this endpoint.

```bash
curl -X POST https://your-pbnj.workers.dev/api/bulk-delete \
  -H "Authorization: Bearer YOUR_AUTH_KEY" \
  -H "Content-Type: application/json" \
  -d '{"ids": ["crunchy-peanut-butter-sandwich", "smooth-jelly-toast"]}'
```

#### Request Body (JSON)
- `ids` (required): array of 1 to 50 paste IDs

#### Response
```json
{
  "success": true,
  "deleted": 2
}
```

### Upload Image

POST /api/images

Requires authentication. Uploads an image and returns its ID. Attach it to a paste by listing the ID in `images` when you create or update the paste. Uploads that no paste references are deleted after 24 hours.

Send a multipart form with a `file` field. Accepted types are PNG, JPEG, WebP, and GIF (SVG is not accepted). The maximum size is 1,990,000 bytes.

```bash
curl -X POST https://your-pbnj.workers.dev/api/images \
  -H "Authorization: Bearer YOUR_AUTH_KEY" \
  -F "file=@screenshot.png"
```

#### Response (201)
```json
{
  "id": "3f9c0a1b2d4e5f60718293a4b5c6d7e8",
  "url": "/i/3f9c0a1b2d4e5f60718293a4b5c6d7e8"
}
```

Returns 400 if `file` is missing, 415 for an unsupported type, and 413 if the file is too large.

### View Image

GET /i/{id}

Returns the image bytes with the stored content type. Images on a paste follow the paste's rules: a paste with a key needs `?key=YOUR_KEY`, and a paste with a password needs the same unlock as the paste page. Unattached images are only visible to logged-in owners. Missing or inaccessible images return 404.

### View Paste (Web)

GET /{id}

Returns HTML page with syntax highlighting.

For pastes with a key:
GET /{id}?key=YOUR_KEY

For pastes with a password, the page shows a password form. Entering the correct password sets an unlock cookie for that paste. Logged-in owners skip the form. Raw (`/r/{id}`) returns 404 until the paste is unlocked.

If a paste has `maxReads`, each unlocked view by a logged-out visitor uses one read. The view that uses the last read still shows the paste, and later views return 404. Logged-in owners' views and raw reads (`/r/{id}`) don't count.

### View Paste (Raw)

GET /r/{id}

Returns plain text content.

For pastes with a key:
GET /r/{id}?key=YOUR_KEY

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "Not found"
}
```
Note: Pastes with invalid keys also return 404 to prevent enumeration.

### 400 Bad Request
```json
{
  "error": "Code is required"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---
Next: 06_configuration.md - Configuration options
