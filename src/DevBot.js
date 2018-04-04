require('dotenv').load();
const Slimbot = require('slimbot');
const slimbot = new Slimbot(process.env.DEV_BOT_API_TOKEN);

// Register listeners
slimbot.on('message', message => {
  // reply when user sends a message
  slimbot.sendMessage(message.chat.id, 'This bot is still under development and might not always be online, please stay tuned!');
});

slimbot.on('edited_message', message => {
  // reply when user edits a message
  slimbot.sendMessage(message.chat.id, 'Editing your message might not help, but at least it proves we can already detect that sort of event!');
});

// Call API
slimbot.startPolling();

//interesting
