const EventEmitter = require("events").EventEmitter;
const axios = require("axios").default;

class Robot {
    constructor(bot) {
        this.fetchAttributes = this.fetchAttributes.bind(this);
        this.attributesEmitter = new EventEmitter();

        this.bot = bot;
        this.host = process.env.VALETUDO_URL || "http://localhost/";
        this.auth_username = process.env.VALETUDO_AUTH_USERNAME || "";
        this.auth_password = process.env.VALETUDO_AUTH_PASSWORD || "";
        this.timeout = parseInt(process.env.VALETUDO_HTTP_TIMEOUT || 10_000);

        this.manufacturer = "?";
        this.modelName = "?";
        this.implementation = "?";
        this.capabilities = [];
        this.attributeFetchInterval = null;
        this.attributes = [];
        this.lastStatusState = null;
        this.fillRobotInfo();
    }

    formatURL(url) {
        return new URL("api/v2/" + url, this.host).href;
    }

    request(url, msg_id = null, options = {}) {
        options.url = this.formatURL(url);
        options.timeout = this.timeout;
        if (!options.method) {
            options.method = "GET";
        }
        if (this.auth_username) {
            options.auth = {
                username: this.auth_username,
                password: this.auth_password,
            };
        }
        return axios.request(options).catch((err) => {
            console.error(`Axios error: ${err}`);
            if (msg_id) {
                this.bot
                    .sendMessage(msg_id, `Axios error: ${err}`, {
                        reply_markup: {
                            remove_keyboard: true,
                        },
                    })
                    .then();
            }
        });
    }

    fillRobotInfo() {
        this.request("robot").then((res) => {
            this.manufacturer = res.data.manufacturer;
            this.modelName = res.data.modelName;
            this.implementation = res.data.implementation;
        });

        this.request("robot/capabilities").then((res) => {
            this.capabilities = res.data;
        });

        // This could be done using SSE
        this.attributeFetchInterval = setInterval(this.fetchAttributes, 5_000);
        this.fetchAttributes();
    }

    fetchAttributes() {
        this.request("robot/state/attributes").then((res) => {
            this.attributes = res.data;
            const newStatusState = this.attributes.filter(a => a?.__class === "StatusStateAttribute").at(0).value;
            if (this.lastStatusState && newStatusState !== this.lastStatusState) {
                this.attributesEmitter.emit("status_state", newStatusState);
            }
            this.lastStatusState = newStatusState;
        });
    }

    onStatusStateChange(listener) {
        this.attributesEmitter.on("status_state", listener);
    }
}

module.exports = {Robot};
