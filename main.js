import Colors from "./src/colors.js";
import GoogleWS from "./src/googleWS.js";
import Webserver from "./src/webserver.js";

// deno-lint-ignore no-constant-condition
if (true) {
	Colors.tests();
}
const moreRoutes = [];
new GoogleWS({ moreRoutes });
const ws = new Webserver();
await ws.initializeServer({ moreRoutes });
Colors.success({ msg: "Server Ready" });
