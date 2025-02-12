import ET_Asserts from "../etAsserts.js";
import { assert, assertEquals } from "jsr:@std/assert";

Deno.test("Assertions Pass", () => {
	// Pass
	ET_Asserts.equals({ expected: 1, actual: 1, message: "Pass" });
	ET_Asserts.notEquals({ expected: 1, actual: 2, message: "Pass" });
	ET_Asserts.hasData({ value: "DATA", message: "Pass" });
	ET_Asserts.includes({ value: 1, listValues: [1, 2, 3], message: "Pass" });
	assert(true, "Assertions did not fail");
});

Deno.test("Assertion EQUALS", () => {
	try {
		ET_Asserts.equals({ expected: 2, actual: 1, message: "Pass" });
		assert(false, "DID NOT FAIL");
	} catch (ex) {
		assert(ex.message.includes("Assertion failed"), "Invalid assertion received");
	}
});

Deno.test("Assertion NOT EQUALS", () => {
	try {
		ET_Asserts.notEquals({ expected: 2, actual: 2, message: "Pass" });
		assert(false, "DID NOT FAIL");
	} catch (ex) {
		assert(ex.message.includes("Assertion failed"), "Invalid assertion received");
	}
});

Deno.test("Assertion HAS DATA", () => {
	try {
		ET_Asserts.hasData({ value: null, message: "Pass" });
		assert(false, "DID NOT FAIL");
	} catch (ex) {
		assert(ex.message.includes("Assertion failed"), "Invalid assertion received");
	}
});

Deno.test("Assertion INCLUDES", () => {
	try {
		ET_Asserts.includes({ value: 4, listValues: [1, 2, 3], message: "Pass" });
		assert(false, "DID NOT FAIL");
	} catch (ex) {
		assert(ex.message.includes("Assertion failed"), "Invalid assertion received");
	}
});
