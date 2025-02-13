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

const bodyRequestPTO = (overrides = {}) => {
	const bodyRequest = {
		ptoRequest: {
			ptoStartTime: null,
			ptoStartDate: null,
			ptoID: null,
			ptoEntitled: null,
			ptoEndTime: null,
			ptoDays: null,
			employeeID: "005Ot00000KcxGTIAZ",
			...overrides,
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
	return bodyRequest;
};

const resetTestAsync = async () => {
	await googlePTO.clearCalendar();
};

Deno.test("Make request for 1 days", async (t) => {
	await resetTestAsync();
	const bodyRequest = bodyRequestPTO({
		ptoStartDate: new Date().toJSON().split("T")[0],
		ptoDays: 1,
		ptoEntitled: 10.6,
	});
	const events = await googlePTO.requestPTO(bodyRequest);
	assert(events[0].id);
	assertEquals(events.length, 1);
	assertEquals(events[0].isFullDay, true);
	assertEquals(events[0].durationHours, 8);
	assertEquals((new Date(events[0].end) - new Date(events[0].start)) / (1000 * 60 * 60), 8);
	assertEquals(events[0].attendees[0], "aperez@salesforce.com");

	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Make request for 2 hours", async (t) => {
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
});

Deno.test("Make request for 3 days", async (t) => {
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
});

Deno.test("Make request for 2 hours but ptoDays >= 1 (Times will be ignored)", async (t) => {
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
});

Deno.test("Make request for 2 hours without times", async (t) => {
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
		assert(false, "Expected exception was NOT thrown");
	} catch (ex) {
		const isExpectedException = ex.message.includes("When requesting less than a day, the times are required. Missing [End time]");
		if (!isExpectedException) Utils.reportError({ ex });
		assert(isExpectedException, "Invalid assertion received");
	}

	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Make request for 2 hours (twice, should fail)", async (t) => {
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
	const events1 = await googlePTO.requestPTO(bodyRequest);
	assert(events1[0].id);
	try {
		await googlePTO.requestPTO(bodyRequest);
		assert(false, "Expected exception was NOT thrown");
	} catch (ex) {
		const isExpectedException = ex.message.includes("You had already requeed that time off");
		if (!isExpectedException) Utils.reportError({ ex });
		assert(isExpectedException, "Invalid assertion received");
	}

	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Exceeding Entitled Hours", async (t) => {
	await resetTestAsync();
	const bodyRequest = bodyRequestPTO({
		ptoStartDate: new Date().toJSON().split("T")[0],
		ptoDays: 8,
		ptoEntitled: 10.6,
	});
	const events1 = await googlePTO.requestPTO(bodyRequest);
	assertEquals(events1.length, 8);
	try {
		const newDate = new Date();
		newDate.setDate(newDate.getDate() + 10);
		bodyRequest.ptoRequest.ptoStartDate = newDate.toJSON().split("T")[0];
		await googlePTO.requestPTO(bodyRequest);
		assert(false, "Expected exception was NOT thrown");
	} catch (ex) {
		const isExpectedException = ex.message.includes("Request has been denied. This request exceeds the amount of hours you are entitled to request per year.");
		if (!isExpectedException) Utils.reportError({ ex });
		assert(isExpectedException, "Invalid assertion received");
	}

	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Make request for 2.7 days", async (t) => {
	await resetTestAsync();
	const bodyRequest = bodyRequestPTO({
		ptoStartDate: new Date().toJSON().split("T")[0],
		ptoDays: 2.7,
		ptoEntitled: 10.6,
	});
	try {
		await googlePTO.requestPTO(bodyRequest);
		assert(false, "Expected exception was NOT thrown");
	} catch (ex) {
		const isExpectedException = ex.message.includes("can not have fractions when requesting more than one day");
		if (!isExpectedException) Utils.reportError({ ex });
		assert(isExpectedException, "Invalid assertion received");
	}
	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

Deno.test("Missing required fields", async (t) => {
	await resetTestAsync();
	const bodyRequest = bodyRequestPTO({
		ptoStartDate: new Date().toJSON().split("T")[0],
		ptoDays: 3,
		ptoEntitled: 10.6,
	});
	try {
		const tmp = JSON.parse(JSON.stringify(bodyRequest));
		tmp.employee.TimeZoneSidKey = null;
		await googlePTO.requestPTO(tmp);
		assert(false, "Expected exception was NOT thrown");
	} catch (ex) {
		const isExpectedException = ex.message.includes("You must indicate the employee time zone");
		if (!isExpectedException) Utils.reportError({ ex });
		assert(isExpectedException, "Invalid assertion received");
	}
	try {
		const tmp = JSON.parse(JSON.stringify(bodyRequest));
		tmp.ptoRequest.ptoStartDate = null;
		await googlePTO.requestPTO(tmp);
		assert(false, "Expected exception was NOT thrown");
	} catch (ex) {
		const isExpectedException = ex.message.includes("You must indicate the [start date] for the PTO request");
		if (!isExpectedException) Utils.reportError({ ex });
		assert(isExpectedException, "Invalid assertion received");
	}

	Colors.success({ msg: `Test #${++denoTestCounter}: [${t.name}] Completed` });
});

/*
Deno.test("PTO Requests - Missing Required Fields", async () => {
  const googlePTO = new GooglePTO({ googleWS: mockGoogleWS });
  googlePTO.simulation.isActive = true;

  // Missing TimeZoneSidKey
  await assertRejects(
    async () => {
      await googlePTO.requestPTO(createBasicRequestBody({
        employee: { TimeZoneSidKey: undefined }
      }));
    },
    Error,
    "You must indicate the employee time zone"
  );

  // Missing ptoStartDate
  await assertRejects(
    async () => {
      await googlePTO.requestPTO(createBasicRequestBody({
        ptoRequest: { ptoStartDate: undefined }
      }));
    },
    Error,
    "You must indicate the [start date] for the PTO request"
  );
});

Deno.test("PTO Requests - Partial Day Missing Time", async () => {
  const googlePTO = new GooglePTO({ googleWS: mockGoogleWS });
  googlePTO.simulation.isActive = true;

  await assertRejects(
    async () => {
      await googlePTO.requestPTO(createBasicRequestBody({
        ptoRequest: {
          ptoDays: 0.5,
          ptoStartTime: "09:00"
          // Missing ptoEndTime
        }
      }));
    },
    Error,
    "When requesting less than a day, the times are required. Missing [End time]"
  );
});

Deno.test("PTO Requests - Zero Days", async () => {
  const googlePTO = new GooglePTO({ googleWS: mockGoogleWS });
  googlePTO.simulation.isActive = true;

  await assertRejects(
    async () => {
      await googlePTO.requestPTO(createBasicRequestBody({
        ptoRequest: { ptoDays: 0 }
      }));
    },
    Error,
    "Days requested [0] must be greater than 0"
  );
});

Deno.test("PTO Requests - Request More Than 8 Hours In One Day", async () => {
  const googlePTO = new GooglePTO({ googleWS: mockGoogleWS });
  googlePTO.simulation.isActive = true;

  await assertRejects(
    async () => {
      await googlePTO.requestPTO(createBasicRequestBody({
        ptoRequest: {
          ptoDays: 0.9,
          ptoStartTime: "08:00",
          ptoEndTime: "17:00"
        }
      }));
    },
    Error,
    "Requesting more than 8 hours is not allowed, you should request a full day"
  );
});
*/
