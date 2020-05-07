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
  name: "close",
  execute: async (message, args) => {

    if(!message.channel.name.startsWith(`loan-`) && !message.channel.name.startsWith(`ticket-`)) return;

    var transcript = [];
    let logs = message.guild.channels.find(c => c.id === config.transcripts_channel);
    if(!logs) return console.log(`[ERROR] Could not find the (#${config.transcripts_channel}).`);

    if(message.channel.name.startsWith(`ticket-`)) {

      message.channel.fetchMessages({ limit: 100 })
      .then(messages => {

        const filterBy = bot.user.id;
        messages = messages.filter(m => m.author.id != filterBy).array();
        let m = messages.sort((b, a) => b.createdTimestamp - a.createdTimestamp);

        m.forEach(msg => {

          let now = new Date();
          const edate = date.format(msg.createdAt, 'MM/DD/YYYY h:mm A');

          transcript.push(`${edate} ${msg.author.tag}: ${msg.content}`);
        })

        h(`[Transcript]\n\n${transcript.join("\n")}`, 'txt').then(r =>  {

          message.author.send(new Discord.RichEmbed()
          .setAuthor(`${message.guild.name} Tickets`, message.guild.iconURL)
          .setColor(config.color)
          .setDescription(`Click [here](${r}) to view the transcript of ${message.channel.name}.`)).catch(err => message.channel.send(new Discord.RichEmbed().setAuthor(`${message.guild.name} Tickets`, message.guild.iconURL).setColor(config.color).setDescription(`Click [here](${r}) to view the transcript of ${message.channel.name}.`)));

          let embed = new Discord.RichEmbed()
          .setAuthor(`${message.guild.name} Tickets`, message.guild.iconURL)
          .setColor(config.color)
          .setDescription(`Click [here](${r}) to view the transcript of ${message.channel.name}.`);

          logs.send(embed);
        })

        message.channel.send(new Discord.RichEmbed().setColor(config.color).setDescription(`Ticket closing in 10 seconds...`));
      })

      setTimeout(async function() {
          await message.channel.delete();
        }, ms('10s'));

        return;
    }

    if(message.channel.name.startsWith(`loan-`)) {

      let iu = db.get(`${message.author.id}_`);
      let is = db.get(`${message.channel.id}_.seller`);

      if(!iu) {

        if(!message.member.roles.some(r=>config.admin_role.includes(r.name)) && message.author.id != is) return;

        let embed = new Discord.RichEmbed()
        .setAuthor(`Cancellation Confirmation`, message.guild.iconURL)
        .setDescription(`${message.author} is requesting to cancel the loan.\nBoth parties must react to confirm.`)
        .setColor(config.color);

        let msg = await message.channel.send(embed);

        await msg.react('🗑');

        let filter = (reaction, user) => reaction.emoji.name === '🗑' && !user.bot;
        let react = await msg.createReactionCollector(filter, {time: false});

        react.on('collect', async reaction => {

          let iu = db.get(`${reaction.message.channel.id}_.user`);
          let is = db.get(`${reaction.message.channel.id}_.seller`);

          let rmember = reaction.message.guild.members.get(reaction.users.last().id);

          reaction.remove(reaction.users.last().id);

          if(!rmember.roles.some(r=>config.admin_role.includes(r.name)) && reaction.users.last().id != iu && reaction.users.last().id != is) return;
          let ius = db.get(`${reaction.message.channel.id}_.users`);
          if(ius.includes(reaction.users.last().id)) return;

          db.push(`${reaction.message.channel.id}_.users`, reaction.users.last().id);
          db.add(`${reaction.message.channel.id}_.count`, 1);

          let icount = db.get(`${reaction.message.channel.id}_.count`);
          if(icount != 2) return;

          react.stop();

          await reaction.message.delete().catch(error => console.log(chalk.yellow(`[WARN] - Unknown Message`)));

          db.delete(`${reaction.message.channel.id}_`);
          db.delete(`${iu}_`);

          reaction.message.channel.send(new Discord.RichEmbed().setColor(config.color).addField(`Cancellation Confirmed`, `Channel will now close in 10 seconds...`));

          reaction.message.channel.fetchMessages({ limit: 100 })
          .then(messages => {

            const filterBy = bot.user.id;
            messages = messages.filter(m => m.author.id != filterBy).array();
            let m = messages.sort((b, a) => b.createdTimestamp - a.createdTimestamp);

            m.forEach(msg => {

              let now = new Date();
              const edate = date.format(msg.createdAt, 'MM/DD/YYYY h:mm A');

              transcript.push(`${edate} ${msg.author.tag}: ${msg.content}`);
            })

            h(`[Transcript]\n\n${transcript.join("\n")}`, 'txt').then(r =>  {

              message.channel.send(new Discord.RichEmbed()
              .setAuthor(`${message.guild.name} Tickets`, message.guild.iconURL)
              .setColor(config.color)
              .setDescription(`Click [here](${r}) to view the transcript of ${message.channel.name}.`));

              let embed = new Discord.RichEmbed()
              .setAuthor(`${message.guild.name} Tickets`, message.guild.iconURL)
              .setColor(config.color)
              .setDescription(`Click [here](${r}) to view the transcript of ${message.channel.name}.`);

              logs.send(embed);
            })

          })

          setTimeout(async function() {
            await reaction.message.channel.delete().catch(error => console.log(chalk.yellow(`[WARN] - Unknown Channel`)));
          }, ms('10s'));

        });

        return;
      }

      let embed = new Discord.RichEmbed()
      .setAuthor(`Cancellation Confirmation`, message.guild.iconURL)
      .setDescription(`${message.author} is requesting to cancel the loan.\nBoth parties must react to confirm.`)
      .setColor(config.color);

      let msg = await message.channel.send(embed);

      await msg.react('🗑');

      let filter = (reaction, user) => reaction.emoji.name === '🗑' && !user.bot;
      let react = await msg.createReactionCollector(filter, {time: false});

      react.on('collect', async reaction => {

        let iu = db.get(`${reaction.users.last().id}_.user`);
        let is = db.get(`${reaction.users.last().id}_.seller`);

        const rmember = reaction.message.guild.members.get(reaction.users.last().id);

        reaction.remove(reaction.users.last().id).catch(error => console.log(chalk.yellow(`[WARN] - Unknown Message`)));

        if(!rmember.roles.some(r=>config.admin_role.includes(r.name)) && reaction.users.last().id != iu && reaction.users.last().id != is) return;
        let ius = db.get(`${reaction.message.channel.id}_.users`);
        if(ius.includes(reaction.users.last().id)) return;

        db.push(`${reaction.message.channel.id}_.users`, reaction.users.last().id);
        db.add(`${reaction.message.channel.id}_.count`, 1);

        let icount = db.get(`${reaction.message.channel.id}_.count`);
        if(icount != 2) return;

        react.stop();

        await reaction.message.delete().catch(error => console.log(chalk.yellow(`[WARN] - Unknown Message`)));

        db.delete(`${reaction.message.channel.id}_`);
        db.delete(`${reaction.users.last().id}_`);

        reaction.message.channel.send(new Discord.RichEmbed().setColor(config.color).addField(`Cancellation Confirmed`, `Channel will now close in 10 seconds...`));

        reaction.message.channel.fetchMessages({ limit: 100 })
        .then(messages => {

          const filterBy = bot.user.id;
          messages = messages.filter(m => m.author.id != filterBy).array();
          let m = messages.sort((b, a) => b.createdTimestamp - a.createdTimestamp);

          m.forEach(msg => {

            let now = new Date();
            const edate = date.format(msg.createdAt, 'MM/DD/YYYY h:mm A');

            transcript.push(`${edate} ${msg.author.tag}: ${msg.content}`);
          })

          h(`[Transcript]\n\n${transcript.join("\n")}`, 'txt').then(r =>  {

            message.channel.send(new Discord.RichEmbed()
            .setAuthor(`${message.guild.name} Tickets`, message.guild.iconURL)
            .setColor(config.color)
            .setDescription(`Click [here](${r}) to view the transcript of ${message.channel.name}.`));

            let embed = new Discord.RichEmbed()
            .setAuthor(`${message.guild.name} Tickets`, message.guild.iconURL)
            .setColor(config.color)
            .setDescription(`Click [here](${r}) to view the transcript of ${message.channel.name}.`);

            logs.send(embed);
          })

        })

        setTimeout(async function() {
          await reaction.message.channel.delete().catch(error => console.log(chalk.yellow(`[WARN] - Unknown Channel`)));
        }, ms('10s'));
      });
    }
  }
}
