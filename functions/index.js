
const Telegraf = require('telegraf');
const functions = require('firebase-functions');
const admin = require("firebase-admin");
admin.initializeApp();
const firestore = admin.firestore();

const bot = new Telegraf(functions.config().telegrambot.key);


bot.hears('hi', (ctx) => ctx.reply('Hey there'));
// bot.command('help', ctx => ctx.reply('список команд:\n' +
//     '\n' +
//     '/rancor X[.Y]\n' +
//     '\n' +
//     'внесение % урона в таблицу, где X и Y цифры, разделённые точкой. разрешённый диапазон: 0-30\n' +
//     '\n' +
//     '/rancor ls\n' +
//     '\n' +
//     'просмотр таблицы (ls от list)\n' +
//     '\n' +
//     '/rancor clear\n' +
//     '\n' +
//     'очистка таблицы (происходит автоматически по достижении 110% суммарного урона и после команды call).\n' +
//     '\n' +
//     '/rancor call\n' +
//     '\n' +
//     'принудительное оповещение игроков в таблице о фиксации урона (происходит автоматически по достижении 110% суммарного урона).\n' +
//     '\n' +
//     '/rancor set\n' +
//     '\n' +
//     'настройки'));
//
bot.command('leader', ctx => ctx.reply('Мішаня - наш лідер!'));
bot.command('rancor', async ctx => {
    try {
        const regex = /^\/([^@\s]+)@?(?:(\S+)|)\s?([\s\S]*)$/i;
        const parts = regex.exec(ctx.message.text);
        const value = parts[3];
        if (!value) {
            return ctx.reply(getDisplayName(ctx) + ', треба ввести, скільки відсотків урона ти набив або якусь команду');
        }

        if ('ls' === value) {
            const snapshot = await firestore
                .collection('rancor')
                .doc('chat' + ctx.chat.id)
                .collection('users')
                .get()
            ;
            const tableReducer = (accumulator, currentValue) => {
                return accumulator + '\n|' +
                    (currentValue.data().user.username ?  currentValue.data().user.username : currentValue.data().user.first_name) +
                    '\t|\t\t|' + Math.round(100*currentValue.data().value)/100 + '|';
            }
            const sumReducer = (accumulator, currentValue) => {
                return accumulator + currentValue.data().value;
            }

            const output = snapshot.docs.reduce(tableReducer, '-----------') +
                '\n-----------\n|Всього людей:\t|\t\t|' + snapshot.docs.length +
                '\n-----------\n|Всього відсотків:\t|\t\t|' +
                Math.round(100*snapshot.docs.reduce(sumReducer, 0))/100 + '|'
            ;

            return ctx.reply(output);
        }

        if ('clear' === value) {
            await deleteAllResults(ctx);

            return ctx.reply('Всі ваши результати знищено');
        }

        if('call' === value) {
            const snapshot = await firestore
                .collection('rancor')
                .doc('chat' + ctx.chat.id)
                .collection('users')
                .get()
            ;
            const promises = snapshot.docs.map(doc => bot.telegram.sendMessage(doc.data().user.id, 'Фіксуємо результат!'));
            await Promise.all(promises);

            return ctx.reply('Сповіщення надіслани!');
        }

        if (Number(value)) {
            const userId = ctx.from.first_name + '-' + ctx.from.id;
            const rancorRef = firestore
                .collection('rancor')
                .doc('chat' + ctx.chat.id)
                .collection('users')
                .doc(userId)
            ;
            const snapshot = await rancorRef.get();
            if (snapshot.exists) {
                await rancorRef.update({user: ctx.from, value: Math.round(100*Number(value))/100});
            } else {
                await rancorRef.create({user: ctx.from, value: Math.round(100*Number(value))/100});
            }

            return ctx.reply(getDisplayName(ctx) + ', записав тобі ' + value);
        }


        return ctx.reply('Щось я тебе не розумію, ' + getDisplayName(ctx) + ', ти написав ' + value)
    } catch (e) {
        return ctx.reply('Сталася якась помилка: ' + e.message);
    }
});

bot.launch();

exports.bot = functions.region('europe-west6').https.onRequest((req, res) => {
    bot.handleUpdate(req.body, res);
});

const getDisplayName = (ctx) => {
    if(ctx.from.first_name || ctx.from.last_name) {
        return ctx.from.first_name || '' + ' ' + ctx.from.last_name || '';
    } else {
        return ctx.from.username;
    }
}

const deleteAllResults = async (ctx) => {
    const snapshot = await firestore
        .collection('rancor')
        .doc('chat' + ctx.chat.id)
        .collection('users')
        .get();
    const promises = snapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(promises);
}