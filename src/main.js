import Utils from "./utils.js";
import Colors from "./colors.js";
import GoogleWS from "./googleWS.js";
import Webserver from "./webserver.js";

// deno-lint-ignore no-constant-condition
if (true) {
	Colors.tests();
}
const moreRoutes = [];
new GoogleWS({ moreRoutes });
const ws = new Webserver();
await ws.initializeServer({ moreRoutes });
Colors.success({ msg: "Server Ready" });
