import Utils from "../utils.js";
import Colors from "../colors.js";
import GoogleWS from "../googleWS.js";
import GooglePTO from "../googlePTO.js";
import { assert, assertEquals } from "jsr:@std/assert";

Colors.isDebug = false;

const moreRoutes = [];
let denoTestCounter = 0;
const googleWS = new GoogleWS({ moreRoutes });
const googlePTO = new GooglePTO({ googleWS });
googlePTO.simulation.isActive = true;

// Finding Calendar
Deno.test({
	name: "Finding Calendar",
	async fn(t) {
		const body = await googlePTO.findCalendar();
		assert(body.includes("Calendar found"));
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Clear Calendar
Deno.test({
	name: "Clear Calendar",
	async fn(t) {
		const output = await googlePTO.clearCalendar();
		assert(output.includes("Calendar Cleared"));
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Create event
Deno.test({
	name: "Create event",
	async fn(t) {
		const start = makeTimeForEvent(0);
		const end = makeTimeForEvent(1);
		const eventData = {
			start,
			end,
			employeeName: "Andres Perez",
			employeeEmail: "aperez@salesforce.com",
		};
		const event = await googlePTO.createEvent(eventData);
		assert(event.id);
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Update event
Deno.test({
	name: "Update event",
	async fn(t) {
		const DTTMs = {
			create: { start: makeTimeForEvent(0), end: makeTimeForEvent(1) },
			update: { start: makeTimeForEvent(1), end: makeTimeForEvent(2) },
		};
		const eventData = {
			start: DTTMs.create.start,
			end: DTTMs.create.end,
			employeeName: "Andres Perez",
			employeeEmail: "aperez@salesforce.com",
		};
		const oldEvent = await googlePTO.createEvent(eventData);
		assertEquals(oldEvent.start, DTTMs.create.start);
		assertEquals(oldEvent.end, DTTMs.create.end);

		eventData.start = DTTMs.update.start;
		eventData.end = DTTMs.update.end;
		const newEvent = await googlePTO.updateEvent({ id: oldEvent.id, ...eventData });
		assertEquals(newEvent.start, DTTMs.update.start);
		assertEquals(newEvent.end, DTTMs.update.end);
		assertEquals(oldEvent.id, newEvent.id);
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Delete event
Deno.test({
	name: "Delete event",
	async fn(t) {
		const eventData = {
			start: makeTimeForEvent(0),
			end: makeTimeForEvent(1),
			employeeName: "Andres Perez",
			employeeEmail: "aperez@salesforce.com",
		};
		const oldEvent = await googlePTO.createEvent(eventData);
		const outputDelete = await googlePTO.deleteEvent({ id: oldEvent.id });
		// await new Promise((resolve) => setTimeout(resolve, 30e3));
		// const outputRetrieve = await googlePTO.getEvent({ id: oldEvent.id });
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Finding Events without parameters
Deno.test({
	name: "Finding Events without parameters",
	async fn(t) {
		const body = await googlePTO.findEvents({});
		assert(body.size >= 0);
		assertEquals(body.size, body.items.length);
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Finding Events with invalid parameters
Deno.test({
	name: "Finding Events with invalid parameters",
	async fn(t) {
		const body = await googlePTO.findEvents({ query: "DO NOT FIND EVENTS" });
		if (googlePTO.simulation.isActive) {
			Utils.reportError({ error: "Simulation mode queries do not filter events" });
		} else {
			assertEquals(body.size, 0);
			assertEquals(body.size, body.items.length);
		}
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Finding Events past years
Deno.test({
	name: "Finding Events past years",
	async fn(t) {
		const year = 1999;
		const timeZone = "America/Toronto";
		const timeMin = Utils.getDateTime({ date: `${year}-01-01`, time: "00:00", timeZone });
		const timeMax = Utils.getDateTime({ date: `${year + 1}-01-01`, time: "00:00", timeZone });
		const body = await googlePTO.findEvents({ timeMin, timeMax });
		if (googlePTO.simulation.isActive) {
			Utils.reportError({ error: "Simulation mode queries do not filter events" });
		} else {
			assertEquals(body.size, 0);
			assertEquals(body.size, body.items.length);
		}
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Finding Events current year
Deno.test({
	name: "Finding Events current year",
	async fn(t) {
		const timeZone = "America/Toronto";
		const year = new Date().getFullYear();
		const timeMin = Utils.getDateTime({ date: `${year}-01-01`, time: "00:00", timeZone });
		const timeMax = Utils.getDateTime({ date: `${year + 1}-01-01`, time: "00:00", timeZone });
		const body = await googlePTO.findEvents({ timeMin, timeMax });
		if (googlePTO.simulation.isActive) {
			Utils.reportError({ error: "Simulation mode queries do not filter events" });
		} else {
			assertEquals(body.size, body.items.length);
		}
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Retrieving Event by id
Deno.test({
	name: "Retrieving Event by id",
	async fn(t) {
		const events = await googlePTO.findEvents({});
		const event = await googlePTO.getEvent({ id: events.items[0].id });
		assertEquals(events.items[0].id, event.id);
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

const makeTimeForEvent = (offset) => {
	const dttm = new Date();
	dttm.setMinutes(0);
	dttm.setSeconds(0);
	dttm.setMilliseconds(0);
	dttm.setHours(dttm.getHours() + 1 + offset);
	return dttm;
};
