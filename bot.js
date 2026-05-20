const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    PermissionsBitField
} = require('discord.js');

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration
    ]
});

// ================= AYARLAR =================

const TOKEN = "..";
const OWNER_ID = "970622873431601172";
const GUILD_ID = "1337903502944636959";

// Komut kullanabilecek roller
const ALLOWED_ROLES = [
    "1506422575352254575",
    "1337924532735967293"
];

// Küfür sistemi
const warningSystem = new Map();

// Bot aktif/pasif
let botActive = true;

// ===========================================

client.once('ready', async () => {

    console.log(`✅ ${client.user.tag} aktif!`);

    const guild = client.guilds.cache.get(GUILD_ID);

    if (!guild) {
        return console.log("❌ Sunucu bulunamadı!");
    }
// ================= PARTNER BUTTON =================

client.on('messageCreate', async message => {

    if (message.author.bot) return;

    // Sadece owner kullanabilsin
    if (message.content === '!partnerpanel') {

        if (message.author.id !== OWNER_ID) {
            return;
        }

        const button = new ButtonBuilder()
            .setCustomId('partner_role')
            .setLabel('✅ Partner Rolünü Al')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder()
            .addComponents(button);

        await message.channel.send({
            content: '📢 Partnerliği görmek istiyorsan aşağıdaki butona bas!',
            components: [row]
        });
    }
});
// ================= PARTNER ROLE =================

client.on('interactionCreate', async interaction => {

    if (!interaction.isButton()) return;

    if (interaction.customId === 'partner_role') {

        const roleId = "1506492222118563851";

        const member = interaction.member;

        // Rol varsa kaldır
        if (member.roles.cache.has(roleId)) {

            await member.roles.remove(roleId);

            return interaction.reply({
                content: '❌ Partner rolün kaldırıldı!',
                ephemeral: true
            });
        }

        // Rol ver
        await member.roles.add(roleId);

        return interaction.reply({
            content: '✅ Partner rolü verildi!',
            ephemeral: true
        });
    }
});
// ================= PARTNER PANEL =================

client.on('messageCreate', async message => {

    if (message.author.bot) return;

    if (message.content === '!partnerpanel') {

        // Sadece owner kullanabilsin
        if (message.author.id !== OWNER_ID) {
            return;
        }

        // EMBED PANEL
        const embed = new EmbedBuilder()
            .setColor('#111827')
            .setTitle('📢 Partner Kanalı Erişimi')
            .setDescription(
                '### Partnerliği görmek istiyorsan aşağıdaki butona bas!\n\n' +
                '> ✅ Butona bastığında otomatik olarak partner rolünü alırsın.'
            )
            .addFields(
                {
                    name: '🎁 Avantajlar',
                    value:
                        '• Partner kanalını görürsün\n' +
                        '• Reklam paylaşabilirsin\n' +
                        '• Partner duyurularını alırsın',
                    inline: false
                }
            )
            .setFooter({
                text: 'Zenith Partner Sistemi'
            });

        // BUTON
        const button = new ButtonBuilder()
            .setCustomId('partner_role')
            .setLabel('Partner Rolünü Al')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder()
            .addComponents(button);

        // PANELİ GÖNDER
        await message.channel.send({
            embeds: [embed],
            components: [row]
        });
    }
});
    // ================= MUTE =================

    await guild.commands.create(
        new SlashCommandBuilder()
            .setName('mute')
            .setDescription('Kullanıcıyı mute atar')
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('Mute atılacak kişi')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription('Mute nedeni')
                    .setRequired(false)
            )
            .addIntegerOption(option =>
                option
                    .setName('duration')
                    .setDescription('Süre (dakika)')
                    .setRequired(false)
                    .setMinValue(1)
                    .setMaxValue(1440)
            )
    );

    // ================= UNMUTE =================

    await guild.commands.create(
        new SlashCommandBuilder()
            .setName('unmute')
            .setDescription('Kullanıcının mutesini kaldırır')
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('Mute kaldırılacak kişi')
                    .setRequired(true)
            )
    );

    // ================= BAN =================

    await guild.commands.create(
        new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Kullanıcıyı banlar')
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('Banlanacak kişi')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription('Ban nedeni')
                    .setRequired(false)
            )
    );

    // ================= UNBAN =================

    await guild.commands.create(
        new SlashCommandBuilder()
            .setName('unban')
            .setDescription('Kullanıcının banını kaldırır')
            .addStringOption(option =>
                option
                    .setName('userid')
                    .setDescription('Banı kaldırılacak kişinin IDsi')
                    .setRequired(true)
            )
    );

    console.log("✅ Slash komutları yüklendi!");
});

