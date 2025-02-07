import { Google } from "./src/google.js";
import { Webserver } from "./src/webserver.js";

const moreRoutes = [];
new Google({ moreRoutes });
new Webserver({ moreRoutes });
