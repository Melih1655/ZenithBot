const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    PermissionsBitField,
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

const TOKEN = process.env.TOKEN;

const OWNER_ID = "970622873431601172";
const GUILD_ID = "1337903502944636959";

// Yetkili roller
const ALLOWED_ROLES = [
    "1506422575352254575",
    "1337924532735967293"
];

// Partner rol ID
const PARTNER_ROLE_ID = "1506492222118563851";

// Küfür sistemi
const warningSystem = new Map();

// Bot aktif/pasif
let botActive = true;

// ===========================================
// READY
// ===========================================

client.once('ready', async () => {

    console.log(`✅ ${client.user.tag} aktif!`);

    const guild = client.guilds.cache.get(GUILD_ID);

    if (!guild) {
        return console.log("❌ Sunucu bulunamadı!");
    }

    // Slash komutları temizle
    await guild.commands.set([]);

    // ================= MUTE =================

    await guild.commands.create(
        new SlashCommandBuilder()
            .setName('mute')
            .setDescription('Kullanıcıyı mute eder')
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('Mute atılacak kişi')
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option
                    .setName('duration')
                    .setDescription('Süre (dakika)')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription('Mute nedeni')
                    .setRequired(false)
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
            .setDescription('Ban kaldırır')
            .addStringOption(option =>
                option
                    .setName('userid')
                    .setDescription('Kullanıcı ID')
                    .setRequired(true)
            )
    );

    console.log("✅ Slash komutları yüklendi!");
});

// ===========================================
// SLASH KOMUTLARI
// ===========================================

client.on('interactionCreate', async interaction => {

    // ================= PARTNER BUTTON =================

    if (interaction.isButton()) {

        if (interaction.customId === 'partner_role') {

            const member = interaction.member;

            if (member.roles.cache.has(PARTNER_ROLE_ID)) {

                await member.roles.remove(PARTNER_ROLE_ID);

                return interaction.reply({
                    content: '❌ Partner rolün kaldırıldı!',
                    ephemeral: true
                });
            }

            await member.roles.add(PARTNER_ROLE_ID);

            return interaction.reply({
                content: '✅ Partner rolü verildi!',
                ephemeral: true
            });
        }
    }

    // Slash değilse çık
    if (!interaction.isChatInputCommand()) return;

    // Bot pasif mi?
    if (!botActive) {

        return interaction.reply({
            content: "⛔ Bot pasif durumda!",
            ephemeral: true
        });
    }

    // Yetki kontrolü
    const hasRole = interaction.member.roles.cache.some(role =>
        ALLOWED_ROLES.includes(role.id)
    );

    if (!hasRole) {

        return interaction.reply({
            content: "❌ Bu komutu kullanamazsın!",
            ephemeral: true
        });
    }

    // ===========================================
    // MUTE
    // ===========================================

    if (interaction.commandName === 'mute') {

        await interaction.deferReply();

        try {

            const user = interaction.options.getUser('user');
            const duration = interaction.options.getInteger('duration');
            const reason =
                interaction.options.getString('reason') || 'Belirtilmedi';

            const member =
                await interaction.guild.members.fetch(user.id);

            // Yönetici koruması
            if (
                member.permissions.has(
                    PermissionsBitField.Flags.Administrator
                )
            ) {

                return interaction.editReply({
                    content: '❌ Yönetici mute edilemez!'
                });
            }

            await member.timeout(
                duration * 60 * 1000,
                reason
            );

            await interaction.editReply({
                content:
                    `✅ ${user.tag} ${duration} dakika mute edildi!\n` +
                    `📝 Sebep: ${reason}`
            });

        } catch (err) {

            console.error(err);

            interaction.editReply({
                content: '❌ Hata oluştu!'
            });
        }
    }

    // ===========================================
    // UNMUTE
    // ===========================================

    if (interaction.commandName === 'unmute') {

        await interaction.deferReply();

        try {

            const user = interaction.options.getUser('user');

            const member =
                await interaction.guild.members.fetch(user.id);

            await member.timeout(null);

            await interaction.editReply({
                content:
                    `✅ ${user.tag} kullanıcısının mutesi kaldırıldı!`
            });

        } catch (err) {

            console.error(err);

            interaction.editReply({
                content: '❌ Hata oluştu!'
            });
        }
    }

    // ===========================================
    // BAN
    // ===========================================

    if (interaction.commandName === 'ban') {

        await interaction.deferReply();

        try {

            const user = interaction.options.getUser('user');

            const reason =
                interaction.options.getString('reason') || 'Belirtilmedi';

            const member =
                await interaction.guild.members.fetch(user.id);

            // Yönetici koruması
            if (
                member.permissions.has(
                    PermissionsBitField.Flags.Administrator
                )
            ) {

                return interaction.editReply({
                    content: '❌ Yönetici banlanamaz!'
                });
            }

            await member.ban({ reason });

            await interaction.editReply({
                content:
                    `🔨 ${user.tag} banlandı!\n` +
                    `📝 Sebep: ${reason}`
            });

        } catch (err) {

            console.error(err);

            interaction.editReply({
                content: '❌ Hata oluştu!'
            });
        }
    }

    // ===========================================
    // UNBAN
    // ===========================================

    if (interaction.commandName === 'unban') {

        await interaction.deferReply();

        try {

            const userId =
                interaction.options.getString('userid');

            await interaction.guild.members.unban(userId);

            await interaction.editReply({
                content:
                    `✅ ${userId} IDli kişinin banı kaldırıldı!`
            });

        } catch (err) {

            console.error(err);

            interaction.editReply({
                content: '❌ Hata oluştu!'
            });
        }
    }
});

