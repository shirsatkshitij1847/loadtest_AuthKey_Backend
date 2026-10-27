import express from "express";
import dotenv from "dotenv";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import {
  apiKeyExists,
  connectDB,
  createApiKey,
  getApiKeyDetails,
  getProjectName,
  getValidApiKey,
  isApiKeyValid,
} from "./connectMongo.js";

dotenv.config();

export const app = express();
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.post("/api/keys", async (request, response, next) => {
  try {
    const { projectName, email, validityDays = 30 } = request.body ?? {};

    if (typeof projectName !== "string" || !projectName.trim() || typeof email !== "string" || !email.trim() || !Number.isInteger(validityDays) || validityDays <= 0) {
      return response.status(400).json({
        error: "projectName, email, and a positive integer validityDays are required",
      });
    }

    const record = await createApiKey(
      projectName.trim(),
      email.trim(),
      validityDays
    );

    return response.status(201).json({
      apiKey: record.apiKey,
      projectName: record.projectName,
      email: record.email,
      validity: record.validity,
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/keys/:apiKey/exists", async (request, response, next) => {
  try {
    return response.json({
      exists: await apiKeyExists(request.params.apiKey),
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/keys/:apiKey/valid", async (request, response, next) => {
  try {
    return response.json({
      valid: await isApiKeyValid(request.params.apiKey),
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/keys/:apiKey/project", async (request, response, next) => {
  try {
    const projectName = await getProjectName(request.params.apiKey);
    if (!projectName) {
      return response.status(404).json({ error: "API key not found" });
    }
    return response.json({ projectName });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/keys/:apiKey/details", async (request, response, next) => {
  try {
    const record = await getApiKeyDetails(request.params.apiKey);
    if (!record) {
      return response.status(404).json({ error: "API key not found" });
    }
    return response.json(record);
  } catch (error) {
    return next(error);
  }
});

app.get("/api/keys/:apiKey/details/valid", async (request, response, next) => {
  try {
    const record = await getValidApiKey(request.params.apiKey);
    if (!record) {
      return response.status(404).json({ error: "API key is invalid or expired" });
    }
    return response.json(record);
  } catch (error) {
    return next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error("API request failed:", error);

  if (error.code === 11000) {
    return response.status(409).json({ error: "API key already exists" });
  }

  if (error.type === "entity.parse.failed") {
    return response.status(400).json({ error: "Request body must be valid JSON" });
  }

  return response.status(500).json({ error: "Internal server error" });
});

export async function startServer() {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  await connectDB();
  return app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  startServer().catch((error) => {
    console.error("Failed to start API server:", error);
    process.exitCode = 1;
  });
}
