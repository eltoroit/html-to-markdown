import Utils from "./utils.js";
import Colors from "./colors.js";
import ET_Asserts from "./etAsserts.js";

export default class GooglePTO {
	#googleWS;
	#isDebug = false;
	#defaultCalendar = {};
	#sendUpdates = "none"; // Send emails to attendees
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
			options: { method: "GET" },
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

	async findEvents({ query, timeMin, timeMax }) {
		if (!this.#defaultCalendar.id) {
			await this.findCalendar();
		}

		const queryParams = {};
		if (query?.length > 0) queryParams.q = query;
		if (timeMin) queryParams.timeMin = new Date(timeMin).toJSON();
		if (timeMax) queryParams.timeMax = new Date(timeMax).toJSON();
		queryParams.maxResults = 2000;
		const url = `https://www.googleapis.com/calendar/v3/calendars/${this.#defaultCalendar.id}/events?${new URLSearchParams(queryParams).toString()}`;
		const events = await this.#etFetch({
			url,
			options: { method: "GET" },
		});

		// Parse list
		const items = events.items.map((event) => {
			return this.#getSimpleEvent({ event });
		});
		items.sort((a, b) => {
			return a.start - b.start;
		});
		const output = {
			size: items.length,
			items,
		};
		Colors.fine({ msg: `${output.size} events found` });
		if (this.#isDebug) Colors.debug({ msg: output });
		return output;
	}

	async getEvent({ id }) {
		ET_Asserts.hasData({ value: id, fullMessage: `Finding event by ID without an ID is not allowed!` });

		if (!this.#defaultCalendar.id) {
			await this.findCalendar();
		}
		const event = await this.#etFetch({
			url: `https://www.googleapis.com/calendar/v3/calendars/${this.#defaultCalendar.id}/events/${id}`,
			options: { method: "GET" },
		});

		// Parse list
		const output = {};
		this.#itemFields.forEach((field) => {
			output[field] = event[field];
		});
		Colors.fine({ msg: `Found event with ID: ${id}` });

		if (this.#isDebug) Colors.debug({ msg: output });
		return output;
	}

	async createEvent({ start, end, employeeName, employeeEmail }) {
		ET_Asserts.hasData({ value: start, fullMessage: `Creating an event, requires a [start] timestamp` });
		ET_Asserts.hasData({ value: end, fullMessage: `Creating an event, requires a [end] timestamp` });
		ET_Asserts.hasData({ value: employeeName, fullMessage: `Creating an event, requires a [employeeName]` });
		ET_Asserts.hasData({ value: employeeEmail, fullMessage: `Creating an event, requires a [employeeEmail]` });

		if (!this.#defaultCalendar.id) {
			await this.findCalendar();
		}

		end = new Date(end);
		start = new Date(start);

		const event = {
			description: employeeName,
			summary: `PTO: ${employeeName}`,
			start: {
				dateTime: start.toJSON(),
			},
			end: {
				dateTime: end.toJSON(),
			},
			attendees: [{ email: employeeEmail, responseStatus: "accepted" }],
		};

		const response = await this.#etFetch({
			url: `https://www.googleapis.com/calendar/v3/calendars/${this.#defaultCalendar.id}/events?sendUpdates=${this.#sendUpdates}`,
			options: {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(event),
			},
		});
		if (this.#isDebug) Colors.debug({ msg: response });
		const output = this.#getSimpleEvent({ event: response });
		return output;
	}

	async updateEvent({ id, start, end }) {
		ET_Asserts.hasData({ value: id, fullMessage: `Updating an event without an ID is not allowed!` });
		ET_Asserts.hasData({ value: start, fullMessage: `Updating an event requires a [start] timestamp` });
		ET_Asserts.hasData({ value: end, fullMessage: `Updating an event requires a [end] timestamp` });

		if (!this.#defaultCalendar.id) {
			await this.findCalendar({});
		}
		const event = await this.getEvent({ id });
		if (event) {
			event.start.dateTime = new Date(start).toJSON();
			event.end.dateTime = new Date(end).toJSON();
			const response = await this.#etFetch({
				url: `https://www.googleapis.com/calendar/v3/calendars/${this.#defaultCalendar.id}/events/${id}?sendUpdates=${this.#sendUpdates}`,
				options: {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(event),
				},
			});
			if (this.#isDebug) Colors.debug({ msg: response });
			const output = this.#getSimpleEvent({ event: response });
			return output;
		} else {
			throw new Error(`Event with ID [${id}] was NOT found to be updated`);
		}
	}

	async deleteEvent({ id }) {
		ET_Asserts.hasData({ value: id, fullMessage: `Deleting an event without an ID is not allowed!` });

		if (!this.#defaultCalendar.id) {
			await this.findCalendar({});
		}
		const event = await this.getEvent({ id });
		if (event) {
			await this.#etFetch({
				url: `https://www.googleapis.com/calendar/v3/calendars/${this.#defaultCalendar.id}/events/${id}`,
				options: {
					method: "DELETE",
				},
				expectedStatus: 204,
			});
			Colors.debug({ msg: `Event with ID: ${id} deleted` });
			return `Event deleted: ${new Date().toJSON()}`;
		} else {
			throw new Error(`Event with ID [${id}] was NOT found to be deleted`);
		}
	}

	async clearCalendar() {
		const events = await this.findEvents({});
		const deleteEventsPromise = events.items.map((event) => {
			return this.deleteEvent({ id: event.id });
		});
		await Promise.allSettled(deleteEventsPromise);
		return `Calendar Cleared: ${new Date().toJSON()}`;
	}

	// Sample bodyRequest is located here: /src/tests/googlePTO_test.js (bodyRequestPTO)
	async requestPTO(bodyRequest) {
		ET_Asserts.hasData({ value: bodyRequest, message: "bodyRequest" });

		if (!this.#defaultCalendar.id) {
			await this.findCalendar({});
		}

		let output = [];
		const isUpdating = bodyRequest.ptoRequest.ptoID !== null;
		const daysRequested = await this.#requestPTO_validateHours({ bodyRequest });
		const employeeEvents = await this.#requestPTO_findEmployeeEvents({ bodyRequest, year: new Date().getFullYear() });
		const hoursTaken = await this.#requestPTO_calculateHoursTaken({ employeeEvents });

		if (isUpdating) {
			output = await this.#requestPTO_Update({ bodyRequest, output, daysRequested, employeeEvents, hoursTaken });
		} else {
			output = await this.#requestPTO_Create({ bodyRequest, output, daysRequested, employeeEvents, hoursTaken });
		}
		return output;
	}

	async #requestPTO_Update({ bodyRequest, output, employeeEvents, hoursTaken }) {
		ET_Asserts.hasData({ value: output, message: "output" });
		ET_Asserts.hasData({ value: hoursTaken, message: "hoursTaken" });
		ET_Asserts.hasData({ value: bodyRequest, message: "bodyRequest" });
		ET_Asserts.hasData({ value: employeeEvents, message: "employeeEvents" });

		let start, end;
		const oldEvent = await this.getEvent({ id: bodyRequest.ptoRequest.ptoID });
		if (bodyRequest.ptoRequest.ptoStartDate && bodyRequest.ptoRequest.ptoEndTime) {
			start = Utils.getDateTime({ date: bodyRequest.ptoRequest.ptoStartDate, time: bodyRequest.ptoRequest.ptoStartTime, timeZone: bodyRequest.employee.TimeZoneSidKey });
			end = Utils.getDateTime({ date: bodyRequest.ptoRequest.ptoStartDate, time: bodyRequest.ptoRequest.ptoEndTime, timeZone: bodyRequest.employee.TimeZoneSidKey });
		} else {
			start = Utils.getDateTime({ date: bodyRequest.ptoRequest.ptoStartDate, time: this.#businessHours.start, timeZone: bodyRequest.employee.TimeZoneSidKey });
			end = Utils.getDateTime({ date: bodyRequest.ptoRequest.ptoStartDate, time: this.#businessHours.end, timeZone: bodyRequest.employee.TimeZoneSidKey });
		}
		const hoursRequested = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
		if (hoursRequested > this.#businessHours.day) throw new Error("Requesting more than 8 hours is not allowed, you should request a full day");
		await this.#requestPTO_validateEntitlementPTO({ bodyRequest, oldEvent, hoursRequested, hoursTaken });
		// Remove old event because maybe the overlap is with the old event.
		employeeEvents.items = employeeEvents.items.filter((event) => event.id !== bodyRequest.ptoRequest.ptoID);
		await this.#requestPTO_validateOverlap({ start, end, employeeEvents });
		const newEvent = await this.updateEvent({ id: bodyRequest.ptoRequest.ptoID, start, end });
		output.push(newEvent);
	}

	async #requestPTO_Create({ bodyRequest, output, daysRequested, hoursTaken, employeeEvents }) {
		ET_Asserts.hasData({ value: output, message: "output" });
		ET_Asserts.hasData({ value: hoursTaken, message: "hoursTaken" });
		ET_Asserts.hasData({ value: daysRequested, message: "daysRequested" });

		const oldEvent = {};
		if (daysRequested >= 1) {
			await this.#requestPTO_CreateDays({ bodyRequest, output, oldEvent, daysRequested, hoursTaken });
		} else {
			await this.#requestPTO_CreateHours({ bodyRequest, output, oldEvent, daysRequested, hoursTaken, employeeEvents });
		}
	}

	async #requestPTO_CreateDays({ bodyRequest, output, oldEvent, daysRequested, hoursTaken }) {
		ET_Asserts.hasData({ value: output, message: "output" });
		ET_Asserts.hasData({ value: hoursTaken, message: "hoursTaken" });
		ET_Asserts.hasData({ value: bodyRequest, message: "bodyRequest" });
		ET_Asserts.hasData({ value: daysRequested, message: "daysRequested" });

		// Calculate all the dates and times
		const dates = [];
		const baseStart = Utils.getDateTime({ date: bodyRequest.ptoRequest.ptoStartDate, time: this.#businessHours.start, timeZone: bodyRequest.employee.TimeZoneSidKey });
		const baseEnd = Utils.getDateTime({ date: bodyRequest.ptoRequest.ptoStartDate, time: this.#businessHours.end, timeZone: bodyRequest.employee.TimeZoneSidKey });
		for (let i = 0; i < daysRequested; i++) {
			const dttmStart = new Date(baseStart);
			const dttmEnd = new Date(baseEnd);
			dttmStart.setDate(dttmStart.getDate() + i);
			dttmEnd.setDate(dttmEnd.getDate() + i);
			dates.push({ start: dttmStart, end: dttmEnd });
			await this.#requestPTO_validateOverlap({ start, end, employeeEvents });
		}
		// Days
		const hoursRequested = ((new Date(baseEnd) - new Date(baseStart)) / (1000 * 60 * 60)) * daysRequested;
		await this.#requestPTO_validateEntitlementPTO({ bodyRequest, oldEvent, hoursRequested, hoursTaken });
		const employeeName = bodyRequest.employee.Name;
		const employeeEmail = bodyRequest.employee.Email;
		const newEventsPromise = dates.map((date) => {
			const p = this.createEvent({ start: date.start, end: date.end, employeeName, employeeEmail });
			p.then((newEvent) => {
				output.push(newEvent);
			});
			return p;
		});
		await Promise.allSettled(newEventsPromise);
	}

	async #requestPTO_CreateHours({ bodyRequest, output, oldEvent, hoursTaken, employeeEvents }) {
		ET_Asserts.hasData({ value: output, message: "output" });
		ET_Asserts.hasData({ value: oldEvent, message: "oldEvent" });
		ET_Asserts.hasData({ value: hoursTaken, message: "hoursTaken" });
		ET_Asserts.hasData({ value: bodyRequest, message: "bodyRequest" });
		ET_Asserts.hasData({ value: employeeEvents, message: "employeeEvents" });

		const start = Utils.getDateTime({ date: bodyRequest.ptoRequest.ptoStartDate, time: bodyRequest.ptoRequest.ptoStartTime, timeZone: bodyRequest.employee.TimeZoneSidKey });
		const end = Utils.getDateTime({ date: bodyRequest.ptoRequest.ptoStartDate, time: bodyRequest.ptoRequest.ptoEndTime, timeZone: bodyRequest.employee.TimeZoneSidKey });
		const hoursRequested = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
		if (hoursRequested > this.#businessHours.day) throw new Error("Requesting more than 8 hours is not allowed, you should request a full day");
		await this.#requestPTO_validateEntitlementPTO({ bodyRequest, oldEvent, hoursRequested, hoursTaken });
		await this.#requestPTO_validateOverlap({ start, end, employeeEvents });
		const employeeName = bodyRequest.employee.Name;
		const employeeEmail = bodyRequest.employee.Email;
		const newEvent = await this.createEvent({ start, end, employeeName, employeeEmail });
		output.push(newEvent);
	}

	async #requestPTO_findEmployeeEvents({ bodyRequest, year }) {
		ET_Asserts.hasData({ value: year, message: "year" });
		ET_Asserts.hasData({ value: bodyRequest, message: "bodyRequest" });

		const timeZone = bodyRequest.employee.TimeZoneSidKey;
		return await this.findEvents({
			query: bodyRequest.employee.Email,
			timeMin: Utils.getDateTime({ date: `${year}-01-01`, time: "00:00", timeZone }),
			timeMax: Utils.getDateTime({ date: `${year + 1}-01-01`, time: "00:00", timeZone }),
		});
	}

	#requestPTO_calculateHoursTaken({ employeeEvents }) {
		ET_Asserts.hasData({ value: employeeEvents, message: "employeeEvents" });

		return employeeEvents.items.reduce((accumulator, event) => {
			const eventDurationHR = (new Date(event.end) - new Date(event.start)) / (1000 * 60 * 60);
			return accumulator + eventDurationHR;
		}, 0);
	}

	#requestPTO_validateHours({ bodyRequest }) {
		ET_Asserts.hasData({ value: bodyRequest, message: "bodyRequest" });

		const daysRequested = bodyRequest.ptoRequest.ptoDays;
		const fraction = daysRequested - Math.floor(daysRequested);
		if (daysRequested >= 1) {
			if (!fraction) return daysRequested;
			throw new Error(`Days requested ${daysRequested} can not have fractions when requesting more than one day`);
		} else {
			if (fraction) return daysRequested;
			if (daysRequested === 0) throw new Error(`Days requested ${daysRequested} must be greater than 0`);
			throw new Error(`Days requested ${daysRequested} must be a fraction when requesting less than one day`);
		}
	}

	#requestPTO_validateEntitlementPTO({ bodyRequest, oldEvent, hoursRequested, hoursTaken }) {
		ET_Asserts.hasData({ value: oldEvent, message: "oldEvent" });
		ET_Asserts.hasData({ value: hoursTaken, message: "hoursTaken" });
		ET_Asserts.hasData({ value: bodyRequest, message: "bodyRequest" });
		ET_Asserts.hasData({ value: hoursRequested, message: "hoursRequested" });

		let durationOldEvent = 0;
		if (oldEvent.start || oldEvent.end) {
			durationOldEvent = (new Date(oldEvent.end.dateTime) - new Date(oldEvent.start.dateTime)) / (1000 * 60 * 60);
		}
		const totalHours = hoursTaken - durationOldEvent + hoursRequested;
		const hoursEntitled = bodyRequest.ptoRequest.ptoEntitled * this.#businessHours.day;
		if (totalHours > hoursEntitled) {
			let msg = "";
			msg += "Request has been denied. ";
			msg += "This request exceeds the amount of hours you are entitled to request per year. ";
			msg += `You have taken ${(hoursTaken / this.#businessHours.day).toFixed(1)} days`;
			throw new Error(msg);
		}
	}

	#requestPTO_validateOverlap({ start, end, employeeEvents }) {
		ET_Asserts.hasData({ value: end, message: "end" });
		ET_Asserts.hasData({ value: start, message: "start" });
		ET_Asserts.hasData({ value: employeeEvents, message: "employeeEvents" });

		const newEvent = { start, end };
		const oldEvents = employeeEvents.items.map((event) => {
			const oldEvent = { start: new Date(event.start), end: new Date(event.end) };
			return oldEvent;
		});
		const overlaps = Utils.hasOverlap({ events: oldEvents, newEvent });
		if (overlaps) {
			throw new Error(`Event requested ${JSON.stringify(newEvent)} overlaps existing request. You had already requeed that time off`);
		}
	}

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
			Colors.debug({ msg: "Invalid session, need to log it to Google using Refresh Token" });
			await this.#googleWS.loginWithRefreshToken();
			await makeRequest();
		}
		if (response.status === expectedStatus) {
			if (response.body) {
				response = await response.json();
				if (this.#isDebug) Colors.debug({ msg: response });
				return response;
			} else {
				response.body?.cancel();
				return;
			}
		} else {
			const error = {};
			["ok", "status", "statusText", "type", "url"].forEach((key) => {
				error[key] = response[key];
			});
			Utils.reportError({ error }); // Response
			Utils.reportError({ error: await response.text() });
			throw new Error(`Unexpected HTTP Status. expectedStatus [${expectedStatus}], received [${response.status}]`);
		}
	}

	#getSimpleEvent({ event }) {
		const output = {};
		["id", "summary", "description", ["start", "dateTime"], ["end", "dateTime"], ["creator", "email"], "attendees", "status"].forEach((item) => {
			if (Array.isArray(item)) {
				const keyName = item.shift();
				const event2 = event[keyName];
				const key2 = item.shift();
				const value = event2[key2];
				output[keyName] = value;
			} else {
				output[item] = event[item];
			}
		});
		output.timeZone = event.start.timeZone;
		output.start = new Date(output.start);
		output.end = new Date(output.end);
		output.startDTTM = output.start;
		output.endDTTM = output.end;
		output.durationHours = Math.round((100 * (output.end - output.start)) / (1000 * 60 * 60)) / 100;
		output.isFullDay = output.durationHours >= 8;
		output.attendees = output.attendees.map((attendeee) => attendeee.email);
		return output;
	}
}
