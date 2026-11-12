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
| key      | string/boolean | No | Secret key (true = auto-generate) |
| expires  | string  | No       | Lifetime: `10m`, `1h`, `1d`, or `1w`. Expired pastes return 404 |
| password | string  | No       | Viewers must enter this to open the paste. Makes the paste private |

#### Response
```json
{
  "id": "crunchy-peanut-butter-sandwich",
  "url": "https://your-pbnj.workers.dev/crunchy-peanut-butter-sandwich",
  "private": false,
  "expiresAt": null
}
```

With key:
```json
{
  "id": "crunchy-peanut-butter-sandwich",
  "url": "https://your-pbnj.workers.dev/crunchy-peanut-butter-sandwich?key=abc123",
  "private": true,
  "expiresAt": null
}
```

### List Pastes

GET /api

Returns recent public pastes.

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

| Field    | Type   | Required | Description                      |
|----------|--------|----------|----------------------------------|
| code     | string | Yes      | The new content                  |
| language | string | No       | Language for syntax highlighting |
| filename | string | No       | Display filename                 |

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

### View Paste (Web)

GET /{id}

Returns HTML page with syntax highlighting.

For pastes with a key:
GET /{id}?key=YOUR_KEY

For pastes with a password, the page shows a password form. Entering the correct password sets an unlock cookie for that paste. Logged-in owners skip the form. Raw (`/r/{id}`) returns 404 until the paste is unlocked.

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
