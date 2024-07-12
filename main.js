const { Client, GatewayIntentBits, REST, Routes, PermissionsBitField } = require('discord.js');
const { token, adminUserId, testTokens } = require('./config.json');
const fs = require('fs');
const path = require('path');

const mainClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildScheduledEvents
    ]
});

let selectedRole = null;
const roleDataFile = './selectedRole.json';
const reactionRoleDataFile = './reactionRoleData.json';
const activityDataFile = './activityData.json';

if (fs.existsSync(roleDataFile)) {
    const data = fs.readFileSync(roleDataFile, 'utf8');
    const parsedData = JSON.parse(data);
    selectedRole = parsedData.roleId ? { id: parsedData.roleId } : null;
}

mainClient.commands = new Map();

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
    mainClient.commands.set(command.data.name, command);
}

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

    const command = mainClient.commands.get(interaction.commandName);

    if (command) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }

        try {
            await command.execute(interaction, selectedRole, roleDataFile, reactionRoleDataFile, activityDataFile, mainClient, adminUserId, testTokens);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    } else if (interaction.isButton()) {
        // Handle button interactions for reaction roles and activity check-ins
        const customId = interaction.customId;

        if (customId.startsWith('toggleRole_')) {
            if (fs.existsSync(reactionRoleDataFile)) {
                let reactionRoleData;
                try {
                    reactionRoleData = JSON.parse(fs.readFileSync(reactionRoleDataFile, 'utf8'));
                } catch (err) {
                    console.error('Error reading reactionRoleData.json:', err);
                    return;
                }
                const data = reactionRoleData[interaction.message.id];
                if (data && customId === `toggleRole_${data.roleId}`) {
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
        } else if (customId.startsWith('activityCheck_')) {
            const messageId = customId.split('_')[1];
            let activityData = { pending: [], checkedIn: [] };

            if (fs.existsSync(activityDataFile)) {
                try {
                    activityData = JSON.parse(fs.readFileSync(activityDataFile, 'utf8'));
                } catch (err) {
                    console.error('Error reading activityData.json:', err);
                }
            }

            if (activityData.pending.includes(messageId)) {
                activityData.pending = activityData.pending.filter(id => id !== messageId);
                if (!activityData.checkedIn.includes(interaction.user.id)) {
                    activityData.checkedIn.push(interaction.user.id);
                }
                fs.writeFileSync(activityDataFile, JSON.stringify(activityData));
                await interaction.reply({ content: 'You have checked in for activity.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'This activity check-in is no longer valid.', ephemeral: true });
            }
        }
    }
});

mainClient.login(token);
