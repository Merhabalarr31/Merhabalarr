require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");

const app = express();

// —— Sunucu ve Bot Ayarları ——
const CONFIG = {
    ip: "95.173.173.31",
    port: 27015,
    channelId: "1508144741538201804",
    prefix: "." // Komut ön eki
};

let messageId = null;

// Eklentiden gelecek verileri tutacağımız hafıza
let serverData = {
    online: false,
    players: "0 / 0",
    map: "YOK"
};

// —— Discord Bot İstemcisi ——
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent 
    ]
});

// —— AMXX Eklentisinden Gelen Veriyi Yakalayan Kulak (API) ——
app.get("/status", async (req, res) => {
    const { map, players, max } = req.query;

    if (!map || !players || !max) {
        return res.status(400).send("Eksik veri gönderildi.");
    }

    // Eklentiden gelen verileri hafızaya kaydet (Valorant mod rank sistemin falan sunucuyu yormadan bota aksın)
    serverData = {
        online: true,
        players: `${players} / ${max}`,
        map: map.toUpperCase()
    };

    // Veri geldiği an Discord embed'ini güncelle
    await updateDiscordEmbed();

    res.status(200).send("Veri alindi, Discord guncellendi!");
});

// Render'da botun ayakta kalması ve verileri dinlemesi için portu aç
app.listen(3000, () => console.log("Web API portu aktif (3000). Eklentiden veri bekleniyor..."));

// —— Embed Oluşturucu ——
function createEmbed() {
    return new EmbedBuilder()
        .setColor(serverData.online ? 0x00ff00 : 0xff0000)
        .setTitle("🦁 RAS GAMING • VALORANT MOD")
        .setThumbnail("https://i.imgur.com/BkAc3Yn.jpeg")
        .addFields(
            { 
                name: "📡 Durum", 
                value: serverData.online ? "<a:greenloading:1508152313087262982> **Sunucu Aktif**" : "🔴 **Veri Bekleniyor...**", 
                inline: true 
            },
            { name: "👥 Oyuncular", value: serverData.players, inline: true },
            { name: "🗺️ Harita", value: `\`${serverData.map}\`` },
            { name: "🔗 Bağlan", value: `[Sunucuya Katıl](steam://connect/${CONFIG.ip}:${CONFIG.port})` },
            { name: "💻 Konsol", value: `\`connect ${CONFIG.ip}:${CONFIG.port}\`` }
        )
        .setFooter({ text: "RAS Gaming • Oyun İçi Otomatik Güncelleme" })
        .setTimestamp();
}

// —— Discord Mesaj Güncelleme Fonksiyonu ——
async function updateDiscordEmbed() {
    try {
        const channel = await client.channels.fetch(CONFIG.channelId).catch(() => null);
        if (!channel) return;

        const embed = createEmbed();

        if (!messageId) {
            // Hiç mesaj yoksa yeni gönder
            const msg = await channel.send({ embeds: [embed] });
            messageId = msg.id;
        } else {
            // Eski mesajı bul ve düzenle
            const msg = await channel.messages.fetch(messageId).catch(() => null);
            if (msg) {
                await msg.edit({ embeds: [embed] });
            } else {
                // Eski mesaj silinmişse yeni baştan gönder
                const newMsg = await channel.send({ embeds: [embed] });
                messageId = newMsg.id;
            }
        }
    } catch (err) {
        console.error("Discord güncellenirken hata oluştu:", err);
    }
}

// —— Bot Eventleri ——
client.once("ready", () => {
    console.log(`Bot giriş yaptı: ${client.user.tag}`);
    console.log(`Komut Prefixi: ${CONFIG.prefix}`);
});

// —— Manuel .yenile Komutu ——
client.on("messageCreate", async (message) => {
    // Botları ve prefix ile başlamayan mesajları yok say
    if (message.author.bot || !message.content.startsWith(CONFIG.prefix)) return;

    const command = message.content.slice(CONFIG.prefix.length).trim().toLowerCase();

    if (command === "yenile") {
        await updateDiscordEmbed();
        
        // Komutu kullanan kişinin mesajını sil
        await message.delete().catch(() => null);
        
        // Eski mesajı silip en alta yenisini göndermek istersen:
        const channel = message.channel;
        if (messageId) {
             const oldMsg = await channel.messages.fetch(messageId).catch(() => null);
             if (oldMsg) await oldMsg.delete().catch(() => null);
        }
        const newMsg = await channel.send({ embeds: [createEmbed()] });
        messageId = newMsg.id;

        // Geri bildirim ver ve 3 saniye sonra onu da sil
        const reply = await message.reply("✅ Embed paneli manuel olarak tetiklendi.");
        setTimeout(() => {
            reply.delete().catch(() => null);
        }, 3000);
    }
});

// Botu başlat
client.login(process.env.DISCORD_TOKEN);
