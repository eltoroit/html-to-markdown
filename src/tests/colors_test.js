import Utils from "../utils.js";
import Colors from "../colors.js";

let denoTestCounter = 0;

Deno.test("Show colors", (t) => {
	Colors.tests();
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Test exception", (t) => {
	try {
		throw new Error("Testing Exception colors");
	} catch (ex) {
		Utils.reportError({ ex });
	}
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});
