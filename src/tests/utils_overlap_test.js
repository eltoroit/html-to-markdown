import { Utils } from "../utils.js";
import { assert, assertEquals } from "jsr:@std/assert";

let events = [];
Utils.IsDebug = false;

function addEvent(newEvent) {
	const hasOverlap = Utils.hasOverlap({ events, newEvent });
	if (hasOverlap) return false;
	events.push(newEvent);
	events.sort((a, b) => a.startTime - b.startTime);
	return true;
}

const baseEvents = [
	{
		start: new Date("2025-02-10T10:00:00-05:00"),
		end: new Date("2025-02-10T11:00:00-05:00"),
		title: "Morning Meeting",
	},
	{
		start: new Date("2025-02-10T11:30:00-05:00"),
		end: new Date("2025-02-10T12:00:00-05:00"),
		title: "Lunch",
	},
];
baseEvents.forEach((newEvent) => {
	addEvent(newEvent);
});

//#region Good Events
Deno.test("Event #GOOD_01 - Well Before", () => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-10T09:00:00-05:00"),
		end: new Date("2025-02-10T09:30:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
});

Deno.test("Event #GOOD_02 - Ends on time", () => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-10T09:00:00-05:00"),
		end: new Date("2025-02-10T10:00:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
});

Deno.test("Event #GOOD_03 - Squezzed", () => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-10T11:00:00-05:00"),
		end: new Date("2025-02-10T11:30:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
});

Deno.test("Event #GOOD_04 - Between meetings", () => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-10T11:15:00-05:00"),
		end: new Date("2025-02-10T11:20:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
});

Deno.test("Event #GOOD_05 - Just before", () => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-10T11:15:00-05:00"),
		end: new Date("2025-02-10T11:30:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
});

Deno.test("Event #GOOD_06 - Just after", () => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-10T12:00:00-05:00"),
		end: new Date("2025-02-10T13:00:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
});

Deno.test("Event #GOOD_07 - Well past", () => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-10T14:00:00-05:00"),
		end: new Date("2025-02-10T15:00:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
});

Deno.test("Event #GOOD_08 - Day before", () => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-09T08:00:00-05:00"),
		end: new Date("2025-02-09T15:00:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
});

Deno.test("Event #GOOD_09 - Day after", () => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-09T08:00:00-05:00"),
		end: new Date("2025-02-09T15:00:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
});
//#endregion

//#region Bad Events
Deno.test("Event #BAD_01 - Ends too late", () => {
	const newEvent = {
		added: false,
		start: new Date("2025-02-10T09:00:00-05:00"),
		end: new Date("2025-02-10T10:30:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
});

Deno.test("Event #BAD_02 - Exact meeting", () => {
	const newEvent = {
		added: false,
		start: new Date("2025-02-10T10:00:00-05:00"),
		end: new Date("2025-02-10T11:00:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
});

Deno.test("Event #BAD_03 - Inside meeting", () => {
	const newEvent = {
		added: false,
		start: new Date("2025-02-10T10:10:00-05:00"),
		end: new Date("2025-02-10T10:20:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
});

Deno.test("Event #BAD_04 - Starts Early", () => {
	const newEvent = {
		added: false,
		start: new Date("2025-02-10T10:30:00-05:00"),
		end: new Date("2025-02-10T11:15:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
});

Deno.test("Event #BAD_05 - Ends too late", () => {
	const newEvent = {
		added: false,
		start: new Date("2025-02-10T11:15:00-05:00"),
		end: new Date("2025-02-10T11:45:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
});

Deno.test("Event #BAD_06 - Longer meeting", () => {
	const newEvent = {
		added: false,
		start: new Date("2025-02-10T09:00:00-05:00"),
		end: new Date("2025-02-10T11:15:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
});

Deno.test("Event #BAD_07 - Full day", () => {
	const newEvent = {
		added: false,
		start: new Date("2025-02-10T09:00:00-05:00"),
		end: new Date("2025-02-10T17:00:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
});
//#endregion

Deno.test("Event #EXCEPTION_01 - Inverted timestamps", () => {
	const newEvent = {
		added: false,
		start: new Date("2025-02-10T17:00:00-05:00"),
		end: new Date("2025-02-10T09:00:00-05:00"),
		title: "TEST EVENT",
	};
	try {
		const added = addEvent(newEvent);
		assert(false, "Excetion not thrown");
	} catch (ex) {
		assertEquals(ex.message, "Event start time can't be later than event end time");
	}
	events = events.filter((event) => event.title !== newEvent.title);
});

Deno.test("Event #EXCEPTION_02 - Same timestamps", () => {
	const newEvent = {
		added: false,
		start: new Date("2025-02-10T17:00:00-05:00"),
		end: new Date("2025-02-10T17:00:00-05:00"),
		title: "TEST EVENT",
	};
	try {
		addEvent(newEvent);
		assert(false, "Excetion not thrown");
	} catch (ex) {
		assertEquals(ex.message, "Event start time can't be the same as the event end time");
	}
	events = events.filter((event) => event.title !== newEvent.title);
});
