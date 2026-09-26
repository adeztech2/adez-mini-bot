// config.js — ADEZ BOT configuration

module.exports = {
  BOT_NAME: "ADEZ BOT",
  BOT_NUMBER: "254111783552",        // without + and without @s.whatsapp.net
  OWNER_NAME: "ARNOLD ADEZ",
  OWNER_NUMBER: "254111783552",      // used for owner-only commands
  PREFIX: ".",
  // Public-facing footer used in the menu / replies
  FOOTER: "ADEZ BOT | Owner: ARNOLD ADEZ",

  // Ports for the two web tools
  PAIR_PORT: process.env.PAIR_PORT || 3000,
  DEPLOY_PORT: process.env.DEPLOY_PORT || 4000,
};
