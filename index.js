const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const Gamedig = require('gamedig');
const express = require('express');

// EXPRESS – Render'ın botu kapatmaması için
const app = express();
app.get('/', (req, res) => res.send('Bot çalışıyor!'));
app.listen(3000, () => console.log("Web server aktif"));

// DISCORD CLIENT
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// Config
const CONFIG = {
    ip: "95.173.173.31",
    port: 27015,
    game: "cs16",
    channelId: "1508144741538201804"
};

// Sunucu bilgisi çekme
async function getServerInfo() {
    try {
        const state = await Gamedig.query({
            type: CONFIG.game,
            host: CONFIG.ip,
            port: CONFIG.port
        });

        return {
            online: true,
            map: state.map,
            players: `${state.players.length}/${state.maxplayers}`
        };
    } catch (err) {
        return { online: false };
    }
}

// Bot hazır olduğunda
client.on("ready", () => {
    console.log(`${client.user.tag} aktif!`);
    statusLoop();
});

// Embed gönderme döngüsü
async function statusLoop() {
    const channel = await client.channels.fetch(CONFIG.channelId);

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

    }, 15000);
}

// TOKEN – Render’dan alıyor
client.login(process.env.DISCORD_TOKEN);
