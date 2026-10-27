import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    apiKey: { type: String, unique: true, required: true },
    projectName: { type: String, required: true },
    email: { type: String, required: true },
    validity: { type: Date, required: true },
  },
  { collection: "loadtest_auth_key", timestamps: true }
);

export default mongoose.models.LoadtestAuthKey ?? mongoose.model("LoadtestAuthKey", schema);
