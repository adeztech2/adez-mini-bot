// pair-server.js — serves pair.html and handles the pairing-code login flow.
// On success it encodes the session and sends it to the linked number's own chat.

const express = require("express");
const path = require("path");
const fs = require("fs");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { encodeSession } = require("./lib/sessionCodec");
const config = require("./config");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const TEMP_DIR = path.join(__dirname, "temp_sessions");
fs.mkdirSync(TEMP_DIR, { recursive: true });

// requestId -> { status, code?, sessionId?, error? }
const requests = new Map();

app.post("/api/pair", async (req, res) => {
  const digitsOnly = String(req.body.phone || "").replace(/[^0-9]/g, "");
  if (digitsOnly.length < 9) {
    return res.status(400).json({ error: "Enter your WhatsApp number with country code, digits only." });
  }

  const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const sessionDir = path.join(TEMP_DIR, requestId);
  fs.mkdirSync(sessionDir, { recursive: true });

  const state_ = { status: "connecting" };
  requests.set(requestId, state_);

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: [config.BOT_NAME, "Chrome", "1.0.0"],
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      if (update.connection === "open") {
        try {
          const sessionId = encodeSession(sessionDir);
          state_.status = "ready";
          state_.sessionId = sessionId;

          const ownJid = sock.user.id;
          await sock.sendMessage(ownJid, {
            text:
              `✅ *${config.BOT_NAME}* linked successfully!\n\n` +
              `Copy the SESSION ID below and paste it into *deploy.html* to bring your bot online:\n\n` +
              `${sessionId}\n\n` +
              `⚠️ Keep this private — anyone with it can control this WhatsApp account.`,
          });
        } catch (err) {
          state_.status = "error";
          state_.error = "Linked, but failed to generate/send session id.";
          console.error(err);
        }
        setTimeout(() => sock.end(undefined), 4000);
      }
    });

    if (!state.creds.registered) {
      await new Promise((r) => setTimeout(r, 1500));
      const code = await sock.requestPairingCode(digitsOnly);
      state_.status = "code_ready";
      state_.code = code;
    }

    res.json({ requestId, code: state_.code || null });
  } catch (err) {
    console.error(err);
    state_.status = "error";
    state_.error = "Failed to start pairing. Try again.";
    res.status(500).json({ error: state_.error });
  }
});

app.get("/api/pair/status/:id", (req, res) => {
  const data = requests.get(req.params.id);
  if (!data) return res.status(404).json({ error: "Unknown request id" });
  res.json(data);
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "pair.html")));

app.listen(config.PAIR_PORT, () => {
  console.log(`🔗 Pairing site running at http://localhost:${config.PAIR_PORT}`);
});
