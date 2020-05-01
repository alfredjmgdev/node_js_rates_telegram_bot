const token = process.env.TOKEN;

var request = require("request");
var rp = require("request-promise");
const $ = require('cheerio');
const Bot = require('node-telegram-bot-api');
let bot;

if(process.env.NODE_ENV === 'production') {
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
}
else {
  bot = new Bot(token, { polling: true });
}

function telegramMessage(){
  
console.log("Hey dude")

}

setInterval(telegramMessage, 10000);

module.exports = bot;