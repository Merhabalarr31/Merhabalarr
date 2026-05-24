const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const Gamedig = require('gamedig');
const express = require('express');

// EXPRESS – Botun 7/24 açık kalmasını sağlar
const app = express();
app.get('/', (req, res) => res.send('Bot aktif çalışıyor!'));
app.listen(3000);

// DISCORD BOT
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// Sunucu bilgileri
const CONFIG = {
    ip: "valo.serahor.com",
    port: 27015,
    game: "cs16"
};

async function getServerInfo() {
    try {
        const state = await Gamedig.query({
            type: CONFIG.game,
            host: CONFIG.ip,
            port: CONFIG.port
        });

        return {
            online: true,
            name: state.name,
            map: state.map,
            players: `${state.players.length}/${state.maxplayers}`
        };
    } catch (error) {
        return { online: false };
    }
}

client.on("ready", () => {
    console.log(`${client.user.tag} aktif!`);
    statusLoop();
});

// Embed güncelleme
async function statusLoop() {
    const channelId = "KANAL_ID"; // Buraya botun mesaj atacağı kanal ID'sini yaz
    const channel = await client.channels.fetch(channelId);

    setInterval(async () => {
        const info = await getServerInfo();

        const embed = new EmbedBuilder()
            .setColor(info.online ? 0x00ff00 : 0xff0000)
            .setTitle("Return Allstarz - Valorant Mod")
            .addFields(
                { name: "Durum", value: info.online ? "🟢 Online" : "🔴 Offline" },
                { name: "Oyuncular", value: info.online ? info.players : "0/0" },
                { name: "Harita", value: info.online ? info.map : "Yok" }
            )
            .setTimestamp();

        channel.send({ embeds: [embed] });

    }, 15000); // 15 saniyede bir günceller
}

// Tokeni Render ortam değişkeninden alır
client.login(process.env.DISCORD_TOKEN);