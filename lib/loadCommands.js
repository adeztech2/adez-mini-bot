// lib/loadCommands.js
// Scans the commands/ folder and loads every valid command module.

const fs = require("fs");
const path = require("path");

function loadCommands() {
  const commands = new Map();

  // Project root/commands
  const dir = path.join(__dirname, "..", "commands");

  // Prevent ENOENT if the commands folder does not exist.
  if (!fs.existsSync(dir)) {
    console.warn(`[WARN] Commands folder not found. Creating: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
    return commands;
  }

  let files;

  try {
    files = fs.readdirSync(dir);
  } catch (err) {
    console.error(`[ERROR] Could not read commands folder: ${dir}`);
    console.error(err);
    return commands;
  }

  for (const file of files) {
    // Only load JavaScript command files.
    if (!file.endsWith(".js")) continue;

    const filePath = path.join(dir, file);

    try {
      const cmd = require(filePath);

      if (!cmd?.name || typeof cmd.execute !== "function") {
        console.warn(`[WARN] Skipping invalid command file: ${file}`);
        continue;
      }

      const commandName = cmd.name.toLowerCase();
      commands.set(commandName, cmd);

      // Load aliases.
      if (Array.isArray(cmd.aliases)) {
        for (const alias of cmd.aliases) {
          if (typeof alias !== "string") continue;
          commands.set(alias.toLowerCase(), cmd);
        }
      }

      console.log(`[CMD] Loaded: ${cmd.name}`);
    } catch (err) {
      console.error(`[ERROR] Failed to load command: ${file}`);
      console.error(err);
    }
  }

  console.log(`[CMD] Loaded ${commands.size} command/alias entries.`);

  return commands;
}

module.exports = { loadCommands };

Your "bot.js" can remain as it is. You don't need to change it for this particular error.

Also add the "commands" folder to GitHub

Even though the new loader creates it automatically, your actual commands still need to be in the repository.

Your structure should be:

adez-mini-bot/
├── index.js
├── bot.js
├── config.js
├── package.json
├── commands/
│   ├── ping.js
│   ├── menu.js
│   └── ...
└── lib/
    └── loadCommands.js

If your repository currently has no "commands" folder, create it on GitHub and put your command ".js" files there.

For example, a command must follow your loader's expected structure:

module.exports = {
  name: "ping",
  aliases: ["p"],
  
  async execute({ sock, msg, sender }) {
    await sock.sendMessage(
      sender,
      { text: "🏓 Pong!" },
      { quoted: msg }
    );
  }
};

Then redeploy

Commit the change to GitHub and redeploy on Render.

You should now see something similar to:

Starting ADEZ BOT services...
[CMD] Loaded: ping
[CMD] Loaded: menu
[CMD] Loaded 4 command/alias entries.

Instead of:

Error: ENOENT: no such file or directory, scandir '/opt/render/project/src/commands'

One important point: if you create the folder but leave it empty, the bot should start, but commands obviously won't respond. If you paste your GitHub repository's "commands" files here (or upload the project ZIP), I can also check whether the command files themselves match this loader and fix any next deployment errors.
