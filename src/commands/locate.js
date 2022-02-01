const {CommandGroup} = require("./command_group");
const {filter} = require("../chat_ids");

class LocateCommandGroup extends CommandGroup {
    constructor(props) {
        super(props);
    }

    available() {
        return this.robot.capabilities.indexOf("LocateCapability") !== -1;
    }

    registerCommands() {
        this.bot.onText(
            /\/locate/,
            filter((msg) => {
                this.robot.request("robot/capabilities/LocateCapability", msg.chat.id, {
                    method: "PUT",
                    data: {
                        action: "locate",
                    },
                });
            })
        );
    }

    getCommandList() {
        return [
            {
                command: "/locate",
                description: "Locate robot",
            },
        ];
    }
}

module.exports = {LocateCommandGroup};
