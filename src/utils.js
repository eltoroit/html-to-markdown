import Colors from "./colors.js";
import ET_Asserts from "./etAsserts.js";

export default class Utils {
	static getDateTime({ date, time, timeZone }) {
		// Handle different time formats
		const parseTime = (timeStr) => {
			// If it's in AM/PM format
			if (timeStr.includes("AM") || timeStr.includes("PM")) {
				let [fullHour, period] = timeStr.split(" ");
				let [hour, rest] = fullHour.split(":");
				let hour24;
				if (period === "AM") {
					if (fullHour === "12") hour24 = "00";
					hour24 = `${hour.padStart(2, "0")}${rest ? ":" + rest : ""}`;
				} else {
					if (fullHour === "12") hour24 = "12";
					hour24 = `${String(Number(hour) + 12).padStart(2, "0")}${rest ? ":" + rest : ""}`;
				}
				const output = `${hour24}${rest ? "" : ":00:00"}`;
				return output;
			}

			// If it's in 24-hour format (might include seconds and milliseconds)
			return timeStr.includes(":") ? timeStr : `${timeStr}:00:00`;
		};

		// If time is already in UTC
		if (time.endsWith("Z")) {
			if (time.includes("T")) {
				return new Date(`${time}`);
			} else {
				return new Date(`${date}T${time}`);
			}
		}

		try {
			// Create timestamp in specified timeZone
			const timeString = parseTime(time);
			const fullString = `${date} ${timeString}`;
			const localDate = new Date(fullString);
			const targetDate = new Date(localDate.toLocaleString("en-US", { timeZone }));

			// Calculate and apply the offset
			const offset = targetDate.getTime() - localDate.getTime();
			return new Date(localDate.getTime() - offset);
		} catch (ex) {
			throw ex;
		}
	}

	static hasOverlap({ events, newEvent }) {
		const forPrintDTTM = (dttm) => {
			dttm = new Date(dttm); // Clone the value
			dttm.setHours(dttm.getHours() - 5); // From GMT to EST
			const output = dttm.toJSON().split("T")[1].split(".")[0];
			return output;
		};
		const forPrint = (event) => {
			const tmp = { ...event };
			tmp.start = forPrintDTTM(tmp.start);
			tmp.end = forPrintDTTM(tmp.end);
			return JSON.stringify(tmp);
		};

		Colors.debug({ msg: "---" });
		Colors.debug({ msg: `New Event: ${forPrint(newEvent)}` });
		if (newEvent.start > newEvent.end) {
			throw new Error("Event start time can't be later than event end time");
		}
		if (newEvent.start - newEvent.end === 0) {
			throw new Error("Event start time can't be the same as the event end time");
		}
		return events.some((event) => {
			// Check if either the start or end time of the new event falls within an existing event
			const newStartOverlaps = newEvent.start >= event.start && newEvent.start < event.end;
			const newEndOverlaps = newEvent.end > event.start && newEvent.end <= event.end;
			// Check if the new event completely encompasses an existing event
			const encompassesExisting = newEvent.start <= event.start && newEvent.end >= event.end;

			const output = newStartOverlaps || newEndOverlaps || encompassesExisting;
			Colors.debug({
				msg: `Old Event: ${forPrint(event)} | output: ${output} | newStartOverlaps: ${newStartOverlaps} | newEndOverlaps: ${newEndOverlaps} | encompassesExisting: ${encompassesExisting}`,
			});

			return output;
		});
	}

	static reportError({ ctx, error, ex }) {
		ET_Asserts.hasData({ value: error || ex, message: "Either error or ex must be provided" });

		let msg;
		if (error) msg = Utils.#reportError({ msg: error });
		if (ex) msg = Utils.#reportException({ ex });
		if (ctx) {
			ctx.response.status = 503;
			ctx.response.body = msg;
		}
	}

	static #reportException({ ex }) {
		ET_Asserts.hasData({ value: ex, message: "ex" });

		let error = null;
		if (ex.stack) {
			error = ex.stack;
			const parsedStack = Utils.getParsedStack({ stack: ex.stack });
			[parsedStack.firstLine, ...parsedStack.filteredLines].forEach((line) => {
				Colors.errorDoNotUse({ msg: line });
			});
		} else if (error.message) {
			error = ex.message;
			Colors.errorDoNotUse({ msg: error.message });
		} else {
			// This is a valid use for console.log();
			console.log(ex);
			throw new Error("What was the exception?");
		}
		return error;
	}

	static #reportError({ msg }) {
		ET_Asserts.hasData({ value: msg, message: "msg" });

		Colors.errorDoNotUse({ msg });
		return msg;
	}

	static getParsedStack({ stack }) {
		if (!stack) {
			stack = new Error().stack;
		}

		const lines = stack.split("\n");
		const firstLine = lines[0]; // First line is the error message

		// Define patterns for exclusion and inclusion
		const includePatterns = [/HerokuPTO/];
		const excludePatterns = [/etAsserts\.js/, /colors\.js/, , /utils\.js/];

		// Filter relevant stack trace lines
		let filteredLines = lines.slice(1);
		filteredLines = filteredLines.filter((line) => {
			console.log(line);
			return includePatterns.some((pattern) => pattern.test(line));
		});
		filteredLines = filteredLines.filter((line) => {
			return !excludePatterns.some((pattern) => pattern.test(line));
		});

		return { firstLine, filteredLines };
	}
}
