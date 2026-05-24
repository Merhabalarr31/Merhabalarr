require("dotenv").config(); // Çevresel değişkenleri (.env) kullanmak için
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require("discord.js");
const Gamedig = require("gamedig");
const express = require("express");

// —— Express - Render botu ayakta tutsun ——
const app = express();
app.get("/", (_, res) => res.send("RAS Gaming bot aktif!"));
app.listen(3000, () => console.log("Web sunucusu 3000 portunda dinleniyor."));

// —— Sunucu ve Bot Ayarları ——
const CONFIG = {
    ip: "95.173.173.31",
    port: 27015,
    channelId: "1508144741538201804",
    updateInterval: 30000 // 30 saniye (API banı yememek için önerilen süre)
};

let messageId = null;

// —— Discord Bot İstemcisi ——
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// —— Slash Komutları ——
const commands = [
    new SlashCommandBuilder()
        .setName("yenile")
        .setDescription("Sunucu durum embed mesajını silip yeniden gönderir."),
];

// —— Sunucu Sorgusu ——
async function getServerInfo() {
    try {
        const state = await Gamedig.query({
            type: "cs16",
            host: CONFIG.ip,
            port: CONFIG.port,
            maxAttempts: 3 // Sunucu yanıt vermezse 3 kez dener
        });

        return {
            online: true,
            players: `${state.players.length} / ${state.maxplayers}`,
            map: state.map
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
            { name: "🔗 Bağlan", value: `[Sunucuya Katıl](steam://connect/${CONFIG.ip}:${CONFIG.port})` },
            { name: "💻 Konsol ile giriş", value: `\`connect ${CONFIG.ip}:${CONFIG.port}\`` }
        )
        .setFooter({ text: "RAS Gaming • Otomatik Güncelleme" })
        .setTimestamp();
}

// —— Embed Güncelleme Döngüsü ——
async function statusLoop() {
    try {
        const channel = await client.channels.fetch(CONFIG.channelId);

        setInterval(async () => {
            const info = await getServerInfo();
            const embed = createEmbed(info);

            try {
                if (!messageId) {
                    // İlk kez gönderiliyorsa veya eski mesaj silinmişse
                    const msg = await channel.send({ embeds: [embed] });
                    messageId = msg.id;
                } else {
                    // Mevcut mesajı güncelle
                    const msg = await channel.messages.fetch(messageId);
                    await msg.edit({ embeds: [embed] });
                }
            } catch (err) {
                // Mesaj bulunamadı hatası (Biri kanaldaki mesajı silmiş olabilir)
                // ID'yi sıfırlıyoruz ki bir sonraki döngüde yeniden göndersin
                console.log("Mesaj güncellenemedi, silinmiş olabilir. Yenisi oluşturulacak.");
                messageId = null; 
            }
        }, CONFIG.updateInterval);

    } catch (err) {
        console.error("Kanal bulunamadı, channelId ayarını kontrol edin:", err);
    }
}

// —— Bot Eventleri ——
client.once("ready", async () => {
    console.log("Bot aktif:", client.user.tag);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

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

    // Döngüyü başlat
    statusLoop();
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "yenile") {
        // İşlem uzun sürerse timeout yememek için deferReply kullanıyoruz
        await interaction.deferReply({ ephemeral: true });

        try {
            const channel = await client.channels.fetch(CONFIG.channelId);
            const info = await getServerInfo();
            const embed = createEmbed(info);

            // Eski mesaj varsa sil
            if (messageId) {
                try {
                    const msg = await channel.messages.fetch(messageId);
                    await msg.delete();
                } catch (e) {
                    console.log("Eski mesaj zaten silinmiş.");
                }
            }

            // Yeniden gönder ve ID'yi kaydet
            const newMsg = await channel.send({ embeds: [embed] });
            messageId = newMsg.id;

            await interaction.editReply({ content: "Sunucu durum mesajı başarıyla yenilendi!" });
        } catch (err) {
            console.error("Yenileme komutunda hata:", err);
            await interaction.editReply({ content: "Mesaj yenilenirken bir hata oluştu." });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
