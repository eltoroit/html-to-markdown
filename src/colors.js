import Utils from "./utils.js";
import ET_Asserts from "./etAsserts.js";

//#region Color Variables)
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
//#endregion

export default class Colors {
	static isDebug = false;

	static clearScreen() {
		console.log(clearScreenCode);
	}

	//#region COLORS
	static debug({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });

		if (this.isDebug) {
			console.log(colorBgBlack + colorBright + colorFgGray + this.#msgToText({ level: "DEBUG", msg }) + colorReset);
		}
	}

	static finest({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });

		console.log(colorBgBlack + colorFgCyan + this.#msgToText({ level: "FINEST", msg }) + colorReset);
	}

	static fine({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });
		console.log(colorBgBlack + colorFgMagenta + this.#msgToText({ level: "FINE", msg }) + colorReset);
	}

	static info({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });
		console.log(colorBgBlack + colorBright + colorFgWhite + this.#msgToText({ level: "INFO", msg }) + colorReset);
	}

	static warn({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });

		console.log(colorBgBlack + colorBright + colorFgYellow + this.#msgToText({ level: "WARN", msg }) + colorReset);
	}

	static success({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });

		console.log(colorBgBlack + colorBright + colorFgGreen + this.#msgToText({ level: "SUCCESS", msg }) + colorReset);
	}

	static errorDoNotUse({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });

		console.log(colorBgBlack + colorBright + colorFgRed + this.#msgToText({ level: "ERROR", msg }) + colorReset);
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

		if (!Colors.isDebug) {
			Colors.isDebug = true;
			Colors.debug({ msg: `0. DEBUG (Skipping debug because isDebug is false)` });
			Colors.isDebug = false;
		}
		Colors.debug({ msg: "0. DEBUG" });
		Colors.finest({ msg: "1. FINEST" });
		Colors.fine({ msg: "2. FINE" });
		Colors.info({ msg: "3. INFO" });
		Colors.warn({ msg: "4. WARN" });
		Colors.success({ msg: "5. SUCCESS" });
		Utils.reportError({ error: "6. ERROR" });
		console.log("");
	}

	static initialize() {
		// Is Debug?
		const envColors = Deno.env.get("IS_DEBUG");
		const isDebug = envColors === "TRUE";
		Colors.isDebug = isDebug;
		console.log(`ENV Colors: ${envColors} => isDebug: ${isDebug}`);
		Colors.debug({ msg: `Debug Mode: ${isDebug}` });
	}
}

Colors.initialize();
