const {CommandGroup} = require("./command_group");
const {filter} = require("../chat_ids");

class PresetSelectionCommandGroup extends CommandGroup {
    constructor(props) {
        super(props);
        this.selectPreset = this.selectPreset.bind(this);
        this.selectPresetValue = this.selectPresetValue.bind(this);
        this.onMessage = this.onMessage.bind(this);

        this.awaiting_response = new Set();
        this.awaiting_value = new Map();
    }

    fanAvailable() {
        return this.robot.capabilities.indexOf("FanSpeedControlCapability") !== -1;
    }

    waterUsageAvailable() {
        return (
            this.robot.capabilities.indexOf("WaterUsageControlCapability") !== -1
        );
    }

    available() {
        return this.fanAvailable() || this.waterUsageAvailable();
    }

    registerCommands() {
        this.bot.onText(/\/preset/, filter(this.selectPreset));
        this.bot.on("message", filter(this.onMessage));
    }

    getCommandList() {
        return [
            {
                command: "/preset",
                description: "Select preset values (fan speed/water usage)",
            },
        ];
    }

    selectPreset(msg) {
        if (!this.available()) {
            this.bot.sendMessage(msg.chat.id, "This robot does not support presets");
            return;
        }

        const fanSpeedAvailable = this.fanAvailable();
        const waterUsageAvailable = this.waterUsageAvailable();

        if (fanSpeedAvailable && waterUsageAvailable) {
            this.bot.sendMessage(msg.chat.id, "Please select the preset to change", {
                reply_markup: {
                    keyboard: [["Fan speed", "Water usage"], ["Cancel"]],
                    one_time_keyboard: true,
                },
            });
            this.awaiting_response.add(msg.chat.id);
        } else if (fanSpeedAvailable) {
            this.selectPresetValue("FanSpeedControlCapability", "fan speed", msg);
        } else if (waterUsageAvailable) {
            this.selectPresetValue("WaterUsageControlCapability", "water usage", msg);
        }
    }

    selectPresetValue(capability, name, msg) {
        this.robot
            .request(`robot/capabilities/${capability}/presets`, msg.chat.id)
            .then((res) => {
                const presets = res?.data || [];
                this.bot.sendMessage(
                    msg.chat.id,
                    `Please select the preset to change the ${name} to`,
                    {
                        reply_markup: {
                            keyboard: [
                                ...presets.map((p) => {
                                    return [p];
                                }),
                                ["Cancel"],
                            ],
                            one_time_keyboard: true,
                        },
                    }
                );
                this.awaiting_value.set(msg.chat.id, {
                    capability,
                    name,
                    presets,
                });
            });
    }

    onMessage(msg) {
        if (this.awaiting_response.has(msg.chat.id)) {
            this.awaiting_response.delete(msg.chat.id);
            const msg_txt = msg.text.toString().toLowerCase();
            if (msg_txt === "fan speed") {
                this.selectPresetValue("FanSpeedControlCapability", "fan speed", msg);
            } else if (msg_txt === "water usage") {
                this.selectPresetValue(
                    "WaterUsageControlCapability",
                    "water usage",
                    msg
                );
            }
        }

        if (this.awaiting_value.has(msg.chat.id)) {
            const {capability, name, presets} = this.awaiting_value.get(
                msg.chat.id
            );
            this.awaiting_value.delete(msg.chat.id);

            const msg_txt = msg.text.toString();
            if (msg_txt.toLowerCase() === "cancel") {
                return;
            }

            if (presets.indexOf(msg_txt) === -1) {
                this.bot.sendMessage(
                    msg.chat.id,
                    `Invalid preset for ${name}: ${msg_txt}`,
                    {
                        reply_markup: {
                            remove_keyboard: true,
                        },
                    }
                );
            } else {
                this.robot
                    .request(`robot/capabilities/${capability}/preset`, msg.chat.id, {
                        method: "PUT",
                        data: {
                            name: msg_txt,
                        },
                    })
                    .then(() => {
                        this.bot.sendMessage(
                            msg.chat.id,
                            `Changed preset for ${name} to ${msg_txt}`,
                            {
                                reply_markup: {
                                    remove_keyboard: true,
                                },
                            }
                        );
                    });
            }
        }
    }
}

module.exports = {PresetSelectionCommandGroup};
