module.exports = {
  name: "ping",
  aliases: ["p"],

  async execute({ sock, msg, sender }) {
    const start = Date.now();

    const sent = await sock.sendMessage(
      sender,
      { text: "🏓 Pinging..." },
      { quoted: msg }
    );

    const latency = Date.now() - start;

    await sock.sendMessage(
      sender,
      {
        text: `🏓 *PONG!*\n\n⚡ Speed: ${latency}ms\n🤖 ADEZ BOT is online!`,
      },
      { quoted: msg }
    );
  },
};

Save it as:

commands/ping.js

Then send:

.ping

or, if your prefix is different:

<prefix>ping

It will also respond to:

.p
