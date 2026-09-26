const fs = require("fs");
const path = require("path");

function loadCommands() {
  const commands = new Map();
  const dir = path.join(__dirname, "..", "commands");

  // Create the commands directory if it does not exist.
  if (!fs.existsSync(dir)) {
    console.warn(`[WARN] Commands folder not found. Creating: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
    return commands;
  }

  let files;

  try {
    files = fs.readdirSync(dir);
  } catch (error) {
    console.error(`[ERROR] Cannot read commands folder: ${dir}`);
    console.error(error);
    return commands;
  }

  for (const file of files) {
    if (!file.endsWith(".js")) continue;

    const filePath = path.join(dir, file);

    try {
      const cmd = require(filePath);

      if (!cmd?.name || typeof cmd.execute !== "function") {
        console.warn(`[WARN] Skipping invalid command file: ${file}`);
        continue;
      }

      commands.set(cmd.name.toLowerCase(), cmd);

      if (Array.isArray(cmd.aliases)) {
        for (const alias of cmd.aliases) {
          if (typeof alias !== "string") continue;
          commands.set(alias.toLowerCase(), cmd);
        }
      }

      console.log(`[CMD] Loaded: ${cmd.name}`);
    } catch (error) {
      console.error(`[ERROR] Failed to load command: ${file}`);
      console.error(error);
    }
  }

  console.log(`[CMD] Total command/alias entries: ${commands.size}`);

  return commands;
}

module.exports = { loadCommands };
