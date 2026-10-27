# Load-test API key backend

An Express server for creating and checking load-test API keys stored in MongoDB.

> **Security note:** The API currently has no authentication. Do not expose it publicly until access is protected.

## Prerequisites

- Node.js 22.12 or later
- A MongoDB database

## Setup

1. Go to the backend folder:

   ```powershell
   cd C:\Final_LoadTest_Project_Nov_2026\loadtest_backend
   ```

2. Install dependencies if `node_modules` is missing:

   ```powershell
   npm install
   ```

3. Add your MongoDB connection string to `.env`:

   ```env
   MONGO_URL=your_mongodb_connection_string
   ```

   Optionally set the port (default is `3000`):

   ```env
   PORT=3000
   ```

## Start the server

```powershell
npm run start:api
```

Keep this terminal open while using the API. You should see:

```text
MongoDB connected successfully
API server listening on port 3000
```

> `npm start` runs the separate load-test CLI ([index.js](./index.js)), not this API server.

## Check that it is running

In another PowerShell window:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Expected response:

```json
{ "status": "ok" }
```

## Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/health` | Checks that the server is responding. |
| `POST` | `/api/keys` | Creates a new API key. |
| `GET` | `/api/keys/:apiKey/exists` | Checks whether the key is stored. |
| `GET` | `/api/keys/:apiKey/valid` | Checks whether the key exists and has not expired. |
| `GET` | `/api/keys/:apiKey/project` | Gets the key's project name. |
| `GET` | `/api/keys/:apiKey/details` | Gets the key's stored details. |
| `GET` | `/api/keys/:apiKey/details/valid` | Gets details only if the key is still valid. |

A key is **valid** only while its `validity` date is later than the current date and time. Once that date is reached, the key is expired.

## Create an API key

Request body:

| Field | Required | Description |
| ----- | -------- | ----------- |
| `projectName` | Yes | Project the key belongs to. |
| `email` | Yes | Owner's email address. |
| `validityDays` | No | Positive whole number of days the key stays valid. Defaults to `30`. |

PowerShell:

```powershell
$body = @{
  projectName = "LoadTest Project"
  email = "owner@example.com"
  validityDays = 30
} | ConvertTo-Json

$key = Invoke-RestMethod `
  -Uri http://localhost:3000/api/keys `
  -Method Post `
  -ContentType "application/json" `
  -Body $body

$key
```

curl:

```sh
curl -X POST http://localhost:3000/api/keys \
  -H "Content-Type: application/json" \
  -d '{"projectName":"LoadTest Project","email":"owner@example.com","validityDays":30}'
```

Response (`201 Created`):

```json
{
  "apiKey": "3f9a...c21e",
  "projectName": "LoadTest Project",
  "email": "owner@example.com",
  "validity": "2026-11-26T20:35:00.000Z"
}
```

Store the `apiKey` securely; treat it like a password.

## Check a key

```powershell
$apiKey = $key.apiKey

Invoke-RestMethod "http://localhost:3000/api/keys/$apiKey/valid"
# { "valid": true }

Invoke-RestMethod "http://localhost:3000/api/keys/$apiKey/exists"
# { "exists": true }

Invoke-RestMethod "http://localhost:3000/api/keys/$apiKey/project"
# { "projectName": "LoadTest Project" }

Invoke-RestMethod "http://localhost:3000/api/keys/$apiKey/details"
Invoke-RestMethod "http://localhost:3000/api/keys/$apiKey/details/valid"
```

## Error responses

| Status | Meaning |
| ------ | ------- |
| `400` | Missing or invalid request fields, or malformed JSON. |
| `404` | Key not found, or invalid or expired (for `/details/valid`). |
| `409` | Generated key already exists (retry the request). |
| `500` | Unexpected server or database error. Check the server terminal. |

## Using the functions in code

The database functions in [connectMongo.js](./connectMongo.js) can also be imported directly:

```js
import { connectDB, createApiKey, isApiKeyValid } from "./connectMongo.js";

await connectDB();
const record = await createApiKey("LoadTest Project", "owner@example.com", 30);
console.log(await isApiKeyValid(record.apiKey));
```

## Project files

- [server.js](./server.js) — Express server and routes.
- [connectMongo.js](./connectMongo.js) — MongoDB connection and API key functions.
- [models/LoadtestAuthKey.js](./models/LoadtestAuthKey.js) — Mongoose schema for the `loadtest_auth_key` collection.
