import Colors from "../colors.js";
import { assert, assertEquals } from "jsr:@std/assert";

Colors.isDebug = true;
Colors.tests();

let denoTestCounter = 0;

// Spawn the server in a worker thread
const serverPath = new URL("../../main.js", import.meta.url).href;
const worker = new Worker(serverPath, { type: "module", deno: true });

// Wait for a moment to let the server start (this is a little hacky actually)
await new Promise((resolve) => setTimeout(resolve, 5e2));
Colors.warn({ msg: "Waiting..." });
await new Promise((resolve) => setTimeout(resolve, 5e2));
Colors.warn({ msg: "Resume" });

Deno.test("Testing webserver", async (t) => {
	const response = await fetch("http://localhost:3000/test");
	assertEquals(await response.text(), "HELLO WORLD");
	// await response.body?.cancel();
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});
