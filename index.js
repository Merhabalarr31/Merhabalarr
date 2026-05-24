require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");

const app = express();

// —— Sunucu ve Bot Ayarları ——
const CONFIG = {
    ip: "95.173.173.31",
    port: 27015,
    dns: "valo.rasgaming.com", // Kendi domainin varsa buraya yaz, yoksa IP'yi yaz
    channelId: "1508144741538201804",
    prefix: "."
};

let messageId = null;

let serverData = {
    online: false,
    players: "0 / 32",
    map: "Yükleniyor..."
};

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

app.get("/status", async (req, res) => {
    const { map, players, max } = req.query;
    if (!map || !players || !max) return res.status(400).send("Eksik veri.");

    serverData = { online: true, players: `${players} / ${max}`, map: map.toUpperCase() };
    await updateDiscordEmbed();
    res.status(200).send("Güncellendi.");
});

app.listen(3000, () => console.log("API Aktif."));

function createEmbed() {
    return new EmbedBuilder()
        .setColor(serverData.online ? 0x00ff00 : 0xff0000)
        .setTitle("🦁 CS1.6 VALORANT MOD\n#RASGAMING")
        .setThumbnail("https://i.imgur.com/BkAc3Yn.jpeg")
        .addFields(
            { name: "📡 Durum", value: serverData.online ? "<a:greenloading:1508152313087262982> **Aktif**" : "🔴 **Veri Bekleniyor...**", inline: true },
            { name: "🔗 Adres", value: `\`${CONFIG.dns || CONFIG.ip}\``, inline: true },
            { name: "🗺️ Harita", value: `\`${serverData.map}\`` },
            { name: "👥 Oyuncular", value: serverData.players },
            { name: "🔗 Bağlanmak için Tıkla", value: `[Sunucuya Katıl](steam://connect/${CONFIG.ip}:${CONFIG.port})` },
            { name: "💻 Konsol ile girmek için kopyala:", value: `\`connect ${CONFIG.ip}:${CONFIG.port}\`` }
        )
        .setFooter({ text: "RAS Gaming • Otomatik Güncelleme" })
        .setTimestamp();
}

async function updateDiscordEmbed() {
    try {
        const channel = await client.channels.fetch(CONFIG.channelId).catch(() => null);
        if (!channel) return;
        const embed = createEmbed();

        if (!messageId) {
            const msg = await channel.send({ embeds: [embed] });
            messageId = msg.id;
        } else {
            const msg = await channel.messages.fetch(messageId).catch(() => null);
            if (msg) await msg.edit({ embeds: [embed] });
            else {
                const newMsg = await channel.send({ embeds: [embed] });
                messageId = newMsg.id;
            }
        }
    } catch (err) { console.error(err); }
}

client.once("ready", async () => {
    console.log(`Bot aktif: ${client.user.tag}`);
    // Bot açıldığında ilk mesajı oluştur
    await updateDiscordEmbed();
});

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.content.startsWith(CONFIG.prefix)) return;
    if (message.content.slice(CONFIG.prefix.length).trim().toLowerCase() === "yenile") {
        await message.delete().catch(() => null);
        if (messageId) {
             const oldMsg = await message.channel.messages.fetch(messageId).catch(() => null);
             if (oldMsg) await oldMsg.delete().catch(() => null);
        }
        messageId = null; // Sıfırla ki yeniden oluştursun
        await updateDiscordEmbed();
    }
});

client.login(process.env.DISCORD_TOKEN);
