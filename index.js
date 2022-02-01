const TelegramBot = require("node-telegram-bot-api");
const {registerCommandGroups} = require("./src/commands/commands");
const {Robot} = require("./src/robot");
const {warn} = require("./src/chat_ids");

const bot_token = process.env.VALEGRAM_BOT_TOKEN;
if (!bot_token) {
    console.error(
        "Telegram Bot API bot_token required in VALEGRAM_BOT_TOKEN"
    );
    process.exit(1);
}

const bot = new TelegramBot(bot_token, {polling: true, filepath: false});
const robot = new Robot(bot);
warn();
registerCommandGroups(robot, bot);
