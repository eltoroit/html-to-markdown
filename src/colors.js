import Utils from "./utils.js";
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
	static info({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });

		console.log(colorBgBlack + colorBright + colorFgWhite + this.#msgToText({ level: "INFO", msg }) + colorReset);
	}

	static fine({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });
		console.log(colorBgBlack + colorBright + colorFgCyan + this.#msgToText({ level: "FINE", msg }) + colorReset);
	}

	static finest({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });

		console.log(colorBgBlack + colorBright + colorFgMagenta + this.#msgToText({ level: "FINEST", msg }) + colorReset);
	}

	static warn({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });

		console.log(colorBgBlack + colorBright + colorFgYellow + this.#msgToText({ level: "WARN", msg }) + colorReset);
	}

	static debug({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });

		console.log(colorBgBlack + colorBright + colorFgGray + this.#msgToText({ level: "DEBUG", msg }) + colorReset);
	}

	static errorDoNotUse({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });

		console.log(colorBgBlack + colorBright + colorFgRed + this.#msgToText({ level: "ERROR", msg }) + colorReset);
	}

	static success({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });

		console.log(colorBgBlack + colorBright + colorFgGreen + this.#msgToText({ level: "SUCCESS", msg }) + colorReset);
	}

	//#endregion

	static #msgToText({ level, msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });
		ET_Asserts.hasData({ value: level, message: "level" });

		function isPrimitive(value) {
			let type = Object.prototype.toString.call(value);
			type = type.substring(type.indexOf(" ") + 1, type.indexOf("]"));
			return !["array", "object", "function"].includes(type.toLowerCase());
		}

		let output;
		if (isPrimitive(msg)) {
			output = msg;
		} else {
			output = JSON.stringify(msg);
		}
		output = `${level.toUpperCase().padEnd(10, "_")}: ${output}`;
		return output;
	}

	static tests() {
		console.log(clearScreenCode);

		Colors.debug({ msg: { text: "debug" } });
		Colors.debug({ msg: ["debug"] });
		console.log("");
		Colors.info({ msg: "1. INFO" });
		Colors.fine({ msg: "2. FINE" });
		Colors.finest({ msg: "4. FINEST" });
		Colors.warn({ msg: "3. WARN" });
		console.log("");
		Colors.debug({ msg: "DEBUG" });
		Colors.success({ msg: "SUCCESS" });
		Utils.reportError({ error: "ERROR" });
		try {
			throw new Error("Testing Exceptions");
		} catch (ex) {
			Utils.reportError({ ex });
		}
	}
}
