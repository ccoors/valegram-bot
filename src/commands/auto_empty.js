const {CommandGroup} = require("./command_group");
const {filter} = require("../chat_ids");

class AutoEmptyTriggerCommandGroup extends CommandGroup {
    constructor(props) {
        super(props);
    }

    available() {
        return (
            this.robot.capabilities.indexOf(
                "AutoEmptyDockManualTriggerCapability"
            ) !== -1
        );
    }

    registerCommands() {
        this.bot.onText(
            /\/auto_empty/,
            filter((msg) => {
                if (!this.available()) {
                    this.bot.sendMessage(
                        msg.chat.id,
                        "This robot does not support the AutoEmptyDockManualTriggerCapability"
                    );
                    return;
                }
                this.robot.request(
                    "robot/capabilities/AutoEmptyDockManualTriggerCapability",
                    msg.chat.id,
                    {
                        method: "PUT",
                        data: {
                            action: "trigger",
                        },
                    }
                );
            })
        );
    }

    getCommandList() {
        return [
            {
                command: "/auto_empty",
                description: "Trigger auto-empty",
            },
        ];
    }
}

module.exports = {AutoEmptyTriggerCommandGroup};
