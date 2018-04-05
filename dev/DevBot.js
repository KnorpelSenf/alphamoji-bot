require('dotenv').load();
const Slimbot = require('slimbot');
const slimbot = new Slimbot(process.env.DEV_BOT_API_TOKEN);

const database = require('./emoji');

// Register listeners
slimbot.on('message', message => {
    // get msg text
    var txt = message.text;
    // build unicode
    var unicode = touni(txt);
    console.log('Request with "' + txt + '" which is in unicode "' + unicode + '"');
    var searchres = findemoji(txt, unicode);

    var response;
    if (searchres)
        response = pretty(searchres);
    else
        response = 'Nothing found!';

    var params = {
        parse_mode: "html"
    }
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
        return database[unicode];
    var ps = undefined;
    var unils = unicode.split('-');
    if (unils.length <= 5) {
        ps = powerset(unils);
        for (i in ps)
            if (database[ps[i]])
                return database[ps[i]];
    }
    for (key in database) {
        var emoji = database[key];
        if(emoji.output === unicode)
            return emoji;
        if (ps)
            for (i in ps)
                if (emoji.output === ps[i])
                    return emoji;
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

function pretty(emoji) {
    console.log(JSON.stringify(emoji));
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
    var result =
        '<strong>' + name + '</strong>\n'
        + moji + '\n'
        + 'Unicode: <code>' + output + '</code>\n'
        + 'Alpha Name' + (alphanameslist.length > 1 ? 's' : '') + ': ' + alphanames
    console.log(result);
    return result;
}

slimbot.on('edited_message', message => {
  // reply when user edits a message
  slimbot.sendMessage(message.chat.id, 'Editing your message might not help, but at least it proves we can already detect that sort of event!');
});

// Call API
slimbot.startPolling();

//interesting
