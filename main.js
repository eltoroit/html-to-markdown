import Colors from "./src/colors.js";
import { Google } from "./src/google.js";
import { Webserver } from "./src/webserver.js";

Colors.tests();
const moreRoutes = [];
const isDebug = Deno.env.get("IS_DEBUG") === "TRUE";
console.log(`Debug Mode: ${isDebug}`);
new Google({ moreRoutes, isDebug });
new Webserver({ moreRoutes, isDebug });
