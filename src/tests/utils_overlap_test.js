import Utils from "../utils.js";
import Colors from "../colors.js";
import { assert, assertEquals } from "jsr:@std/assert";

Colors.isDebug = true;
Colors.tests();

let events = [];
let denoTestCounter = 0;

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
Deno.test("Event #GOOD_01 - Well Before", (t) => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-10T09:00:00-05:00"),
		end: new Date("2025-02-10T09:30:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Event #GOOD_02 - Ends on time", (t) => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-10T09:00:00-05:00"),
		end: new Date("2025-02-10T10:00:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Event #GOOD_03 - Squezzed", (t) => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-10T11:00:00-05:00"),
		end: new Date("2025-02-10T11:30:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Event #GOOD_04 - Between meetings", (t) => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-10T11:15:00-05:00"),
		end: new Date("2025-02-10T11:20:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Event #GOOD_05 - Just before", (t) => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-10T11:15:00-05:00"),
		end: new Date("2025-02-10T11:30:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Event #GOOD_06 - Just after", (t) => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-10T12:00:00-05:00"),
		end: new Date("2025-02-10T13:00:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Event #GOOD_07 - Well past", (t) => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-10T14:00:00-05:00"),
		end: new Date("2025-02-10T15:00:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Event #GOOD_08 - Day before", (t) => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-09T08:00:00-05:00"),
		end: new Date("2025-02-09T15:00:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Event #GOOD_09 - Day after", (t) => {
	const newEvent = {
		added: true,
		start: new Date("2025-02-09T08:00:00-05:00"),
		end: new Date("2025-02-09T15:00:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});
//#endregion

//#region Bad Events
Deno.test("Event #BAD_01 - Ends too late", (t) => {
	const newEvent = {
		added: false,
		start: new Date("2025-02-10T09:00:00-05:00"),
		end: new Date("2025-02-10T10:30:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Event #BAD_02 - Exact meeting", (t) => {
	const newEvent = {
		added: false,
		start: new Date("2025-02-10T10:00:00-05:00"),
		end: new Date("2025-02-10T11:00:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Event #BAD_03 - Inside meeting", (t) => {
	const newEvent = {
		added: false,
		start: new Date("2025-02-10T10:10:00-05:00"),
		end: new Date("2025-02-10T10:20:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Event #BAD_04 - Starts Early", (t) => {
	const newEvent = {
		added: false,
		start: new Date("2025-02-10T10:30:00-05:00"),
		end: new Date("2025-02-10T11:15:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Event #BAD_05 - Ends too late", (t) => {
	const newEvent = {
		added: false,
		start: new Date("2025-02-10T11:15:00-05:00"),
		end: new Date("2025-02-10T11:45:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Event #BAD_06 - Longer meeting", (t) => {
	const newEvent = {
		added: false,
		start: new Date("2025-02-10T09:00:00-05:00"),
		end: new Date("2025-02-10T11:15:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Event #BAD_07 - Full day", (t) => {
	const newEvent = {
		added: false,
		start: new Date("2025-02-10T09:00:00-05:00"),
		end: new Date("2025-02-10T17:00:00-05:00"),
		title: "TEST EVENT",
	};
	const added = addEvent(newEvent);
	events = events.filter((event) => event.title !== newEvent.title);
	assertEquals(added, newEvent.added);
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});
//#endregion

Deno.test("Event #EXCEPTION_01 - Inverted timestamps", (t) => {
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
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Event #EXCEPTION_02 - Same timestamps", (t) => {
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
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});
