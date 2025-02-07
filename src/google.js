import { Application, Router } from "jsr:@oak/oak";

export class Google {
	moreRoutes;
	serverRoot;
	loginResult;

	constructor({ moreRoutes }) {
		this.moreRoutes = moreRoutes;
		this.serverRoot = Deno.env.get("SERVER_ROOT");

		this.moreRoutes.push(this.login.bind(this));
		this.moreRoutes.push(this.callback.bind(this));
		this.moreRoutes.push(this.addScopes.bind(this));
	}

	async login({ router }) {
		router.get("/login", (ctx) => {
			const scopeRoot = "https://www.googleapis.com";
			const scopes = [`${scopeRoot}/auth/calendar.readonly`];
			const scope = encodeURI(scopes.join(" "));
			const queryParams = new URLSearchParams({
				scope,
				access_type: "offline",
				include_granted_scopes: "true",
				response_type: "code",
				state: "state_parameter_passthrough_value",
				redirect_uri: encodeURI(`${this.serverRoot}/callback`),
				client_id: Deno.env.get("CLIENT_ID"),
			});

			const url = `https://accounts.google.com/o/oauth2/v2/auth?${queryParams.toString()}`;
			ctx.response.redirect(url);
		});
	}

	async callback({ router }) {
		router.get("/callback", async (ctx) => {
			const queryParams = ctx.request.url.searchParams;
			const response = await fetch("https://oauth2.googleapis.com/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					code: queryParams.get("code"),
					client_id: Deno.env.get("CLIENT_ID"),
					client_secret: Deno.env.get("CLIENT_SECRET"),
					redirect_uri: `${this.serverRoot}/callback`,
					grant_type: "authorization_code",
				}),
			});
			this.loginResult = await response.json();
			console.log(this.loginResult);
			ctx.response.body = `DONE`;
		});
	}

	async addScopes({ router }) {
		const scopeRoot = "https://www.googleapis.com";
		const scopes = [];
		// Google Calendar API	  auth/calendar.events	View and edit events on all your calendars
		scopes.push(`${scopeRoot}/auth/calendar.events`);
		// Google Calendar API	  auth/calendar.events.owned	See, create, change, and delete events on Google calendars you own
		scopes.push(`${scopeRoot}/auth/calendar.events.owned`);
		// const scope = scopes.join("%20");
		// console.log(scope);
		router.get("/addScope0", (ctx) => {
			this.addScope({ ctx, scope: scopes[0] });
		});
		router.get("/addScope1", (ctx) => {
			this.addScope({ ctx, scope: scopes[1] });
		});
	}

	addScope({ ctx, scope }) {
		const queryParams = new URLSearchParams({
			client_id: Deno.env.get("CLIENT_ID"),
			response_type: "code",
			state: "state_parameter_passthrough_value",
			scope,
			redirect_uri: encodeURI(`${this.serverRoot}/callback`),
			prompt: "consent",
			include_granted_scopes: "true",
		});
		const url = `https://accounts.google.com/o/oauth2/v2/auth?${queryParams.toString()}`;
		ctx.response.redirect(url);
	}
}
