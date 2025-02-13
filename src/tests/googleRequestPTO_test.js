import Utils from "../utils.js";
import Colors from "../colors.js";
import GoogleWS from "../googleWS.js";
import GooglePTO from "../googlePTO.js";
import { assert, assertEquals } from "jsr:@std/assert";

Colors.isDebug = false;

const moreRoutes = [];
let denoTestCounter = 0;
const googleWS = new GoogleWS({ moreRoutes });
const googlePTO = new GooglePTO({ googleWS });
googlePTO.simulation.isActive = true;

const makeTimeForEvent = (offset) => {
	const dttm = new Date();
	dttm.setMinutes(0);
	dttm.setSeconds(0);
	dttm.setMilliseconds(0);
	dttm.setHours(dttm.getHours() + 1 + offset);
	return dttm;
};

const bodyRequestPTO = ({ ptoStartTime, ptoStartDate, ptoID, ptoEntitled, ptoEndTime, ptoDays }) => {
	return {
		ptoRequest: {
			ptoStartTime,
			ptoStartDate,
			ptoID,
			ptoEntitled,
			ptoEndTime,
			ptoDays,
			employeeID: "005Ot00000KcxGTIAZ",
		},
		employee: {
			attributes: {
				type: "User",
				url: "/services/data/v63.0/sobjects/User/005Ot00000KcxGTIAZ",
			},
			Id: "005Ot00000KcxGTIAZ",
			Username: "test-scqg41x0pb0g@example.com",
			Name: "Andres Perez",
			Email: "aperez@salesforce.com",
			StartDate__c: "2024-10-03",
			TimeZoneSidKey: "America/New_York",
		},
	};
};

const resetTestAsync = async () => {
	await googlePTO.clearCalendar();
};

// Make request for 2 hours
Deno.test({
	name: "Make request for 2 hours",
	async fn(t) {
		await resetTestAsync();
		const start = makeTimeForEvent(1);
		const end = makeTimeForEvent(3);
		const bodyRequest = bodyRequestPTO({
			ptoStartDate: new Date().toJSON().split("T")[0],
			ptoStartTime: start.toJSON().split("T")[1],
			ptoEndTime: end.toJSON().split("T")[1],
			ptoDays: (end - start) / (1000 * 60 * 60) / 8,
			ptoEntitled: 10.6,
		});
		const events = await googlePTO.requestPTO(bodyRequest);
		assert(events[0].id);
		assertEquals(events.length, 1);
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Make request for 3 days
Deno.test({
	name: "Make request for 3 days",
	async fn(t) {
		await resetTestAsync();
		const bodyRequest = bodyRequestPTO({
			ptoStartDate: new Date().toJSON().split("T")[0],
			ptoDays: 3,
			ptoEntitled: 10.6,
		});
		const events = await googlePTO.requestPTO(bodyRequest);
		assert(events[0].id);
		assertEquals(events.length, 3);
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Make request for 2 hours but ptoDays >= 1 (Times will be ignored)
Deno.test({
	name: "Make request for 2 hours but ptoDays >= 1 (Times will be ignored)",
	async fn(t) {
		await resetTestAsync();
		const start = makeTimeForEvent(1);
		const end = makeTimeForEvent(3);
		const bodyRequest = bodyRequestPTO({
			ptoStartDate: new Date().toJSON().split("T")[0],
			ptoStartTime: start.toJSON().split("T")[1],
			ptoEndTime: end.toJSON().split("T")[1],
			ptoDays: 2,
			ptoEntitled: 10.6,
		});
		const events = await googlePTO.requestPTO(bodyRequest);
		assertEquals(events.length, 2);
		assert(events[0].start !== bodyRequest.ptoStartDate);
		assert(events[0].end !== bodyRequest.ptoEndTime);
		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Make request for 2 hours but times not provided
Deno.test({
	name: "Make request for 2 hours",
	async fn(t) {
		await resetTestAsync();
		const start = makeTimeForEvent(1);
		const end = makeTimeForEvent(3);
		const bodyRequest = bodyRequestPTO({
			ptoStartDate: new Date().toJSON().split("T")[0],
			ptoDays: (end - start) / (1000 * 60 * 60) / 8,
			ptoEntitled: 10.6,
		});
		try {
			const events = await googlePTO.requestPTO(bodyRequest);
			assert(events[0].id);
			assertEquals(events.length, 1);
			assert(false, "Expected exception was not thrown");
		} catch (ex) {
			// Utils.reportError({ ex });
			assert(ex.message.includes("When requesting less than a day, the times are required."), "Invalid assertion received");
		}

		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});

// Make request for 2 hours (twice, should fail)
Deno.test({
	name: "Make request for 2 hours (twice, should fail)",
	async fn(t) {
		await resetTestAsync();
		const start = makeTimeForEvent(1);
		const end = makeTimeForEvent(3);
		const bodyRequest = bodyRequestPTO({
			ptoStartDate: new Date().toJSON().split("T")[0],
			ptoStartTime: start.toJSON().split("T")[1],
			ptoEndTime: end.toJSON().split("T")[1],
			ptoDays: (end - start) / (1000 * 60 * 60) / 8,
			ptoEntitled: 10.6,
		});
		const event1 = await googlePTO.requestPTO(bodyRequest);
		assert(event1[0].id);
		try {
			await googlePTO.requestPTO(bodyRequest);
			assert(false, "Expected exception was not thrown");
		} catch (ex) {
			// Utils.reportError({ ex });
			assert(ex.message.includes("You had already requeed that time off"), "Invalid assertion received");
		}

		Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
	},
	sanitizeResources: false,
});
