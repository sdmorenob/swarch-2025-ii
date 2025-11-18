import http from 'k6/http';
import { check, sleep } from 'k6';
import { hmac } from 'k6/crypto';
import encoding from 'k6/encoding';

// Base config via env
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8083';
const PATH = __ENV.PATH || '/search';
const METHOD = (__ENV.METHOD || 'POST').toUpperCase();
const CONTENT_TYPE = __ENV.CONTENT_TYPE || 'application/json';
const BODY = __ENV.BODY || '';
const SERVICE_NAME = __ENV.SERVICE_NAME || 'generic-service';
const SCENARIO_RAW = (__ENV.SCENARIO || 'load').toLowerCase();
const SCENARIOS_ALLOWED = ['load', 'stress'];
const SCENARIO = SCENARIOS_ALLOWED.includes(SCENARIO_RAW) ? SCENARIO_RAW : 'load';
const EXECUTOR_MODE_RAW = (__ENV.EXECUTOR_MODE || 'vus').toLowerCase();
const EXECUTOR_ALLOWED = ['vus', 'rps'];
const EXECUTOR_MODE = EXECUTOR_ALLOWED.includes(EXECUTOR_MODE_RAW) ? EXECUTOR_MODE_RAW : 'vus';
// Dynamic test id tag (can be overridden via TESTID)
const TESTID = __ENV.TESTID || `k6-${SERVICE_NAME}-${SCENARIO}`;
const USE_LOGIN_TOKEN_FOR_API = (__ENV.USE_LOGIN_TOKEN_FOR_API || 'false').toLowerCase();
const TEST_EMAIL = __ENV.TEST_EMAIL || 'perftest@example.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'Passw0rd!';
const AUTH_BASE_URL = __ENV.AUTH_BASE_URL || BASE_URL;

// Load parameters
const API_RPS = parseInt(__ENV.API_RPS || '50');
const DURATION = __ENV.DURATION || '2m';
// Load stages to reflect ramp/hold/down per the desired model
const LOAD_STAGE_UP = __ENV.LOAD_STAGE_UP || '2m';
const LOAD_STAGE_HOLD = __ENV.LOAD_STAGE_HOLD || (DURATION || '2m');
const LOAD_STAGE_DOWN = __ENV.LOAD_STAGE_DOWN || '2m';
// Optional overrides for VU limits in 'load' scenario
const LOAD_PREALLOCATED_VUS = parseInt(__ENV.PREALLOCATED_VUS || String(Math.max(API_RPS, 20)));
const LOAD_MAX_VUS = parseInt(__ENV.MAX_VUS || String(Math.max(API_RPS * 2, 60)));

// Objetivo de concurrencia por VUs para carga
const LOAD_VUS_TARGET = parseInt(__ENV.LOAD_VUS_TARGET || String(Math.max(API_RPS, 50)));

// Stress parameters (stair-step ascending)
const STRESS_START_RATE = parseInt(__ENV.STRESS_START_RATE || Math.max(Math.floor(API_RPS / 2), 10));
const STRESS_MAX_RATE = parseInt(__ENV.STRESS_MAX_RATE || Math.max(API_RPS, 100));
const STRESS_STEP_COUNT = parseInt(__ENV.STRESS_STEP_COUNT || '4');
function parseSecondsFromDuration(d) {
  if (!d) return 600;
  const s = String(d);
  if (s.endsWith('m')) return Math.max(parseInt(s) * 60, 1);
  if (s.endsWith('s')) return Math.max(parseInt(s), 1);
  const n = parseInt(s);
  if (Number.isNaN(n)) return 600;
  return Math.max(n * 60, 1);
}
const STRESS_TOTAL_SECONDS = parseInt(__ENV.STRESS_TOTAL_SECONDS || String(parseSecondsFromDuration(DURATION)));
const STRESS_HOLD_SECONDS = Math.max(1, Math.floor(STRESS_TOTAL_SECONDS / (STRESS_STEP_COUNT + 1)));
const STRESS_STEP_HOLD = __ENV.STRESS_STEP_HOLD || `${STRESS_HOLD_SECONDS}s`;
const STRESS_STYLE = (__ENV.STRESS_STYLE || 'auto').toLowerCase();
const STRESS_STEP_DURATION = __ENV.STRESS_STEP_DURATION || STRESS_STEP_HOLD;

// Parámetros de estrés por VUs (escalonado)
const STRESS_START_VUS = parseInt(__ENV.STRESS_START_VUS || String(Math.max(Math.floor(LOAD_VUS_TARGET / 2), 20)));
const STRESS_MAX_VUS = parseInt(__ENV.STRESS_MAX_VUS || String(Math.max(LOAD_VUS_TARGET * 2, 100)));

