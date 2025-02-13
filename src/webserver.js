import Colors from "./colors.js";
import { Application, Router } from "jsr:@oak/oak";

export default class Webserver {
	#router = new Router();

	constructor() {}

	async initializeServer({ moreRoutes }) {
		this.#router = new Router();
		const app = new Application();
		this.#makeRoutes({ moreRoutes });
		app.use(this.#router.routes());
		app.use(this.#router.allowedMethods());

		const port = parseInt(Deno.env.get("PORT") || "3000");
		await this.#serveHTTP({ app, port });
		// await this.#serveHTTPS({ app, port });
	}

	#makeRoutes({ moreRoutes }) {
		this.#homepage();
		this.#test();
		for (const route of moreRoutes) {
			route({ router: this.#router });
		}
	}

	#homepage() {
		this.#router.get("/", (ctx) => {
			ctx.response.body = `<!DOCTYPE html>
<html>
	<head><title>Agentforce PTO</title><head>
	<body>
	<h1>Agentforce PTO</h1>
	<a href="/login">/login</a><br/>
	<hr/>
	<a href="/clearCalendar">/clearCalendar</a><br/>
	<hr/>
	</body>
</html>`;
		});
	}

	#test() {
		this.#router.get("/test", (ctx) => {
			ctx.response.body = `HELLO WORLD`;
		});
	}

	#serveHTTP({ app, port }) {
		app.listen({ port });
		Colors.success({ msg: `Server running on HTTP ${port}: http://localhost:${port}` });
	}

	async #serveHTTPS({ app, port }) {
		const certs = {
			private: "./cert/localhost.key",
			public: "./cert/localhost.crt",
		};
		for (const cert of Object.keys(certs)) {
			certs[cert] = await Deno.realPath(certs[cert]);
			certs[cert] = await Deno.readTextFile(certs[cert]);
		}

		app.listen({
			port,
			secure: true,
			cert: certs.public,
			key: certs.private,
		});
		Colors.success({ msg: `Server running on HTTPS port ${port}: https://localhost:${port}` });
	}
}

// // CORS middleware
// app.use(async (ctx, next) => {
//  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
//  ctx.response.headers.set(
//   "Access-Control-Allow-Methods",
//   "GET, POST, OPTIONS"
//  );
//  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type");

//  if (ctx.request.method === "OPTIONS") {
//   ctx.response.status = 204;
//   return;
//  }

//  await next();
// });
