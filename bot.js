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

// ------------------- scraping ----------------------

// Global variables
var sended = false;
// Airtm
var airtm_url = "https://rates.airtm.com/";
var airtm_rates = {};
// MonitorDolar
var monitordolar_url = "https://monitordolarvenezuela.com/";
var monitordolar_rates_1 = [];
var monitordolar_rates_2 = [];
var rates;

function airtmRequest(airtm_url){ 
    return new Promise(function (resolve, reject) {
      request(airtm_url, function (error, res, body) {
        if(!error && res.statusCode == 200) {
            var hola = $('div.text-airtm', body);
            for(var i = 0; i < hola.length; i++){
                if(hola[i]["type"] == "tag" && hola[i]["name"] == "div" && hola[i]["children"]){
                    if(hola[i]["children"][0]["attribs"]["class"] == "rate--buy"){
                        airtm_buy_rate = hola[i]["children"][0]["children"][0]['data'];
                    }else if (hola[i]["children"][0]["attribs"]["class"] == "rate--sell") {
                        airtm_sell_rate = hola[i]["children"][0]["children"][0]['data'];
                    }else if (hola[i]["children"][0]["attribs"]["class"] == "rate--general") {
                        airtm_general_rate = hola[i]["children"][0]["children"][0]['data'];
                    }
                } 
            } 
            airtm_rates.airtm_sell_rate     = new Intl.NumberFormat("de-DE").format(airtm_sell_rate); 
            airtm_rates.airtm_buy_rate      = new Intl.NumberFormat("de-DE").format(airtm_buy_rate);
            airtm_rates.airtm_general_rate  = new Intl.NumberFormat("de-DE").format(airtm_general_rate);
            airtm_rates.error               = false;
            resolve(airtm_rates);
        }else{
            airtm_rates.airtm_sell_rate     = null; 
            airtm_rates.airtm_buy_rate      = null;
            airtm_rates.airtm_general_rate  = null;
            airtm_rates.error               = true;
            reject(airtm_rates);
        }
      });
    });
}

function monitorDolarRequest(monitordolar_url){
    return new Promise(function (resolve, reject) {
        request(monitordolar_url, function (error, res, body) {
            if(!error && res.statusCode == 200){
                var hola = $('div.box-prices', body);
                hola.each(function(i,entry){
                    if(entry['type'] == 'tag' && entry['name'] == 'div' && entry['children']){
                        entry['children'].forEach(function(entry2) {
                            if(entry2['attribs']){
                                if(entry2['attribs']['class'] == 'col-6 col-lg-4'){
                                    entry2['children'].forEach(function(entry3){
                                        if(entry3['type'] == 'text'){
                                            monitordolar_rates_1.push(entry3['data']);
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
                var monitor_rates_values                    = {};
                monitor_rates_values.dolar_today            = monitordolar_rates_1[0];
                monitor_rates_values.btc                    = monitordolar_rates_1[1];
                monitor_rates_values.yadio                  = monitordolar_rates_1[2];
                monitor_rates_values.airtm                  = monitordolar_rates_1[3];
                monitor_rates_values.cucuta                 = monitordolar_rates_1[4];
                monitor_rates_values.american_kryptosbank   = monitordolar_rates_1[5];
                monitor_rates_values.movicambio             = monitordolar_rates_1[6];
                monitor_rates_values.mkambio                = monitordolar_rates_1[7];
                
                
                var hola2 = $('div.box-calcmd', body)[0];
                hola2['children'].forEach(function(entry_a){
                    if(entry_a['type'] == 'tag' && entry_a['name'] == 'p' && entry_a['children']){
                        entry_a['children'].forEach(function(entry_b){
                            if(entry_b['type'] == 'text'){
                                monitordolar_rates_2.push(entry_b['data']);
                            }
                        });
                    }   
                });

                monitor_rates_values.monitor_dolar      = monitordolar_rates_2[0];
                monitor_rates_values.monitor_euro       = monitordolar_rates_2[1];
                monitor_rates_values.bcv                = monitordolar_rates_2[2];
                monitor_rates_values.peso_col           = monitordolar_rates_2[3];
                monitor_rates_values.petro              = monitordolar_rates_2[4];
                monitor_rates_values.paypal             = monitordolar_rates_2[7];

                monitor_rates_values.error              = false;

                resolve(monitor_rates_values);
            }else{
                var monitor_rates_values = {};
                monitor_rates_values.dolar_today = null;
                monitor_rates_values.btc = null;
                monitor_rates_values.yadio = null;
                monitor_rates_values.airtm = null;
                monitor_rates_values.cucuta = null;
                monitor_rates_values.american_kryptosbank = null;
                monitor_rates_values.movicambio = null;
                monitor_rates_values.mkambio = null;
                monitor_rates_values.error = true;
                reject(monitor_rates_values);
            }
        });
    });
}

async function getRates() {
    try{
        airtm_request = await airtmRequest(airtm_url);
    }
    catch(e){
        airtm_request = e;
    }
    try{
        monitordolar_request = await monitorDolarRequest(monitordolar_url);
    }
    catch(e){
        monitordolar_request = e;
    }

    var rates = {};
    rates.airtm = airtm_request;
    rates.monitordolar = monitordolar_request;
    return rates;
}

// ------------------- scraping ----------------------

function telegramBotMessage(data) {
    var date = new Date();
    if(date.getMinutes() === 0) {
        if(sended === false) {
            sended = true;
            bot.sendMessage("829387252",
            "<b>Airtm Rates:</b>"+
            "\nSell: "+data.airtm.airtm_sell_rate+
            "\nBuy: "+data.airtm.airtm_buy_rate+
            "\nGeneral: "+data.airtm.airtm_general_rate+
            "\n------------------------------------------\n"+
            "<b>Monitor Dolar (Tasas para promedio):</b>"+
            "\nDolar Today: "+data.monitordolar.dolar_today+
            "\nBTC: "+data.monitordolar.btc+
            "\nYadio: "+data.monitordolar.yadio+
            "\nAirtm: "+data.monitordolar.airtm+
            "\nCucuta: "+data.monitordolar.cucuta+
            "\nAmerican Kryptosbank: "+data.monitordolar.american_kryptosbank+
            "\nMovicambio: "+data.monitordolar.movicambio+
            "\n------------------------------------------\n"+
            "<b>Monitor Dolar:</b>"+
            "\nMonitor Dolar: "+data.monitordolar.monitor_dolar+
            "\nMonitor Euro: "+data.monitordolar.monitor_euro+
            "\nBCV: "+data.monitordolar.bcv+
            "\nPeso colomb: "+data.monitordolar.peso_col+
            "\nPetro: "+data.monitordolar.petro+
            "\nPaypal: "+data.monitordolar.paypal,
            {parse_mode : "HTML"});
            console.log("Mensaje enviado");
        }
    }else{
        sended = false;
        console.log("Esperando hora para enviar mensaje");
    }   
}

async function main() {

    var rates = await getRates();
    var message = await telegramBotMessage(rates);

}

setInterval(main, 60000);

module.exports = bot; 