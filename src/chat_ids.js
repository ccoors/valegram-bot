const CHAT_IDS = new Set(JSON.parse(process.env.CHAT_IDS || "[]"));

function warn() {
    if (CHAT_IDS.size === 0) {
        console.warn(
            "CHAT_IDS does not contain any chat IDs. Running in restricted mode."
        );
    }
}

function filter(cb) {
    return (...params) => {
        if (CHAT_IDS.has(params[0].chat.id)) {
            return cb(...params);
        } else {
            console.warn(
                `Received command from unknown chat id ${params[0].chat.id}, ignoring`
            );
        }
    };
}

module.exports = {CHAT_IDS, warn, filter};
