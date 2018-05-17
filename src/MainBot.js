require('dotenv').load();
const Slimbot = require('slimbot');
const slimbot = new Slimbot(process.env.BOT_API_TOKEN);

const config = require('./botconfig');
const database = require('./emoji');

// prevent zeit.co from restarting the bot
require('http').createServer().listen(3000);

// Register listeners
slimbot.on('message', message => {
    var chatType = message.chat.type;
    if (chatType === 'channel')
        return;
    var response;    
    var params = {
        parse_mode: "html",
        reply_to_message_id: message.message_id
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

            // console.log(searchres);
            
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

slimbot.on('edited_message', message => {
  // reply when user edits a message
  slimbot.sendMessage(message.chat.id, 'Editing your message might do much yet, but at least it proves we can already detect that sort of event!');
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
    var unicodeResults = findByUnicode(unicode);
    var txtResults = findByText(txt);
    return unicodeResults.concat(txtResults);
}

function findByUnicode(unicode) {
    if (database[unicode])
        return [database[unicode]];
    var unils = unicode.split('-').slice(0, 5);
    var ps = powerset(unils);
    // sorting by length is superfluous when using the current ps impl
    // ps.sort(function(a,b) {
    //     return b.length - a.length;
    // });
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
    return [];
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

function findByText(txt) {
    txt = txt.toLowerCase();
    
    var result = [];
    // prios (eq equals, ic includes, sw startsWith, ew endsWith)
    
    //  0 -- name eq
    //  1 -- alpha code eq
    //  2 -- name word eq
    //  3 -- alpha code word eq
    
    //  4 -- name sw
    //  5 -- name ew
    //  6 -- alpha code sw
    //  7 -- alpha code ew
    //  8 -- name word sw
    //  9 -- name word ew
    // 10 -- alpha code word sw
    // 11 -- alpha code word ew
    
    // 12 -- name ic
    // 13 -- alpha code ic
    // 14 -- name word ic
    // 15 -- alpha code word ic
    
    var stripColons = function(alphaCode) {
        return alphaCode.slice(1, alphaCode.length - 1);
    }

    SEARCH:
    for (key in database) {
        // emoji
        var emoji = database[key];
        // emoji name
        var ename = emoji.name.toLowerCase();
        // emoji alpha codes
        var ecodes = [emoji.alpha_code]
            .concat(emoji.aliases.split('|'))
            .filter(e => e !== '')
            .map(ac => ac.toLowerCase());
        // emoji alpha codes without colons
        var icodes = ecodes.map(stripColons);
        // emoji alpha codes with and without colons
        var codes = ecodes.concat(icodes);
        // words in emoji name
        var enameWords = ename.split(' ');
        // words in emoji alpha codes
        var icodeWords = icodes.join(' ').replace(/_/g, ' ').split(' ');
        
        // EQUALS
        // name eq
        if (ename === txt) {
            result.push({ em: emoji, prio: 0 });
            continue SEARCH;
        }
        // alpha code eq
        for (i in codes) {
            if (codes[i] === txt) {
                result.push({ em: emoji, prio: 1 });
                continue SEARCH;
            }
        }
        // name word eq
        for (i in enameWords) {
            if (enameWords[i] === txt) {
                result.push({ em: emoji, prio: 2 });
                continue SEARCH;
            }
        }
        // alpha code word eq
        for (i in icodeWords) {
            if (icodeWords[i] === txt) {
                result.push({ em: emoji, prio: 3 });
                continue SEARCH;
            }
        }

        // STARTS WITH & ENDS WITH
        // name sw&ew
        if (ename.startsWith(txt)) {
            result.push({ em: emoji, prio: 4 });
            continue SEARCH;
        }
        if (ename.endsWith(txt)) {
            result.push({ em: emoji, prio: 5 });
            continue SEARCH;
        }
        // alpha code sw&ew
        for (i in codes) {
            if (codes[i].startsWith(txt)) {
                result.push({ em: emoji, prio: 6 });
                continue SEARCH;
            }
        }
        for (i in codes) {
            if (codes[i].endsWith(txt)) {
                result.push({ em: emoji, prio: 7 });
                continue SEARCH;
            }
        }
        // name word sw&ew
        for (i in enameWords) {
            if (enameWords[i].startsWith(txt)) {
                result.push({ em: emoji, prio: 8 });
                continue SEARCH;
            }
        }
        for (i in enameWords) {
            if (enameWords[i].endsWith(txt)) {
                result.push({ em: emoji, prio: 9 });
                continue SEARCH;
            }
        }
        // alpha code word sw&ew
        for (i in icodeWords) {
            if (icodeWords[i].startsWith(txt)) {
                result.push({ em: emoji, prio: 10 });
                continue SEARCH;
            }
        }
        for (i in icodeWords) {
            if (icodeWords[i].endsWith(txt)) {
                result.push({ em: emoji, prio: 11 });
                continue SEARCH;
            }
        }

        // INCLUDES
        // name ic
        if (ename.includes(txt)) {
            result.push({ em: emoji, prio: 12 });
            continue SEARCH;
        }
        // alpha code ic
        for (i in codes) {
            if (codes[i].includes(txt)) {
                result.push({ em: emoji, prio: 13 });
                continue SEARCH;
            }
        }
        // name word ic
        for (i in enameWords) {
            if (enameWords[i].includes(txt)) {
                result.push({ em: emoji, prio: 14 });
                continue SEARCH;
            }
        }
        // alpha code word ic
        for (i in icodeWords) {
            if (icodeWords[i].includes(txt)) {
                result.push({ em: emoji, prio: 15 });
                continue SEARCH;
            }
        }
        
    }
    result.sort((a,b) => a.prio - b.prio);
    return result.map(o => o.em);
}

function prettySearchRes(emojiList) {
    var res = '';
    displayList = emojiList.slice(0, 10);
    if (displayList.length < emojiList.length) {
        res = '(<em>showing top ' + displayList.length + ' of ' + emojiList.length
            + ' total results</em>)\n';
    } else if (emojiList.length > 1) {
        res = '(<em>showing all ' + emojiList.length + ' results</em>)\n';
    }
    for (i in displayList) {
        if (displayList.length > 1) {
            res += '[Result ' + (Number(i) + 1) + ']:\n';
        }
        res += pretty(displayList[i]) + '\n\n';
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
    return '<strong>' + name + '</strong>\n<code>'
        + moji + '</code>\n'
        + 'Unicode: <code>' + output + '</code>\n'
        + 'Alpha Name' + (alphanameslist.length > 1 ? 's' : '') + ': ' + alphanames;
}

// Call API
slimbot.startPolling();

