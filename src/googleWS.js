import Utils from "./utils.js";
import Colors from "./colors.js";
import GooglePTO from "./googlePTO.js";

export default class GoogleWS {
	#googlePTO;
	loginResult;
	#callbackServer;
	#isDebug = false;

	constructor({ moreRoutes }) {
		const isDebug = Deno.env.get("IS_DEBUG") === "TRUE";
		this.#isDebug = isDebug;
		Utils.IsDebug = this.#isDebug;
		Colors.debug({ msg: `Debug Mode: ${isDebug}` });
		this.#googlePTO = new GooglePTO({ isDebug, googleWS: this });

		// Set Variables
		this.#callbackServer = Deno.env.get("CALLBACK_SERVER");

		// Login
		moreRoutes.push(this.#login_GET.bind(this));
		moreRoutes.push(this.#callback_GET.bind(this));
		moreRoutes.push(this.#addScopes_GET.bind(this));

		// // Calendar events
		moreRoutes.push(this.#event_GET.bind(this));
		moreRoutes.push(this.#event_POST.bind(this));
		moreRoutes.push(this.#event_PATCH.bind(this));
		moreRoutes.push(this.#event_DELETE.bind(this));
		moreRoutes.push(this.#findEvents_GET.bind(this));
		moreRoutes.push(this.#requestPTO_POST.bind(this));
		moreRoutes.push(this.#findCalendar_GET.bind(this));
		moreRoutes.push(this.#clearCalendar_GET.bind(this));
	}

	//#region CALENDAR ROUTER
	#findCalendar_GET({ router }) {
		router.get(`/findCalendar`, async (ctx) => {
			Colors.finest({ msg: `${ctx.request.method} ${ctx.request.url}` });
			try {
				const body = await this.#googlePTO.findCalendar();
				ctx.response.status = "200";
				ctx.response.body = body;
			} catch (ex) {
				Utils.reportError({ ctx, ex });
			}
		});
	}

	#findEvents_GET({ router }) {
		router.get("/findEvents", async (ctx) => {
			Colors.finest({ msg: `${ctx.request.method} ${ctx.request.url}` });
			const queryParams = ctx.request.url.searchParams;
			const query = queryParams.get("query");
			try {
				const body = await this.#googlePTO.findEvents({ query });
				ctx.response.type = "json";
				ctx.response.status = "200";
				ctx.response.body = body;
			} catch (ex) {
				Utils.reportError({ ctx, ex });
			}
		});
	}

	#event_GET({ router }) {
		router.get("/event", async (ctx) => {
			Colors.finest({ msg: `${ctx.request.method} ${ctx.request.url}` });
			const queryParams = ctx.request.url.searchParams;
			const id = queryParams.get("id");
			try {
				const body = await this.#googlePTO.getEvent({ id });
				ctx.response.type = "json";
				ctx.response.status = "200";
				ctx.response.body = body;
			} catch (ex) {
				Utils.reportError({ ctx, ex });
			}
		});
	}

	#event_POST({ router }) {
		router.post("/event", async (ctx) => {
			const bodyRequest = await ctx.request.body.json();
			Colors.finest({ msg: `${ctx.request.method} ${ctx.request.url}` });
			Colors.finest({ msg: bodyRequest });
			try {
				const bodyResponse = await this.#googlePTO.createEvent(bodyRequest);
				ctx.response.type = "json";
				ctx.response.status = "200";
				ctx.response.body = bodyResponse;
			} catch (ex) {
				Utils.reportError({ ctx, ex });
			}
		});
	}

	#event_PATCH({ router }) {
		router.patch("/event", async (ctx) => {
			const queryParams = ctx.request.url.searchParams;
			const id = queryParams.get("id");
			const bodyRequest = await ctx.request.body.json();
			Colors.finest({ msg: `${ctx.request.method} ${ctx.request.url}` });
			Colors.finest({ msg: bodyRequest });
			try {
				const bodyResponse = await this.#googlePTO.updateEvent({ id, ...bodyRequest });
				ctx.response.type = "json";
				ctx.response.status = "200";
				ctx.response.body = bodyResponse;
			} catch (ex) {
				Utils.reportError({ ctx, ex });
			}
		});
	}

	#event_DELETE({ router }) {
		router.delete("/event", async (ctx) => {
			Colors.finest({ msg: `${ctx.request.method} ${ctx.request.url}` });
			const queryParams = ctx.request.url.searchParams;
			const id = queryParams.get("id");
			try {
				const body = await this.#googlePTO.deleteEvent({ id });
				ctx.response.type = "json";
				ctx.response.status = "200";
				ctx.response.body = body;
			} catch (ex) {
				Utils.reportError({ ctx, ex });
			}
		});
	}

	#clearCalendar_GET({ router }) {
		router.get("/clearCalendar", async (ctx) => {
			Colors.finest({ msg: `${ctx.request.method} ${ctx.request.url}` });
			try {
				const body = await this.#googlePTO.clearCalendar();
				ctx.response.type = "json";
				ctx.response.status = "200";
				ctx.response.body = body;
			} catch (ex) {
				Utils.reportError({ ctx, ex });
			}
		});
	}

	#requestPTO_POST({ router }) {
		router.post("/requestPTO", async (ctx) => {
			const bodyRequest = await ctx.request.body.json();
			Colors.finest({ msg: `${ctx.request.method} ${ctx.request.url}` });
			Colors.finest({ msg: bodyRequest });
			try {
				const bodyResponse = await this.#googlePTO.requestPTO(bodyRequest);
				ctx.response.type = "json";
				ctx.response.status = "200";
				ctx.response.body = bodyResponse;
			} catch (ex) {
				Utils.reportError({ ctx, ex });
			}
		});
	}

	//#endregion

	//#region LOGIN
	get #scopesRequired() {
		const scopesRequired = [];
		const scopeRoot = "https://www.googleapis.com";

		// See your primary Google Account email address
		scopesRequired.push(`${scopeRoot}/auth/userinfo.email`);

		// Google Calendar API | See, create, change, and delete events on Google calendars you own
		scopesRequired.push(`${scopeRoot}/auth/calendar.events.owned`);

		// Google Calendar API | See the title, description, default time zone, and other properties of Google calendars you have access to
		scopesRequired.push(`${scopeRoot}/auth/calendar.readonly`);

		// // Google Calendar API | View and edit events on all your calendars
		// scopesRequired.push(`${scopeRoot}/auth/calendar.events`);

		return scopesRequired;
	}

	#login_GET({ router }) {
		router.get("/login", async (ctx) => {
			const loginWithoutRefreshToken = () => {
				const scopes = this.#scopesRequired;
				const scope = encodeURI(scopes.shift());
				const state = encodeURI(JSON.stringify(scopes));
				let queryParams = {
					scope,
					state,
					response_type: "code",
					access_type: "offline",
					include_granted_scopes: "true",
					client_id: Deno.env.get("CLIENT_ID"),
					redirect_uri: encodeURI(`${this.#callbackServer}/callback`),
				};
				if (Deno.env.get("GMAIL")) {
					queryParams.login_hint = Deno.env.get("GMAIL");
				}
				queryParams = new URLSearchParams(queryParams);
				if (this.#isDebug) Colors.debug({ msg: `Callback Server: ${this.#callbackServer}` });

				const url = `https://accounts.google.com/o/oauth2/v2/auth?${queryParams.toString()}`;
				ctx.response.redirect(url);
			};

			try {
				const body = await this.loginWithRefreshToken();
				ctx.response.body = body;
			} catch (ex) {
				Utils.reportError({ error: "Unable to login with Refresh Token" });
				Utils.reportError({ ex });
				await loginWithoutRefreshToken();
			}
		});
	}

	#callback_GET({ router }) {
		const saveLoginResults = async () => {
			if (this.#isDebug) {
				await Deno.mkdir("secrets", { recursive: true });
				await Deno.writeTextFile(`secrets/googleSecrets_${new Date().getTime() / 1000}.json`, JSON.stringify(this.loginResult, null, 4));
				if (this.loginResult.refresh_token) {
					await Deno.writeTextFile(`secrets/google.json`, JSON.stringify(this.loginResult, null, 4));
				}
			}
			if (this.loginResult?.refresh_token) {
				Colors.debug({ msg: `Refresh Token [${this.loginResult.refresh_token}]` });
			}
		};
		router.get("/callback", async (ctx) => {
			const queryParams = ctx.request.url.searchParams;
			if (this.#isDebug) {
				for (const [key, value] of queryParams) {
					Colors.debug({ msg: `${key}: ${value}` });
				}
			}
			Colors.debug({ msg: "Swapping code for Access Token" });
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
					redirect_uri: `${this.#callbackServer}/callback`,
				}),
			});
			if (this.#isDebug) Colors.debug({ msg: `Callback Server: ${this.#callbackServer}` });
			this.loginResult = await response.json();
			Colors.fine({ msg: "Login Callback" });
			if (this.#isDebug) Colors.debug({ msg: this.loginResult });
			await saveLoginResults();

			// Check scopes
			const scopesGranted = this.loginResult.scope.split(" ");
			const scopesRequired = JSON.parse(decodeURI(queryParams.get("state")));
			const scopesRemaining = scopesRequired.filter((scope) => !scopesGranted.includes(scope));
			if (scopesRemaining.length > 0) {
				// ctx.response.redirect(`/addScope?state=${state}`);
				const state = encodeURI(JSON.stringify(scopesRemaining));
				const nextUrl = `/addScope?state=${state}`;
				let nextScope = scopesRemaining[0].split("/");
				nextScope = nextScope[nextScope.length - 1];
				ctx.response.body = `<!DOCTYPE html>
<html>
	<head><title>Agentforce PTO</title><head>
	<body>
	<h1>More requests are needed</h1>
	<a href="${nextUrl}">Request scope <b>${nextScope}</b></a><br/>
	</body>
</html>`;
			} else {
				let msg = "";
				if (this.loginResult?.refresh_token) {
					msg = `Save the new Refresh Token <span style="color:red">${this.loginResult.refresh_token}</span>`;
				}
				ctx.response.body = `<!DOCTYPE html>
<html>
	<head><title>Agentforce PTO</title><head>
	<body>
	<h1>Login succesful</h1>
	${msg}
	</body>
</html>`;
			}
		});
	}

	#addScopes_GET({ router }) {
		router.get("/addScope", (ctx) => {
			const queryParamsRequest = ctx.request.url.searchParams;

			try {
				let state = JSON.parse(queryParamsRequest.get("state"));
				const scope = state.shift();
				state = encodeURI(JSON.stringify(state));
				let queryParams = {
					scope,
					state,
					prompt: "consent",
					response_type: "code",
					access_type: "offline",
					include_granted_scopes: "true",
					client_id: Deno.env.get("CLIENT_ID"),
					redirect_uri: encodeURI(`${this.#callbackServer}/callback`),
				};
				if (Deno.env.get("GMAIL")) {
					queryParams.login_hint = Deno.env.get("GMAIL");
				}
				queryParams = new URLSearchParams(queryParams);
				if (this.#isDebug) Colors.debug({ msg: `Callback Server: ${this.#callbackServer}` });
				const url = `https://accounts.google.com/o/oauth2/v2/auth?${queryParams.toString()}`;
				ctx.response.redirect(url);
			} catch (ex) {
				ctx.response.body = `ERROR: ${ex.message}\n\n${ex.stack}`;
			}
		});
	}

	async loginWithRefreshToken() {
		const getRefreshToken = () => {
			try {
				// const path = "secrets/google.json";
				// await Deno.lstat(path);
				// const json = await Deno.readTextFile(path);
				// const refresh_token = JSON.parse(json).refresh_token;
				const refresh_token = Deno.env.get("REFRESH_TOKEN");
				return refresh_token;
			} catch (error) {
				if (error instanceof Deno.errors.NotFound) {
					return null;
				} else {
					throw error; // Re-throw unexpected errors
				}
			}
		};

		const login = async (refresh_token) => {
			Colors.debug({ msg: "Requesting Access Token using Refresh Token" });
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
			if (this.#isDebug) Colors.debug({ msg: this.loginResult });
			if (this.loginResult.access_token) {
				Colors.fine({ msg: "Logged in with Refresh Token" });
				return `Logged in with refresh token completed: ${new Date().toJSON()}`;
			} else {
				throw new Error("Unable to get Access Token using Refresh Token");
			}
		};

		const refresh_token = await getRefreshToken();
		Colors.debug({ msg: `Refresh token: [${refresh_token}]` });
		if (refresh_token) {
			await login(refresh_token);
		} else {
			throw new Error("Refresh Token NOT found");
		}
	}
	//#endregion
}
