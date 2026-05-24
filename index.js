require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes } = require("discord.js");
const Gamedig = require("gamedig");
const express = require("express");

// —— Express - Render botu ayakta tutsun ——
const app = express();
app.get("/", (_, res) => res.send("RAS Gaming bot aktif!"));
app.listen(3000);

// —— Sunucu ve Bot Ayarları ——
const CONFIG = {
    ip: "95.173.173.31",
    port: 27015,
    channelId: "1508144741538201804",
    updateInterval: 30000,
    prefix: "." // Komut ön eki
};

let messageId = null;

// —— Discord Bot İstemcisi ——
// MessageContent intent'i buraya eklendi!
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent 
    ]
});

// —— Sunucu Sorgusu ——
async function getServerInfo() {
    try {
        const state = await Gamedig.query({
            type: "cs16",
            host: CONFIG.ip,
            port: CONFIG.port,
            maxAttempts: 2
        });
        return { online: true, players: `${state.players.length} / ${state.maxplayers}`, map: state.map };
    } catch (err) {
        return { online: false, players: "0 / 0", map: "YOK" };
    }
}

// —— Embed Oluşturma ——
function createEmbed(info) {
    return new EmbedBuilder()
        .setColor(info.online ? 0x00ff00 : 0xff0000)
        .setTitle("🦁 RAS GAMING • VALORANT MOD")
        .setThumbnail("https://i.imgur.com/BkAc3Yn.jpeg")
        .addFields(
            { name: "📡 Durum", value: info.online ? "<a:greenloading:1508152313087262982> **Sunucu Aktif**" : "🔴 **Sunucu Kapalı**", inline: true },
            { name: "👥 Oyuncular", value: info.players, inline: true },
            { name: "🗺️ Harita", value: `\`${info.map}\`` },
            { name: "🔗 Bağlan", value: `[Sunucuya Katıl](steam://connect/${CONFIG.ip}:${CONFIG.port})` },
            { name: "💻 Konsol", value: `\`connect ${CONFIG.ip}:${CONFIG.port}\`` }
        )
        .setFooter({ text: "RAS Gaming • .yenile yazarak tazeleyebilirsiniz" })
        .setTimestamp();
}

// —— Embed Güncelleme Döngüsü ——
async function statusLoop() {
    const channel = await client.channels.fetch(CONFIG.channelId).catch(() => null);
    if (!channel) return console.error("Kanal bulunamadı!");

    setInterval(async () => {
        const info = await getServerInfo();
        const embed = createEmbed(info);

        try {
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
        } catch (err) { console.log("Güncelleme hatası."); }
    }, CONFIG.updateInterval);
}

// —— Bot Eventleri ——
client.once("ready", () => {
    console.log(`${client.user.tag} hazır! Prefix: ${CONFIG.prefix}`);
    statusLoop();
});

// —— Mesaj Kontrolü (.yenile için) ——
client.on("messageCreate", async (message) => {
    // Botların mesajlarını ve prefix ile başlamayanları görmezden gel
    if (message.author.bot || !message.content.startsWith(CONFIG.prefix)) return;

    const command = message.content.slice(CONFIG.prefix.length).trim().toLowerCase();

    if (command === "yenile") {
        try {
            const info = await getServerInfo();
            const embed = createEmbed(info);
            const channel = message.channel;

            // Eski mesajı silmeyi dene
            if (messageId) {
                const oldMsg = await channel.messages.fetch(messageId).catch(() => null);
                if (oldMsg) await oldMsg.delete().catch(() => null);
            }

            // Yeni mesajı gönder
            const newMsg = await channel.send({ embeds: [embed] });
            messageId = newMsg.id;

            // Komutu yazan kişinin mesajını sil (isteğe bağlı, temizlik için)
            await message.delete().catch(() => null);

            // Bilgilendirme mesajı gönder ve 3 saniye sonra sil
            const feedback = await message.reply("✅ Embed başarıyla yenilendi.");
            setTimeout(() => feedback.delete().catch(() => null), 3000);

        } catch (err) {
            console.error("Yenileme hatası:", err);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
