import Colors from "../colors.js";
import { assert, assertEquals } from "jsr:@std/assert";

const serverPath = new URL("../../main.js", import.meta.url).href;
Colors.debug({ msg: serverPath });

// Spawn the server in a worker thread
const worker = new Worker(serverPath, { type: "module", deno: true });

// Wait for a moment to let the server start (this is a little hacky actually)
Colors.command({ msg: "Waiting..." });
await new Promise((resolve) => setTimeout(resolve, 5e3));
Colors.success({ msg: "Resume" });

Deno.test("Testing webserver", async (t) => {
	const response = await fetch("http://localhost:3000/test");
	assertEquals(await response.text(), "HELLO WORLD");
	// await response.body?.cancel();
});
