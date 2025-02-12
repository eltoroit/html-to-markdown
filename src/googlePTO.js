import Colors from "./colors.js";
import { Utils } from "./utils.js";

export class GooglePTO {
	#googleWS;
	#isDebug = false;
	#defaultCalendar = {};
	#businessHours = {
		day: 8, // 8 hours in a business day (Not 24!)
		start: "09:00",
		end: "17:00",
	};
	#itemFields = ["id", "summary", "description", "start", "end", "attendees"];
	constructor({ isDebug, googleWS }) {
		this.#isDebug = isDebug;
		this.#googleWS = googleWS;
	}
	async findCalendar() {
		const calendarName = "Agentforce PTO";
		let calendars = await this.#etFetch({
			url: "https://www.googleapis.com/calendar/v3/users/me/calendarList",
			options: {
				method: "GET",
			},
		});
		calendars = calendars.items.filter((calendar) => calendar.summary === calendarName);
		if (calendars.length === 1) {
			this.#defaultCalendar = calendars[0];
			Colors.fine({ msg: `Calendar: ${this.#defaultCalendar.id}` });
			return `Calendar found: ${new Date().toJSON()}`;
		} else {
			throw new Error(`Could not find calendar named [${calendarName}]`);
		}
	}
	// async #findEvents({ ctx, query, timeMin, timeMax }) {
	// 	if (!this.#defaultCalendar.id) {
	// 		await this.#findCalendar({});
	// 	}
	// 	const queryParams = {};
	// 	if (query?.length > 0) queryParams.q = query;
	// 	if (timeMin) queryParams.timeMin = new Date(timeMin).toJSON();
	// 	if (timeMax) queryParams.timeMax = new Date(timeMax).toJSON();
	// 	const url = `https://www.googleapis.com/calendar/v3/calendars/${this.#defaultCalendar.id}/events?${new URLSearchParams(queryParams).toString()}`;
	// 	const events = await this.#etFetch({
	// 		url,
	// 		options: {
	// 			method: "GET",
	// 		},
	// 	});
	// 	// Parse list
	// 	const items = events.items.map((event) => {
	// 		return this.#getSimpleEvent({ event });
	// 	});
	// 	items.sort((a, b) => {
	// 		return a.start - b.start;
	// 	});
	// 	const output = {
	// 		size: items.length,
	// 		items,
	// 	};
	// 	console.log(`${output.size} events found`);
	// 	if (ctx) {
	// 		ctx.response.type = "json";
	// 		ctx.response.status = "200";
	// 		ctx.response.body = output;
	// 	} else {
	// 		if (this.#isDebug) console.log(output);
	// 		return output;
	// 	}
	// }
	// async #getEvent({ ctx, id }) {
	// 	if (!id) {
	// 		throw new Error(`Finding event by ID without an ID is not allowed!`);
	// 	}
	// 	if (!this.#defaultCalendar.id) {
	// 		await this.#findCalendar({});
	// 	}
	// 	const event = await this.#etFetch({
	// 		url: `https://www.googleapis.com/calendar/v3/calendars/${this.#defaultCalendar.id}/events/${id}`,
	// 		options: {
	// 			method: "GET",
	// 		},
	// 	});
	// 	// Parse list
	// 	const output = {};
	// 	this.#itemFields.forEach((field) => {
	// 		output[field] = event[field];
	// 	});
	// 	console.log(`Found event with ID: ${id}`);
	// 	if (ctx) {
	// 		ctx.response.type = "json";
	// 		ctx.response.status = "200";
	// 		ctx.response.body = output;
	// 	} else {
	// 		if (this.#isDebug) console.log(output);
	// 		return output;
	// 	}
	// }
	// async #createEvent({ ctx, start, end, employeeName, employeeEmail }) {
	// 	if (!this.#defaultCalendar.id) {
	// 		await this.#findCalendar({});
	// 	}
	// 	const event = {
	// 		description: employeeName,
	// 		summary: `PTO: ${employeeName}`,
	// 		start: {
	// 			dateTime: start.toJSON(),
	// 		},
	// 		end: {
	// 			dateTime: end.toJSON(),
	// 		},
	// 		attendees: [{ email: employeeEmail, responseStatus: "accepted" }],
	// 	};
	// 	const sendUpdates = "none";
	// 	const response = await this.#etFetch({
	// 		url: `https://www.googleapis.com/calendar/v3/calendars/${this.#defaultCalendar.id}/events?sendUpdates=${sendUpdates}`,
	// 		options: {
	// 			method: "POST",
	// 			headers: {
	// 				"Content-Type": "application/json",
	// 			},
	// 			body: JSON.stringify(event),
	// 		},
	// 	});
	// 	if (this.#isDebug) console.log(response);
	// 	const output = this.#getSimpleEvent({ event: response });
	// 	if (ctx) {
	// 		ctx.response.type = "json";
	// 		ctx.response.status = "200";
	// 		ctx.response.body = output;
	// 	} else {
	// 		return output;
	// 	}
	// }
	// async #updateEvent({ ctx, id, start, end }) {
	// 	if (!id) {
	// 		throw new Error(`Updating event by ID without an ID is not allowed!`);
	// 	}
	// 	if (!this.#defaultCalendar.id) {
	// 		await this.#findCalendar({});
	// 	}
	// 	const event = await this.#getEvent({ id });
	// 	if (event) {
	// 		event.start.dateTime = new Date(start).toJSON();
	// 		event.end.dateTime = new Date(end).toJSON();
	// 		const sendUpdates = "none";
	// 		const response = await this.#etFetch({
	// 			url: `https://www.googleapis.com/calendar/v3/calendars/${this.#defaultCalendar.id}/events/${id}?sendUpdates=${sendUpdates}`,
	// 			options: {
	// 				method: "PUT",
	// 				headers: {
	// 					"Content-Type": "application/json",
	// 				},
	// 				body: JSON.stringify(event),
	// 			},
	// 		});
	// 		if (this.#isDebug) console.log(response);
	// 		const output = this.#getSimpleEvent({ event: response });
	// 		if (ctx) {
	// 			ctx.response.type = "json";
	// 			ctx.response.status = "200";
	// 			ctx.response.body = output;
	// 		} else {
	// 			return output;
	// 		}
	// 	} else {
	// 		throw new Error(`Event with ID [${id}] was NOT found to be updated`);
	// 	}
	// }
	// async #deleteEvent({ ctx, id }) {
	// 	if (!id) {
	// 		throw new Error(`Deleting event by ID without an ID is not allowed!`);
	// 	}
	// 	if (!this.#defaultCalendar.id) {
	// 		await this.#findCalendar({});
	// 	}
	// 	const event = await this.#getEvent({ id });
	// 	if (event) {
	// 		await this.#etFetch({
	// 			url: `https://www.googleapis.com/calendar/v3/calendars/${this.#defaultCalendar.id}/events/${id}`,
	// 			options: {
	// 				method: "DELETE",
	// 			},
	// 			expectedStatus: 204,
	// 		});
	// 		console.log(`Event with ID: ${id} deleted`);
	// 		if (ctx) {
	// 			ctx.response.body = `Event deleted: ${new Date().toJSON()}`;
	// 		}
	// 	} else {
	// 		throw new Error(`Event with ID [${id}] was NOT found to be deleted`);
	// 	}
	// }

	async #etFetch({ url, options, expectedStatus = 200 }) {
		let response;
		const addAuthorization = () => {
			if (!options.headers) {
				options.headers = {};
			}
			options.headers.Authorization = `Bearer ${this.#googleWS.loginResult?.access_token}`;
		};
		const makeRequest = async () => {
			try {
				addAuthorization();
				response = await fetch(url, options);
			} catch (ex) {
				Utils.reportError({ ex });
				throw ex;
			}
		};
		Colors.fine({ msg: `Fetching [${options.method}]: ${url}` });
		await makeRequest();
		if (response.status === 401) {
			// Try to login with refresh token
			await this.#googleWS.loginWithRefreshToken({});
			await makeRequest();
		}
		if (response.status === expectedStatus) {
			if (response.body) {
				response = await response.json();
				if (this.#isDebug) Colors.debug({ msg: response });
				return response;
			} else {
				// No body
				return;
			}
		} else {
			const error = {};
			["ok", "status", "statusText", "type", "url"].forEach((key) => {
				error[key] = response[key];
			});
			Utils.reportError({ error }); // Response
			Utils.reportError({ error: await response.text() }); // Body
			throw new Error(`Unexpected HTTP Status. expectedStatus [${expectedStatus}], received [${response.status}]`);
		}
	}

	// #getSimpleEvent({ event }) {
	// 	const output = {};
	// 	["id", "summary", "description", ["start", "dateTime"], ["end", "dateTime"], ["creator", "email"], "attendees", "status"].forEach((item) => {
	// 		if (Array.isArray(item)) {
	// 			const keyName = item.shift();
	// 			const event2 = event[keyName];
	// 			const key2 = item.shift();
	// 			const value = event2[key2];
	// 			output[keyName] = value;
	// 		} else {
	// 			output[item] = event[item];
	// 		}
	// 	});
	// 	output.timeZone = event.start.timeZone;
	// 	output.start = new Date(output.start);
	// 	output.end = new Date(output.end);
	// 	output.startDTTM = output.start;
	// 	output.endDTTM = output.end;
	// 	output.durationHours = Math.round((100 * (output.end - output.start)) / (1000 * 60 * 60)) / 100;
	// 	output.isFullDay = output.durationHours >= 8;
	// 	output.attendees = output.attendees.map((attendeee) => attendeee.email);
	// 	return output;
	// }
}
