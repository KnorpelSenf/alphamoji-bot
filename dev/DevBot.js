require('dotenv').load();
const Slimbot = require('slimbot');
const slimbot = new Slimbot(process.env.DEV_BOT_API_TOKEN);

const config = require('./botconfig');
const database = require('./emoji_dev');

// prevent zeit.co from restarting the bot
require('http').createServer().listen(3000);

// Register listeners
slimbot.on('message', message => {
    var chatType = message.chat.type;
    if (chatType === 'channel')
        return;
    var response;    
    var params = {
        parse_mode: "html"
    }

    if (message.hasOwnProperty('text')) {
        // get msg text
        var txt = message.text;
	
	if (message.hasOwnProperty('entities') && message.entities[0].type === 'bot_command') {
            
            if (txt.startsWith('/start') || txt.startsWith('/help'))
                response = config.helpmsg;
            else if (txt.startsWith('/search'))
                if (chatType === 'group' || chatType === 'supergroup') {
                    response = 'Hi! How can I help?';
                    params.reply_to_message_id = message.message_id;
                    params.reply_markup = JSON.stringify({
                        force_reply: true,
                        selective: true
                    });
                } else {
                    response = "This command can be used in groups to search for an emoji. In this chat, I'm always listening to you."
                }
            else if (txt.startsWith('/feedback'))
                response = 'Like this bot? Hit this link and rate it!\nhttps://telegram.me/storebot?start=alphamojibot';
            else
                response = 'Unknown command. Try /help';
            
        } else {
            // build unicode
            var unicode = touni(txt);
            
            var searchres = findemoji(txt, unicode);

            console.log(searchres);
            
            if (searchres && searchres.length > 0)
                response = prettySearchRes(searchres);
            else
                response = 'Nothing found! Try less input or shorter words.';
        }
        
    } else if (chatType === 'group' || chatType === 'supergroup') {
        return;
    } else {
        response = 'This bot currently only supports searching alpha names for emoji! Type /help for an introduction.';
    }

    if (chatType !== 'channel')
        slimbot.sendMessage(message.chat.id, response, params);
});

function touni(emoji) {
    var len = emoji.length;
    var unicode = "";
    for (var i = 0; i < len; i ++) {
        var c = emoji.codePointAt(i);
        var u = c.toString(16);
        while (u.length < 4)
            u = '0' + u;
        unicode += u;
        if (i < len - 1)
            unicode += "-";
    }
    return unicode;
}
    
function findemoji(txt, unicode) {
    if (database[unicode])
        return [database[unicode]];
    var unils = unicode.split('-').slice(0, 5);
    var ps = powerset(unils);
    ps.sort(function(a,b) {
        return b.length - a.length;
    });
    for (i in ps) {
        var code = '';
        for (var j = 0; j < ps[i].length; j++) {
            code += ps[i][j];
            if (j < ps[i].length - 1)
                code += '-';
        }
        for (key in database) {
            var emoji = database[key];
            if (emoji.output === code) {
                return [emoji];
            }
        }
        if (database[code]) {
            return [database[code]];
        }
    }
}

// taken from SO (see https://stackoverflow.com/a/42774126/4453823)
function powerset(array) {
    function fork(i, t) {
        if (i === array.length) {
            result.push(t);
            return;
        }
        fork(i + 1, t.concat([array[i]]));
        fork(i + 1, t);
    }

    var result = [];
    fork(0, []);
    return result;
}

function prettySearchRes(emojiList) {
    var res = '';
    for (i in emojiList) {
        res += pretty(emojiList[i]) + '\n';
    }
    return res;
}

function pretty(emoji) {
    // get name
    var name = emoji.name;
    // get unicode output
    var output = emoji.output;
    // get emoji
    var moji = '';
    var ls = output.split("-");
    for (i in ls) {
        var toInt = parseInt(ls[i], 16);
        var toChar = String.fromCodePoint(toInt);
        moji += toChar;
    }
    // get alpha names (including aliases)
    var alphanames = '';
    var alphanameslist = [ emoji.alpha_code ];
    var aliasesList = emoji.aliases.split("|");
    for (key in aliasesList) {
        if (aliasesList[key].length > 0)
            alphanameslist.push(aliasesList[key]);
    }
    var count = alphanameslist.length;
    for (var i = 0; i < count; i++) {
        var append = '<code>' + alphanameslist[i] + '</code>';
        if (i < count - 1)
            append += ', ';
        alphanames += append;
    }
    return '<strong>' + name + '</strong>\n'
        + moji + '\n'
        + 'Unicode: <code>' + output + '</code>\n'
        + 'Alpha Name' + (alphanameslist.length > 1 ? 's' : '') + ': ' + alphanames;
}

slimbot.on('edited_message', message => {
  // reply when user edits a message
  slimbot.sendMessage(message.chat.id, 'Editing your message might do much yet, but at least it proves we can already detect that sort of event!');
});

// Call API
slimbot.startPolling();

