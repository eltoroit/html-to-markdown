import { Application, Router } from "jsr:@oak/oak";

export class Webserver {
	#isDebug = false;
	#router = new Router();

	constructor({ moreRoutes, isDebug }) {
		this.#isDebug = isDebug;
		this.#initializeServer({ moreRoutes });
	}

	async #initializeServer({ moreRoutes }) {
		this.#router = new Router();
		const app = new Application();
		this.#makeRoutes({ moreRoutes });
		app.use(this.#router.routes());
		app.use(this.#router.allowedMethods());

		const port = parseInt(Deno.env.get("PORT") || "3000");
		this.#serveHTTP({ app, port });
		// this.#serveHTTPS({ app, port });
	}

	#makeRoutes({ moreRoutes }) {
		this.#homepage();
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

	#serveHTTP({ app, port }) {
		app.listen({ port });
		console.log(`Server running on HEROKU ${port}: http://localhost:${port}`);
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
		console.log(`Server running on LOCALHOST port ${port}: https://localhost:${port}`);
	}
}

// // CORS middleware
// app.use(async (ctx, next) => {
//   ctx.response.headers.set("Access-Control-Allow-Origin", "*");
//   ctx.response.headers.set(
//     "Access-Control-Allow-Methods",
//     "GET, POST, OPTIONS"
//   );
//   ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type");

//   if (ctx.request.method === "OPTIONS") {
//     ctx.response.status = 204;
//     return;
//   }

//   await next();
// });
