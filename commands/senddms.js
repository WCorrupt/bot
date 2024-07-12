const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { exec } = require('child_process');
const fs = require('fs');

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

module.exports = {
    data: new SlashCommandBuilder()
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
                .setDescription('Custom hex code color for the embed'))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction, selectedRole, roleDataFile, reactionRoleDataFile, activityDataFile, mainClient, adminUserId, testTokens) {
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
    },
};