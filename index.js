const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");

const app = express();
app.use(express.json());
app.listen(3000, () => console.log("RAS Gaming bot aktif!"));

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

let messageId = null;
let channelId = "1508144741538201804"; // KANAL ID

// CS 1.6 eklentisinden gelen veriler buraya yazılıyor
global.serverData = {
    hostname: "RAS GAMING",
    map: "YOK",
    players: 0,
    maxplayers: 0
};

// CS 1.6 Eklentisi veri gönderiyor (GET endpoint)
app.get("/status", (req, res) => {
    global.serverData = {
        hostname: req.query.hostname,
        map: req.query.map,
        players: req.query.players,
        maxplayers: req.query.max
    };

    console.log("CS Veri Geldi:", global.serverData);

    res.send("OK");
});

client.on("ready", async () => {
    console.log(`Bot aktif: ${client.user.tag}`);
    statusLoop();
});

// Embed güncelleme
async function statusLoop() {
    const channel = await client.channels.fetch(channelId);

    setInterval(async () => {
        const info = global.serverData;
        const online = parseInt(info.players) > 0; // oyuncu varsa aktif

        const embed = new EmbedBuilder()
            .setColor(online ? 0x00ff00 : 0xff0000)
            .setTitle("🦁 RAS GAMING • VALORANT MOD")
            .setThumbnail("https://i.imgur.com/BkAc3Yn.jpeg")
            .addFields(
                { name: "Durum", value: online ? "🟢 Sunucu Aktif" : "🔴 Sunucu Kapalı", inline: true },
                { name: "Oyuncular", value: `${info.players} / ${info.maxplayers}`, inline: true },
                { name: "Harita", value: info.map || "YOK", inline: false },
                { name: "Bağlan", value: "[Sunucuya Katıl](steam://connect/95.173.173.31:27015)" },
                { name: "Konsol ile Giriş", value: "`connect 95.173.173.31:27015`" }
            )
            .setFooter({ text: "RAS Gaming • Otomatik Güncelleme" })
            .setTimestamp();

        try {
            if (!messageId) {
                const msg = await channel.send({ embeds: [embed] });
                messageId = msg.id;
            } else {
                const msg = await channel.messages.fetch(messageId);
                await msg.edit({ embeds: [embed] });
            }
        } catch (err) {
            console.error("Embed güncellenemedi:", err);
        }
    }, 10000);
}

client.login(process.env.DISCORD_TOKEN);
