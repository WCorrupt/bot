const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { testTokens } = require('./config.json');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages] });

client.once('ready', async () => {
    console.log(`manualBot2 logged in as ${client.user.tag}`);

    const chunkFile = process.argv[2];
    const optionsFile = process.argv[3];
    const chunk = JSON.parse(fs.readFileSync(chunkFile, 'utf8'));
    const options = JSON.parse(fs.readFileSync(optionsFile, 'utf8'));

    const { message, useEmbed, title, author, color, thumbnail, image, footer } = options;
    const summary = [];

    for (const memberId of chunk) {
        try {
            const member = await client.users.fetch(memberId);

            if (useEmbed) {
                const embed = new EmbedBuilder().setDescription(message);

                if (title) embed.setTitle(title);
                if (author) embed.setAuthor({ name: author });
                if (color) embed.setColor(color);
                if (thumbnail) embed.setThumbnail(thumbnail);
                if (image) embed.setImage(image);
                if (footer) embed.setFooter({ text: footer });

                await member.send({ embeds: [embed] });
                console.log(`Sent embed DM to ${member.tag} using ${client.user.tag}`);
                summary.push(`Sent embed DM to ${member.tag} using ${client.user.tag}`);
            } else {
                await member.send(message);
                console.log(`Sent DM to ${member.tag} using ${client.user.tag}`);
                summary.push(`Sent DM to ${member.tag} using ${client.user.tag}`);
            }
        } catch (error) {
            console.error(`Could not DM ${memberId} using ${client.user.tag}: ${error}`);
            summary.push(`Failed to send DM to ${memberId} using ${client.user.tag}: ${error.message}`);
        }
    }

    console.log(summary.join('\n'));
    client.destroy();
});

client.on('error', console.error);
client.login(testTokens[1]);
