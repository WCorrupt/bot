const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('activitystatus')
        .setDescription('Show the status of users who responded to activity check')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction, selectedRole, roleDataFile, reactionRoleDataFile, activityDataFile, mainClient) {
        let activityData = { pending: [], checkedIn: [] };

        if (fs.existsSync(activityDataFile)) {
            try {
                activityData = JSON.parse(fs.readFileSync(activityDataFile, 'utf8'));
            } catch (err) {
                console.error('Error reading activityData.json:', err);
            }
        }

        const pendingUsers = activityData.pending;
        const checkedInUsers = activityData.checkedIn;

        const maxEmbedDescriptionLength = 4096;
        let statusText = `**Pending Users:**\n${pendingUsers.join('\n')}\n\n**Checked In Users:**\n${checkedInUsers.join('\n')}`;
        const statusChunks = statusText.match(new RegExp(`.{1,${maxEmbedDescriptionLength}}`, 'g'));

        await interaction.reply({ content: 'Sending activity status via DM.', ephemeral: true });

        try {
            const adminUser = await mainClient.users.fetch(adminUserId);

            for (const chunk of statusChunks) {
                const statusEmbed = new EmbedBuilder()
                    .setTitle('Activity Status')
                    .setDescription(chunk)
                    .setColor('#FF0000');
                await adminUser.send({ embeds: [statusEmbed] });
            }
        } catch (error) {
            console.error(`Could not send status to admin: ${error}`);
        }
    },
};