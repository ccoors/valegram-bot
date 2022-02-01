const axios = require("axios").default;
const {CommandGroup} = require("./command_group");
const {filter} = require("../chat_ids");

const ICBINV_MAP_URL = process.env.ICBINV_URL;

class MapCommandGroup extends CommandGroup {
    constructor(props) {
        super(props);
        this.sendMapImage = this.sendMapImage.bind(this);
    }

    available() {
        return Boolean(ICBINV_MAP_URL);
    }

    registerCommands() {
        if (!this.available()) {
            console.info("ICBINV_URL is not set, /map command is not available");
            return;
        }

        this.bot.onText(/\/map/, filter(this.sendMapImage));
    }

    getCommandList() {
        if (!this.available()) {
            return [];
        }
        return [
            {
                command: "/map",
                description: "Get map image from ICBINV",
            },
        ];
    }

    sendMapImage(msg) {
        axios
            .get(ICBINV_MAP_URL, {
                responseType: "stream",
            })
            .then((res) => {
                this.bot.sendPhoto(
                    msg.chat.id,
                    res.data,
                    {
                        caption: "Current map image from ICBINV",
                    },
                    {
                        filename: "map_image.png",
                        contentType: "image/png",
                    }
                );
            })
            .catch((err) => {
                console.error(err);
                this.bot.sendMessage(msg.chat.id, `Axios error: ${err}`);
            });
    }
}

module.exports = {MapCommandGroup};
