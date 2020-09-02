require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
var data = require('./data.json');
const { authorized_tc_setters } = require('./what.json');
const fs = require('fs').promises;
const fsb = require('fs');
let gamble;
let gambling = false;
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
set <user-id> <amount>: set user's thonk coin's amount
setbank <user-id> <amount>: set user's thonk coin's amount in bank
`;

function getThonkCoins(id) {
	if (data[id]) {
		return data[id].amount.toFixed(2);
	} else {
		data[id] = {
			amount: 0,
			bank: 0,
			time: Date.now(),
		};
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
		return `Deposited ${amount.toFixed(2)} thonk coins`;
	}
}

let prestigeRolesId = [
	'722867502962704435',
	'723176166432964639',
	'723176379234910278',
	'723176529768611861',
	'723176518485803130',
	'723176074212671530',
];

/**
 * makes a <tt>GuildMember</tt> in an array wins a giveaway
 * @param {Discord.GuildMember[]} users
 */
function wingamble(users) {
	/**
	 * @type {Discord.GuildMember[]}
	 */
	let winners = [];
	let str = '';
	for (let i = 0; i < 5; i++) {
		winners.push(users[Math.floor(users.length * Math.random())]);
	}
	for (let i = 0; i < winners.length; i++) {
		let prestiges = 0;
		for (let j = 0; j < prestigeRolesId; j++) {
			if (winners.roles.cache.get(prestigeRolesId[j])) prestiges++;
		}

		let id = winners[i].id;
		if (data[id]) {
			data[id].amount +=
				(6 * i + Math.floor(Math.random() * 3) - 1) * prestiges;
		} else {
			data[id] = {
				amount: 6 * i + Math.floor(Math.random() * 3) - 1,
				bank: 0,
				time: Date.now(),
			};
		}
	}
}

const dayInMillis = 1000 * 60 * 1;
const weekInMillis = 1000 * 60 * 5;
let gambleTimestamp = fs.readFile('./gamble-timestamp', 'utf8');
function bgupdate() {
	for (let i in data.keys) {
		if (data[i].time + dayInMillis >= Date.now()) {
			let days = Math.floor((Date.now() - data[i].time) / dayInMillis);
			data[i].amount += data[i].bank * 0.05 ** days;
			data[i].time += days * dayInMillis;
		}
	}
	if (gambleTimestamp + weekInMillis >= Date.now()) {
		gambleTimestamp += weekInMillis;
		global.mainserver.then(
			/**
			 * @param {Discord.Guild} server
			 */
			(server) => {
				server.members.fetch().then((users) => {
					wingamble(users.array());
				});
			}
		);
	}
	client.sweepMessages(20);
	fs.writeFile('./data.json', JSON.stringify(data), 'utf8')
		.then(() => {
			console.log('saved database');
		})
		.catch(() => {
			console.log('failed to save database');
		});
}

function createEmbed(title, color, description) {
	return new Discord.MessageEmbed()
		.setTitle(title)
		.setColor(color)
		.setDescription(description);
}

client.once('ready', () => {
	console.log('ready');
	global.mainserver = client.guilds.fetch('702957021229482064');
	global.mainserver.then(async (server) => {
		gamble = await server.channels.cache.get('612645831094304774');
	});
	client.user.setActivity({
		name: 'diamboy is testing dont use',
	});
});

client.on('message', (message) => {
	let instr = message.content.split(' ');
	if (instr[0].slice(0, config.prefix.length) === config.prefix) {
		instr[0] = instr[0].slice(config.prefix.length);
		switch (instr[0]) {
			case 'thonkcoins': {
				if (instr[1]) {
					if (instr[1] == 'bank') {
						message.channel.send(
							createEmbed(
								'Thonk coins bank',
								0xeeea0f,
								`<@!${message.author.id}> You have ${data[
									message.author.id
								].bank.toFixed(2)} thonk coins in the bank`
							)
						);
					} else if (instr[1] == 'dep') {
						if (instr[2]) {
							if (instr[2] == 'all') {
								message.channel.send(
									createEmbed(
										'Thonk coins bank',
										0xeeea0f,
										`<@!${message.author.id}> ${depositThonkCoins(
											message.author.id,
											data[message.author.id].amount
										)}`
									)
								);
							} else if (!isNaN(Number(instr[2]))) {
								message.channel.send(
									createEmbed(
										'Thonk coins bank',
										0xeeea0f,
										`<@!${message.author.id}> ${depositThonkCoins(
											message.author.id,
											Number(instr[2])
										)}`
									)
								);
							} else {
								message.channel.send(
									createEmbed(
										'Thonk coins bank',
										0xeeea0f,
										`<@!${message.author.id}> Usage: ${config.prefix}thonkcoins dep [all or number]`
									)
								);
							}
						} else {
							message.channel.send(
								createEmbed(
									'Thonk coins bank',
									0xeeea0f,
									`<@!${message.author.id}> Usage: ${config.prefix}thonkcoins dep [all or number]`
								)
							);
						}
					} else {
						// fucking spaghetti code
						instr[1] = instr[1].replace(/<@!|<@/g, '');
						instr[1] = instr[1].replace(/>/g, '');
						instr[1] = instr[1].trim();
						global.mainserver
							.then((server) => server.members.fetch())
							.then((members) => {
								return members.map((m) => m.user.id);
							})
							.then((arr) => (arr.includes(instr[1]) ? 0 : 1))
							.then((type) => {
								if (type == 0) {
									message.channel.send(
										createEmbed(
											'Thonk coins',
											0xeeea0f,
											`<@!${instr[1]}> has ${getThonkCoins(
												instr[1]
											)} thonk coins`
										)
									);
								} else {
									global.mainserver
										.then((g) => g.members.fetch({ query: instr[1] }))
										.then((m) => {
											m = m.array()[0];
											message.channel.send(
												createEmbed(
													'Thonk coins',
													0xeeea0f,
													`<@!${m.user.id}> has ${getThonkCoins(
														m.user.id
													)} thonk coins`
												)
											);
										})
										.catch((e) => {
											console.error(e);
											message.channel.send(
												createEmbed(
													'Thonk coins',
													0xeeea0f,
													`User does not exist!`
												)
											);
										});
								}
							})
							.catch((e) => {
								console.error(e);
								message.channel.send(
									createEmbed('Thonk coins', 0xeeea0f, `User does not exist!`)
								);
							});
					}
				} else {
					message.channel.send(
						createEmbed(
							'Thonk coins',
							0xeeea0f,
							`<@!${message.author.id}> You have ${getThonkCoins(
								message.author.id
							)} thonk coins`
						)
					);
				}
				break;
			}
			case 'help': {
				message.channel.send(createEmbed('Help', 0xeeea0f, helpText));
				break;
			}
			case 'save': {
				if (authorized_tc_setters.includes(message.author.id)) {
					fs.writeFile('./data.json', JSON.stringify(data), 'utf8')
						.then(() => {
							message.channel.send(
								createEmbed('Saving', 0xaaff5a, 'Saved database')
							);
						})
						.catch((e) => {
							console.error(e);
							message.channel.send(
								createEmbed('Saving', 0xaaff5a, 'Failed to save database')
							);
						});
				} else {
					message.channel.send(
						createEmbed('Saving', 0xaaff5a, 'Not whitelisted')
					);
				}
				break;
			}
			case 'set': {
				if (authorized_tc_setters.includes(message.author.id)) {
					data[instr[1]].amount = Number(instr[2]);
					message.guild.members.fetch(instr[1]).then((m) => {
						message.channel.send(
							createEmbed(
								'',
								0xaaff5a,
								`Set ${m.user.tag}'s thonk coins to ${instr[2]}`
							)
						);
					});
				} else {
					message.channel.send(createEmbed('', 0xaaff5a, 'Not whitelisted'));
				}
				break;
			}
			case 'setbank': {
				if (authorized_tc_setters.includes(message.author.id)) {
					data[instr[1]].bank = Number(instr[2]);
					message.guild.members.fetch(instr[1]).then((m) => {
						message.channel.send(
							createEmbed(
								'',
								0xaaff5a,
								`Set ${m.user.tag}'s thonk coins in the bank to ${instr[2]}`
							)
						);
					});
				} else {
					message.channel.send(createEmbed('', 0xaaff5a, 'Not whitelisted'));
				}
				break;
			}
		}
	} else {
		return;
	}
});

process.on('exit', () => {
	fsb.writeFileSync('./data.json', JSON.stringify(data), 'utf8');
});

setInterval(bgupdate, 60000);

client.login(process.env.TOKEN);
