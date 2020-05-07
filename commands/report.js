const Discord = require("discord.js");
const config = require("../storage/config.json");
const chalk = require("chalk");
const index = require('../index.js');
const bot = index.bot;
const ms = require("ms");
const h = require('hastebin-gen');
const fs = require("fs");
const date = require('date-and-time');
const db = require("quick.db");

module.exports = {
  name: "report",
  execute: async (message, args) => {

        let rUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
        if(!rUser) return message.channel.send(new Discord.RichEmbed().setColor("RED").setDescription(":x: Couldn't find that user!"));
        let rReason = args.join(" ").slice(22);
        if(!rReason) return message.channel.send(new Discord.RichEmbed().setColor("RED").setDescription(`:x: Please supply a valid reason!.`));
        let rlink = args.join(" ").slice(22);
        if(!message.content.includes(`https://www.mc-market.org/members/`)) return message.channel.send(new Discord.RichEmbed().setColor("RED").setDescription(`:x: Please provide a valid MC-Market profile link.`));

        let reportEmbed = new Discord.RichEmbed()
        .setAuthor("Sword Reports", "http://i.imgur.com/WHq6qmo.png")
        .setColor("GREEN")
        .addField("Reported User", `${rUser}`)
        .addField("Reported By", `${message.author}`)
        .addField("Channel", message.channel)
        .addField("Reason", rReason)
        .addField("MCM Link", rlink)
        .setTimestamp();

        let reportschannel = message.guild.channels.find(`name`, "reports");
        if(!reportschannel) return message.channel.send(new Discord.RichEmbed().setColor("RED").setDescription(":x: Couldn't find reports channel!"));


        message.delete().catch(O_o=>{});
        reportschannel.send(reportEmbed);

        let embed = new Discord.RichEmbed()
        .setAuthor(`✅ User reported!`)
        .setColor("GREEN")
        await message.channel.send(embed)

      }
    }
