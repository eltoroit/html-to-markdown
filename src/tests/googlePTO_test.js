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
googlePTO.isSimulationMode = true;

//#region Basic Google Events
// Finding Calendar
Deno.test({
	name: "Finding Calendar",
	async fn(t) {
		const body = await googlePTO.findCalendar();
		assert(body.includes("Calendar found"), "Invalid output received");
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Clear Calendar
Deno.test({
	name: "Clear Calendar",
	async fn(t) {
		const output = await googlePTO.clearCalendar();
		assert(output.includes("Calendar Cleared"), "Invalid output received");
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
		assert(event.id, "Invalid output received");
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
		if (googlePTO.isSimulationMode) {
			googlePTO.simulatedEvent = { ...oldEvent };
		}
		assertEquals(oldEvent.start, DTTMs.create.start, "Invalid output received");
		assertEquals(oldEvent.end, DTTMs.create.end, "Invalid output received");

		eventData.start = DTTMs.update.start;
		eventData.end = DTTMs.update.end;
		const newEvent = await googlePTO.updateEvent({ id: oldEvent.id, ...eventData });
		assertEquals(newEvent.start, DTTMs.update.start, "Invalid output received");
		assertEquals(newEvent.end, DTTMs.update.end, "Invalid output received");
		assertEquals(oldEvent.id, newEvent.id, "Invalid output received");
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
		// async findEvents({ query, timeMin, timeMax }) {
		const body = await googlePTO.findEvents({});
		assert(body.size >= 0, "Invalid output received");
		assertEquals(body.size, body.items.length, "Invalid output received");
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Finding Events without parameters
Deno.test({
	name: "Finding Events without parameters",
	async fn(t) {
		// async findEvents({ query, timeMin, timeMax }) {
		const body = await googlePTO.findEvents({ query: "DO NOT FIND EVENTS" });
		assertEquals(body.size, 0, "Invalid output received");
		assertEquals(body.size, body.items.length, "Invalid output received");
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Finding Events past years
Deno.test({
	name: "Finding Events past years",
	async fn(t) {
		// async findEvents({ query, timeMin, timeMax }) {
		const year = 1999;
		const timeZone = "America/Toronto";
		const timeMin = Utils.getDateTime({ date: `${year}-01-01`, time: "00:00", timeZone });
		const timeMax = Utils.getDateTime({ date: `${year + 1}-01-01`, time: "00:00", timeZone });
		const body = await googlePTO.findEvents({ timeMin, timeMax });
		assertEquals(body.size, 0, "Invalid output received");
		assertEquals(body.size, body.items.length, "Invalid output received");
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Finding Events current year
Deno.test({
	name: "Finding Events current year",
	async fn(t) {
		// async findEvents({ query, timeMin, timeMax }) {
		const timeZone = "America/Toronto";
		const year = new Date().getFullYear();
		const timeMin = Utils.getDateTime({ date: `${year}-01-01`, time: "00:00", timeZone });
		const timeMax = Utils.getDateTime({ date: `${year + 1}-01-01`, time: "00:00", timeZone });
		const body = await googlePTO.findEvents({ timeMin, timeMax });
		if (!googlePTO.isSimulationMode) {
			assert(body.size > 0, "Invalid output received");
		}
		assertEquals(body.size, body.items.length, "Invalid output received");
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Finding Event by id
Deno.test({
	name: "Finding Event by id",
	async fn(t) {
		let events;
		if (googlePTO.isSimulationMode) {
			const eventData = {
				start: makeTimeForEvent(0),
				end: makeTimeForEvent(1),
				employeeName: "Andres Perez",
				employeeEmail: "aperez@salesforce.com",
			};
			const oldEvent = await googlePTO.createEvent(eventData);
			googlePTO.simulatedEvent = { ...oldEvent };
			events = { items: [oldEvent] };
		} else {
			events = await googlePTO.findEvents({});
		}
		const event = await googlePTO.getEvent({ id: events.items[0].id });
		assertEquals(events.items[0].id, event.id, "Invalid output received");
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});
//#endregion

const makeTimeForEvent = (offset) => {
	const dttm = new Date();
	dttm.setMinutes(0);
	dttm.setSeconds(0);
	dttm.setMilliseconds(0);
	dttm.setHours(dttm.getHours() + 1 + offset);
	return dttm;
};

const bodyRequestPTO = ({ ptoStartTime, ptoStartDate, ptoID, ptoEntitled, ptoEndTime, ptoDays }) => {
	return {
		ptoRequest: {
			ptoStartTime,
			ptoStartDate,
			ptoID,
			ptoEntitled,
			ptoEndTime,
			ptoDays,
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
};

// #region PTO Requests
// Make request for 2 hours
Deno.test({
	name: "Make request for 2 hours",
	async fn(t) {
		const start = makeTimeForEvent(1);
		const end = makeTimeForEvent(3);
		const bodyRequest = bodyRequestPTO({
			ptoStartDate: new Date().toJSON().split("T")[0],
			ptoStartTime: start.toJSON().split("T")[1],
			ptoEndTime: end.toJSON().split("T")[1],
			ptoDays: (end - start) / (1000 * 60 * 60) / 8,
			ptoEntitled: 10.6,
		});
		// const output = await googlePTO.requestPTO(bodyRequest);
		// assert(output[0].id, "Invalid output received");
		// console.log(output);

		// const events = await googlePTO.findEvents({});
		// const event = await googlePTO.getEvent({ id: events.items[0].id });
		// assertEquals(events.items[0].id, event.id, "Invalid output received");
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});
//#endregion
