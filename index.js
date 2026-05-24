require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");

const app = express();
const CONFIG = {
    ip: "95.173.173.31",
    port: 27015,
    dns: "valo.rasgaming.com",
    channelId: "1508144741538201804",
    prefix: "."
};

let messageId = null; // Bellekte tutulan mesaj ID'si
let serverData = { online: false, players: "0 / 32", map: "Yükleniyor..." };

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// — API: Eklentiden veri geldiği an tetiklenir —
app.get("/status", async (req, res) => {
    const { map, players, max } = req.query;
    if (!map || !players || !max) return res.status(400).send("Eksik veri.");

    serverData = { online: true, players: `${players} / ${max}`, map: map.toUpperCase() };
    
    // Veri geldiği an mevcut mesajı güncelle (Yenisini atmaz, eskisini düzenler)
    await updateDiscordEmbed();
    res.status(200).send("Discord güncellendi.");
});

app.listen(3000, () => console.log("API Port 3000 aktif."));

function createEmbed() {
    return new EmbedBuilder()
        .setColor(serverData.online ? 0x00ff00 : 0xff0000)
        .setTitle("🦁 CS1.6 VALORANT MOD\n#RASGAMING")
        .setThumbnail("https://i.imgur.com/BkAc3Yn.jpeg")
        .addFields(
            { 
                name: "📡 Durum", 
                value: serverData.online 
                    ? "<a:greenloading:1508152313087262982> **Aktif**" 
                    : "🔴 **Veri Bekleniyor...**", 
                inline: true 
            },
            
            { 
                name: "🗺️ Harita", 
                value: `\`${serverData.map}\``, 
                inline: true 
            },
            
            { 
                name: "👥 Oyuncular", 
                value: `\`${serverData.players}\``, 
                inline: true 
            },
            
            { 
                name: "🔗 Bağlan", 
                value: `[🔗 Bağlan](steam://connect/${CONFIG.ip}:${CONFIG.port})` 
            },
            
            { 
                name: "💻 Konsol:", 
                value: `\`connect ${CONFIG.ip}:${CONFIG.port}\`` 
            }
        )
        .setImage(`https://gametracker.com/server_info/${CONFIG.ip}:${CONFIG.port}/b_560_95_1.png`)
        .setFooter({ text: "RAS Gaming • Otomatik Güncelleme" })
        .setTimestamp();
}

async function updateDiscordEmbed() {
    try {
        const channel = await client.channels.fetch(CONFIG.channelId).catch(() => null);
        if (!channel) return;
        
        const embed = createEmbed();

        // 1. Eğer messageId yoksa, kanaldaki son mesajlara bakıp kendi mesajımızı bulalım
        if (!messageId) {
            const messages = await channel.messages.fetch({ limit: 10 });
            const myMsg = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0);
            if (myMsg) messageId = myMsg.id;
        }

        // 2. Mesaj varsa düzenle, yoksa yeni at
        if (messageId) {
            const msg = await channel.messages.fetch(messageId).catch(() => null);
            if (msg) {
                await msg.edit({ embeds: [embed] });
            } else {
                const newMsg = await channel.send({ embeds: [embed] });
                messageId = newMsg.id;
            }
        } else {
            const newMsg = await channel.send({ embeds: [embed] });
            messageId = newMsg.id;
        }
    } catch (err) { console.error("Hata:", err); }
}

client.once("ready", async () => {
    console.log(`Bot: ${client.user.tag}`);
    await updateDiscordEmbed();
});

// .yenile komutu: Sadece mesajı temizler ve yeniden oluşturur
client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.content.startsWith(CONFIG.prefix)) return;
    if (message.content.slice(CONFIG.prefix.length).trim().toLowerCase() === "yenile") {
        await message.delete().catch(() => null);
        if (messageId) {
             const oldMsg = await message.channel.messages.fetch(messageId).catch(() => null);
             if (oldMsg) await oldMsg.delete().catch(() => null);
        }
        messageId = null;
        await updateDiscordEmbed();
    }
});

client.login(process.env.DISCORD_TOKEN);
