// index.js — single entry point for hosting platforms (Render/Railway/Heroku/etc.)
// Boots both web tools in one process:
//   - pair-server.js   -> pairing site (get your session ID)
//   - deploy-server.js -> deploy site (bring the bot online from a session ID)

console.log("Starting ADEZ BOT services...");

require("./pair-server");
require("./deploy-server");
