import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import busRoutes from "./routes/busRoutes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend build if exists
app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

// API
app.use("/api", busRoutes);

// Fallback to frontend index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚍 Backend listening on http://localhost:${PORT}`));
