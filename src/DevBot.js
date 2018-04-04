var fs = require("fs");
require('dotenv').load();
const Slimbot = require('slimbot');
const slimbot = new Slimbot(process.env.DEV_BOT_API_TOKEN);

const database = JSON.parse(fs.readFileSync("emoji.json"));
const keys = Object.keys(database);

// Register listeners
slimbot.on('message', message => {
    // get msg text
    var txt = message.text;
    var len = txt.length;
    // build unicode
    var unicode = "";
    for (var i = 0; i < len; i ++) {
        var c = txt.charCodeAt(i);
        var u = c.toString(16);
        while (u.length < 4)
            u = '0' + u;
        unicode += u;
        if (i < len - 1)
            unicode += "-";
    }
    slimbot.sendMessage(message.chat.id, 'Searching for ' + unicode);
    var msg = "";
    // find entry in res

    var key = keys[0];
    var emoji = database.key;
    var debug = JSON.stringify(emoji);
    slimbot.sendMessage(message.chat.id, 'key is ' + key);
    slimbot.sendMessage(message.chat.id, 'emoji is ' + emoji);
    slimbot.sendMessage(message.chat.id, 'debug is ' + debug);
    
    for (var i = 0; i < keys.length; i++) {
        var emoji = database.keys[i];
        if (emoji.output === unicode) {
            msg = emoji.name;
            break;
        }
    }
    if (msg.length === 0)
        msg = 'Nothing found!';
    slimbot.sendMessage(message.chat.id, msg);
    
});

slimbot.on('edited_message', message => {
  // reply when user edits a message
  slimbot.sendMessage(message.chat.id, 'Editing your message might not help, but at least it proves we can already detect that sort of event!');
});

// Call API
slimbot.startPolling();
