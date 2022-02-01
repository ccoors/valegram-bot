const {CommandGroup} = require("./command_group");
const {filter} = require("../chat_ids");

class BasicCommandGroup extends CommandGroup {
    constructor(props) {
        super(props);
        this.command = this.command.bind(this);
        this.run_command = this.run_command.bind(this);

        this.awaiting_command = new Set();
    }

    available() {
        return this.robot.capabilities.indexOf("BasicControlCapability") !== -1;
    }

    registerCommands() {
        this.bot.onText(/\/command(.*)/, filter(this.command));

        this.bot.onText(
            /^Start$/,
            filter((msg) => this.run_command(msg, "start"))
        );
        this.bot.onText(
            /^Stop$/,
            filter((msg) => this.run_command(msg, "stop"))
        );
        this.bot.onText(
            /^Pause$/,
            filter((msg) => this.run_command(msg, "pause"))
        );
        this.bot.onText(
            /^Home$/,
            filter((msg) => this.run_command(msg, "home"))
        );
        this.bot.onText(
            /^Cancel$/,
            filter((msg) => {
                this.run_command(msg, "");
            })
        );
    }

    getCommandList() {
        return [
            {
                command: "/command",
                description: "Execute basic command",
            },
        ];
    }

    command(msg, command) {
        const cmd = command[1].toLowerCase().trim();
        if (cmd === "") {
            this.bot.sendMessage(msg.chat.id, "Please select command", {
                reply_markup: {
                    keyboard: [["Start", "Stop"], ["Pause", "Home"], ["Cancel"]],
                    one_time_keyboard: true,
                },
            });

            this.awaiting_command.add(msg.chat.id);
            return;
        }

        this.run_command(msg, cmd, true);
    }

    run_command(msg, command, force = false) {
        if (force || this.awaiting_command.has(msg.chat.id)) {
            this.awaiting_command.delete(msg.chat.id);
            if (!command) {
                return;
            }
            this.robot.request(
                "robot/capabilities/BasicControlCapability",
                msg.chat.id,
                {
                    method: "PUT",
                    data: {
                        action: command,
                    },
                }
            );
        }
    }
}

module.exports = {BasicCommandGroup};