// ================= SLASH KOMUTLARI =================

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (!botActive) {
        return interaction.reply({
            content: "⛔ Bot pasif durumda!",
            ephemeral: true
        });
    }

    const hasRole = interaction.member.roles.cache.some(role =>
        ALLOWED_ROLES.includes(role.id)
    );

    if (!hasRole) {
        return interaction.reply({
            content: "❌ Yetkin yok!",
            ephemeral: true
        });
    }

    // ================= MUTE =================

    if (interaction.commandName === 'mute') {

        await interaction.deferReply();

        try {

            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'Belirtilmedi';
            const duration = interaction.options.getInteger('duration') || 10;

            const member = await interaction.guild.members.fetch(user.id);

            await member.timeout(duration * 60 * 1000, reason);

            await interaction.editReply({
                content: `✅ ${user.tag} ${duration} dakika mute edildi!`
            });

        } catch (err) {

            console.error(err);

            await interaction.editReply({
                content: "❌ Hata oluştu!"
            });
        }
    }

    // ================= UNMUTE =================

    if (interaction.commandName === 'unmute') {

        await interaction.deferReply();

        try {

            const user = interaction.options.getUser('user');

            const member = await interaction.guild.members.fetch(user.id);

            await member.timeout(null);

            await interaction.editReply({
                content: `✅ ${user.tag} kullanıcısının mutesi kaldırıldı!`
            });

        } catch (err) {

            console.error(err);

            await interaction.editReply({
                content: "❌ Hata oluştu!"
            });
        }
    }

    // ================= BAN =================

    if (interaction.commandName === 'ban') {

        await interaction.deferReply();

        try {

            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'Belirtilmedi';

            const member = await interaction.guild.members.fetch(user.id);

            await member.ban({ reason });

            await interaction.editReply({
                content: `🔨 ${user.tag} banlandı!`
            });

        } catch (err) {

            console.error(err);

            await interaction.editReply({
                content: "❌ Hata oluştu!"
            });
        }
    }

    // ================= UNBAN =================

    if (interaction.commandName === 'unban') {

        await interaction.deferReply();

        try {

            const userId = interaction.options.getString('userid');

            await interaction.guild.members.unban(userId);

            await interaction.editReply({
                content: `✅ ${userId} IDli kullanıcının banı kaldırıldı!`
            });

        } catch (err) {

            console.error(err);

            await interaction.editReply({
                content: "❌ Hata oluştu!"
            });
        }
    }
});

// ================= MESSAGE KOMUTLARI =================

client.on('messageCreate', async message => {

    if (message.author.bot) return;

    // ================= KUFUR SISTEMI =================

    const badWords = [
        "mal",
        "salak",
        "aptal",
        "oç",
        "orospu",
        "piç",
        "amk"
    ];

    const foundBadWord = badWords.some(word =>
        message.content.toLowerCase().includes(word)
    );

    if (foundBadWord) {

        const member = message.member;

        if (!member) return;

        if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return;
        }

        const userId = member.id;

        let data = warningSystem.get(userId);

        const now = Date.now();

        if (data && now > data.resetTime) {
            data = null;
        }

        if (!data) {

            data = {
                minutes: 5,
                resetTime: now + (3 * 24 * 60 * 60 * 1000)
            };

        } else {

            data.minutes += 5;
        }

        warningSystem.set(userId, data);

        await message.delete().catch(() => {});

        await member.timeout(
            data.minutes * 60 * 1000,
            "Küfür / Hakaret"
        );

        await member.send(
            `🚫 KÜFÜR SUNUCUMUZDA YASAK DOSTUM!\n⛔ Ceza Süren: ${data.minutes} dakika`
        ).catch(() => {});

        return message.channel.send(
            `⛔ ${member.user.tag} ${data.minutes} dakika mute yedi!`
        );
    }

    // ================= AGONY =================

    if (message.content === '!agony') {
        return message.reply('BiDahAOlmAsIN');
    }

    // ================= STOP =================

    if (message.content === '!stop') {

        if (message.author.id !== OWNER_ID) {
            return;
        }

        botActive = false;

        return message.reply('⛔ Bot pasif moda alındı!');
    }

    // ================= ACTIVE =================

    if (message.content === '!active') {

        if (message.author.id !== OWNER_ID) {
            return;
        }

        botActive = true;

        return message.reply('✅ Bot tekrar aktif edildi!');
    }

    // ================= YAZ =================

    if (message.content.startsWith('!yaz')) {

        if (message.author.id !== OWNER_ID) {
            return;
        }

        await message.delete().catch(() => {});

        const mentionedUser = message.mentions.users.first();

        let fullText = message.content.slice(5).trim();

        // Reply sistemi
        if (
            mentionedUser &&
            (
                fullText.startsWith(`<@${mentionedUser.id}>`) ||
                fullText.startsWith(`<@!${mentionedUser.id}>`)
            )
        ) {

            let text = fullText
                .replace(/<@!?\d+>/, '')
                .trim();

            const messages = await message.channel.messages.fetch({ limit: 20 });

            const targetMessage = messages.find(
                msg =>
                    msg.author.id === mentionedUser.id
            );

            if (!targetMessage) return;

            return targetMessage.reply(text);
        }

        // Normal bot mesajı
        return message.channel.send(fullText);
    }
});

client.login(TOKEN);