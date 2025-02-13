import Colors from "../colors.js";
import ET_Asserts from "../etAsserts.js";
import { assert } from "jsr:@std/assert";
import Utils from "../utils.js";

Colors.isDebug = true;
Colors.tests();

let denoTestCounter = 0;

Deno.test("Assertions Pass", (t) => {
	// Pass
	ET_Asserts.equals({ expected: 1, actual: 1, message: "Pass" });
	ET_Asserts.notEquals({ expected: 1, actual: 2, message: "Pass" });
	ET_Asserts.hasData({ value: "DATA", message: "Pass" });
	ET_Asserts.includes({ value: 1, listValues: [1, 2, 3], message: "Pass" });
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Assertion EQUALS", (t) => {
	try {
		ET_Asserts.equals({ expected: 2, actual: 1, message: "Pass" });
		assert(false, "Expected exception was NOT thrown");
	} catch (ex) {
		const isExpectedException = ex.message.includes("Assertion failed");
		if (!isExpectedException) Utils.reportError({ ex });
		assert(isExpectedException, "Invalid assertion received");
	}
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Assertion NOT EQUALS", (t) => {
	try {
		ET_Asserts.notEquals({ expected: 2, actual: 2, message: "Pass" });
		assert(false, "Expected exception was NOT thrown");
	} catch (ex) {
		const isExpectedException = ex.message.includes("Assertion failed");
		if (!isExpectedException) Utils.reportError({ ex });
		assert(isExpectedException, "Invalid assertion received");
	}
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Assertion HAS DATA", (t) => {
	try {
		ET_Asserts.hasData({ value: null, message: "Pass" });
		assert(false, "Expected exception was NOT thrown");
	} catch (ex) {
		const isExpectedException = ex.message.includes("Assertion failed");
		if (!isExpectedException) Utils.reportError({ ex });
		assert(isExpectedException, "Invalid assertion received");
	}
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Assertion INCLUDES", (t) => {
	try {
		ET_Asserts.includes({ value: 4, listValues: [1, 2, 3], message: "Pass" });
		assert(false, "Expected exception was NOT thrown");
	} catch (ex) {
		const isExpectedException = ex.message.includes("Assertion failed");
		if (!isExpectedException) Utils.reportError({ ex });
		assert(isExpectedException, "Invalid assertion received");
	}
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});
