// import { Application, Router } from "jsr:@oak/oak";

export class Google {
	#serverRoot;
	#calendarId;
	#loginResult;
	#isDebug = true;
	#itemFields = ["id", "summary", "description", "start", "end", "attendees"];

	constructor({ moreRoutes, isDebug }) {
		this.#isDebug = isDebug;
		this.#serverRoot = Deno.env.get("SERVER_ROOT");

		// Login
		moreRoutes.push(this.#loginGET.bind(this));
		moreRoutes.push(this.#callbackGET.bind(this));
		moreRoutes.push(this.#addScopesGET.bind(this));

		// Calendar events
		moreRoutes.push(this.#getEventGET.bind(this));
		moreRoutes.push(this.#findEventsGET.bind(this));
		moreRoutes.push(this.#findCalendarGET.bind(this));
		moreRoutes.push(this.#createEventPOST.bind(this));
		moreRoutes.push(this.#updateEventPATCH.bind(this));
		moreRoutes.push(this.#deleteEventDELETE.bind(this));
	}

	//#region CALENDAR
	#findCalendarGET({ router }) {
		router.get("/findCalendar", async (ctx) => {
			await this.#findCalendar({ ctx });
		});
	}

	#findEventsGET({ router }) {
		router.get("/findEvents", async (ctx) => {
			const queryParams = ctx.request.url.searchParams;
			const query = queryParams.get("query");
			await this.#findEvents({ ctx, query });
		});
	}

	#getEventGET({ router }) {
		router.get("/event", async (ctx) => {
			const queryParams = ctx.request.url.searchParams;
			const id = queryParams.get("id");
			await this.#getEvent({ ctx, id });
		});
	}

	#createEventPOST({ router }) {
		router.post("/event", async (ctx) => {
			let { start, end, employeeName, employeeEmail } = await ctx.request.body.json();
			start = new Date(start);
			end = new Date(end);
			console.log(start, end, employeeName, employeeEmail);
			await this.#createEvent({ ctx, start, end, employeeName, employeeEmail });
		});
	}

	#updateEventPATCH({ router }) {
		router.patch("/event", async (ctx) => {
			const queryParams = ctx.request.url.searchParams;
			const id = queryParams.get("id");
			const { start, end } = await ctx.request.body.json();
			console.log(id, start, end);
			await this.#updateEvent({ ctx, id, start, end });
		});
	}

	#deleteEventDELETE({ router }) {
		router.delete("/event", async (ctx) => {
			const queryParams = ctx.request.url.searchParams;
			const id = queryParams.get("id");
			await this.#deleteEvent({ ctx, id });
		});
	}

	#clearCalendarGET({ router }) {
		router.get("/clearCalendar", async (ctx) => {
			const queryParams = ctx.request.url.searchParams;
			const id = queryParams.get("id");
			await this.#getEvent({ ctx, id });
		});
	}

	async #findCalendar({ ctx }) {
		const calendarName = "Agentforce PTO";
		let calendars = await this.#etFetch({
			url: "https://www.googleapis.com/calendar/v3/users/me/calendarList",
			options: {
				method: "GET",
			},
		});
		calendars = calendars.items.filter((calendar) => calendar.summary === calendarName);
		if (calendars.length === 1) {
			this.#calendarId = calendars[0].id;
			console.log(`Calendar: ${this.#calendarId}`);
			if (ctx) {
				ctx.response.body = "Calendar found";
			}
		} else {
			throw new Error(`Could not find calendar named [${calendarName}]`);
		}
	}

	async #findEvents({ ctx, query }) {
		if (!this.#calendarId) {
			await this.#findCalendar({});
		}

		let url = `https://www.googleapis.com/calendar/v3/calendars/${this.#calendarId}/events`;
		if (query?.length > 0) {
			url += `?q=${query}`;
		}
		const events = await this.#etFetch({
			url,
			options: {
				method: "GET",
			},
		});

		// Parse list
		const items = events.items.map((event) => {
			const item = {};
			this.#itemFields.forEach((field) => {
				item[field] = event[field];
			});
			return item;
		});
		const output = {
			size: items.length,
			items,
		};

		console.log(`${output.size} events found`);
		if (ctx) {
			ctx.response.type = "json";
			ctx.response.status = "200";
			ctx.response.body = output;
		} else {
			if (this.#isDebug) console.log(output);
			return output;
		}
	}

	async #getEvent({ ctx, id }) {
		if (!id) {
			throw new Error(`Finding event by ID without an ID is not allowed!`);
		}

		if (!this.#calendarId) {
			await this.#findCalendar({});
		}

		const event = await this.#etFetch({
			url: `https://www.googleapis.com/calendar/v3/calendars/${this.#calendarId}/events/${id}`,
			options: {
				method: "GET",
			},
		});

		// Parse list
		const output = {};
		this.#itemFields.forEach((field) => {
			output[field] = event[field];
		});

		console.log(`Found event with ID: ${id}`);
		if (ctx) {
			ctx.response.type = "json";
			ctx.response.status = "200";
			ctx.response.body = output;
		} else {
			if (this.#isDebug) console.log(output);
			return output;
		}
	}

	async #createEvent({ ctx, start, end, employeeName, employeeEmail }) {
		if (!this.#calendarId) {
			await this.#findCalendar({});
		}

		const event = {
			description: employeeName,
			summary: `PTO: ${employeeName}`,
			start: {
				dateTime: start.toJSON(),
			},
			end: {
				dateTime: end.toJSON(),
			},
			attendees: [{ email: employeeEmail, responseStatus: "accepted" }],
		};
		const sendUpdates = "none";
		const response = await this.#etFetch({
			url: `https://www.googleapis.com/calendar/v3/calendars/${this.#calendarId}/events?sendUpdates=${sendUpdates}`,
			options: {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(event),
			},
		});
		if (this.#isDebug) console.log(response);
		console.log("Event created");
		if (ctx) {
			ctx.response.body = "Event created";
		}
	}

	async #updateEvent({ ctx, id, start, end }) {
		if (!id) {
			throw new Error(`Updating event by ID without an ID is not allowed!`);
		}

		if (!this.#calendarId) {
			await this.#findCalendar({});
		}
		const event = await this.#getEvent({ id });
		if (event) {
			event.start.dateTime = new Date(start).toJSON();
			event.end.dateTime = new Date(end).toJSON();
			const sendUpdates = "none";
			const response = await this.#etFetch({
				url: `https://www.googleapis.com/calendar/v3/calendars/${this.#calendarId}/events/${id}?sendUpdates=${sendUpdates}`,
				options: {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(event),
				},
			});
			if (this.#isDebug) console.log(response);
			console.log("Event updated");
			if (ctx) {
				ctx.response.body = "Event updated";
			}
		} else {
			throw new Error(`Event with ID [${id}] was NOT found to be updated`);
		}
	}

	async #deleteEvent({ ctx, id }) {
		if (!id) {
			throw new Error(`Deleting event by ID without an ID is not allowed!`);
		}

		if (!this.#calendarId) {
			await this.#findCalendar({});
		}

		const event = await this.#getEvent({ id });
		if (event) {
			await this.#etFetch({
				url: `https://www.googleapis.com/calendar/v3/calendars/${this.#calendarId}/events/${id}`,
				options: {
					method: "DELETE",
				},
				expectedStatus: 204,
			});
			console.log(`Event with ID: ${id} deleted`);
			if (ctx) {
				ctx.response.body = "Event deleted";
			}
		} else {
			throw new Error(`Event with ID [${id}] was NOT found to be deleted`);
		}
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

	#loginGET({ router }) {
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
					redirect_uri: encodeURI(`${this.#serverRoot}/callback`),
				};
				if (Deno.env.get("GMAIL")) {
					queryParams.login_hint = Deno.env.get("GMAIL");
				}
				queryParams = new URLSearchParams(queryParams);
				if (this.#isDebug) console.log(`Callback Server: ${this.#serverRoot}`);

				const url = `https://accounts.google.com/o/oauth2/v2/auth?${queryParams.toString()}`;
				ctx.response.redirect(url);
			};

			try {
				await this.#loginWithRefreshToken({ ctx });
			} catch (ex) {
				console.error(ex);
				console.error("Unable to login with Refresh Token");
				await loginWithoutRefreshToken();
			}
		});
	}

	#callbackGET({ router }) {
		const saveLoginResults = async () => {
			if (this.#isDebug) {
				await Deno.mkdir("secrets", { recursive: true });
				await Deno.writeTextFile(`secrets/googleSecrets_${new Date().getTime() / 1000}.json`, JSON.stringify(this.#loginResult, null, 4));
				if (this.#loginResult.refresh_token) {
					await Deno.writeTextFile(`secrets/google.json`, JSON.stringify(this.#loginResult, null, 4));
				}
			}
			if (this.#loginResult?.refresh_token) {
				console.log(`Refresh Token [${this.#loginResult.refresh_token}]`);
			}
		};
		router.get("/callback", async (ctx) => {
			const queryParams = ctx.request.url.searchParams;
			if (this.#isDebug) {
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
					redirect_uri: `${this.#serverRoot}/callback`,
				}),
			});
			if (this.#isDebug) console.log(`Callback Server: ${this.#serverRoot}`);
			this.#loginResult = await response.json();
			console.log("Login Callback");
			if (this.#isDebug) console.log(this.#loginResult);
			await saveLoginResults();

			// Check scopes
			const scopesGranted = this.#loginResult.scope.split(" ");
			const scopesRequired = JSON.parse(decodeURI(queryParams.get("state")));
			const scopesRemaining = scopesRequired.filter((scope) => !scopesGranted.includes(scope));
			if (scopesRemaining.length > 0) {
				// ctx.response.redirect(`/addScope?state=${state}`);
				const state = encodeURI(JSON.stringify(scopesRemaining));
				const nextUrl = `/addScope?state=${state}`;
				let nextScope = scopesRemaining[0].split("/");
				nextScope = nextScope[nextScope.length - 1];
				ctx.response.body = `
<!DOCTYPE html>
<html>
	<head><title>Agentforce PTO</title><head>
	<body>
	<h1>More requests are needed</h1>
	<a href="${nextUrl}">Request scope <b>${nextScope}</b></a><br/>
	</body>
</html>`;
			} else {
				let msg = "";
				if (this.#loginResult?.refresh_token) {
					msg = `Save the new Refresh Token <span style="color:red">${this.#loginResult.refresh_token}</span>`;
				}
				ctx.response.body = `
<!DOCTYPE html>
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

	#addScopesGET({ router }) {
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
					redirect_uri: encodeURI(`${this.#serverRoot}/callback`),
				};
				if (Deno.env.get("GMAIL")) {
					queryParams.login_hint = Deno.env.get("GMAIL");
				}
				queryParams = new URLSearchParams(queryParams);
				if (this.#isDebug) console.log(`Callback Server: ${this.#serverRoot}`);
				const url = `https://accounts.google.com/o/oauth2/v2/auth?${queryParams.toString()}`;
				ctx.response.redirect(url);
			} catch (ex) {
				ctx.response.body = `ERROR: ${ex.message}\n\n${ex.stack}`;
			}
		});
	}

	async #loginWithRefreshToken({ ctx }) {
		const getRefreshToken = async () => {
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
			this.#loginResult = await response.json();
			if (this.#isDebug) console.log(this.#loginResult);
			if (this.#loginResult.access_token) {
				console.log("Logged in with Refresh Token");
				if (ctx) {
					ctx.response.body = "Logged in with refresh token completed";
				} else {
					return;
				}
			} else {
				throw new Error("Unable to get Access Token using Refresh Token");
			}
		};

		const refresh_token = await getRefreshToken();
		console.log(`Refresh token: [${refresh_token}]`);
		if (refresh_token) {
			await login(refresh_token);
		} else {
			throw new Error("Refresh Token NOT found");
		}
	}
	//#endregion

	async #etFetch({ url, options, expectedStatus = 200 }) {
		let response;
		const addAuthorization = () => {
			if (!options.headers) {
				options.headers = {};
			}
			options.headers.Authorization = `Bearer ${this.#loginResult?.access_token}`;
		};

		const makeRequest = async () => {
			try {
				addAuthorization();
				response = await fetch(url, options);
			} catch (ex) {
				console.error(ex);
				throw ex;
			}
		};

		console.log(`Fetching [${options.method}]: ${url}`);
		await makeRequest();
		if (response.status === 401) {
			// Try to login with refresh token
			await this.#loginWithRefreshToken({});
			await makeRequest();
		}
		if (response.status === expectedStatus) {
			if (response.body) {
				response = await response.json();
				if (this.#isDebug) console.log(response);
				return response;
			} else {
				// No body
				return;
			}
		} else {
			const err = {};
			["ok", "status", "statusText", "type", "url"].forEach((key) => {
				err[key] = response[key];
			});
			console.error(err); // Response
			console.error(await response.text()); // Body
			throw new Error(`Unexpected HTTP Status. expectedStatus [${expectedStatus}], received [${response.status}]`);
		}
	}
}
