// import { Application, Router } from "jsr:@oak/oak";

export class Google {
	serverRoot;
	calendarId;
	loginResult;
	isDebug = false;
	itemFields = ["id", "summary", "description", "start", "end", "attendees"];

	constructor({ moreRoutes }) {
		this.serverRoot = Deno.env.get("SERVER_ROOT");

		// Login
		moreRoutes.push(this._loginGET.bind(this));
		moreRoutes.push(this._callbackGET.bind(this));
		moreRoutes.push(this._addScopesGET.bind(this));

		// Calendar events
		moreRoutes.push(this._getEventGET.bind(this));
		moreRoutes.push(this._findEventsGET.bind(this));
		moreRoutes.push(this._findCalendarGET.bind(this));
		moreRoutes.push(this._createEventPOST.bind(this));
		moreRoutes.push(this._updateEventPATCH.bind(this));
		moreRoutes.push(this._deleteEventDELETE.bind(this));
	}

	_findCalendarGET({ router }) {
		router.get("/findCalendar", async (ctx) => {
			await this._findCalendar({ ctx });
		});
	}

	_findEventsGET({ router }) {
		router.get("/findEvents", async (ctx) => {
			const queryParams = ctx.request.url.searchParams;
			const query = queryParams.get("query");
			await this._findEvents({ ctx, query });
		});
	}

	_getEventGET({ router }) {
		router.get("/event", async (ctx) => {
			const queryParams = ctx.request.url.searchParams;
			const id = queryParams.get("id");
			await this._getEvent({ ctx, id });
		});
	}

	_createEventPOST({ router }) {
		router.post("/event", async (ctx) => {
			let { start, end, employeeName, employeeEmail } = await ctx.request.body.json();
			start = new Date(start);
			end = new Date(end);
			console.log(start, end, employeeName, employeeEmail);
			await this._createEvent({ ctx, start, end, employeeName, employeeEmail });
		});
	}

	_updateEventPATCH({ router }) {
		router.patch("/event", async (ctx) => {
			const queryParams = ctx.request.url.searchParams;
			const id = queryParams.get("id");
			const { start, end } = await ctx.request.body.json();
			console.log(id, start, end);
			await this._updateEvent({ ctx, id, start, end });
		});
	}

	_deleteEventDELETE({ router }) {
		router.delete("/event", async (ctx) => {
			const queryParams = ctx.request.url.searchParams;
			const id = queryParams.get("id");
			await this._deleteEvent({ ctx, id });
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
				ctx.response.body = "Calendar found";
			}
		} else {
			throw new Error(`Could not find calendar named [${calendarName}]`);
		}
	}

	async _findEvents({ ctx, query }) {
		if (!this.calendarId) {
			await this._findCalendar({});
		}

		let url = `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events`;
		if (query?.length > 0) {
			url += `?q=${query}`;
		}
		const events = await this._etFetch({
			url,
			options: {
				method: "GET",
			},
		});

		// Parse list
		const items = events.items.map((event) => {
			const item = {};
			this.itemFields.forEach((field) => {
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
			if (this.isDebug) console.log(output);
			return output;
		}
	}

	async _getEvent({ ctx, id }) {
		if (!id) {
			throw new Error(`Finding event by ID without an ID is not allowed!`);
		}

		if (!this.calendarId) {
			await this._findCalendar({});
		}

		const event = await this._etFetch({
			url: `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${id}`,
			options: {
				method: "GET",
			},
		});

		// Parse list
		const output = {};
		this.itemFields.forEach((field) => {
			output[field] = event[field];
		});

		console.log(`Found event with ID: ${id}`);
		if (ctx) {
			ctx.response.type = "json";
			ctx.response.status = "200";
			ctx.response.body = output;
		} else {
			if (this.isDebug) console.log(output);
			return output;
		}
	}

	async _createEvent({ ctx, start, end, employeeName, employeeEmail }) {
		if (!this.calendarId) {
			await this._findCalendar({});
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
		if (this.isDebug) console.log(response);
		console.log("Event created");
		if (ctx) {
			ctx.response.body = "Event created";
		}
	}

	async _updateEvent({ ctx, id, start, end }) {
		if (!id) {
			throw new Error(`Updating event by ID without an ID is not allowed!`);
		}

		if (!this.calendarId) {
			await this._findCalendar({});
		}
		const event = await this._getEvent({ id });
		if (event) {
			event.start.dateTime = new Date(start).toJSON();
			event.end.dateTime = new Date(end).toJSON();
			const sendUpdates = "none";
			const response = await this._etFetch({
				url: `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${id}?sendUpdates=${sendUpdates}`,
				options: {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(event),
				},
			});
			if (this.isDebug) console.log(response);
			console.log("Event updated");
			if (ctx) {
				ctx.response.body = "Event updated";
			}
		} else {
			throw new Error(`Event with ID [${id}] was NOT found to be updated`);
		}
	}

	async _deleteEvent({ ctx, id }) {
		if (!id) {
			throw new Error(`Deleting event by ID without an ID is not allowed!`);
		}

		if (!this.calendarId) {
			await this._findCalendar({});
		}

		const event = await this._getEvent({ id });
		if (event) {
			await this._etFetch({
				url: `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${id}`,
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

	_loginGET({ router }) {
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

	_callbackGET({ router }) {
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
				ctx.response.body = "Login succesful";
			}
		});
	}

	_addScopesGET({ router }) {
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
					ctx.response.body = "Logged in with refresh token completed";
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

	async _etFetch({ url, options, expectedStatus = 200 }) {
		let response;
		const addAuthorization = () => {
			if (!options.headers) {
				options.headers = {};
			}
			options.headers.Authorization = `Bearer ${this.loginResult?.access_token}`;
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
			await this._loginWithRefreshToken({});
			await makeRequest();
		}
		if (response.status === expectedStatus) {
			if (response.body) {
				response = await response.json();
				if (this.isDebug) console.log(response);
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
