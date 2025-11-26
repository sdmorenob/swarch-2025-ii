import http from 'k6/http';
import { check, sleep } from 'k6';
import { hmac } from 'k6/crypto';
import encoding from 'k6/encoding';

// Env-driven configuration
const LOGIN_RPS = parseInt(__ENV.LOGIN_RPS || '5');
const API_RPS = parseInt(__ENV.API_RPS || '50');
const DURATION = __ENV.DURATION || '2m';
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8083';
const SEARCH_PATH = __ENV.SEARCH_PATH || '/search/';
const SCENARIO = __ENV.SCENARIO || 'baseline'; // baseline|tls|lb|cache
const QUERY = __ENV.QUERY || 'meeting';
const USER_ID = parseInt(__ENV.USER_ID || '1');
const LIMIT = parseInt(__ENV.LIMIT || '20');
const SKIP = parseInt(__ENV.SKIP || '0');

const SERVICE_NAME = __ENV.SERVICE_NAME || 'auth-service';

// Modo de prueba: carga o estrés (preferencia por concurrencia/VUs)
const MODE_RAW = (__ENV.TEST_TYPE || __ENV.MODE || 'load').toLowerCase();
const MODES_ALLOWED = ['load', 'stress'];
const MODE = MODES_ALLOWED.includes(MODE_RAW) ? MODE_RAW : 'load';

// Objetivos por VUs para cada flujo
const LOGIN_VUS_TARGET = parseInt(__ENV.LOGIN_VUS_TARGET || String(Math.max(LOGIN_RPS, 5)));
const API_VUS_TARGET = parseInt(__ENV.API_VUS_TARGET || String(Math.max(API_RPS, 20)));

// Etapas de carga (subida/mantenimiento/bajada)
const LOAD_STAGE_UP = __ENV.LOAD_STAGE_UP || '1m';
const LOAD_STAGE_HOLD = __ENV.LOAD_STAGE_HOLD || DURATION;
const LOAD_STAGE_DOWN = __ENV.LOAD_STAGE_DOWN || '1m';

// Parámetros de estrés (escalonado en VUs)
const STRESS_START_VUS_LOGIN = parseInt(__ENV.STRESS_START_VUS_LOGIN || String(Math.max(Math.floor(LOGIN_VUS_TARGET / 2), 2)));
const STRESS_MAX_VUS_LOGIN = parseInt(__ENV.STRESS_MAX_VUS_LOGIN || String(Math.max(LOGIN_VUS_TARGET * 2, 10)));
const STRESS_STEP_COUNT_LOGIN = parseInt(__ENV.STRESS_STEP_COUNT_LOGIN || '4');
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
const LOGIN_STRESS_HOLD_SECONDS = Math.max(1, Math.floor(STRESS_TOTAL_SECONDS / (STRESS_STEP_COUNT_LOGIN + 1)));
const STRESS_STEP_HOLD_LOGIN = __ENV.STRESS_STEP_HOLD_LOGIN || `${LOGIN_STRESS_HOLD_SECONDS}s`;
const STRESS_STYLE = (__ENV.STRESS_STYLE || 'auto').toLowerCase();
const STRESS_STEP_DURATION_LOGIN = __ENV.STRESS_STEP_DURATION_LOGIN || STRESS_STEP_HOLD_LOGIN;

const STRESS_START_VUS_API = parseInt(__ENV.STRESS_START_VUS_API || String(Math.max(Math.floor(API_VUS_TARGET / 2), 10)));
const STRESS_MAX_VUS_API = parseInt(__ENV.STRESS_MAX_VUS_API || String(Math.max(API_VUS_TARGET * 2, 40)));
const STRESS_STEP_COUNT_API = parseInt(__ENV.STRESS_STEP_COUNT_API || '4');
const API_STRESS_HOLD_SECONDS = Math.max(1, Math.floor(STRESS_TOTAL_SECONDS / (STRESS_STEP_COUNT_API + 1)));
const STRESS_STEP_HOLD_API = __ENV.STRESS_STEP_HOLD_API || `${API_STRESS_HOLD_SECONDS}s`;
const STRESS_STEP_DURATION_API = __ENV.STRESS_STEP_DURATION_API || STRESS_STEP_HOLD_API;

// Test ID para facilitar filtro en Grafana
const TESTID = __ENV.TESTID || `k6-auth-${MODE}`;
const USE_LOGIN_TOKEN_FOR_API = (__ENV.USE_LOGIN_TOKEN_FOR_API || 'true').toLowerCase();

