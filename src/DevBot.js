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
    var reponse = pretty(searchres);

    slimbot.sendMessage(message.chat.id, 'Searching for ' + unicode);
    slimbot.sendMessage(message.chat.id, response);


  //  var msg = "";
  //slimbot.sendMessage(message.chat.id, msg);

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
    if(database.key.output===unicode) {
      return database.key;
    }
  }
}

slimbot.on('edited_message', message => {
  // reply when user edits a message
  slimbot.sendMessage(message.chat.id, 'Editing your message might not help, but at least it proves we can already detect that sort of event!');
});

// Call API
slimbot.startPolling();

//interesting
