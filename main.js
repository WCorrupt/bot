const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { exec } = require('child_process');
const { token, adminUserId, testTokens } = require('./config.json');
const fs = require('fs');

const mainClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildScheduledEvents  // Add this intent
    ]
});

let selectedRole = null;
const roleDataFile = './selectedRole.json';
const reactionRoleDataFile = './reactionRoleData.json';

if (fs.existsSync(roleDataFile)) {
    const data = fs.readFileSync(roleDataFile, 'utf8');
    const parsedData = JSON.parse(data);
    selectedRole = parsedData.roleId ? { id: parsedData.roleId } : null;
}

const colors = {
    red: '#FF0000',
    blue: '#0000FF',
    green: '#00FF00',
    yellow: '#FFFF00',
    purple: '#800080',
    black: '#000000',
    white: '#FFFFFF',
    orange: '#FFA500',
    pink: '#FFC0CB',
    cyan: '#00FFFF'
};

const commands = [
    new SlashCommandBuilder()
        .setName('selectrole')
        .setDescription('Select a role to send DMs to')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to send DMs to')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('senddms')
        .setDescription('Send DMs to users with the selected role')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message content')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('embed')
                .setDescription('Send the message as an embed'))
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the embed'))
        .addStringOption(option =>
            option.setName('author')
                .setDescription('The author of the embed'))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('The color of the embed')
                .addChoices(
                    { name: 'Red', value: colors.red },
                    { name: 'Blue', value: colors.blue },
                    { name: 'Green', value: colors.green },
                    { name: 'Yellow', value: colors.yellow },
                    { name: 'Purple', value: colors.purple },
                    { name: 'Black', value: colors.black },
                    { name: 'White', value: colors.white },
                    { name: 'Orange', value: colors.orange },
                    { name: 'Pink', value: colors.pink },
                    { name: 'Cyan', value: colors.cyan }
                ))
        .addStringOption(option =>
            option.setName('thumbnail')
                .setDescription('The thumbnail URL of the embed'))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('The image URL of the embed'))
        .addStringOption(option =>
            option.setName('footer')
                .setDescription('The footer of the embed'))
        .addStringOption(option =>
            option.setName('customcolor')
                .setDescription('Custom hex code color for the embed')),
    new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Create a reaction role message')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to be toggled')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('text')
                .setDescription('The custom text for the embed'))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('The custom color for the embed')
                .addChoices(
                    { name: 'Red', value: colors.red },
                    { name: 'Blue', value: colors.blue },
                    { name: 'Green', value: colors.green },
                    { name: 'Yellow', value: colors.yellow },
                    { name: 'Purple', value: colors.purple },
                    { name: 'Black', value: colors.black },
                    { name: 'White', value: colors.white },
                    { name: 'Orange', value: colors.orange },
                    { name: 'Pink', value: colors.pink },
                    { name: 'Cyan', value: colors.cyan }
                )),
    new SlashCommandBuilder()
        .setName('eventdm')
        .setDescription('Send DMs to users with the selected role who haven\'t RSVP\'d to the event')
        .addStringOption(option =>
            option.setName('eventid')
                .setDescription('The ID of the event')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message content')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('embed')
                .setDescription('Send the message as an embed'))
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the embed'))
        .addStringOption(option =>
            option.setName('author')
                .setDescription('The author of the embed'))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('The color of the embed')
                .addChoices(
                    { name: 'Red', value: colors.red },
                    { name: 'Blue', value: colors.blue },
                    { name: 'Green', value: colors.green },
                    { name: 'Yellow', value: colors.yellow },
                    { name: 'Purple', value: colors.purple },
                    { name: 'Black', value: colors.black },
                    { name: 'White', value: colors.white },
                    { name: 'Orange', value: colors.orange },
                    { name: 'Pink', value: colors.pink },
                    { name: 'Cyan', value: colors.cyan }
                ))
        .addStringOption(option =>
            option.setName('thumbnail')
                .setDescription('The thumbnail URL of the embed'))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('The image URL of the embed'))
        .addStringOption(option =>
            option.setName('footer')
                .setDescription('The footer of the embed'))
        .addStringOption(option =>
            option.setName('customcolor')
                .setDescription('Custom hex code color for the embed'))
].map(command => command.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator).toJSON());

