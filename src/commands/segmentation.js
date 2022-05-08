const {CommandGroup} = require("./command_group");
const {filter} = require("../chat_ids");

const STAGES = {
    SELECT_SEGMENTS: 1,
    SELECT_ITERATIONS: 2,
};

class SegmentationCommandGroup extends CommandGroup {
    constructor(props) {
        super(props);
        this.segmentClean = this.segmentClean.bind(this);
        this.keyboard = this.keyboard.bind(this);
        this.make_segment_keyboard = this.make_segment_keyboard.bind(this);
        this.make_iterations_keyboard = this.make_iterations_keyboard.bind(this);
        this.onMessage = this.onMessage.bind(this);

        this.awaiting_command = new Map();

        this.properties = null;
    }

    available() {
        return this.robot.capabilities.indexOf("MapSegmentationCapability") !== -1;
    }

    fetchProperties() {
        if (this.available() && !this.properties) {
            this.robot
                .request("robot/capabilities/MapSegmentationCapability/properties")
                .then((res) => {
                    this.properties = res?.data || null;
                });
        }
    }

    registerCommands() {
        this.bot.onText(/\/segment_clean/, filter(this.segmentClean));
        this.bot.on("message", filter(this.onMessage));

        this.fetchProperties();
    }

    getCommandList() {
        return [
            {
                command: "/segment_clean",
                description: "Start cleaning task with custom segments",
            },
        ];
    }

    segmentClean(msg) {
        if (!this.available()) {
            this.bot.sendMessage(
                msg.chat.id,
                "This robot does not support map segmentation"
            );
            return;
        }
        this.fetchProperties();

        this.robot
            .request("robot/capabilities/MapSegmentationCapability", msg.chat.id)
            .then((res) => {
                const available_segments = new Map();
                const segments = res?.data || [];
                segments.forEach((segment) => {
                    available_segments.set(segment.id, segment.name);
                });

                this.awaiting_command.set(msg.chat.id, {
                    available_segments: available_segments,
                    selected_segments: [],
                    stage: STAGES.SELECT_SEGMENTS,
                });
                this.keyboard(msg.chat.id);
            });
    }

    make_segment_keyboard(chat_id) {
        const {available_segments, selected_segments} =
            this.awaiting_command.get(chat_id);
        const ret = [];
        let add = [];
        for (const [key, value] of available_segments) {
            if (selected_segments.indexOf(key) === -1) {
                add.push(value || key);
                if (add.length === 2) {
                    ret.push(add);
                    add = [];
                }
            }
        }
        if (add.length) {
            ret.push(add);
        }
        if (selected_segments.length) {
            ret.push(["Cancel", "Done"]);
        } else {
            ret.push(["Cancel"]);
        }

        return ret;
    }

    make_iterations_keyboard() {
        const ret = [[]];
        for (let i = this.properties?.iterationCount?.min || 0; i <= Math.min(this.properties?.iterationCount?.max || 0, 4); i++) {
            ret[0].push(`${i}`);
        }
        ret[0].push("Cancel");
        return ret;
    }

    keyboard(chat_id) {
        if (!this.awaiting_command.has(chat_id)) {
            return;
        }

        const {stage} = this.awaiting_command.get(chat_id);
        let keyboard = [];
        let msg = "";
        if (stage === STAGES.SELECT_SEGMENTS) {
            keyboard = this.make_segment_keyboard(chat_id);
            msg = "Please select segments to clean";
        } else if (stage === STAGES.SELECT_ITERATIONS) {
            keyboard = this.make_iterations_keyboard();
            msg = "Please select cleaning iterations";
        }

        this.bot.sendMessage(chat_id, msg, {
            reply_markup: {
                keyboard,
                one_time_keyboard: true,
            },
        });
    }

    onMessage(msg) {
        if (this.awaiting_command.has(msg.chat.id)) {
            if (msg.text.toString().toLowerCase() === "cancel") {
                this.awaiting_command.delete(msg.chat.id);
                return;
            }

            const {stage, available_segments, selected_segments} = this.awaiting_command.get(msg.chat.id);
            switch (stage) {
            case STAGES.SELECT_SEGMENTS: {
                const segmentName = msg.text.toString();
                if (segmentName.toLowerCase() === "done" && selected_segments.length) {
                    this.awaiting_command.get(msg.chat.id).stage = STAGES.SELECT_ITERATIONS;
                } else {
                    let segmentId = -1;
                    for (const [key, value] of available_segments) {
                        if (segmentName === (value || key)) {
                            segmentId = key;
                            break;
                        }
                    }
                    if (segmentId === -1 || selected_segments.indexOf(segmentId) !== -1) {
                        this.bot.sendMessage(msg.chat.id, "Invalid choice");
                    } else {
                        selected_segments.push(segmentId);
                    }
                }

                this.keyboard(msg.chat.id);
            }
                break;
            case STAGES.SELECT_ITERATIONS: {
                const iterations = parseInt(msg.text.toString());
                if (iterations >= this.properties.iterationCount.min && iterations <= this.properties.iterationCount.max) {
                    this.robot
                        .request("robot/capabilities/MapSegmentationCapability", msg.chat.id, {
                            method: "PUT",
                            data: {
                                action: "start_segment_action",
                                segment_ids: selected_segments,
                                iterations: iterations,
                                customOrder: true,
                            },
                        })
                        .then(() => {
                            this.awaiting_command.delete(msg.chat.id);
                        });

                } else {
                    this.bot.sendMessage(msg.chat.id, "Invalid choice");
                    this.keyboard(msg.chat.id);
                }
            }
                break;
            }
        }
    }
}

module.exports = {SegmentationCommandGroup};
