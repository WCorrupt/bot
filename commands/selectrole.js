const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('selectrole')
        .setDescription('Select a role to send DMs to')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to send DMs to')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction, selectedRole, roleDataFile) {
        selectedRole = interaction.options.getRole('role');
        fs.writeFileSync(roleDataFile, JSON.stringify({ roleId: selectedRole.id }));
        await interaction.reply({ content: `Selected role: ${selectedRole.name}`, ephemeral: true });
    },
};