// Build stress stages: start hold at STRESS_START_RATE, then ascend in steps to STRESS_MAX_RATE
let stressStagesVus = [];
const STRESS_TARGETS_VUS = (__ENV.STRESS_TARGETS || '').trim();
if (STRESS_TARGETS_VUS.length > 0) {
  const targets = STRESS_TARGETS_VUS.split(',').map((t) => parseInt(t.trim())).filter((n) => !Number.isNaN(n) && n >= 0);
  for (const t of targets) {
    stressStagesVus.push({ target: t, duration: STRESS_STEP_DURATION });
  }
} else if (STRESS_STYLE === 'progressive') {
  const stepSeconds = parseSecondsFromDuration(STRESS_STEP_DURATION);
  const count = Math.max(1, Math.floor(STRESS_TOTAL_SECONDS / stepSeconds));
  const inc = Math.max(1, Math.floor((STRESS_MAX_VUS - STRESS_START_VUS) / count));
  for (let i = 0; i < count; i++) {
    const nextTarget = Math.min(STRESS_START_VUS + inc * i, STRESS_MAX_VUS);
    stressStagesVus.push({ target: nextTarget, duration: STRESS_STEP_DURATION });
  }
} else {
  stressStagesVus.push({ target: STRESS_START_VUS, duration: STRESS_STEP_HOLD });
  const steps = Math.max(STRESS_STEP_COUNT - 1, 1);
  const inc = Math.max(1, Math.floor((STRESS_MAX_VUS - STRESS_START_VUS) / steps));
  for (let i = 1; i <= steps; i++) {
    const nextTarget = Math.min(STRESS_START_VUS + inc * i, STRESS_MAX_VUS);
    stressStagesVus.push({ target: nextTarget, duration: STRESS_STEP_HOLD });
  }
}

let stressStagesRate = [];
const STRESS_TARGETS_RATE = (__ENV.STRESS_TARGETS_RATE || '').trim();
if (STRESS_TARGETS_RATE.length > 0) {
  const targets = STRESS_TARGETS_RATE.split(',').map((t) => parseInt(t.trim())).filter((n) => !Number.isNaN(n) && n >= 0);
  for (const t of targets) {
    stressStagesRate.push({ target: t, duration: STRESS_STEP_DURATION });
  }
} else if (STRESS_STYLE === 'progressive') {
  const stepSeconds = parseSecondsFromDuration(STRESS_STEP_DURATION);
  const count = Math.max(1, Math.floor(STRESS_TOTAL_SECONDS / stepSeconds));
  const inc = Math.max(1, Math.floor((STRESS_MAX_RATE - STRESS_START_RATE) / count));
  for (let i = 0; i < count; i++) {
    const nextTarget = Math.min(STRESS_START_RATE + inc * i, STRESS_MAX_RATE);
    stressStagesRate.push({ target: nextTarget, duration: STRESS_STEP_DURATION });
  }
} else {
  stressStagesRate.push({ target: STRESS_START_RATE, duration: STRESS_STEP_HOLD });
  const rateSteps = Math.max(STRESS_STEP_COUNT - 1, 1);
  const rateInc = Math.max(1, Math.floor((STRESS_MAX_RATE - STRESS_START_RATE) / rateSteps));
  for (let i = 1; i <= rateSteps; i++) {
    const nextTarget = Math.min(STRESS_START_RATE + rateInc * i, STRESS_MAX_RATE);
    stressStagesRate.push({ target: nextTarget, duration: STRESS_STEP_HOLD });
  }
}


// Optional JWT for auth (HS256 for dev/e2e)
const JWT_OVERRIDE = __ENV.JWT_OVERRIDE || '';
const JWT_SECRET = __ENV.JWT_SECRET || 'change-me-in-prod';
const JWT_ISSUER = __ENV.JWT_ISSUER || 'tasknotes-auth';
const JWT_AUDIENCE = __ENV.JWT_AUDIENCE || 'tasknotes';
const USER_ID = parseInt(__ENV.USER_ID || '1');
const JWT_TTL_SECONDS = parseInt(__ENV.JWT_TTL_SECONDS || '900');

function b64url(input) {
  const enc = encoding.b64encode(input, 'url');
  return enc.replace(/=+$/g, '');
}