// JWT config (HS256 dev/e2e)
const JWT_SECRET = __ENV.JWT_SECRET || 'change-me-in-prod';
const JWT_ISSUER = __ENV.JWT_ISSUER || 'tasknotes-auth';
const JWT_AUDIENCE = __ENV.JWT_AUDIENCE || 'tasknotes';
const JWT_TTL_SECONDS = parseInt(__ENV.JWT_TTL_SECONDS || '900'); // 15m por defecto

// Test user credentials for login scenario
const TEST_EMAIL = __ENV.TEST_EMAIL || 'perftest@example.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'Passw0rd!';

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

// Construcción de escenarios según MODE con ejecutores basados en VUs
const loginScenario = MODE === 'load'
  ? {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { target: LOGIN_VUS_TARGET, duration: LOAD_STAGE_UP },
        { target: LOGIN_VUS_TARGET, duration: LOAD_STAGE_HOLD },
        { target: 0, duration: LOAD_STAGE_DOWN },
      ],
      exec: 'loginFlow',
      tags: { scenario: 'login', mode: MODE, service: SERVICE_NAME },
    }
  : (() => {
      let stressStages = [];
      const TARGETS_LOGIN_RAW = (__ENV.STRESS_TARGETS_LOGIN || '').trim();
      if (TARGETS_LOGIN_RAW.length > 0) {
        const targets = TARGETS_LOGIN_RAW.split(',').map((t) => parseInt(t.trim())).filter((n) => !Number.isNaN(n) && n >= 0);
        for (const t of targets) stressStages.push({ target: t, duration: STRESS_STEP_DURATION_LOGIN });
      } else if (STRESS_STYLE === 'progressive') {
        const stepSec = parseSecondsFromDuration(STRESS_STEP_DURATION_LOGIN);
        const count = Math.max(1, Math.floor(STRESS_TOTAL_SECONDS / stepSec));
        const inc = Math.max(1, Math.floor((STRESS_MAX_VUS_LOGIN - STRESS_START_VUS_LOGIN) / count));
        for (let i = 0; i < count; i++) {
          const nextTarget = Math.min(STRESS_START_VUS_LOGIN + inc * i, STRESS_MAX_VUS_LOGIN);
          stressStages.push({ target: nextTarget, duration: STRESS_STEP_DURATION_LOGIN });
        }
      } else {
        const steps = Math.max(STRESS_STEP_COUNT_LOGIN, 1);
        const inc = Math.max(1, Math.floor((STRESS_MAX_VUS_LOGIN - STRESS_START_VUS_LOGIN) / steps));
        stressStages = [{ target: STRESS_START_VUS_LOGIN, duration: STRESS_STEP_HOLD_LOGIN }];
        for (let i = 1; i <= steps; i++) {
          const nextTarget = Math.min(STRESS_START_VUS_LOGIN + inc * i, STRESS_MAX_VUS_LOGIN);
          stressStages.push({ target: nextTarget, duration: STRESS_STEP_HOLD_LOGIN });
        }
      }
      return {
        executor: 'ramping-vus',
        startVUs: STRESS_START_VUS_LOGIN,
        stages: stressStages,
        exec: 'loginFlow',
        tags: { scenario: 'login', mode: MODE, service: SERVICE_NAME },
      };
    })();

