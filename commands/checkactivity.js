const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkactivity')
        .setDescription('Check activity of users with the selected role')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction, selectedRole, roleDataFile, reactionRoleDataFile, activityDataFile, mainClient) {
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

        const activityData = { pending: [], checkedIn: [] };

        roleMembers.forEach(member => {
            const embed = new EmbedBuilder()
                .setTitle('Activity Check')
                .setDescription('Please confirm your activity by clicking the button below.')
                .setColor('#FFA500');

            const button = new ButtonBuilder()
                .setCustomId(`activityCheck_${member.id}`)
                .setLabel('Check In')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            member.send({ embeds: [embed], components: [row] })
                .then(message => {
                    activityData.pending.push(message.id);
                })
                .catch(error => {
                    console.error(`Could not send DM to ${member.user.tag}:`, error);
                });
        });

        fs.writeFileSync(activityDataFile, JSON.stringify(activityData));

        await interaction.reply({ content: `Activity check initiated for ${roleMembers.size} members.`, ephemeral: true });
    },
};