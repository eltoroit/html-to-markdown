import { Application, Router } from "jsr:@oak/oak";

export class Webserver {
	router = new Router();

	constructor({ moreRoutes }) {
		this._initializeServer({ moreRoutes });
	}

	async _initializeServer({ moreRoutes }) {
		this.router = new Router();
		const app = new Application();
		this._makeRoutes({ moreRoutes });
		app.use(this.router.routes());
		app.use(this.router.allowedMethods());

		const port = parseInt(Deno.env.get("PORT") || "3000");
		console.log(`*** ${Deno.env.get("SERVER")} ***`);
		if (Deno.env.get("SERVER") === "LOCALHOST") {
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
		} else {
			app.listen({ port });
			console.log(`Server running on HEROKU ${port}: http://localhost:${port}`);
		}
	}

	_makeRoutes({ moreRoutes }) {
		this._hello();
		this._convert();
		for (const route of moreRoutes) {
			route({ router: this.router });
		}
	}

	_hello() {
		this.router.get("/", (ctx) => {
			ctx.response.body = `
        <!DOCTYPE html>
        <html>
          <head><title>Agentforce PTO</title><head>
          <body>
            <h1>Agentforce PTO</h1>
            <a href="/createEvent">/createEvent</a><br/>
            <a href="/findAllEvents">/findAllEvents</a><br/>
			<hr/>
            <a href="/findCalendar">/findCalendar</a><br/>
            <a href="/login">/login</a><br/>
          </body>
        </html>`;
		});
	}

	_convert() {
		this.router.post("/convert", async (ctx) => {
			try {
				const body = await ctx.request.body.text();

				if (!body) {
					ctx.response.status = 400;
					ctx.response.body = {
						error: "Missing request body",
					};
					return;
				}

				const markdown = `Pong: ${body}`;

				ctx.response.body = markdown;
			} catch (error) {
				console.error("Conversion error:", error);
				ctx.response.status = 500;
				ctx.response.body = {
					error: "Failed to convert HTML to Markdown",
					details: error.message,
				};
			}
		});
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