const apiScenario = MODE === 'load'
  ? {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { target: API_VUS_TARGET, duration: LOAD_STAGE_UP },
        { target: API_VUS_TARGET, duration: LOAD_STAGE_HOLD },
        { target: 0, duration: LOAD_STAGE_DOWN },
      ],
      exec: 'apiFlow',
      tags: { scenario: 'api', mode: MODE, service: SERVICE_NAME },
    }
  : (() => {
      let stressStages = [];
      const TARGETS_API_RAW = (__ENV.STRESS_TARGETS_API || '').trim();
      if (TARGETS_API_RAW.length > 0) {
        const targets = TARGETS_API_RAW.split(',').map((t) => parseInt(t.trim())).filter((n) => !Number.isNaN(n) && n >= 0);
        for (const t of targets) stressStages.push({ target: t, duration: STRESS_STEP_DURATION_API });
      } else if (STRESS_STYLE === 'progressive') {
        const stepSec = parseSecondsFromDuration(STRESS_STEP_DURATION_API);
        const count = Math.max(1, Math.floor(STRESS_TOTAL_SECONDS / stepSec));
        const inc = Math.max(1, Math.floor((STRESS_MAX_VUS_API - STRESS_START_VUS_API) / count));
        for (let i = 0; i < count; i++) {
          const nextTarget = Math.min(STRESS_START_VUS_API + inc * i, STRESS_MAX_VUS_API);
          stressStages.push({ target: nextTarget, duration: STRESS_STEP_DURATION_API });
        }
      } else {
        const steps = Math.max(STRESS_STEP_COUNT_API, 1);
        const inc = Math.max(1, Math.floor((STRESS_MAX_VUS_API - STRESS_START_VUS_API) / steps));
        stressStages = [{ target: STRESS_START_VUS_API, duration: STRESS_STEP_HOLD_API }];
        for (let i = 1; i <= steps; i++) {
          const nextTarget = Math.min(STRESS_START_VUS_API + inc * i, STRESS_MAX_VUS_API);
          stressStages.push({ target: nextTarget, duration: STRESS_STEP_HOLD_API });
        }
      }
      return {
        executor: 'ramping-vus',
        startVUs: STRESS_START_VUS_API,
        stages: stressStages,
        exec: 'apiFlow',
        tags: { scenario: 'api', mode: MODE, service: SERVICE_NAME },
      };
    })();

export const options = {
  scenarios: {
    login_perf: loginScenario,
    api_traffic: apiScenario,
  },
  thresholds: {
    'http_req_duration{scenario:login}': ['p(99)<10000'],
    'http_req_duration{scenario:api}': ['p(99)<10000'],
    'http_req_failed{scenario:login}': ['rate<0.5'],
    'http_req_failed{scenario:api}': ['rate<0.5'],
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

  let token = __ENV.JWT_OVERRIDE && __ENV.JWT_OVERRIDE.length > 0 ? __ENV.JWT_OVERRIDE : '';

  if (!token && USE_LOGIN_TOKEN_FOR_API === 'true') {
    const loginUrl = `${BASE_URL}/auth/login`;
    const loginPayload = JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const loginParams = { headers: { 'Content-Type': 'application/json' } };
    const loginRes = http.post(loginUrl, loginPayload, loginParams);
    if (loginRes.status === 200) {
      token = loginRes.json('access_token') || '';
    }
  }

  if (!token) {
    token = createHS256JWT(JWT_SECRET, payload);
  }

  sharedAuthHeader = { Authorization: `Bearer ${token}` };

  if (SCENARIO === 'cache') {
    const url = `${BASE_URL}${SEARCH_PATH}`;
    const warmPayload = JSON.stringify({ query: QUERY, user_id: USER_ID, limit: LIMIT, skip: SKIP });
    const params = { headers: { 'Content-Type': 'application/json', ...sharedAuthHeader } };
    for (let i = 0; i < 50; i++) {
      http.post(url, warmPayload, params);
    }
  }

  const registerUrl = `${BASE_URL}/auth/register`;
  const registerPayload = JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD });
  const registerParams = { headers: { 'Content-Type': 'application/json' } };
  const registerRes = http.post(registerUrl, registerPayload, registerParams);

  return { authHeader: sharedAuthHeader };
}

// Escenario de login: mide el rendimiento de /auth/login
export function loginFlow() {
  const loginUrl = `${BASE_URL}/auth/login`;
  const loginPayload = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  const params = { headers: { 'Content-Type': 'application/json' } };

  const res = http.post(loginUrl, loginPayload, params);
  check(res, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => r.json('access_token') !== undefined,
  });

  sleep(0.1); // Pequeña pausa entre logins
}

// Escenario de tráfico de API: usa token pre-generado
export function apiFlow(data) {
  const url = `${BASE_URL}${SEARCH_PATH}`;
  // Para baseline, randomizar query para evitar cache
  const q = SCENARIO === 'baseline' ? `${QUERY}-${__ITER}` : QUERY;
  const payload = JSON.stringify({ query: q, user_id: USER_ID, limit: LIMIT, skip: SKIP });
  const params = { headers: { 'Content-Type': 'application/json', ...data.authHeader } };

  const res = http.post(url, payload, params);
  check(res, {
    'api status is 200': (r) => r.status === 200,
    'api returns results': (r) => r.json('results') !== undefined,
  });

  sleep(0.05); // Think time para simular usuarios reales
}