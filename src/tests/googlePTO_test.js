import Utils from "../utils.js";
import Colors from "../colors.js";
import GoogleWS from "../googleWS.js";
import GooglePTO from "../googlePTO.js";
import { assert, assertEquals } from "jsr:@std/assert";

Colors.tests();

const moreRoutes = [];
const isDebug = true;
const googleWS = new GoogleWS({ moreRoutes });
const googlePTO = new GooglePTO({ isDebug, googleWS });

// Finding Calendar
Deno.test({
	name: "Finding Calendar",
	async fn(_t) {
		const body = await googlePTO.findCalendar();
		assert(body.includes("Calendar found"), "Invalid output received");
	},
	sanitizeResources: false,
});

// Finding Events without parameters
Deno.test({
	name: "Finding Events without parameters",
	async fn(_t) {
		// async findEvents({ query, timeMin, timeMax }) {
		const body = await googlePTO.findEvents({});
		assert(body.size > 0, "Invalid output received");
		assertEquals(body.size, body.items.length, "Invalid output received");
	},
	sanitizeResources: false,
});

// Finding Events without parameters
Deno.test({
	name: "Finding Events without parameters",
	async fn(_t) {
		// async findEvents({ query, timeMin, timeMax }) {
		const body = await googlePTO.findEvents({ query: "DO NOT FIND EVENTS" });
		assertEquals(body.size, 0, "Invalid output received");
		assertEquals(body.size, body.items.length, "Invalid output received");
	},
	sanitizeResources: false,
});

// Finding Events past years
Deno.test({
	name: "Finding Events past years",
	async fn(_t) {
		// async findEvents({ query, timeMin, timeMax }) {
		const year = 1999;
		const timeZone = "America/Toronto";
		const timeMin = Utils.getDateTime({ date: `${year}-01-01`, time: "00:00", timeZone });
		const timeMax = Utils.getDateTime({ date: `${year + 1}-01-01`, time: "00:00", timeZone });
		const body = await googlePTO.findEvents({ timeMin, timeMax });
		assertEquals(body.size, 0, "Invalid output received");
		assertEquals(body.size, body.items.length, "Invalid output received");
	},
	sanitizeResources: false,
});

// Finding Events current year
Deno.test({
	name: "Finding Events current year",
	async fn(_t) {
		// async findEvents({ query, timeMin, timeMax }) {
		const timeZone = "America/Toronto";
		const year = new Date().getFullYear();
		const timeMin = Utils.getDateTime({ date: `${year}-01-01`, time: "00:00", timeZone });
		const timeMax = Utils.getDateTime({ date: `${year + 1}-01-01`, time: "00:00", timeZone });
		const body = await googlePTO.findEvents({ timeMin, timeMax });
		assert(body.size > 0, "Invalid output received");
		assertEquals(body.size, body.items.length, "Invalid output received");
	},
	sanitizeResources: false,
});

// Finding Event by id
Deno.test({
	name: "Finding Event by id",
	async fn(_t) {
		const events = await googlePTO.findEvents({});
		const event = await googlePTO.getEvent({ id: events.items[0].id });
		assertEquals(events.items[0].id, event.id, "Invalid output received");
	},
	sanitizeResources: false,
});

// Create event
Deno.test({
	name: "Create event",
	async fn(_t) {
		const start = makeTimeForEvent(0);
		const end = makeTimeForEvent(1);
		const eventData = {
			start,
			end,
			employeeName: "Andres Perez",
			employeeEmail: "aperez@salesforce.com",
		};
		const event = await googlePTO.createEvent(eventData);
		assert(event.id, "Invalid output received");
	},
	sanitizeResources: false,
});

// Update event
Deno.test({
	name: "Update event",
	async fn(_t) {
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
		assertEquals(oldEvent.start, DTTMs.create.start, "Invalid output received");
		assertEquals(oldEvent.end, DTTMs.create.end, "Invalid output received");

		eventData.start = DTTMs.update.start;
		eventData.end = DTTMs.update.end;
		const newEvent = await googlePTO.updateEvent({ id: oldEvent.id, ...eventData });
		assertEquals(newEvent.start, DTTMs.update.start, "Invalid output received");
		assertEquals(newEvent.end, DTTMs.update.end, "Invalid output received");
		assertEquals(oldEvent.id, newEvent.id, "Invalid output received");
	},
	sanitizeResources: false,
});

// Delete event
Deno.test({
	name: "Delete event",
	async fn(_t) {
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
	},
	sanitizeResources: false,
});

// Clear Calendar
Deno.test({
	name: "Clear Calendar",
	async fn(_t) {
		const output = await googlePTO.clearCalendar();
		assert(output.includes("Calendar Cleared"), "Invalid output received");
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

function bodyRequestPTO() {
	return {
		ptoRequest: {
			ptoStartTime: null,
			ptoStartDate: "2025-02-24",
			ptoID: null,
			ptoEntitled: 10.6,
			ptoEndTime: null,
			ptoDays: 3,
			employeeID: "005Ot00000KcxGTIAZ",
		},
		employee: {
			attributes: {
				type: "User",
				url: "/services/data/v63.0/sobjects/User/005Ot00000KcxGTIAZ",
			},
			Id: "005Ot00000KcxGTIAZ",
			Username: "test-scqg41x0pb0g@example.com",
			Name: "Andres Perez",
			Email: "aperez@salesforce.com",
			StartDate__c: "2024-10-03",
			TimeZoneSidKey: "America/New_York",
		},
	};
}
