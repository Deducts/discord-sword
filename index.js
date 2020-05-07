const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require('fs');
const db = require("quick.db");
const ms = require("ms");
const chalk = require("chalk");
const config = require('./storage/config.json');
const prefix = config.prefix;

bot.commands = new Discord.Collection();

exports.bot = bot;

const pcd = new Set();
const cd = new Set();

// Log any errors
bot.on('error', console.error);

// Bot isEnabled
bot.on('ready', async () => {

  try {

    console.log("");
    console.log(chalk.green(`${bot.user.username} Bot Enabled`));
    console.log(chalk.green(`${bot.user.username} is online on ${bot.guilds.size} servers!`));
    console.log("");

    // Command Handler
    const commandFiles = fs.readdirSync("./commands");
    commandFiles.forEach((file) => {
      const command = require(`./commands/${file}`);
      bot.commands.set(command.name, command);
    });

  } catch(e) {

    console.log(chalk.red(`${e.stack}`));
  }
});

const events = {
    MESSAGE_REACTION_ADD: 'messageReactionAdd',
};

bot.on('raw', async event => {

  if (!events.hasOwnProperty(event.t)) return;

  const { d: data } = event

  const user = bot.users.get(data.user_id);
  const channel = bot.channels.get(data.channel_id);
  if(!channel) return;
  const message = await channel.fetchMessage(data.message_id);
  const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
  const reaction = message.reactions.get(emojiKey);

  if(user.bot) return;

  if(reaction.message.channel.name === config.create_ticket_channel) {

    if(reaction.emoji.name === "🎟") {

      reaction.remove(user);

      if(cd.has(user.id)) return reaction.message.channel.send(new Discord.RichEmbed().setColor("RED").setDescription(`You can only open one ticket per 10 minutes.`))
      .then(mg => mg.delete(2000)).catch(error => console.log(chalk.yellow(`[WARN] - Unknown Channel`)));

      var parent = reaction.message.guild.channels.find(c => c.name === config.ticket_category) || null;
      var tnum = db.get(`${reaction.message.guild.id}_.current`);
      var tc = "";

      if(!tnum) {

        db.set(`${reaction.message.guild.id}_.current`, 1);
        var tc = 1;
      }

      db.add(`${reaction.message.guild.id}_.current`, 1);
      var tc = db.get(`${reaction.message.guild.id}_.current`);

      cd.add(user.id);

      setTimeout(function() {
        cd.delete(user.id);
      }, ms('10m'));

      reaction.message.guild.createChannel(`ticket-${tc}`, 'text').then(async channel => {

        channel.setParent(parent);
        channel.overwritePermissions(user.id, {
          VIEW_CHANNEL: true,
          SEND_MESSAGES: false
        })
        channel.overwritePermissions(channel.guild.defaultRole, {
          VIEW_CHANNEL: false,
          SEND_MESSAGES: false
        })

        let embed = new Discord.RichEmbed()
        .setAuthor(`${reaction.message.guild.name} Tickets`, reaction.message.guild.iconURL)
        .setDescription(`${user}\nReact with 📁 to apply.\nReact with ✋ for support.\nReact with 🗑 to close this ticket.`)
        .setColor(config.color);

        let msg = await channel.send(embed).catch(error => console.log(chalk.yellow(`[WARN] - Unknown Message`)));

        await msg.react('🗑');
        await msg.react('📁');
        await msg.react('✋');
        await msg.react('💸');

      }).catch(error => console.log(chalk.yellow(`[WARN] - Unknown Channel`)));
    }
  }

  if(!reaction.message.channel.name.startsWith(`ticket-`)) return;

  // Application Function
  if(reaction.emoji.name === "📁") {

    reaction.message.delete().catch(error => console.log(chalk.yellow(`[WARN] - Unknown Message`)));

    reaction.message.channel.send(`You have selected **apply**.`);

    reaction.message.channel.overwritePermissions(user, {
      SEND_MESSAGES: true,
      READ_MESSAGES: true
    })

    let embedr = new Discord.RichEmbed()
    .setAuthor(`${message.guild.name} Applications`, message.guild.iconURL)
    .setDescription(`${config.application_questions[0]}`)
    .setColor(config.color);
    let embed = new Discord.RichEmbed()
    .setAuthor(`${message.guild.name} Applications`, message.guild.iconURL)
    .setDescription(`${config.application_questions[1]}`)
    .setColor(config.color);
    let embed2 = new Discord.RichEmbed()
    .setAuthor(`${message.guild.name} Applications`, message.guild.iconURL)
    .setDescription(`${config.application_questions[2]}`)
    .setColor(config.color);
    let embed3 = new Discord.RichEmbed()
    .setAuthor(`${message.guild.name} Applications`, message.guild.iconURL)
    .setDescription(`${config.application_questions[3]}`)
    .setColor(config.color);
    let embed4 = new Discord.RichEmbed()
    .setAuthor(`${message.guild.name} Applications`, message.guild.iconURL)
    .setDescription(`${config.application_questions[4]}`)
    .setColor(config.color);

    setTimeout(async function() {
      await reaction.message.channel.send(embedr);
    }, ms('1s'));

    collector = new Discord.MessageCollector(message.channel, u => u.author.id === user.id, { time: false });
    collector.on('collect', async  message => {

      const args = message.content.slice(prefix.length).split(/ +/);
      const command = args.shift();
      let cmd = bot.commands.get(command.toLowerCase());
      if (cmd) return cmd.execute(message,args);

      var trole = message.mentions.roles.first();
      if(!trole) return message.channel.send(new Discord.RichEmbed().setColor("RED").setDescription(`:x: Please mention a valid role.`));

      collector.stop();

      var arole = trole.name;

      message.channel.send(embed);

    collector = new Discord.MessageCollector(message.channel, u => u.author.id === user.id, { time: false });
    collector.on('collect', async  message => {

      const args = message.content.slice(prefix.length).split(/ +/);
      const command = args.shift();
      let cmd = bot.commands.get(command.toLowerCase());
      if (cmd) return cmd.execute(message,args);

      collector.stop();

      var profile = message.content;

      message.channel.send(embed2);

      collector = new Discord.MessageCollector(message.channel, u => u.author.id === user.id, { time: false });
      collector.on('collect', async  message => {

        const args = message.content.slice(prefix.length).split(/ +/);
        const command = args.shift();
        let cmd = bot.commands.get(command.toLowerCase());
        if (cmd) return cmd.execute(message,args);

        collector.stop();

        var thread = message.content;

        message.channel.send(embed3);

        collector = new Discord.MessageCollector(message.channel, u => u.author.id === user.id, { time: false });
        collector.on('collect', async  message => {

          const args = message.content.slice(prefix.length).split(/ +/);
          const command = args.shift();
          let cmd = bot.commands.get(command.toLowerCase());
          if (cmd) return cmd.execute(message,args);

          collector.stop();

          var rates = message.content;

          message.channel.send(embed4);

          collector = new Discord.MessageCollector(message.channel, u => u.author.id === user.id, { time: false });
          collector.on('collect', async  message => {

            const args = message.content.slice(prefix.length).split(/ +/);
            const command = args.shift();
            let cmd = bot.commands.get(command.toLowerCase());
            if (cmd) return cmd.execute(message,args);

            collector.stop();

            var amount = message.content;

            const iamu = message.author;
            const iamm = message.member;

            let tid = message.guild.channels.find(c => c.name === message.channel.name);
            let alogs = message.guild.channels.find(c => c.name === config.application_logs);
            if(!alogs) return console.log(chalk.red(`[ERROR] - Could not find the (#${config.application_logs}) channel. Please create it or redefine it.`));

            let fembed = new Discord.RichEmbed()
            .setAuthor(`Application | ${message.author.tag}`, message.author.displayAvatarURL)
            .setDescription(`Question: ${config.application_questions[0]}\nAnswer: ${arole}\n\nQuestion: ${config.application_questions[1]}\nAnswer: ${profile}\n\nQuestion: ${config.application_questions[2]}\nAnswer: ${thread}\n\nQuestion: ${config.application_questions[3]}\nAnswer: ${rates}\n\nQuestion: ${config.application_questions[4]}\nAnswer: ${amount}`)
            .addField(`Applicant`, `${message.author} | ${message.author.id}`)
            .addField(`Ticket`, `${tid}`)
            .setColor(config.color);

            message.channel.send(new Discord.RichEmbed().setColor(config.color).setDescription(`:white_check_mark: :tada: Your application has been submitted. Please keep this ticket open and await for your result!`));

            let amsg = await alogs.send(fembed);
            await amsg.react('✔');
            await amsg.react('✖');

            let filter1 = (reaction, user) => reaction.emoji.name === '✔' && !user.bot;
            let react1 = await amsg.createReactionCollector(filter1, {time: false});
            let filter2 = (reaction, user) => reaction.emoji.name === '✖' && !user.bot;
            let react2 = await amsg.createReactionCollector(filter2, {time: false});

            react1.on('collect', async reaction => {

              react1.stop();
              react2.stop();
              reaction.message.delete().catch(error => console.log(chalk.yellow(`[WARN] - Unknown Message`)));

              let acrole = reaction.message.guild.roles.find(r => r.name === arole);
              if(!acrole) return console.log(`[ERROR] Could not find the ${acrole}.`)

              message.channel.send(`${message.author}`)
              message.channel.send(new Discord.RichEmbed().setColor(config.color).setDescription(`Dear ${message.author}, We're glad to let you know that your application had been approved by Nitro Giveaways!`)).catch(error => console.log(`[WARN] - Ignore This.`));
              reaction.message.channel.send(`Application was accepted.`);
            })

            react2.on('collect', async reaction => {

              react1.stop();
              react2.stop();
              reaction.message.delete().catch(error => console.log(chalk.yellow(`[WARN] - Unknown Message`)));

              message.channel.send(`${message.author}`)
              message.channel.send(new Discord.RichEmbed().setColor(config.color).setDescription(`Dear ${message.author}, Unfortunately we have decided to reject your application. If you would like to submit another application, please make sure you meet our requirements which can be found in our information box. Here are a few reasons that could result in your rejection:
              	- Lack of experience
                - Lack of Punctuality & Professionalism
                - New to the service`)).catch(error => console.log(`[WARN] - Ignore This.`));
              reaction.message.channel.send(`Application was denied.`);
            })
          })
          });
        });
      });
    });
    return;
  }

  // Commission Function
  if(reaction.emoji.name === "🤖") {

    reaction.message.delete().catch(error => console.log(chalk.yellow(`[WARN] - Unknown Message`)));

    reaction.message.channel.send(`You have selected **order automatically**.`);

    reaction.message.channel.overwritePermissions(user, {
      SEND_MESSAGES: true,
      READ_MESSAGES: true
    })

    let embed = new Discord.RichEmbed()
    .setAuthor(`${message.guild.name} Tickets`, message.guild.iconURL)
    .setDescription(`${config.commission_questions[0]}`)
    .setColor(config.color);
    let embed2 = new Discord.RichEmbed()
    .setAuthor(`${message.guild.name} Tickets`, message.guild.iconURL)
    .setDescription(`${config.commission_questions[1]}`)
    .setColor(config.color);
    let embed3 = new Discord.RichEmbed()
    .setAuthor(`${message.guild.name} Tickets`, message.guild.iconURL)
    .setDescription(`${config.commission_questions[2]}`)
    .setColor(config.color);

    setTimeout(async function() {
      await reaction.message.channel.send(embed);
    }, ms('1s'));

    collector = new Discord.MessageCollector(message.channel, u => u.author.id === user.id, { time: false });
    collector.on('collect', async  message => {

      const args = message.content.slice(prefix.length).split(/ +/);
      const command = args.shift();
      let cmd = bot.commands.get(command.toLowerCase());
      if (cmd) return cmd.execute(message,args);

      let role = message.mentions.roles.first();
      if(!role) return message.channel.send(new Discord.RichEmbed().setColor("RED").setDescription(`Please mention a valid role.`));

      collector.stop();

      var service = role;

      message.channel.send(embed2);
      collector = new Discord.MessageCollector(message.channel, u => u.author.id === user.id, { time: false });
      collector.on('collect', async  message => {

        const args = message.content.slice(prefix.length).split(/ +/);
        const command = args.shift();
        let cmd = bot.commands.get(command.toLowerCase());
        if (cmd) return cmd.execute(message,args);

        let list = ['yes', 'no'];
        let flist = false;

        for (var i in list) {
          if (message.content.toLowerCase().includes(list[i].toLowerCase())) flist = true;

        }
        if(!flist) return message.channel.send(new Discord.RichEmbed().setColor("RED").setDescription(`Please answer with _yes_ or _no_.`));

        collector.stop();

        var w = message.content;

        message.channel.send(embed3);
        collector = new Discord.MessageCollector(message.channel, u => u.author.id === user.id, { time: false });
        collector.on('collect', async  message => {

          const args = message.content.slice(prefix.length).split(/ +/);
          const command = args.shift();
          let cmd = bot.commands.get(command.toLowerCase());
          if (cmd) return cmd.execute(message,args);

          collector.stop();

          var details = message.content;

          message.channel.send(new Discord.RichEmbed().setColor(config.color).setDescription(`:white_check_mark: All finished, I'm processing your request now.`));

          let tlog = message.guild.channels.find(c => c.name === config.commissions_channel);
          if(!tlog) return console.log(chalk.red(`[ERROR] - Could not find the (#${config.commissions_channel}). Please create it or redefine it.`));

          let chan = message.guild.channels.find(c => c.name === message.channel.name);

          let embed = new Discord.RichEmbed()
          .setAuthor(`New Commission`, message.author.displayAvatarURL)
          .setDescription(`React with :white_check_mark: to accept`)
          .addField(`Service`, service)
          .addField(`Paying`, w)
          .addField(`Details`, details)
          .setTimestamp()
          .setFooter(`${message.guild.name} Tickets`, message.guild.iconURL)
          .setColor(config.color);

          let msg2 = await tlog.send(embed);

          await msg2.react('✅');

          let filter = (reaction, user) => reaction.emoji.name === '✅' && !user.bot;
          let react = await msg2.createReactionCollector(filter, {time: false});

          react.on('collect', async reaction => {

            react.stop();
            msg2.delete().catch(error => console.log(chalk.yellow(`[WARN] - Unknown Message`)));

            chan.overwritePermissions(reaction.users.last().id, {
              SEND_MESSAGES: true,
              READ_MESSAGES: true
            })

            reaction.message.channel.send(`<@${reaction.users.last().id}>, you have claimed ${chan}`).then(g => g.delete(5000));
          })

        });
      });
    });

    return;
  }

  // Loan Function
  if(reaction.emoji.name === "💸") {

    reaction.remove(user).catch(error => console.log(chalk.yellow(`[WARN] - Unknown Message`)));

    let hloan = db.get(`${user.id}_.user`);
    if(hloan) return reaction.message.channel.send(new Discord.RichEmbed().setColor("RED").setDescription(`You have an active loan.`));

    reaction.message.delete().catch(error => console.log(chalk.yellow(`[WARN] - Unknown Message`)));

    reaction.message.channel.send(`You have selected **loaning**.`);

    reaction.message.channel.overwritePermissions(user, {
      SEND_MESSAGES: true,
      READ_MESSAGES: true
    })

    let embed = new Discord.RichEmbed()
    .setAuthor(`${message.guild.name} Loans`, message.guild.iconURL)
    .setDescription(`${config.loan_questions[0]}`)
    .setColor(config.color);
    let embed2 = new Discord.RichEmbed()
    .setAuthor(`${message.guild.name} Loans`, message.guild.iconURL)
    .setDescription(`${config.loan_questions[1]}`)
    .setColor(config.color);
    let embed3 = new Discord.RichEmbed()
    .setAuthor(`${message.guild.name} Loans`, message.guild.iconURL)
    .setDescription(`${config.loan_questions[2]}`)
    .setColor(config.color);
    let embed4 = new Discord.RichEmbed()
    .setAuthor(`${message.guild.name} Loans`, message.guild.iconURL)
    .setDescription(`${config.loan_questions[3]}`)
    .setColor(config.color);

    setTimeout(async function() {
      await reaction.message.channel.send(embed);
    }, ms('1s'));

    collector = new Discord.MessageCollector(message.channel, u => u.author.id === user.id, { time: false });
    collector.on('collect', async  message => {

      const args = message.content.slice(prefix.length).split(/ +/);
      const command = args.shift();
      let cmd = bot.commands.get(command.toLowerCase());
      if (cmd) return cmd.execute(message,args);

      if(isNaN(message.content)) return message.channel.send(new Discord.RichEmbed().setColor("RED").setDescription(`Please provide a valid number.`));

      collector.stop();

      var am = message.content;

      message.channel.send(embed2);
      collector = new Discord.MessageCollector(message.channel, u => u.author.id === user.id, { time: false });
      collector.on('collect', async  message => {

        const args = message.content.slice(prefix.length).split(/ +/);
        const command = args.shift();
        let cmd = bot.commands.get(command.toLowerCase());
        if (cmd) return cmd.execute(message,args);

        if(isNaN(message.content)) return message.channel.send(new Discord.RichEmbed().setColor("RED").setDescription(`Please provide a valid number.`));

        collector.stop();

        var pb = message.content;

        message.channel.send(embed3);
        collector = new Discord.MessageCollector(message.channel, u => u.author.id === user.id, { time: false });
        collector.on('collect', async  message => {

          const args = message.content.slice(prefix.length).split(/ +/);
          const command = args.shift();
          let cmd = bot.commands.get(command.toLowerCase());
          if (cmd) return cmd.execute(message,args);

          collector.stop();

          var date = message.content;

          message.channel.send(embed4);
          collector = new Discord.MessageCollector(message.channel, u => u.author.id === user.id, { time: false });
          collector.on('collect', async  message => {

            const args = message.content.slice(prefix.length).split(/ +/);
            const command = args.shift();
            let cmd = bot.commands.get(command.toLowerCase());
            if (cmd) return cmd.execute(message,args);

            collector.stop();

            var reason = message.content;

            let fembed = new Discord.RichEmbed()
            .setAuthor(`Loan Confirmation`, message.author.displayAvatarURL)
            .setDescription(`React with ☑ to confirm your information.`)
            .addField(`Amount`, `\`\`\`${am}\`\`\``)
            .addField(`Payback`, `\`\`\`${pb}\`\`\``)
            .addField(`Return Date`, `\`\`\`${date}\`\`\``)
            .addField(`Reason`, `\`\`\`${reason}\`\`\``)
            .setColor(config.color);

            let m = await message.channel.send(fembed);

            await m.react('☑');

            let ulogo = message.author.displayAvatarURL;
            let umember = message.author.id;
            let filter = (reaction, user) => reaction.emoji.name === '☑' && !user.bot && user.id === message.author.id;
            let react = await m.createReactionCollector(filter, {time: false});
            let llog = message.guild.channels.find(c => c.name === config.loans_channel);
            if(!llog) return console.log(chalk.red(`[ERROR] - Could not find the (#${config.loans_channel}). Please create it or redefine it.`));

            react.on('collect', async reaction => {

              reaction.message.delete().catch(error => console.log(chalk.yellow(`[WARN] - Unknown Message`)));

              const rmember = reaction.message.guild.members.get(reaction.users.last().id);

              react.stop();

              reaction.message.channel.send(new Discord.RichEmbed().setColor(config.color).setDescription(`Your request has been posted in ${llog}.\n_This ticket will close in 10 seconds..._`));

              const embedr = new Discord.RichEmbed()
              .setAuthor(`Loan Request`, ulogo)
              .setDescription(`**User:** ${rmember.user.tag} | \`${rmember.id}\``)
              .addField(`Amount`, `\`\`\`$${am}\`\`\``, true)
              .addField(`Payback`, `\`\`\`$${pb}\`\`\``, true)
              .addField(`Return Date`, `\`\`\`${date}\`\`\``, true)
              .addField(`Reason`, `${reason}`)
              .setColor(config.color);

              let m1 = await llog.send(embedr);
              await m1.react('☑');

              let filter = (reaction, user) => reaction.emoji.name === '☑' && !user.bot;
              let react1 = await m1.createReactionCollector(filter, {time: false});

              setTimeout(async function() {
                await reaction.message.channel.delete().catch(error => console.log(chalk.yellow(`[WARN] - Unknown Channel`)));
              }, ms('10s'));

              react1.on('collect', async reaction => {

                if(reaction.users.last().id === umember) return reaction.remove(reaction.users.last().id);

                react1.stop();

                db.set(`${umember}_`, { user: `${umember}`, seller: `${reaction.users.last().id}`, amount: `${am}`, payback: `${pb}`, rol: `${date}`});

                reaction.message.delete().catch(error => console.log(chalk.yellow(`[WARN] - Unknown Message`)));

                var parent = reaction.message.guild.channels.find(c => c.name === config.ticket_category) || null;
                var tnum = db.get(`${reaction.message.guild.id}_.current`);
                var tc = "";

                if(!tnum) {

                  db.set(`${reaction.message.guild.id}_.current`, 1);
                  var tc = 1;
                }

                db.add(`${reaction.message.guild.id}_.current`, 1);
                var tc = db.get(`${reaction.message.guild.id}_.current`);

                reaction.message.guild.createChannel(`loan-${tc}`, 'text').then(async channel => {

                  db.set(`${channel.id}_`, { user: `${umember}`, seller: `${reaction.users.last().id}`, active: true, count: 0, users: []});

                  channel.setParent(parent);
                  channel.overwritePermissions(reaction.message.guild.defaultRole, {
                    VIEW_CHANNEL: false,
                    SEND_MESSAGES: false
                  })
                  channel.overwritePermissions(reaction.users.last().id, {
                    VIEW_CHANNEL: true,
                    SEND_MESSAGES: true
                  })
                  channel.overwritePermissions(message.author.id, {
                    VIEW_CHANNEL: true,
                    SEND_MESSAGES: true
                  })

                  let is = db.get(`${umember}_.seller`);
                  let iam = db.get(`${umember}_.amount`);
                  let ipb = db.get(`${umember}_.payback`);
                  let ird = db.get(`${umember}_.rol`);

                  channel.send(new Discord.RichEmbed()
                  .setColor(config.color)
                  .setAuthor(`Loan Agreement`, reaction.message.guild.iconURL)
                  .setDescription(`**User:** ${message.author.tag} | \`${message.author.id}\`\n**Loaner:** <@${is}>`)
                  .addField(`Amount`, `$${iam}`)
                  .addField(`Payback`, `$${ipb}`)
                  .addField(`Return Date`, `${ird}`));

                  reaction.message.channel.send(`<@${reaction.users.last().id}>, your loan agreement has been created in ${channel}.`).then(msg => msg.delete(5000));
                })
              });
            })
          })
        })
      })
    })
    return;
  }

  // Support Function
  if(reaction.emoji.name === "✋") {

    reaction.remove(user).catch(error => console.log(chalk.yellow(`[WARN] - Unknown Message`)));

    let role = reaction.message.guild.roles.find(r => r.name === config.admin_role);
    if(!role) return console.log(chalk.red(`[ERROR] - Could not find the (${config.admin_role}) role! Please create it or redefine it.`));

    reaction.message.delete().catch(error => console.log(chalk.yellow(`[WARN] - Unknown Message`)));

    reaction.message.channel.overwritePermissions(user, {
      SEND_MESSAGES: true,
      READ_MESSAGES: true
    })

    reaction.message.channel.send(`You have selected **support**.`);

    setTimeout(async function() {
      await reaction.message.channel.send(`${role}, <@${user.id}> has requested support.`);
    }, ms('1s'));
    return;
  }
})

// Message Listener
bot.on("message", async(message) => {

  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift();

  if (message.channel.type != "text") return;
  if (message.author.bot) return;

  if (message.author.bot && message.content.startsWith(prefix)) return;
  if (!message.content.startsWith(prefix)) return;

  let cmd = bot.commands.get(command.toLowerCase());
  if (cmd) cmd.execute(message,args);
});
bot.login(config.token);
