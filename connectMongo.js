import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "node:crypto";
import LoadtestAuthKey from "./models/LoadtestAuthKey.js";

dotenv.config();

// Connect to MongoDB
export async function connectDB() {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is not configured");
  }

  await mongoose.connect(process.env.MONGO_URL);
  console.log("MongoDB connected successfully");
}

// Create a new API key
export async function createApiKey(projectName, email, validityDays = 30) {
  const apiKey = crypto.randomBytes(32).toString("hex");

  const validity = new Date();
  validity.setDate(validity.getDate() + validityDays);

  return await LoadtestAuthKey.create({
    apiKey,
    projectName,
    email,
    validity,
  });
}

export const generateApiKey = createApiKey;

// Check whether API key exists
export async function apiKeyExists(apiKey) {
  return !!(await LoadtestAuthKey.exists({ apiKey }));
}

// Get project name using API key
export async function getProjectName(apiKey) {
  const record = await LoadtestAuthKey.findOne({ apiKey }).select("projectName");
  return record?.projectName ?? null;
}

// Check whether API key is valid and not expired
export async function isApiKeyValid(apiKey) {
  return !!(await LoadtestAuthKey.exists({
    apiKey,
    validity: { $gt: new Date() },
  }));
}

// Get API key details
export async function getApiKeyDetails(apiKey) {
  return await LoadtestAuthKey.findOne({ apiKey });
}

// Get details only if key is valid
export async function getValidApiKey(apiKey) {
  return await LoadtestAuthKey.findOne({
    apiKey,
    validity: { $gt: new Date() },
  });
}