// ===========================================
// MESSAGE KOMUTLARI
// ===========================================

client.on('messageCreate', async message => {

    if (message.author.bot) return;

    // ===========================================
    // PARTNER PANEL
    // ===========================================

    if (message.content === '!partnerpanel') {

        if (message.author.id !== OWNER_ID) return;

        const embed = new EmbedBuilder()
            .setColor('#111827')
            .setTitle('📢 Partner Kanalı Erişimi')
            .setDescription(
                '### Partnerliği görmek istiyorsan aşağıdaki butona bas!\n\n' +
                '> ✅ Butona bastığında otomatik partner rolü alırsın.'
            )
            .addFields({
                name: '🎁 Avantajlar',
                value:
                    '• Partner kanalını görürsün\n' +
                    '• Reklam paylaşabilirsin\n' +
                    '• Partner duyurularını alırsın'
            })
            .setFooter({
                text: 'Zenith Partner Sistemi'
            });

        const button = new ButtonBuilder()
            .setCustomId('partner_role')
            .setLabel('Partner Rolünü Al')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder()
            .addComponents(button);

        return message.channel.send({
            embeds: [embed],
            components: [row]
        });
    }

    // ===========================================
    // KÜFÜR SİSTEMİ
    // ===========================================

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

        // Yönetici koruması
        if (
            member.permissions.has(
                PermissionsBitField.Flags.Administrator
            )
        ) return;

        const userId = member.id;

        let data = warningSystem.get(userId);

        const now = Date.now();

        if (data && now > data.resetTime) {
            data = null;
        }

        if (!data) {

            data = {
                minutes: 5,
                resetTime:
                    now + (3 * 24 * 60 * 60 * 1000)
            };

        } else {

            data.minutes += 5;
        }

        warningSystem.set(userId, data);

        await message.delete().catch(() => {});

        await member.timeout(
            data.minutes * 60 * 1000,
            'Küfür / Hakaret'
        );

        await member.send(
            `🚫 SUNUCUMUZDA KÜFÜR YASAK!\n` +
            `⛔ Ceza Süresi: ${data.minutes} dakika`
        ).catch(() => {});

        return message.channel.send(
            `⛔ ${member.user.tag} ${data.minutes} dakika mute yedi!`
        );
    }

    // ===========================================
    // AGONY
    // ===========================================

    if (message.content === '!agony') {

        return message.reply('BiDahAOlmAsIN');
    }

    // ===========================================
    // STOP
    // ===========================================

    if (message.content === '!stop') {

        if (message.author.id !== OWNER_ID) return;

        botActive = false;

        return message.reply(
            '⛔ Bot pasif moda alındı!'
        );
    }

    // ===========================================
    // ACTIVE
    // ===========================================

    if (message.content === '!active') {

        if (message.author.id !== OWNER_ID) return;

        botActive = true;

        return message.reply(
            '✅ Bot tekrar aktif edildi!'
        );
    }

    // ===========================================
    // YAZ
    // ===========================================

    if (message.content.startsWith('!yaz')) {

        if (message.author.id !== OWNER_ID) return;

        await message.delete().catch(() => {});

        const text =
            message.content.slice(5).trim();

        if (!text) return;

        return message.channel.send(text);
    }
});

// ===========================================
// LOGIN
// ===========================================

client.login(TOKEN);
