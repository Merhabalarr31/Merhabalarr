const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require("discord.js");
const Gamedig = require("gamedig");
const express = require("express");

// Express - Render botu ayakta tutsun
const app = express();
app.get("/", (_, res) => res.send("RAS Gaming bot aktif!"));
app.listen(3000);

// Discord bot
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Sunucu ayarları
const CONFIG = {
    ip: "95.173.173.31",
    port: 27015
};

// Kanal & mesaj ID
let channelId = "1508144741538201804";
let messageId = null;

// —— Slash Komutları ——
const commands = [
    new SlashCommandBuilder()
        .setName("yenile")
        .setDescription("Sunucu durum embed mesajını yeniden gönderir."),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.on("ready", async () => {
    console.log("Bot aktif:", client.user.tag);

    // Slash komut yükleme
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log("Komutlar yüklendi.");
    } catch (err) {
        console.error("Komut yüklenirken hata:", err);
    }

    statusLoop();
});

// —— Sunucu Sorgusu ——
async function getServerInfo() {
    try {
        let s = await Gamedig.query({
            type: "cs16",
            host: CONFIG.ip,
            port: CONFIG.port
        });

        return {
            online: true,
            players: `${s.players.length} / ${s.maxplayers}`,
            map: s.map
        };

    } catch (err) {
        return {
            online: false,
            players: "0 / 0",
            map: "YOK"
        };
    }
}

// —— Embed Oluşturma ——
function createEmbed(info) {
    return new EmbedBuilder()
        .setColor(info.online ? 0x00ff00 : 0xff0000)
        .setTitle("🦁 RAS GAMING • VALORANT MOD")
        .setThumbnail("https://i.imgur.com/BkAc3Yn.jpeg")
        .addFields(
            {
                name: "📡 Durum",
                value: info.online
                    ? "<a:greenloading:1508152313087262982> **Sunucu Aktif**"
                    : "🔴 **Sunucu Kapalı**",
                inline: true
            },
            { name: "👥 Oyuncular", value: info.players, inline: true },
            { name: "🗺️ Harita", value: `\`${info.map}\`` },
            { name: "🔗 Bağlan", value: "[Sunucuya Katıl](steam://connect/95.173.173.31:27015)" },
            { name: "💻 Konsol ile giriş", value: "`connect 95.173.173.31:27015`" }
        )
        .setFooter({ text: "RAS Gaming • Otomatik Güncelleme" })
        .setTimestamp();
}

// —— Embed Güncelleme Döngüsü ——
async function statusLoop() {
    const channel = await client.channels.fetch(channelId);

    setInterval(async () => {
        const info = await getServerInfo();
        const embed = createEmbed(info);

        try {
            if (!messageId) {
                let msg = await channel.send({ embeds: [embed] });
                messageId = msg.id;
            } else {
                let msg = await channel.messages.fetch(messageId);
                msg.edit({ embeds: [embed] });
            }
        } catch (err) {
            console.log("Mesaj güncellenemedi:", err);
        }

    }, 10000);
}

// —— Slash Komut Çalıştırma ——
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "yenile") {
        const channel = await client.channels.fetch(channelId);
        const info = await getServerInfo();
        const embed = createEmbed(info);

        if (messageId) {
            try {
                let msg = await channel.messages.fetch(messageId);
                await msg.delete(); // Eskiyi sil
            } catch {}
        }

        let newMsg = await channel.send({ embeds: [embed] });
        messageId = newMsg.id;

        await interaction.reply({ content: "Embed yenilendi!", ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);
