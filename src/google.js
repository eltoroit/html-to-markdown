// import { Application, Router } from "jsr:@oak/oak";

export class Google {
	serverRoot;
	calendarId;
	loginResult;
	isDebug = false;

	constructor({ moreRoutes }) {
		this.serverRoot = Deno.env.get("SERVER_ROOT");

		// Login
		moreRoutes.push(this._login.bind(this));
		moreRoutes.push(this._callback.bind(this));
		moreRoutes.push(this._addScopes.bind(this));

		// Calendars
		moreRoutes.push(this._findCalendarWS.bind(this));
		moreRoutes.push(this._createEvent.bind(this));
	}

	_findCalendarWS({ router }) {
		router.get("/findCalendar", async (ctx) => {
			await this._findCalendar({ ctx });
		});
	}

	_createEvent({ router }) {
		router.get("/createEvent", async (ctx) => {
			if (!this.calendarId) {
				await this._findCalendar({});
			}
			const start = new Date();
			let end = new Date();
			end = new Date(end.setHours(end.getHours() + 1));
			const event = {
				summary: "PTO: Andres Perez",
				description: "Andres Perez",
				start: {
					dateTime: start.toJSON(),
				},
				end: {
					dateTime: end.toJSON(),
				},
				// eventType: "outOfOffice",
				attendees: [{ email: "aperez@salesforce.com" }],
				// reminders: {
				// 	useDefault: false,
				// 	overrides: [
				// 		{ method: "email", minutes: 24 * 60 },
				// 		{ method: "popup", minutes: 10 },
				// 	],
				// },
			};
			const sendUpdates = "none";
			const response = await this._etFetch({
				url: `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events?sendUpdates=${sendUpdates}`,
				options: {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(event),
				},
			});
			console.log(response);
			if (ctx) {
				ctx.response.body = "DONE";
			}
		});
	}

	async _findCalendar({ ctx }) {
		const calendarName = "Agentforce PTO";
		let calendars = await this._etFetch({
			url: "https://www.googleapis.com/calendar/v3/users/me/calendarList",
			options: {
				method: "GET",
			},
		});
		calendars = calendars.items.filter((calendar) => calendar.summary === calendarName);
		if (calendars.length === 1) {
			this.calendarId = calendars[0].id;
			console.log(`Calendar: ${this.calendarId}`);
			if (ctx) {
				ctx.response.body = "DONE";
			}
		} else {
			throw new Error(`Could not find calendar named [${calendarName}]`);
		}
	}

	//#region LOGIN
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
			const loginWithoutRefreshToken = () => {
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

			try {
				await this._loginWithRefreshToken({ ctx });
			} catch (ex) {
				console.error(ex);
				console.error("Unable to login with Refresh Token");
				await loginWithoutRefreshToken();
			}
		});
	}

	_callback({ router }) {
		const saveLoginResults = async () => {
			await Deno.mkdir("secrets", { recursive: true });
			await Deno.writeTextFile(`secrets/googleSecrets_${new Date().getTime() / 1000}.json`, JSON.stringify(this.loginResult, null, 4));
			if (this.loginResult.refresh_token) {
				await Deno.writeTextFile(`secrets/google.json`, JSON.stringify(this.loginResult, null, 4));
			}
		};
		router.get("/callback", async (ctx) => {
			const queryParams = ctx.request.url.searchParams;
			if (this.isDebug) {
				for (const [key, value] of queryParams) {
					console.log(`${key}: ${value}`);
				}
			}
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
			console.log("Login Callback");
			if (this.isDebug) console.log(this.loginResult);
			await saveLoginResults();

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

	async _loginWithRefreshToken({ ctx }) {
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

		const login = async (refresh_token) => {
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
			if (this.isDebug) console.log(this.loginResult);
			if (this.loginResult.access_token) {
				console.log("Logged in with Refresh Token");
				if (ctx) {
					// ctx.response.body = "DONE";
					ctx.response.redirect(`/`);
				} else {
					return;
				}
			} else {
				throw new Error("Access Token NOT found");
			}
		};

		const refresh_token = await getRefreshToken();
		if (refresh_token) {
			await login(refresh_token);
		} else {
			throw new Error("Refresh Token NOT found");
		}
	}
	//#endregion

	async _etFetch({ url, options }) {
		const addAuthorization = () => {
			if (!options.headers) {
				options.headers = {};
			}
			options.headers.Authorization = `Bearer ${this.loginResult?.access_token}`;
		};

		console.log(`Fetching [${options.method}]: ${url}`);
		addAuthorization();
		let response = await fetch(url, options);
		if (response.status === 401) {
			// Try to login with refresh token
			await this._loginWithRefreshToken({});
			addAuthorization();
			response = await fetch(url, options);
		}
		response = await response.json();
		if (this.isDebug) console.log(response);
		return response;
	}
}
