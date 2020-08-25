require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
var data = require('./data.json');
const { authorized_tc_setters } = require('./what.json');
const fs = require('fs').promises;
const fsb = require('fs');
const helpText = `
Prefix is ${config.prefix}
**thonkcoins:**
thonkcoins: Get your thonk coins

thonkcoins <user id>: Get user's thonk coins.
Example: ${config.prefix}thonkcoins 213117847436656650

thonkcoins dep: For depositing, not implemented

thonkcoins dep all: Deposit all your coins

thonkcoins dep <number>: Deposit <number> of your coins
Example: ${config.prefix}thonkcoins dep 15


**For whitelisted people:**
save: Important command, saves database
`

function getThonkCoins(id) {
	if (data[id]) {
		return data[id].amount.toFixed(2);
	} else {
		data[id] = {
			amount: 0,
			bank: 0,
			time: Date.now()
		}
		return '0.00';
	}
}

function depositThonkCoins(id, amount) {
	if (amount > data[id].amount) {
		return 'You have too little thonk coins';
	} else {
		data[id].amount -= amount;
		data[id].bank += amount;
		data[id].time = Date.now();
		return `Deposited ${amount.toFixed(2)} thonk coins`
	}
}

function bgupdate() {
	for (let i in data.keys) {
		if (data[i].time + 1000*60*60*24 >= Date.now()) {
			data[i].amount += data[i].bank * 0.05;
		}
	}
	fs.writeFile('./data.json', JSON.stringify(data), 'utf8')
	.then(() => {console.log('saved database')})
	.catch(() => {console.log('failed to save database')})
}

client.once('ready', () => {
	console.log('ready');
});

client.on('message', message => {
	let instr = message.content.split(' ');
	if (instr[0].slice(0, config.prefix.length) === config.prefix) {
		instr[0] = instr[0].slice(config.prefix.length)
		switch (instr[0]) {
			case 'thonkcoins': {
				if (instr[1]) {
					if (instr[1] == 'bank') {
						const embed = new Discord.MessageEmbed()
						.setTitle('Thonk coins bank')
						.setColor(0xeeea0f)
						.setDescription(`<@!${message.author.id}> You have ${data[message.author.id].bank.toFixed(2)} thonk coins in the bank`);
						message.channel.send(embed);
					} else if (instr[1] == 'dep') {
						if (instr[2]) {
							if (instr[2] == 'all') {
								const embed = new Discord.MessageEmbed()
								.setTitle('Thonk coins bank')
								.setColor(0xeeea0f)
								.setDescription(`<@!${message.author.id}> ${depositThonkCoins(message.author.id, data[id].amount)}`);
								message.channel.send(embed);
							} else if (!isNaN(Number(instr[2]))) {
								const embed = new Discord.MessageEmbed()
								.setTitle('Thonk coins bank')
								.setColor(0xeeea0f)
								.setDescription(`<@!${message.author.id}> ${depositThonkCoins(message.author.id, Number(instr[2]))}`);
								message.channel.send(embed);
							} else {
								const embed = new Discord.MessageEmbed()
								.setTitle('Thonk coins bank')
								.setColor(0xeeea0f)
								.setDescription(`<@!${message.author.id}> Usage: ${config.prefix}thonkcoins dep [all or number]`);
								message.channel.send(embed);
							}
						} else {
							const embed = new Discord.MessageEmbed()
							.setTitle('Thonk coins bank')
							.setColor(0xeeea0f)
							.setDescription(`<@!${message.author.id}> Usage: ${config.prefix}thonkcoins dep [all or number]`);
							message.channel.send(embed);
						}
					} else {
						const embed = new Discord.MessageEmbed()
						.setTitle('Thonk coins')
						.setColor(0xeeea0f)
						.setDescription(`<@!${instr[1]}> has ${getThonkCoins(instr[1])} thonk coins`);
						message.channel.send(embed);
					}
				} else {
					const embed = new Discord.MessageEmbed()
					.setTitle('Thonk coins')
					.setColor(0xeeea0f)
					.setDescription(`<@!${message.author.id}> You have ${getThonkCoins(message.author.id)} thonk coins`);
					message.channel.send(embed);
				}
				break;
			}
			case 'help': {
				const embed = new Discord.MessageEmbed()
				.setTitle('Help')
				.setColor(0xeeea0f)
				.setDescription(helpText);
				message.channel.send(embed);
				break;
			}
			case 'save': {
				if (authorized_tc_setters.includes(message.author.id)) {
					fs.writeFile('./data.json', JSON.stringify(data), 'utf8')
					.then(() => {
						const embed = new Discord.MessageEmbed()
						.setTitle('Saving')
						.setColor(0xaaff5a)
						.setDescription('Saved database');
						message.channel.send(embed);
					})
					.catch((e) => {
						console.error(e);
						const embed = new Discord.MessageEmbed()
						.setTitle('Saving')
						.setColor(0xaaff5a)
						.setDescription('Fail to save database');
						message.channel.send(embed);
					})
				} else {
					const embed = new Discord.MessageEmbed()
					.setTitle('Saving')
					.setColor(0xaaff5a)
					.setDescription('Not whitelisted');
					message.channel.send(embed);
				}
				break;
			}
			case 'set': {
				if (authorized_tc_setters.includes(message.author.id)) {
					data[instr[1]].amount = Number(instr[2]);
					const embed = new Discord.MessageEmbed()
					.setColor(0xaaff5a)
					.setDescription(`Set ${message.guild.member.fetch(instr[1]).user.tag}'s thonk coins to ${instr[2]}`);
					message.channel.send(embed);
				} else {
					const embed = new Discord.MessageEmbed()
					.setColor(0xaaff5a)
					.setDescription('Not whitelisted');
					message.channel.send(embed);
				}
				break;
			}
			case 'setbank': {
				if (authorized_tc_setters.includes(message.author.id)) {
					data[instr[1]].bank = Number(instr[2]);
					const embed = new Discord.MessageEmbed()
					.setColor(0xaaff5a)
					.setDescription(`Set ${message.guild.member.fetch(instr[1]).user.tag}'s thonk coins in the bank to ${instr[2]}`);
					message.channel.send(embed);
				} else {
					const embed = new Discord.MessageEmbed()
					.setColor(0xaaff5a)
					.setDescription('Not whitelisted');
					message.channel.send(embed);
				}
				break;
			}
			
		}
	} else {
		return;
	};
});

process.on('exit', () => {
	fsb.writeFileSync('./data.json', JSON.stringify(data), 'utf8');
});

setInterval(bgupdate, 120000);

client.login(process.env.TOKEN);