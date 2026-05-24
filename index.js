const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const Gamedig = require("gamedig");
const express = require("express");

const app = express();
app.get("/", (_, res) => res.send("RAS Gaming bot aktif!"));
app.listen(3000);

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Sunucu
const CONFIG = {
    ip: "95.173.173.31",
    port: 27015,
};

// Embed mesaj ID
let messageId = null;
let channelId = "1508144741538201804"; // KANAL ID

async function getServerInfo() {
    try {
        const s = await Gamedig.query({
            type: "cs16",
            host: CONFIG.ip,
            port: CONFIG.port
        });

        return {
            online: true,
            players: `${s.players.length} / ${s.maxplayers}`,
            map: s.map
        };

    } catch {
        return {
            online: false,
            players: "0 / 0",
            map: "YOK"
        };
    }
}

client.on("ready", async () => {
    console.log("Bot aktif:", client.user.tag);
    statusLoop();
});

async function statusLoop() {
    const channel = await client.channels.fetch(channelId);

    setInterval(async () => {
        const info = await getServerInfo();

        const embed = new EmbedBuilder()
            .setColor(info.online ? 0x00ff00 : 0xff0000)
            .setTitle("🦁 RAS GAMING • VALORANT MOD")
            .setThumbnail("https://i.imgur.com/BkAc3Yn.jpeg") // LOGO
            .addFields(
                { name: "Durum", value: info.online ? "🟢 Sunucu Aktif" : "🔴 Sunucu Kapalı", inline: true },
                { name: "Oyuncular", value: info.players, inline: true },
                { name: "Harita", value: info.map, inline: false },
                { name: "Bağlan", value: "[Sunucuya Katıl](steam://connect/95.173.173.31:27015)" },
                { name: "Konsol ile Giriş", value: "`connect 95.173.173.31:27015`" }
            )
            .setFooter({ text: "RAS Gaming • Otomatik Güncelleme" })
            .setTimestamp();

        try {
            if (!messageId) {
                // İlk mesajı gönder
                let msg = await channel.send({ embeds: [embed] });
                messageId = msg.id;
            } else {
                // Var olan mesajı güncelle
                let msg = await channel.messages.fetch(messageId);
                await msg.edit({ embeds: [embed] });
            }
        } catch (err) {
            console.error("Mesaj güncellenemedi:", err);
        }

    }, 10000);
}

client.login(process.env.DISCORD_TOKEN);
