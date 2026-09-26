// deploy-server.js — serves deploy.html; takes a Session ID and starts the real bot with it.

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { decodeSession } = require("./lib/sessionCodec");
const { startBot } = require("./bot");
const config = require("./config");

const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "public")));

const DEPLOY_DIR = path.join(__dirname, "deployed_sessions");
fs.mkdirSync(DEPLOY_DIR, { recursive: true });

const runningBots = new Map(); // id -> { sock, status }

app.post("/api/deploy", async (req, res) => {
  const sessionId = String(req.body.sessionId || "").trim();
  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required." });
  }

  const id = crypto.createHash("sha256").update(sessionId).digest("hex").slice(0, 16);

  if (runningBots.has(id)) {
    return res.json({ status: "already_running", id });
  }

  const sessionDir = path.join(DEPLOY_DIR, id);

  try {
    decodeSession(sessionId, sessionDir);
  } catch (err) {
    return res.status(400).json({ error: "That session ID looks invalid or corrupted." });
  }

  const entry = { sock: null, status: "starting" };
  runningBots.set(id, entry);

  try {
    const sock = await startBot(sessionDir, {
      onOpen: () => { entry.status = "online"; },
      onClose: () => { entry.status = "offline"; },
    });
    entry.sock = sock;
    res.json({ status: "deployed", id });
  } catch (err) {
    console.error(err);
    runningBots.delete(id);
    res.status(500).json({ error: "Failed to deploy bot with this session." });
  }
});

app.get("/api/deploy/status/:id", (req, res) => {
  const entry = runningBots.get(req.params.id);
  if (!entry) return res.json({ running: false });
  res.json({ running: true, status: entry.status });
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "deploy.html")));

app.listen(config.DEPLOY_PORT, () => {
  console.log(`🚀 Deploy site running at http://localhost:${config.DEPLOY_PORT}`);
});
