
const Telegraf = require('telegraf');
const functions = require('firebase-functions');

const bot = new Telegraf(functions.config().telegrambot.key);

bot.hears('hi', (ctx) => ctx.reply('Hey there'));
bot.command('help', ctx => ctx.reply('список команд:\n' +
    '\n' +
    '/rancor X[.Y]\n' +
    '\n' +
    'внесение % урона в таблицу, где X и Y цифры, разделённые точкой. разрешённый диапазон: 0-30\n' +
    '\n' +
    '/rancor ls\n' +
    '\n' +
    'просмотр таблицы (ls от list)\n' +
    '\n' +
    '/rancor clear\n' +
    '\n' +
    'очистка таблицы (происходит автоматически по достижении 110% суммарного урона и после команды call).\n' +
    '\n' +
    '/rancor call\n' +
    '\n' +
    'принудительное оповещение игроков в таблице о фиксации урона (происходит автоматически по достижении 110% суммарного урона).\n' +
    '\n' +
    '/rancor set\n' +
    '\n' +
    'настройки'));

bot.command('Мішаня', ctx => ctx.reply('Мішаня - наш лідер!'));
bot.launch();

exports.bot = functions.https.onRequest((req, res) => {
    bot.handleUpdate(req.body, res);
})