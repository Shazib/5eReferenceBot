const Telegraf = require('telegraf');
const axios = require("axios");
const utf8 = require("utf8");

const bot = new Telegraf('api-token');

const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')

bot.use((ctx, next) => {
    const start = new Date()
    return next(ctx).then(() => {
        const ms = new Date() - start
    })
})

function apisearch(apiurl) {
    return axios.get(apiurl)
}
function apigetitem(apiurl) {
    return axios.get(apiurl)
}

function replySpell(ctx) {

    var spell = ctx.message.text;
    spell = spell.replace(/\/spell /g, "");

    var keyboard = Markup.inlineKeyboard([
        Markup.urlButton('📜 Read the full text', 'https://roll20.net/compendium/dnd5e/' + spell)
        // Markup.callbackButton('Delete', 'delete')
    ]);

    spell = spell.replace(/ /g, "-");
    spell = spell.toLowerCase();

    apisearch(`http://dnd5eapi.co/api/spells/${spell}`).then(function (response) {
        var msg = composeMessageSpell(response.data);
        ctx.replyWithMarkdown(msg, Extra.markup(keyboard));
    });
}

function replyMonster(ctx) {

    var monster = ctx.message.text;
    monster = monster.replace(/\/monster /g, "");

    var keyboard = Markup.inlineKeyboard([
        Markup.urlButton('📜 Read the full text', 'https://roll20.net/compendium/dnd5e/' + monster)
    ]);

    monster = monster.replace(/ /g, "-");
    monster = monster.toLowerCase();

    apisearch(`http://dnd5eapi.co/api/monsters/${monster}`).then(function (response) {
        var msg = composeMessageMonster(response.data);
        ctx.replyWithMarkdown(msg, Extra.markup(keyboard));
    });
}

function composeMessageMonster(monster) {
    console.log("Found " + monster.name)
    var msg = `***${monster.name}*** (*CR*: ${monster.challenge_rating})\n`
    msg += `_${monster.size}, ${monster.alignment}, ${monster.type} that can move ${monster.speed}_\n`

    msg += `\n*AC*: ${monster.armor_class} *HP*: ${monster.hit_points} *HD*: ${monster.hit_dice}\n`
    msg += `*STR*: ${monster.strength} *DEX*: ${monster.dexterity} *CON*: ${monster.constitution} *INT*: ${monster.intelligence} *WIS*: ${monster.wisdom} *CHA*: ${monster.charisma}\n`

    if (monster.special_abilities) {
        msg += `\n_Traits:_\n`
        for (var trait of monster.special_abilities) {
            msg += `*${trait.name}*: ${trait.desc}\n`
        }
    }

    if (monster.actions) {
        msg += `\n_Actions:_\n`
        for (var trait of monster.actions) {
            msg += `*${trait.name}*: ${trait.desc}\n`
        }
    }

    if (monster.damage_immunities || monster.damage_resistances || monster.damage_vulnerabilities || monster.condition_immunities) { msg += `\n` }
    if (monster.damage_vulnerabilities) { msg += `*Vulnerable* to ${monster.damage_vulnerabilities}\n` }
    if (monster.damage_resistances) { msg += `*Resistance* to ${monster.damage_resistances}\n` }
    if (monster.damage_immunities) { msg += `*Immune (dmg)* to ${monster.damage_resistances}\n` }
    if (monster.condition_immunities) { msg += `*Cannot be* ${monster.condition_immunities}\n` }

    return msg
}

function composeMessageSpell(spell) {
    console.log("Found " + spell.name)
    var spelldesc = spell.desc + ""
    var hl = spell.higher_level || "_This spell has no higher level function_";
    // Weird encoding errors?
    spelldesc = spelldesc.replace(/â€™/g, "'");
    spelldesc = spelldesc.replace(/â€�/g, "\"");
    spelldesc = spelldesc.replace(/â€œa/g, "\"");
    hl = hl + "".replace(/â€™/g, "'");
    hl = hl + "".replace(/â€�/g, "\"");
    hl = hl + "".replace(/â€œ/g, "\"");

    msg = `***${spell.name}*** R:${spell.range} ${spell.components}
${spell.duration}/${spell.casting_time}, Level ${spell.level} Spell
${spelldesc}
${hl}`

    return msg
}

bot.start((ctx) => ctx.reply('Hey there!'))

bot.command('spell', (ctx) => replySpell(ctx))
bot.command('monster', (ctx) => replyMonster(ctx))
// bot.action('delete', ({ deleteMessage }) => deleteMessage())

/* AWS Lambda handler function */
exports.handler = (event, context, callback) => {
    bot.handleUpdate(event); // make Telegraf process that data

    return callback(null, { // return something for webhook, so it doesn't try to send same stuff again
        statusCode: 200,
        body: '',
    });
};

process.on('uncaughtException', function (err) {
    console.log(err);
}); 