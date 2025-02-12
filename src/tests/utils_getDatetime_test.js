import { Utils } from "../utils.js";
import { assertEquals } from "jsr:@std/assert";

Utils.IsDebug = false;
const date = "2025-02-10";
const testValues = [
	{
		timeZone: "America/Toronto",
		expected: new Date("2025-02-10T14:00:00.000Z"),
		times: ["9 AM", "9:00 AM", "09:00 AM", "09:00", "09:00:00", "14:00:00.000Z"],
	},
	{
		timeZone: "America/Los_Angeles",
		expected: new Date("2025-02-10T22:00:00.000Z"),
		times: ["2 PM", "2:00 PM", "02:00 PM", "14:00", "14:00:00", "22:00:00.000Z"],
	},
];
testValues.forEach((testValue) => {
	const timeZone = testValue.timeZone;
	testValue.times.forEach((time) => {
		Deno.test(`timeZone: ${timeZone} | Date: ${date} | Time: ${time}`, () => {
			const timestamp = Utils.getDateTime({ date, time, timeZone });
			// console.log(`timeZone: ${timeZone} | Date: ${date} | Time: ${time}`);
			assertEquals(timestamp, testValue.expected);
		});
	});
});

// More tests
Deno.test("Date ignored if present in time", () => {
	const timeZone = "America/Los_Angeles",
		date = "2025-02-10",
		time = "2025-02-14T14:00:00.000Z",
		expected = new Date(time);
	const timestamp = Utils.getDateTime({ date, time, timeZone });
	if (Utils.IsDebug) console.log(`ISO: ${timestamp.toISOString()} | ${timestamp} | timeZone: ${timeZone} | Date: ${date} | Time: ${time}`);
	assertEquals(timestamp, expected);
});
