const Telegraf = require('telegraf');
const axios = require("axios");
const utf8 = require("utf8");
const bot = new Telegraf("apikey"); // Enter in your API key here

const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')

bot.use((ctx, next) => {
    const start = new Date()
    return next(ctx).then(() => {
      const ms = new Date() - start
      console.log('Response time %sms: (%s) %s', ms, ctx.message.from.username, ctx.message.text )
    })
  })

function apisearch(apiurl) {
    return axios.get(apiurl)
}
function apigetitem(apiurl) {
    return axios.get(apiurl)
}

function replySpell(ctx) {
    var spell = ctx.message.text
    spell = spell.replace(/\/spell /g,"")
    spell = spell.replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of every word
    keyboard = Markup.inlineKeyboard([
        Markup.urlButton('📜 Read the full text', 'https://roll20.net/compendium/dnd5e/' + spell)
        // Markup.callbackButton('Delete', 'delete')
      ])
    spell = spell.replace(/ /g,"+")
    apisearch(`http://dnd5eapi.co/api/spells/?name=${spell}`).then(function (response) {
        apigetitem(response.data.results[0].url).then(function (responsedata) {
            var msg = composeMessageSpell(responsedata.data)
            ctx.replyWithMarkdown(msg, Extra.markup(keyboard))
        });
    });
}

function replyMonster(ctx) {
    var monster = ctx.message.text
    monster = monster.replace(/\/monster /g,"")
    monster = monster.replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of every word
    keyboard = Markup.inlineKeyboard([
        Markup.urlButton('📜 Read the full text', 'https://roll20.net/compendium/dnd5e/' + monster)
        // Markup.callbackButton('Delete', 'delete')
      ])
    monster = monster.replace(/ /g,"+")
    apisearch(`http://dnd5eapi.co/api/monsters/?name=${monster}`).then(function (response) {
        apigetitem(response.data.results[0].url).then(function (responsedata) {
            var msg = composeMessageMonster(responsedata.data)
            ctx.replyWithMarkdown(msg, Extra.markup(keyboard))
        });
    });
}

function composeMessageMonster(monster) {
    console.log("Found " + monster.name)
    var msg = `***${monster.name}*** (*CR*: ${monster.challenge_rating})\n`
    msg += `_${monster.size}, ${monster.alignment}, ${monster.type} that can move ${monster.speed}_\n`

    msg += `\n*AC*: ${monster.armor_class} *HP*: ${monster.hit_points} *HD*: ${monster.hit_dice}\n`
    msg += `*STR*: ${monster.strength} *DEX*: ${monster.dexterity} *CON*: ${monster.constitution} *INT*: ${monster.intelligence} *WIS*: ${monster.wisdom} *CHA*: ${monster.charisma}\n`

    msg += `\n_Traits:_\n`
    for (var trait of monster.special_abilities) {
        msg += `*${trait.name}*: ${trait.desc}\n`
    }
    msg += `\n_Actions:_\n`
    for (var trait of monster.actions) {
        msg += `*${trait.name}*: ${trait.desc}\n`
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
    spelldesc = spelldesc.replace(/â€™/g,"'");
    spelldesc = spelldesc.replace(/â€�/g,"\"");
    spelldesc = spelldesc.replace(/â€œa/g,"\"");
    hl = hl+"".replace(/â€™/g,"'");
    hl = hl+"".replace(/â€�/g,"\"");
    hl = hl+"".replace(/â€œ/g,"\"");

    msg = `***${spell.name}*** R:${spell.range} ${spell.components}
${spell.duration}/${spell.casting_time}, Level ${spell.level} Spell

${spelldesc}

${hl}`

    return msg
}

// bot.start((ctx) => ctx.reply('Hey there!'))

bot.command('spell', (ctx) => replySpell(ctx) )
bot.command('monster', (ctx) => replyMonster(ctx) )
// bot.action('delete', ({ deleteMessage }) => deleteMessage())

bot.startPolling()