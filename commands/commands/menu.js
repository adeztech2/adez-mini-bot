module.exports = {
  name: "menu",
  aliases: ["help", "commands"],

  async execute({ sock, msg, sender, config }) {
    const prefix = config.PREFIX || ".";

    const menu = `
╭━━━〔 🤖 ADEZ BOT 〕━━━╮
┃
┃ 👋 Hello!
┃
┃ 📌 *BOT MENU*
┃
┃ 🏓 ${prefix}ping
┃    Check bot response speed
┃
┃ 📋 ${prefix}menu
┃    Show this menu
┃
┃
┃ ⚙️ *Available Commands*
┃
┃ • ${prefix}ping
┃ • ${prefix}menu
┃ • ${prefix}help
┃ • ${prefix}commands
┃
╰━━━━━━━━━━━━━━━━━━━━╯
`;

    await sock.sendMessage(
      sender,
      { text: menu },
      { quoted: msg }
    );
  },
};

Save it as:

commands/menu.js

Then use:

.menu

or:

.help

or:

.commands

If your "PREFIX" in "config.js" is "." you'll get ".menu"; if it's "!", you'll use "!menu", etc.
