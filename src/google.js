// import { Application, Router } from "jsr:@oak/oak";

export class Google {
	moreRoutes;
	serverRoot;
	_loginResult;

	constructor({ moreRoutes }) {
		this.moreRoutes = moreRoutes;
		this.serverRoot = Deno.env.get("SERVER_ROOT");

		this.moreRoutes.push(this._login.bind(this));
		this.moreRoutes.push(this._callback.bind(this));
		this.moreRoutes.push(this._addScopes.bind(this));
	}

	get _scopesRequired() {
		const scopesRequired = [];
		const scopeRoot = "https://www.googleapis.com";

		// auth/userinfo.email
		// See your primary Google Account email address
		scopesRequired.push(`${scopeRoot}/auth/userinfo.email`);

		// Google Calendar API
		// auth/calendar.calendars.readonly
		// See the title, description, default time zone, and other properties of Google calendars you have access to
		scopesRequired.push(`${scopeRoot}/auth/calendar.readonly`);

		// Google Calendar API
		// auth/calendar.events
		// View and edit events on all your calendars
		scopesRequired.push(`${scopeRoot}/auth/calendar.events`);

		// Google Calendar API
		// auth/calendar.events.owned
		// See, create, change, and delete events on Google calendars you own
		scopesRequired.push(`${scopeRoot}/auth/calendar.events.owned`);

		return scopesRequired;
	}

	_login({ router }) {
		router.get("/login", async (ctx) => {
			const withoutRefreshtoken = () => {
				const scopes = this._scopesRequired;
				const scope = encodeURI(scopes.shift());
				const state = encodeURI(JSON.stringify(scopes));
				const queryParams = new URLSearchParams({
					scope,
					state,
					response_type: "code",
					access_type: "offline",
					include_granted_scopes: "true",
					login_hint: Deno.env.get("GMAIL"),
					client_id: Deno.env.get("CLIENT_ID"),
					redirect_uri: encodeURI(`${this.serverRoot}/callback`),
				});

				const url = `https://accounts.google.com/o/oauth2/v2/auth?${queryParams.toString()}`;
				ctx.response.redirect(url);
			};
			const withRefreshToken = async (refresh_token) => {
				const response = await fetch("https://oauth2.googleapis.com/token", {
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						grant_type: "refresh_token",
						client_id: Deno.env.get("CLIENT_ID"),
						client_secret: Deno.env.get("CLIENT_SECRET"),
						refresh_token,
					}),
				});
				this.loginResult = await response.json();
				console.log(this.loginResult);
				ctx.response.redirect(`/`);
			};
			const getRefreshToken = async () => {
				try {
					const path = "secrets/google.json";
					await Deno.lstat(path);
					const json = await Deno.readTextFile(path);
					const refresh_token = JSON.parse(json).refresh_token;
					return refresh_token;
				} catch (error) {
					if (error instanceof Deno.errors.NotFound) {
						return null;
					} else {
						throw error; // Re-throw unexpected errors
					}
				}
			};

			const refresh_token = await getRefreshToken();
			if (refresh_token) {
				await withRefreshToken(refresh_token);
			} else {
				await withoutRefreshtoken();
			}
		});
	}

	_callback({ router }) {
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
			this.loginResult = await response.json();
			await Deno.mkdir("secrets", { recursive: true });
			await Deno.writeTextFile(`secrets/googleSecrets_${new Date().getTime() / 1000}.json`, JSON.stringify(this.loginResult, null, 4));
			if (this.loginResult.refresh_token) {
				await Deno.writeTextFile(`secrets/google.json`, JSON.stringify(this.loginResult, null, 4));
			}
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

	_addScopes({ router }) {
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
					access_type: "offline",
					include_granted_scopes: "true",
					login_hint: Deno.env.get("GMAIL"),
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
