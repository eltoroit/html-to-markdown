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
			const scopes = [];
			const scopeRoot = "https://www.googleapis.com";
			// Google Calendar API	  auth/calendar.calendars.readonly
			// See the title, description, default time zone, and other properties of Google calendars you have access to
			scopes.push(`${scopeRoot}/auth/calendar.readonly`);
			// Google Calendar API	  auth/calendar.events
			// View and edit events on all your calendars
			scopes.push(`${scopeRoot}/auth/calendar.events`);
			// Google Calendar API	  auth/calendar.events.owned
			// See, create, change, and delete events on Google calendars you own
			scopes.push(`${scopeRoot}/auth/calendar.events.owned`);
			const scope = encodeURI(scopes.pop());
			const state = encodeURI(JSON.stringify(scopes));
			const queryParams = new URLSearchParams({
				scope,
				state,
				response_type: "code",
				access_type: "offline",
				include_granted_scopes: "true",
				client_id: Deno.env.get("CLIENT_ID"),
				redirect_uri: encodeURI(`${this.serverRoot}/callback`),
			});

			const url = `https://accounts.google.com/o/oauth2/v2/auth?${queryParams.toString()}`;
			ctx.response.redirect(url);
		});
	}

	callback({ router }) {
		router.get("/callback", async (ctx) => {
			const queryParams = ctx.request.url.searchParams;
			// for (const [key, value] of queryParams) {
			// 	console.log(`${key}: ${value}`);
			// }
			const response = await fetch("https://oauth2.googleapis.com/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					code: queryParams.get("code"),
					grant_type: "authorization_code",
					client_id: Deno.env.get("CLIENT_ID"),
					client_secret: Deno.env.get("CLIENT_SECRET"),
					redirect_uri: `${this.serverRoot}/callback`,
				}),
			});
			// Save these results to a file (env variable)
			this.loginResult = await response.json();
			console.log(this.loginResult);

			// Check scopes
			const scopesGranted = this.loginResult.scope.split(" ");
			const scopesRequired = JSON.parse(decodeURI(queryParams.get("state")));
			const scopesRemaining = scopesRequired.filter((scope) => !scopesGranted.includes(scope));
			if (scopesRemaining.length > 0) {
				const state = encodeURI(JSON.stringify(scopesRemaining));
				ctx.response.redirect(`/addScope?state=${state}`);
			} else {
				ctx.response.redirect(`/`);
			}
		});
	}

	addScopes({ router }) {
		router.get("/addScope", (ctx) => {
			const queryParamsRequest = ctx.request.url.searchParams;

			try {
				let state = JSON.parse(queryParamsRequest.get("state"));
				const scope = state.pop();
				state = encodeURI(JSON.stringify(state));
				const queryParams = new URLSearchParams({
					scope,
					state,
					prompt: "consent",
					response_type: "code",
					include_granted_scopes: "true",
					client_id: Deno.env.get("CLIENT_ID"),
					redirect_uri: encodeURI(`${this.serverRoot}/callback`),
				});
				const url = `https://accounts.google.com/o/oauth2/v2/auth?${queryParams.toString()}`;
				ctx.response.redirect(url);
			} catch (ex) {
				ctx.response.body = `ERROR: ${ex.message}\n\n${ex.stack}`;
			}
		});
	}
}
