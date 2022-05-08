const {
    VALETUDO_ATTACHMENT_TYPES,
    VALETUDO_PRESET_TYPES,
} = require("../constants");
const {CommandGroup} = require("./command_group");
const {filter} = require("../chat_ids");

class StatusCommandGroup extends CommandGroup {
    constructor(props) {
        super(props);
        this.sendCurrentStatus = this.sendCurrentStatus.bind(this);
    }

    registerCommands() {
        this.bot.onText(/\/status/, filter(this.sendCurrentStatus));
        this.bot.onText(
            /\/capabilities/,
            filter((msg) => {
                this.bot
                    .sendMessage(
                        msg.chat.id,
                        `<pre>${this.robot.capabilities.sort().join("\n")}</pre>`,
                        {parse_mode: "HTML"}
                    )
                    .then();
            })
        );
    }

    getCommandList() {
        return [
            {
                command: "/status",
                description: "Show current robot status",
            },
            {
                command: "/capabilities",
                description: "List robot capabilities",
            },
        ];
    }

    sendCurrentStatus(msg) {
        this.robot.request("robot/state/attributes", msg.chat.id).then((res) => {
            const attributes = res?.data || [];

            let response = `Bot status:
${this.robot.manufacturer} ${this.robot.modelName} (${this.robot.implementation})\n`;

            attributes.forEach((attribute) => {
                if (attribute["__class"] === "BatteryStateAttribute") {
                    response += `> Battery: ${attribute["level"]} %\n`;
                } else if (attribute["__class"] === "StatusStateAttribute") {
                    response += `> Status: ${attribute["value"]}\n`;
                } else if (attribute["__class"] === "AttachmentStateAttribute") {
                    const attachmentName =
                        VALETUDO_ATTACHMENT_TYPES[attribute["type"]] ?? attribute["type"];
                    response += `> Attachment '${attachmentName}' is ${
                        attribute["attached"] ? "" : "not "
                    }attached\n`;
                } else if (attribute["__class"] === "PresetSelectionStateAttribute") {
                    const presetName =
                        VALETUDO_PRESET_TYPES[attribute["type"]] ?? attribute["type"];
                    response += `> Preset '${presetName}' is ${attribute["value"]}\n`;
                }
            });
            this.bot.sendMessage(msg.chat.id, response).then();
        });
    }
}

module.exports = {StatusCommandGroup};
