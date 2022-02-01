const {StatusCommandGroup} = require("./status");
const {MapCommandGroup} = require("./map");
const {PresetSelectionGroup} = require("./presets");
const {BasicCommandGroup} = require("./basic_commands");
const {LocateCommandGroup} = require("./locate");
const {AutoEmptyTriggerCommandGroup} = require("./auto_empty");
const {SegmentationCommandGroup} = require("./segmentation");
const {filter, CHAT_IDS} = require("../chat_ids");

const COMMAND_GROUPS = [];

function registerCommandGroups(robot, bot) {
    COMMAND_GROUPS.push(new StatusCommandGroup({robot, bot}));
    COMMAND_GROUPS.push(new BasicCommandGroup({robot, bot}));
    COMMAND_GROUPS.push(new SegmentationCommandGroup({robot, bot}));
    COMMAND_GROUPS.push(new LocateCommandGroup({robot, bot}));
    COMMAND_GROUPS.push(new MapCommandGroup({robot, bot}));
    COMMAND_GROUPS.push(new PresetSelectionGroup({robot, bot}));
    COMMAND_GROUPS.push(new AutoEmptyTriggerCommandGroup({robot, bot}));

    COMMAND_GROUPS.forEach((g) => {
        g.registerCommands();
    });

    robot.onStatusStateChange((newStatusState) => {
        CHAT_IDS.forEach(chat_id => {
            bot.sendMessage(chat_id, `Robot is now ${newStatusState}`).then();
        });
    });

    bot.onText(
        /\/help/,
        filter((msg) => {
            let helpText = "Available commands:\n/help - Show help text\n";
            COMMAND_GROUPS.filter((g) => g.available()).forEach((g) => {
                g.getCommandList().forEach((cmd) => {
                    helpText += `${cmd.command} - ${cmd.description}\n`;
                });
            });
            helpText += "/chat_id - Get chat id";
            helpText = helpText.trim();
            bot.sendMessage(msg.chat.id, helpText).then();
        })
    );

    bot.onText(/\/chat_id/, (msg) => {
        bot.sendMessage(msg.chat.id, `Your chat id is ${msg.chat.id}`).then();
    });

    // Apparently this is funny... *shrug*
    bot.onText(/\/castrop/, filter((msg) => {
        bot.sendMessage(msg.chat.id, "Rauxel");
        bot.sendLocation(msg.chat.id, 51.555232, 7.314817, {
            horizontal_accuracy: 1500,
        });
    }));
}

module.exports = {registerCommandGroups};
