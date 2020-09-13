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
		console.log(
			`${id} gets his tc: amount: ${data[id].amount} bank: ${data[id].bank}`
		);
		return data[id].amount.toFixed(2);
	} else {
		console.log(`${id} makes new data`);
		data[id] = {
			amount: 0,
			bank: 0,
			time: Date.now(),
		};
		return '0.00';
	}
}

function depositThonkCoins(id, _amount) {
	if (_amount <= 0) return 'Enter a number larger than 0';
	if (_amount > data[id].amount) {
		return 'You have too little thonk coins';
	} else {
		data[id].amount -= _amount;
		data[id].bank += _amount;
		data[id].time = Date.now();
		return `Deposited ${_amount.toFixed(2)} thonk coins`;
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

function swap(arr, a, b) {
	let t = arr[a];
	arr[a] = arr[b];
	arr[b] = t;
}
/**
 * makes a <tt>GuildMember</tt> in an array wins a giveaway
 * @param {Discord.GuildMember[]} users
 */
async function wingamble(users) {
	/**
	 * @type {Discord.GuildMember[]}
	 */
	users = users.filter((val) => !val.user.bot);
	/**
	 * @type {Discord.GuildMember[]}
	 */
	let winners = [];
	let str = '';
	for (let i = 0; i < 5; i++) {
		let index = Math.floor(users.length * Math.random());
		winners.push(users[index]);
		swap(users, index, users.length - 1);
		users.pop();
	}
	for (let i = 0; i < winners.length; i++) {
		let prestiges = 0;
		for (let j = 0; j < prestigeRolesId.length; j++) {
			if (await winners[i].roles.cache.get(prestigeRolesId[j])) prestiges++;
		}
		console.log(prestiges);
		let id = winners[i].id;
		let amount = Math.max(
			(6 * i + Math.floor(Math.random() * 3) - 1) * (prestiges + 1),
			1
		);
		if (data[id]) {
			data[id].amount += amount;
		} else {
			data[id] = {
				amount: 6 * i + Math.floor(Math.random() * 3) - 1,
				bank: 0,
				time: Date.now(),
			};
		}
		str += `${winners.length - i}. <@!${
			winners[i].user.id
		}> had died ${amount} times\n`;
	}
	gamble.send(createEmbed('Thonk coins giveaway', 0xeeea0f, str));
	return new Promise((_) => _());
}

const dayInMillis = 1000 * 60 * 60 * 24;
const weekInMillis = 1000 * 60 * 60 * 24 * 7;
//const dayInMillis = 1000;
//const weekInMillis = 1000 * 15;
let gambleTimestamp; // 1598691600000
(async () => {
	gambleTimestamp = Number(await fs.readFile('./gamble-timestamp', 'utf8'));
})();
function bgupdate() {
	let temp = Object.keys(data);
	console.log(temp);
	for (let i = 0; i < temp.length; i++) {
		if (data[temp[i]].time + dayInMillis <= Date.now()) {
			console.log('go?');
			let days = Math.floor((Date.now() - data[temp[i]].time) / dayInMillis);
			data[temp[i]].amount += data[temp[i]].bank * 1.05 ** days;
			data[temp[i]].time += days * dayInMillis;
		}
	}
	if (gambleTimestamp + weekInMillis <= Date.now()) {
		gambleTimestamp += weekInMillis;
		global.mainserver.then(
			/**
			 * @param {Discord.Guild} server
			 */
			(server) => {
				server.members.fetch().then((users) => {
					wingamble(users.array()).then((_) => {
						fs.writeFile(
							'./gamble-timestamp',
							gambleTimestamp.toString(),
							'utf8'
						).then(() => {
							console.log(
								`gamble timestamp is now ${new Date(
									gambleTimestamp + weekInMillis
								)}`
							);
						});
					});
				});
			}
		);
	}
	client.sweepMessages(20);
	fs.writeFile(
		'./data.json',
		JSON.stringify(data).replace(/\{/g, '\n{\n').replace(/\}/g, '\n}\n'),
		'utf8'
	)
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
		gamble = await server.channels.cache.get('724467569980997634');
	});
	client.user.setActivity({
		name: 'yay bot works now?',
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
			case 'eval': {
				if (message.author.id === '213117847436656650')
					message.channel.send(
						'message: ' + (eval(instr.slice(1).join(' ')) || 'empty').toString()
					);
			}
		}
	} else {
		return;
	}
});

process.on('exit', () => {
	fsb.writeFileSync('./data.json', JSON.stringify(data), 'utf8');
});

setInterval(bgupdate, 300000);

client.login(process.env.TOKEN);
