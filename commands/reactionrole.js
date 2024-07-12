const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
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
                    { name: 'Red', value: '#FF0000' },
                    { name: 'Blue', value: '#0000FF' },
                    { name: 'Green', value: '#00FF00' },
                    { name: 'Yellow', value: '#FFFF00' },
                    { name: 'Purple', value: '#800080' },
                    { name: 'Black', value: '#000000' },
                    { name: 'White', value: '#FFFFFF' },
                    { name: 'Orange', value: '#FFA500' },
                    { name: 'Pink', value: '#FFC0CB' },
                    { name: 'Cyan', value: '#00FFFF' }
                ))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction, selectedRole, roleDataFile, reactionRoleDataFile, mainClient) {
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
    },
};
