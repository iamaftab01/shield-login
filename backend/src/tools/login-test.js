const axios = require("axios");

const TARGET_URL = process.env.TARGET_URL || "http://localhost:4000"; // backend base
const ENDPOINT = "/auth/login"; // endpoint to hit
const REQUESTS = parseInt(process.env.REQUESTS || "10", 10); // total requests to send
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "1", 10); // 1 = sequential, >1 = parallel batches
const DELAY_MS = parseInt(process.env.DELAY_MS || "200", 10); // delay between batches (ms)
const DEBUG = process.env.DEBUG === "1"; // set DEBUG=1 to log request bodies (not recommended)

//
// helper utilities
//
function randomString(len = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function randomEmail() {
  return `user.${Date.now()}.${randomString(4)}@example.com`;
}

function randomPassword() {
  // create passwords with some complexity
  return (
    randomString(6) +
    "-" +
    Math.floor(Math.random() * 9000 + 1000).toString() +
    "A!"
  );
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function sendLogin(email, password) {
  const url = TARGET_URL.replace(/\/$/, "") + ENDPOINT;
  try {
    // redact password in logs unless DEBUG
    if (DEBUG) console.log("REQ ->", { email, password });
    const res = await axios.post(url, { email, password }, { timeout: 10000 });
    // print short result
    console.log(`OK  [${res.status}] ${email} -> ${res.data?.message || "no message"}`);
    return { ok: true, status: res.status, body: res.data };
  } catch (err) {
    if (err.response) {
      console.log(`ERR [${err.response.status}] ${email} -> ${err.response.data?.message || err.response.statusText}`);
      return { ok: false, status: err.response.status, body: err.response.data };
    } else {
      console.log(`ERR [no-resp] ${email} -> ${err.message}`);
      return { ok: false, status: null, error: err.message };
    }
  }
}

async function runSequential(total) {
  for (let i = 0; i < total; i++) {
    const email = randomEmail();
    const password = randomPassword();
    await sendLogin(email, password);
  }
}

async function runBatched(total, concurrency, delayMs) {
  let sent = 0;
  while (sent < total) {
    const batch = Math.min(concurrency, total - sent);
    const promises = [];
    for (let i = 0; i < batch; i++) {
      const email = randomEmail();
      const password = randomPassword();
      promises.push(sendLogin(email, password));
    }
    await Promise.all(promises);
    sent += batch;
    if (sent < total) await sleep(delayMs);
  }
}

(async function main() {
  console.log("Load test starting");
  console.log(`Target: ${TARGET_URL}${ENDPOINT}`);
  console.log(`Requests: ${REQUESTS}, Concurrency: ${CONCURRENCY}, Delay(ms): ${DELAY_MS}`);
  console.log("NOTE: This script sends random credentials (likely to fail).");

  if (CONCURRENCY <= 1) {
    await runSequential(REQUESTS);
  } else {
    await runBatched(REQUESTS, CONCURRENCY, DELAY_MS);
  }

  console.log("Load test finished");
})();
