import { Webserver } from "./src/webserver.js";

const moreRoutes = [];
moreRoutes.push(({ router }) => {
	console.log("Hello");
	router.get("/test", (ctx) => {
		ctx.response.body = `test`;
	});
});

new Webserver({ moreRoutes });