mainClient.once('ready', async () => {
    console.log(`Logged in as ${mainClient.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(mainClient.user.id),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

mainClient.on('interactionCreate', async interaction => {
    if (!interaction.isCommand() && !interaction.isButton()) return;

    if (interaction.isCommand()) {
        const { commandName } = interaction;

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }

        if (commandName === 'selectrole') {
            selectedRole = interaction.options.getRole('role');
            fs.writeFileSync(roleDataFile, JSON.stringify({ roleId: selectedRole.id }));
            await interaction.reply({ content: `Selected role: ${selectedRole.name}`, ephemeral: true });
        } else if (commandName === 'senddms') {
            if (!selectedRole) {
                await interaction.reply({ content: 'No role selected. Use /selectrole to select a role first.', ephemeral: true });
                return;
            }

            const members = await interaction.guild.members.fetch();
            const roleMembers = members.filter(member => member.roles.cache.has(selectedRole.id) && !member.user.bot);

            if (roleMembers.size === 0) {
                await interaction.reply({ content: 'No non-bot members found with the selected role.', ephemeral: true });
                return;
            }

            const message = interaction.options.getString('message').replace(/\|/g, '\n');
            const useEmbed = interaction.options.getBoolean('embed');
            const title = interaction.options.getString('title');
            const author = interaction.options.getString('author');
            const color = interaction.options.getString('color') || interaction.options.getString('customcolor');
            const thumbnail = interaction.options.getString('thumbnail');
            const image = interaction.options.getString('image');
            const footer = interaction.options.getString('footer');

            const roleMembersArray = Array.from(roleMembers.values());
            const numBots = testTokens.length;
            const chunkSize = Math.ceil(roleMembersArray.length / numBots);
            const chunks = Array.from({ length: numBots }, (_, i) =>
                roleMembersArray.slice(i * chunkSize, (i + 1) * chunkSize)
            );

            await interaction.reply({ content: `Sending DMs to ${roleMembersArray.length} members with the role ${selectedRole.name}.`, ephemeral: true });

            const summary = [];

            // Function to run a bot script
            function runBotScript(botIndex, chunk) {
                const chunkFile = `./manualBot${botIndex + 1}_chunk.json`;
                fs.writeFileSync(chunkFile, JSON.stringify(chunk.map(member => member.id)));
                const options = {
                    message,
                    useEmbed,
                    title,
                    author,
                    color,
                    thumbnail,
                    image,
                    footer
                };
                const optionsFile = `./manualBot${botIndex + 1}_options.json`;
                fs.writeFileSync(optionsFile, JSON.stringify(options));
                const command = `node manualBot${botIndex + 1}.js ${chunkFile} ${optionsFile}`;
                return new Promise((resolve, reject) => {
                    exec(command, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Error running manualBot${botIndex + 1}.js: ${error.message}`);
                            reject(error);
                        } else {
                            summary.push(stdout.trim());
                            resolve(stdout);
                        }
                    });
                });
            }

            // Run the bot scripts
            const dmPromises = chunks.map((chunk, index) => runBotScript(index, chunk));
            await Promise.all(dmPromises);

            // Send summary to admin
            try {
                const adminUser = await mainClient.users.fetch(adminUserId);
                const maxEmbedDescriptionLength = 4096;
                const summaryText = summary.join('\n');
                const summaryChunks = summaryText.match(new RegExp(`.{1,${maxEmbedDescriptionLength}}`, 'g'));

                for (let i = 0; i < summaryChunks.length; i += 40) {
                    const chunk = summaryChunks.slice(i, i + 40).join('\n');
                    const summaryEmbed = new EmbedBuilder()
                        .setTitle('DM Summary')
                        .setDescription(chunk)
                        .setColor('#FF0000');
                    await adminUser.send({ embeds: [summaryEmbed] });
                }
            } catch (error) {
                console.error(`Could not send summary to admin: ${error}`);
            }
        } else if (commandName === 'reactionrole') {
            const role = interaction.options.getRole('role');
            const customText = interaction.options.getString('text') || `Click the button below to toggle the ${role.name} role`;
            const customColor = interaction.options.getString('color') || '#FFFF00';

            const embed = new EmbedBuilder()
                .setTitle('Reaction Role')
                .setDescription(customText)
                .setColor(customColor);
            
            const button = new ButtonBuilder()
                .setCustomId(`toggleRole_${role.id}`)
                .setLabel('Toggle Role')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

            let reactionRoleData = {};
            if (fs.existsSync(reactionRoleDataFile)) {
                try {
                    reactionRoleData = JSON.parse(fs.readFileSync(reactionRoleDataFile, 'utf8'));
                } catch (err) {
                    console.error('Error reading reactionRoleData.json:', err);
                }
            }
            reactionRoleData[message.id] = { roleId: role.id };
            fs.writeFileSync(reactionRoleDataFile, JSON.stringify(reactionRoleData));
        } else if (commandName === 'eventdm') {
            if (!selectedRole) {
                await interaction.reply({ content: 'No role selected. Use /selectrole to select a role first.', ephemeral: true });
                return;
            }

            const eventId = interaction.options.getString('eventid');
            let event;
            try {
                event = await interaction.guild.scheduledEvents.fetch(eventId, { withUserCount: true });
            } catch (error) {
                console.error(`Could not fetch event: ${error}`);
                await interaction.reply({ content: 'Could not fetch event. Please check the event ID and try again.', ephemeral: true });
                return;
            }

            const reactedUsers = new Set();

            try {
                const attendees = await event.fetchSubscribers();
                attendees.forEach(user => reactedUsers.add(user.user.id));
            } catch (error) {
                console.error(`Could not fetch event attendees: ${error}`);
                await interaction.reply({ content: 'Could not fetch event attendees.', ephemeral: true });
                return;
            }

            const members = await interaction.guild.members.fetch();
            const roleMembers = members.filter(member => member.roles.cache.has(selectedRole.id) && !member.user.bot && !reactedUsers.has(member.id));

            if (roleMembers.size === 0) {
                await interaction.reply({ content: 'No non-bot members found with the selected role who haven\'t reacted to the event.', ephemeral: true });
                return;
            }

            const message = interaction.options.getString('message').replace(/\|/g, '\n');
            const useEmbed = interaction.options.getBoolean('embed');
            const title = interaction.options.getString('title');
            const author = interaction.options.getString('author');
            const color = interaction.options.getString('color') || interaction.options.getString('customcolor');
            const thumbnail = interaction.options.getString('thumbnail');
            const image = interaction.options.getString('image');
            const footer = interaction.options.getString('footer');

            const roleMembersArray = Array.from(roleMembers.values());
            const numBots = testTokens.length;
            const chunkSize = Math.ceil(roleMembersArray.length / numBots);
            const chunks = Array.from({ length: numBots }, (_, i) =>
                roleMembersArray.slice(i * chunkSize, (i + 1) * chunkSize)
            );

            await interaction.reply({ content: `Sending DMs to ${roleMembersArray.length} members with the role ${selectedRole.name} who haven't reacted to the event.`, ephemeral: true });

            const summary = [];

            // Function to run a bot script
            function runBotScript(botIndex, chunk) {
                const chunkFile = `./manualBot${botIndex + 1}_chunk.json`;
                fs.writeFileSync(chunkFile, JSON.stringify(chunk.map(member => member.id)));
                const options = {
                    message,
                    useEmbed,
                    title,
                    author,
                    color,
                    thumbnail,
                    image,
                    footer
                };
                const optionsFile = `./manualBot${botIndex + 1}_options.json`;
                fs.writeFileSync(optionsFile, JSON.stringify(options));
                const command = `node manualBot${botIndex + 1}.js ${chunkFile} ${optionsFile}`;
                return new Promise((resolve, reject) => {
                    exec(command, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Error running manualBot${botIndex + 1}.js: ${error.message}`);
                            reject(error);
                        } else {
                            summary.push(stdout.trim());
                            resolve(stdout);
                        }
                    });
                });
            }

            // Run the bot scripts
            const dmPromises = chunks.map((chunk, index) => runBotScript(index, chunk));
            await Promise.all(dmPromises);

            // Send summary to admin
            try {
                const adminUser = await mainClient.users.fetch(adminUserId);
                const maxEmbedDescriptionLength = 4096;
                const summaryText = summary.join('\n');
                const summaryChunks = summaryText.match(new RegExp(`.{1,${maxEmbedDescriptionLength}}`, 'g'));

                for (let i = 0; i < summaryChunks.length; i += 40) {
                    const chunk = summaryChunks.slice(i, i + 40).join('\n');
                    const summaryEmbed = new EmbedBuilder()
                        .setTitle('DM Summary')
                        .setDescription(chunk)
                        .setColor('#FF0000');
                    await adminUser.send({ embeds: [summaryEmbed] });
                }
            } catch (error) {
                console.error(`Could not send summary to admin: ${error}`);
            }
        }
    }

    if (interaction.isButton()) {
        if (fs.existsSync(reactionRoleDataFile)) {
            let reactionRoleData;
            try {
                reactionRoleData = JSON.parse(fs.readFileSync(reactionRoleDataFile, 'utf8'));
            } catch (err) {
                console.error('Error reading reactionRoleData.json:', err);
                return;
            }
            const data = reactionRoleData[interaction.message.id];
            if (data && interaction.customId === `toggleRole_${data.roleId}`) {
                const member = await interaction.guild.members.fetch(interaction.user.id);
                const role = interaction.guild.roles.cache.get(data.roleId);
                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    await interaction.reply({ content: `Removed role ${role.name}`, ephemeral: true });
                } else {
                    await member.roles.add(role);
                    await interaction.reply({ content: `Added role ${role.name}`, ephemeral: true });
                }
            }
        }
    }
});

mainClient.login(token);