function createHS256JWT(secret, payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  const signatureStdB64 = hmac('sha256', signingInput, secret, 'base64');
  const signatureB64 = signatureStdB64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${signingInput}.${signatureB64}`;
}

let sharedAuthHeader = {};

const scenariosMapVus = {
  load: {
    executor: 'ramping-vus',
    startVUs: 1,
    stages: [
      { target: LOAD_VUS_TARGET, duration: LOAD_STAGE_UP },
      { target: LOAD_VUS_TARGET, duration: LOAD_STAGE_HOLD },
      { target: 0, duration: LOAD_STAGE_DOWN },
    ],
    exec: 'requestFlow',
    tags: { scenario: 'load', service: SERVICE_NAME },
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: STRESS_START_VUS,
    stages: stressStagesVus,
    exec: 'requestFlow',
    tags: { scenario: 'stress', service: SERVICE_NAME },
  },
};

const scenariosMapRps = {
  load: {
    executor: 'constant-arrival-rate',
    rate: API_RPS,
    timeUnit: '1s',
    duration: DURATION,
    exec: 'requestFlow',
    tags: { scenario: 'load', service: SERVICE_NAME },
  },
  stress: {
    executor: 'ramping-arrival-rate',
    startRate: STRESS_START_RATE,
    timeUnit: '1s',
    stages: stressStagesRate,
    exec: 'requestFlow',
    tags: { scenario: 'stress', service: SERVICE_NAME },
  },
};

export const options = {
  scenarios: {
    [SCENARIO]: (EXECUTOR_MODE === 'rps' ? scenariosMapRps : scenariosMapVus)[SCENARIO] || (EXECUTOR_MODE === 'rps' ? scenariosMapRps.load : scenariosMapVus.load),
  },
  thresholds: {
    'http_req_duration{scenario:load}': ['p(99)<10000'],
    'http_req_failed{scenario:load}': ['rate<0.5'],
    'http_req_duration{scenario:stress}': ['p(99)<10000'],
    'http_req_failed{scenario:stress}': ['rate<0.5'],
  },
  tags: { testid: TESTID },
};

export function setup() {
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(USER_ID),
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    iat: nowSec,
    exp: nowSec + JWT_TTL_SECONDS,
  };

  let token = JWT_OVERRIDE && JWT_OVERRIDE.length > 0 ? JWT_OVERRIDE : '';
  let loginStatus = 0;
  if (!token && USE_LOGIN_TOKEN_FOR_API === 'true') {
    const registerUrl = `${AUTH_BASE_URL}/auth/register`;
    const registerPayload = JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const registerParams = { headers: { 'Content-Type': 'application/json' } };
    http.post(registerUrl, registerPayload, registerParams);
  }
  if (!token && USE_LOGIN_TOKEN_FOR_API === 'true') {
    const loginUrl = `${AUTH_BASE_URL}/auth/login`;
    const loginPayload = JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const loginParams = { headers: { 'Content-Type': 'application/json' } };
    for (let i = 0; i < 3 && !token; i++) {
      const loginRes = http.post(loginUrl, loginPayload, loginParams);
      loginStatus = loginRes.status;
      if (loginRes.status === 200) {
        token = loginRes.json('access_token') || '';
        break;
      }
      const bodySnippet = String(loginRes.body || '').slice(0, 120);
      console.log(`login_failed attempt=${i+1} status=${loginStatus} body=${bodySnippet}`);
      sleep(0.5);
    }
  }
  if (!token) {
    token = createHS256JWT(JWT_SECRET, payload);
  }
  sharedAuthHeader = { Authorization: `Bearer ${token}` };

  const preUrl = `${BASE_URL}${PATH}`;
  const preHeaders = { 'Content-Type': CONTENT_TYPE, ...sharedAuthHeader };
  const preParams = { headers: preHeaders };
  let preRes;
  function defaultPostBody() {
    if (BODY && BODY.length > 0) return BODY;
    const p = String(PATH || '').toLowerCase();
    if (p.startsWith('/tasks')) {
      const tagsRaw = (__ENV.TAG_IDS || '1,2').split(',').map((t) => t.trim()).filter((t) => t);
      return JSON.stringify({
        title: __ENV.TITLE || 'Perf Task',
        description: __ENV.DESCRIPTION || 'k6 load',
        priority: __ENV.PRIORITY || 'medium',
        tag_ids: tagsRaw,
      });
    }
    if (p.startsWith('/search')) {
      return JSON.stringify({ query: __ENV.QUERY || 'meeting', user_id: USER_ID, limit: parseInt(__ENV.LIMIT || '20'), skip: parseInt(__ENV.SKIP || '0') });
    }
    return JSON.stringify({});
  }
  if (METHOD === 'GET') {
    preRes = http.get(preUrl, preParams);
  } else if (METHOD === 'POST') {
    const preBody = defaultPostBody();
    preRes = http.post(preUrl, preBody, preParams);
  } else if (METHOD === 'PUT') {
    const preBody = BODY || JSON.stringify({});
    preRes = http.put(preUrl, preBody, preParams);
  } else if (METHOD === 'DELETE') {
    preRes = http.del(preUrl, null, preParams);
  } else {
    preRes = http.request(METHOD, preUrl, BODY, preParams);
  }
  console.log(`login_status=${loginStatus} preflight ${METHOD} ${PATH} status=${preRes.status}`);

  return { authHeader: sharedAuthHeader };
}

export function requestFlow(data) {
  const url = `${BASE_URL}${PATH}`;
  const headers = { 'Content-Type': CONTENT_TYPE, ...data.authHeader };
  const params = { headers };

  let res;
  if (METHOD === 'GET') {
    res = http.get(url, params);
  } else if (METHOD === 'POST') {
    const body = defaultPostBody();
    res = http.post(url, body, params);
  } else if (METHOD === 'PUT') {
    const body = BODY || JSON.stringify({});
    res = http.put(url, body, params);
  } else if (METHOD === 'DELETE') {
    res = http.del(url, null, params);
  } else {
    res = http.request(METHOD, url, BODY, params);
  }

  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  sleep(0.05);
}