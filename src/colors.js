import ET_Asserts from "./etAsserts.js";

// Define variables
const clearScreenCode = "\x1B[2J";

// Color Modes
const colorReset = "\x1b[0m";
const colorBright = "\x1b[1m";
const colorDim = "\x1b[2m";
const colorUnderscore = "\x1b[4m";
const colorBlink = "\x1b[5m";
const colorReverse = "\x1b[7m";
const colorHidden = "\x1b[8m";

// Color Foreground
const colorFgBlack = "\x1b[30m";
const colorFgRed = "\x1b[31m";
const colorFgGreen = "\x1b[32m";
const colorFgYellow = "\x1b[33m";
const colorFgBlue = "\x1b[34m";
const colorFgMagenta = "\x1b[35m";
const colorFgCyan = "\x1b[36m";
const colorFgWhite = "\x1b[37m";
const colorFgGray = "\x1b[90m";

// Color Background
const colorBgBlack = "\x1b[40m";
const colorBgRed = "\x1b[41m";
const colorBgGreen = "\x1b[42m";
const colorBgYellow = "\x1b[43m";
const colorBgBlue = "\x1b[44m";
const colorBgMagenta = "\x1b[45m";
const colorBgCyan = "\x1b[46m";
const colorBgWhite = "\x1b[47m";

export default class Colors {
	static clearScreen() {
		console.log(clearScreenCode);
	}

	//#region COLORS
	static debug({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });

		console.log(colorBgBlack + colorBright + colorFgGray + msg + colorReset);
	}

	static command({ command }) {
		ET_Asserts.hasData({ value: command, message: "command" });

		console.log(colorBgBlack + colorBright + colorFgYellow + command + colorReset);
	}

	static status({ status }) {
		ET_Asserts.hasData({ value: status, message: "status" });

		console.log(colorBgBlack + colorBright + colorFgMagenta + status + colorReset);
	}

	static note({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });

		console.log(colorBgBlack + colorBright + colorFgWhite + msg + colorReset);
	}

	static error({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });

		console.log(colorBgBlack + colorBright + colorFgRed + msg + colorReset);
	}

	static success({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });

		console.log(colorBgBlack + colorBright + colorFgGreen + msg + colorReset);
	}

	static message({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });
		console.log(colorBgBlack + colorBright + colorFgCyan + msg + colorReset);
	}

	static done() {
		console.log(colorBgBlack + colorBright + colorFgGreen + "Task Completed" + colorReset);
		console.log(colorBgBlack + colorBright + colorFgGreen + new Date() + colorReset);
	}
	//#endregion

	static getPrettyJson({ obj }) {
		ET_Asserts.hasData({ value: obj, message: "obj" });

		return JSON.stringify(obj, null, 4);
	}

	static tests() {
		Colors.debug({ msg: "debug" });
		Colors.command({ command: "command" });
		Colors.status({ status: "status" });
		Colors.note({ msg: "note" });
		Colors.error({ msg: "error" });
		Colors.success({ msg: "success" });
		Colors.message({ msg: "message" });
		Colors.done();
	}
}
