import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

export let rejected = new Counter('rejected_429');
export let reqDuration = new Trend('req_duration_ms');

export let options = {
  stages: [
    { duration: '30s', target: 20 },   // warmup
    { duration: '2m', target: 100 },   // sustained load
    { duration: '30s', target: 400 },  // spike
    { duration: '1m', target: 0 },     // cooldown
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'], // p95 < 1s
    'rejected_429': ['count<1000'],      // example threshold
  },
};

function randomIp(seed) {
  // generate pseudo-random IPv4 from vu id + seed
  let a = (seed * 97) % 255;
  let b = (seed * 53) % 255;
  let c = (seed * 23) % 255;
  let d = (seed * 13) % 255;
  return `${a}.${b}.${c}.${d}`;
}

export default function () {
  const url = __ENV.TARGET_URL || 'http://api-gateway:8080/api/users/health';

  console.log(`[DEBUG] Intentando conectar a: ${url}`);

  // create a user and ip per vu
  const vu = __VU;
  const ip = randomIp(vu);
  const headers = {
    'X-Forwarded-For': '192.168.1.50',
    'Accept': 'application/json',
    // If testing authenticated behavior, set Authorization:
    // 'Authorization': `Bearer ${__ENV.TEST_JWT || ''}`
  };

  let res = http.get(url, { headers: headers, tags: { ip: ip } });

  reqDuration.add(res.timings.duration);
  check(res, {
    'status is 200 or 429 or 5xx': (r) => r.status === 200 || r.status === 429 || r.status >= 500,
  });

  if (res.status === 429) {
    rejected.add(1);
  }

  sleep(0.01);
}
