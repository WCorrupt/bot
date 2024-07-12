const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('activity')
        .setDescription('Assign a role to users who did not respond to activity check')
        .addStringOption(option =>
            option.setName('roleid')
                .setDescription('The role ID to assign to inactive users')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction, selectedRole, roleDataFile, reactionRoleDataFile, activityDataFile) {
        const roleId = interaction.options.getString('roleid');
        const guild = interaction.guild;
        let activityData = { pending: [], checkedIn: [] };

        if (fs.existsSync(activityDataFile)) {
            try {
                activityData = JSON.parse(fs.readFileSync(activityDataFile, 'utf8'));
            } catch (err) {
                console.error('Error reading activityData.json:', err);
            }
        }

        const inactiveUsers = activityData.pending.filter(id => !activityData.checkedIn.includes(id));
        const role = guild.roles.cache.get(roleId);

        if (!role) {
            await interaction.reply({ content: 'Invalid role ID.', ephemeral: true });
            return;
        }

        inactiveUsers.forEach(async userId => {
            const member = await guild.members.fetch(userId);
            if (member) {
                await member.roles.add(role);
            }
        });

        await interaction.reply({ content: `Assigned role to ${inactiveUsers.length} inactive users.`, ephemeral: true });
    },
};
