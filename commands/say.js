const Discord = require("discord.js");
const config = require("../storage/config.json");

module.exports = {
  name: "say",
  execute: async (message, args) => {

    if(!message.member.roles.some(r=>config.admin_role.includes(r.name))) return message.channel.send(new Discord.RichEmbed().setColor("RED").setDescription(`:x: No Permission`));

    message.delete();

    let msg = args.slice(0).join(" ");

    if(!msg) return message.channel.send(new Discord.RichEmbed().setColor("RED").setDescription(`:x: **Usage:** \`${config.prefix}say <msg>\``));

    let embed = new Discord.RichEmbed()
    .setAuthor(`Announcement`, message.guild.iconURL)
    .setDescription(`${msg}`)
    .setColor(config.color);

    let m = await message.channel.send(embed);

    await m.react('⚔');
  }
}
