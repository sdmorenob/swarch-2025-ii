import http from 'k6/http';
import { check, sleep } from 'k6';
import { hmac } from 'k6/crypto';
import encoding from 'k6/encoding';

// Env-driven configuration
const RPS = parseInt(__ENV.RPS || '50');
const DURATION = __ENV.DURATION || '2m';
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8083';
const PATH = __ENV.PATH || '/search/';
const SCENARIO = __ENV.SCENARIO || 'baseline'; // baseline|tls|lb|cache
const QUERY = __ENV.QUERY || 'meeting';
const USER_ID = parseInt(__ENV.USER_ID || '1');
const LIMIT = parseInt(__ENV.LIMIT || '20');
const SKIP = parseInt(__ENV.SKIP || '0');
const VUS = parseInt(__ENV.VUS || String(Math.max(RPS * 2, 50)));

// Modo de prueba y configuración por VUs
const MODE_RAW = (__ENV.TEST_TYPE || __ENV.MODE || 'load').toLowerCase();
const MODES_ALLOWED = ['load', 'stress'];
const MODE = MODES_ALLOWED.includes(MODE_RAW) ? MODE_RAW : 'load';
const LOAD_STAGE_UP = __ENV.LOAD_STAGE_UP || '1m';
const LOAD_STAGE_HOLD = __ENV.LOAD_STAGE_HOLD || DURATION;
const LOAD_STAGE_DOWN = __ENV.LOAD_STAGE_DOWN || '1m';
const TARGET_VUS = parseInt(__ENV.TARGET_VUS || String(Math.max(VUS, 20)));

const STRESS_START_VUS = parseInt(__ENV.STRESS_START_VUS || String(Math.max(Math.floor(TARGET_VUS / 2), 10)));
const STRESS_MAX_VUS = parseInt(__ENV.STRESS_MAX_VUS || String(Math.max(TARGET_VUS * 2, 50)));
const STRESS_STEP_COUNT = parseInt(__ENV.STRESS_STEP_COUNT || '4');
const STRESS_STEP_HOLD = __ENV.STRESS_STEP_HOLD || '2m';

const TESTID = __ENV.TESTID || `k6-search-${MODE}`;

// JWT config (HS256 dev/e2e)
const JWT_SECRET = __ENV.JWT_SECRET || 'change-me-in-prod';
const JWT_ISSUER = __ENV.JWT_ISSUER || 'tasknotes-auth';
const JWT_AUDIENCE = __ENV.JWT_AUDIENCE || 'tasknotes';
const JWT_TTL_SECONDS = parseInt(__ENV.JWT_TTL_SECONDS || '900'); // 15m por defecto

function b64url(input) {
  // URL-safe base64 without padding, as required by JWT
  const enc = encoding.b64encode(input, 'url');
  return enc.replace(/=+$/g, '');
}

function toUTF8Bytes(str) {
  return new TextEncoder().encode(str);
}

function createHS256JWT(secret, payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  // Solicitar salida base64 de k6 y convertir a base64url sin padding
  const signatureStdB64 = hmac('sha256', signingInput, secret, 'base64');
  const signatureB64 = signatureStdB64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${signingInput}.${signatureB64}`;
}

let authHeader = {};

// Construir escenario por VUs (carga/estrés)
const scenarioConfig = MODE === 'load'
  ? {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { target: TARGET_VUS, duration: LOAD_STAGE_UP },
        { target: TARGET_VUS, duration: LOAD_STAGE_HOLD },
        { target: 0, duration: LOAD_STAGE_DOWN },
      ],
      exec: 'default',
      tags: { scenario: 'load', mode: MODE },
    }
  : (() => {
      const steps = Math.max(STRESS_STEP_COUNT, 1);
      const inc = Math.max(1, Math.floor((STRESS_MAX_VUS - STRESS_START_VUS) / steps));
      const stressStages = [{ target: STRESS_START_VUS, duration: STRESS_STEP_HOLD }];
      for (let i = 1; i <= steps; i++) {
        const nextTarget = Math.min(STRESS_START_VUS + inc * i, STRESS_MAX_VUS);
        stressStages.push({ target: nextTarget, duration: STRESS_STEP_HOLD });
      }
      return {
        executor: 'ramping-vus',
        startVUs: STRESS_START_VUS,
        stages: stressStages,
        exec: 'default',
        tags: { scenario: 'stress', mode: MODE },
      };
    })();

export const options = {
  scenarios: {
    [MODE]: scenarioConfig,
  },
  thresholds: {
    'http_req_duration{scenario:load}': ['p(95)<500'],
    'http_req_failed{scenario:load}': ['rate<0.02'],
    'http_req_duration{scenario:stress}': ['p(95)<1000'],
    'http_req_failed{scenario:stress}': ['rate<0.05'],
  },
  tags: { testid: TESTID },
};

export function setup() {
  // Crear JWT válido para el API Gateway (HS256)
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(USER_ID),
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    iat: nowSec,
    exp: nowSec + JWT_TTL_SECONDS,
  };
  const token = __ENV.JWT_OVERRIDE && __ENV.JWT_OVERRIDE.length > 0
    ? __ENV.JWT_OVERRIDE
    : createHS256JWT(JWT_SECRET, payload);
  if (__ENV.JWT_OVERRIDE && __ENV.JWT_OVERRIDE.length > 0) {
    console.log('Using JWT_OVERRIDE from environment');
  }
  console.log(`k6 JWT (HS256 iss=${JWT_ISSUER} aud=${JWT_AUDIENCE} sub=${USER_ID}): ${token}`);
  authHeader = { Authorization: `Bearer ${token}` };

  // Warm cache cuando el escenario es 'cache'
  if (SCENARIO === 'cache') {
    const url = `${BASE_URL}${PATH}`;
    const warmPayload = JSON.stringify({ query: QUERY, user_id: USER_ID, limit: LIMIT, skip: SKIP });
    const params = { headers: { 'Content-Type': 'application/json', ...authHeader } };
    for (let i = 0; i < 200; i++) {
      http.post(url, warmPayload, params);
    }
  }
}

export default function () {
  const url = `${BASE_URL}${PATH}`;
  // For baseline runs that aim to avoid cache, randomize query a bit
  const q = SCENARIO === 'baseline' ? `${QUERY}-${__ITER}` : QUERY;
  const payload = JSON.stringify({ query: q, user_id: USER_ID, limit: LIMIT, skip: SKIP });
  const params = { headers: { 'Content-Type': 'application/json', ...authHeader } };

  const res = http.post(url, payload, params);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  // Short think time to resemble real clients
  sleep(0.05);
}