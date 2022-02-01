class CommandGroup {
    constructor({robot, bot}) {
        this.robot = robot;
        this.bot = bot;
    }

    available() {
        return true;
    }

    registerCommands() {
        throw new Error();
    }

    getCommandList() {
        throw new Error();
    }
}

module.exports = {CommandGroup};
