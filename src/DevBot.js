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
    var searchres = findemoji(txt, unicode);

    var response;
    if (searchres)
        reponse = pretty(searchres);
    else
        response = 'Nothing found!';

    slimbot.sendMessage(message.chat.id, response);
});

function touni(emoji) {
  var len = emoji.length;
  var unicode = "";
  for (var i = 0; i < len; i ++) {
      var c = emoji.charCodeAt(i);
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
  for (key in database) {
    if(key.output===unicode) {
      return database.key;
    }
  }
}

function pretty(emoji) {
    var name = emoji.name;
    var output = emoji.output;
    var alphanames = [emoji.alpha_code].push(emoji.aliases.split("|"));
    var count = alphanames.length;
    var result = '**' + name + '**\n\nUnicode: ' + output + '\nAlpha Names: ';
    for (var i = 0; i < count; i++) {
        var append = '`' + alphanames[i] + '`';
        if (i < count - 1)
            append += ', ';
        result += append;
    }
    return result;
}

slimbot.on('edited_message', message => {
  // reply when user edits a message
  slimbot.sendMessage(message.chat.id, 'Editing your message might not help, but at least it proves we can already detect that sort of event!');
});

// Call API
slimbot.startPolling();

//interesting
