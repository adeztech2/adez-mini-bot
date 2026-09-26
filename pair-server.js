const express = require("express");
const path = require("path");
const fs = require("fs");

const {
default: makeWASocket,
useMultiFileAuthState,
fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");

const QRCode = require("qrcode");
const pino = require("pino");

const { encodeSession } = require("./lib/sessionCodec");
const config = require("./config");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const TEMP_DIR = path.join(__dirname, "temp_sessions");
fs.mkdirSync(TEMP_DIR, { recursive: true });

// requestId -> pairing information
const requests = new Map();

app.post("/api/pair", async (req, res) => {
const requestId =
Date.now().toString(36) +
Math.random().toString(36).slice(2, 8);

const sessionDir = path.join(TEMP_DIR, requestId);

fs.mkdirSync(sessionDir, { recursive: true });

const state_ = {
status: "connecting",
qr: null,
sessionId: null,
error: null,
};

requests.set(requestId, state_);

try {
const { state, saveCreds } =
await useMultiFileAuthState(sessionDir);

const { version } =
  await fetchLatestBaileysVersion();

const sock = makeWASocket({
  version,
  auth: state,
  logger: pino({ level: "silent" }),
  printQRInTerminal: false,
  browser: [
    config.BOT_NAME || "ADEZ MINI BOT",
    "Chrome",
    "1.0.0",
  ],
});

sock.ev.on("creds.update", saveCreds);

sock.ev.on("connection.update", async (update) => {
  const { connection, qr, lastDisconnect } = update;

  // New QR received
  if (qr) {
    try {
      state_.status = "qr_ready";

      // Convert Baileys QR string into an image
      state_.qr = await QRCode.toDataURL(qr, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "M",
      });

      state_.error = null;

      console.log(
        `[PAIR] New QR generated for ${requestId}`
      );
    } catch (error) {
      console.error("[PAIR] QR generation error:", error);

      state_.status = "error";
      state_.error = "Failed to generate QR code.";
    }
  }

  // Successfully linked
  if (connection === "open") {
    console.log(
      `[PAIR] WhatsApp connected: ${requestId}`
    );

    try {
      const sessionId = encodeSession(sessionDir);

      state_.status = "ready";
      state_.sessionId = sessionId;
      state_.qr = null;

      const ownJid = sock.user?.id;

      if (ownJid) {
        await sock.sendMessage(ownJid, {
          text:
            `✅ *${config.BOT_NAME || "ADEZ MINI BOT"}* linked successfully!\n\n` +
            `Your SESSION ID is:\n\n` +
            `${sessionId}\n\n` +
            `Paste this SESSION ID into the deploy page to start your bot.\n\n` +
            `⚠️ Keep this SESSION ID private. Anyone who has it may be able to control this WhatsApp session.`,
        });
      }

      console.log(
        `[PAIR] Session generated successfully: ${requestId}`
      );
    } catch (error) {
      console.error(
        "[PAIR] Session generation error:",
        error
      );

      state_.status = "error";
      state_.error =
        "WhatsApp linked, but the session could not be generated.";
    }

    // Close temporary pairing socket
    setTimeout(() => {
      try {
        sock.end(undefined);
      } catch (_) {}
    }, 5000);
  }

  // Connection closed
  if (connection === "close") {
    console.log(
      `[PAIR] Connection closed: ${requestId}`,
      lastDisconnect?.error?.message || ""
    );

    if (state_.status !== "ready") {
      state_.status = "error";
      state_.error =
        "WhatsApp connection closed. Generate a new QR code and try again.";
    }
  }
});

// Return request ID immediately.
// The browser polls /api/pair/status/:id for the QR.
res.json({
  requestId,
  status: "connecting",
});

} catch (error) {
console.error("[PAIR] Failed to start pairing:", error);

state_.status = "error";
state_.error =
  "Failed to start WhatsApp pairing.";

res.status(500).json({
  error: state_.error,
});

}
});

app.get("/api/pair/status/:id", (req, res) => {
const data = requests.get(req.params.id);

if (!data) {
return res.status(404).json({
error: "Unknown pairing request.",
});
}

res.json(data);
});

app.get("/", (req, res) => {
res.sendFile(
path.join(__dirname, "public", "pair.html")
);
});

app.listen(config.PAIR_PORT, () => {
console.log(
"🔗 Pairing site running at http://localhost:${config.PAIR_PORT}"
);
});
