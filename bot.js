const token = process.env.TOKEN;

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
  bot.sendMessage("829387252", 'Hello, ' + '!').then(() => {
    // reply sent!
  });
}

setInterval(telegramMessage, 10000);

module.exports = bot;
