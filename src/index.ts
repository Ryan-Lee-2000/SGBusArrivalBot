import { Client } from 'discord.js';
import config from './config';
import helpCommand from './commands';

const { intents, prefix, token, key } = config;

const request = require("request");

const client = new Client({
  intents,
  presence: {
    status: 'online',
    activities: [{
      name: `${prefix}help`,
      type: 'LISTENING'
    }]
  }
});

client.on('ready', () => {
  console.log(`Logged in as: ${client.user?.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift();

    switch(command) {
      case 'ping':
        const msg = await message.reply('Pinging...');
        await msg.edit(`Pong! The round trip took ${Date.now() - msg.createdTimestamp}ms.`);
        break;

      case 'help':
        const msg_help = await message.reply("Hi! Thanks for using me! Use !stopbus and your bus stop number to find the estimated arrival times.");
        break;

      case 'stopbus':
        const msgBusStop = await message.reply('Checking...');
        const bus_number = message.content.split(" ")[1];
        const options = {
          url: 'http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=' + bus_number,
          headers: {
            'AccountKey': key,
            'accept': 'application/json'
          }
        };
        //await msg.edit();
        request(options, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            const res = JSON.parse(body)
            const buses = res.Services
            var bus_stops_msg = "Here are the bus timing for the bus stop: " + bus_number + "\n"
            buses.forEach(bus => {
              const bus_num = bus.ServiceNo
                const bus_time_1 = estimatedTime(bus.NextBus.EstimatedArrival.slice(0, 19))
                const bus_time_2 = estimatedTime(bus.NextBus2.EstimatedArrival.slice(0, 19))
                const bus_time_3 = estimatedTime(bus.NextBus3.EstimatedArrival.slice(0, 19))
                bus_stops_msg = bus_stops_msg + bus_num + ": " + bus_time_1 + " " + bus_time_2 + " " + bus_time_3
                bus_stops_msg = bus_stops_msg + "\n"
            })
            msgBusStop.edit(bus_stops_msg);
          }
        )
        break;
    }
  }
});

function estimatedTime(arrival){
  const currentTime = new Date()
  const arrivalTime = new Date(arrival) 
  const diff = arrivalTime -  currentTime
  const arrival_min = Math.round(((diff % 86400000) % 3600000) / 60000)
  const seconds = Math.floor(diff / 1000 % 60)
  const mins = Math.floor(diff / (1000 * 60) % 60)
  //console.log(arrival_min)
  if(isNaN(mins) || isNaN(seconds)){
    return "Nil"
  }
  if(seconds < 10 && mins < 10){
    return "0" + mins + ":" + "0" + seconds
  } else if (seconds < 10){
    return mins + ":" + "0" + seconds
  } else if (mins < 10){
    return "0" + mins + ":" + seconds
  } else {
    return mins + ":" + seconds
  }
}

client.login(token);
