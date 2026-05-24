const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const Gamedig = require("gamedig");
const express = require("express");

// 7/24 aktif tutma
const app = express();
app.get("/", (req, res) => res.send("RAS Gaming bot aktif!"));
app.listen(3000);

// Discord bot
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// Sunucu bilgileri
const CONFIG = {
    ip: "95.173.173.31",
    port: 27015,
};

let messageId = null;

// Sunucu sorgusu
async function getServerInfo() {
    try {
        const data = await Gamedig.query({
            type: "cs16",
            host: CONFIG.ip,
            port: CONFIG.port
        });

        return {
            online: true,
            map: data.map,
            players: `${data.players.length} / ${data.maxplayers}`
        };

    } catch (err) {
        return { online: false };
    }
}

client.on("ready", () => {
    console.log(`Bot aktif: ${client.user.tag}`);
    statusLoop();
});

// Embed güncelleme döngüsü
async function statusLoop() {
    const channel = await client.channels.fetch("1508144741538201804"); // BURAYI DÜZENLE!!

    setInterval(async () => {
        const info = await getServerInfo();

        const embed = new EmbedBuilder()
            .setColor(info.online ? 0x00ff00 : 0xff0000)
            .setTitle("🦁 RAS GAMING • VALORANT MOD")
            .setThumbnail("https://i.imgur.com/99fd39a3.png") // LOGO EKLENDİ
            .addFields(
                {
                    name: "Durum",
                    value: info.online ? "🟢 **Sunucu Aktif**" : "🔴 **Sunucu Kapalı**",
                    inline: true
                },
                {
                    name: "Oyuncular",
                    value: info.online ? info.players : "0 / 0",
                    inline: true
                },
                {
                    name: "Harita",
                    value: info.online ? `\`${info.map}\`` : "YOK",
                    inline: false
                },
                {
                    name: "Bağlan",
                    value: "[Sunucuya Katıl](steam://connect/95.173.173.31:27015)",
                    inline: false
                },
                {
                    name: "Konsol ile giriş",
                    value: "`connect 95.173.173.31:27015`"
                }
            )
            .setFooter({ text: "RAS Gaming • Otomatik Güncelleme" })
            .setTimestamp();

        if (!messageId) {
            const msg = await channel.send({ embeds: [embed] });
            messageId = msg.id;
        } else {
            const msg = await channel.messages.fetch(messageId);
            msg.edit({ embeds: [embed] });
        }

    }, 15000);
}

client.login(process.env.DISCORD_TOKEN);
