import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% errores
    http_req_duration: ['p(95)<500'], // p95 < 500ms
  },
  insecureSkipTLSVerify: true, // Aceptar certificados self-signed del entorno local
};

const BASE_URL = __ENV.BASE_URL || 'https://traefik'; // Nombre del servicio dentro de la red Docker

export default function () {
  // Endpoints de smoke para validar balanceo a través del gateway
  const endpoints = [
    `${BASE_URL}/api/users/health`,
    `${BASE_URL}/api/music/health`,
    `${BASE_URL}/api/social/actuator/health`,
  ];

  for (const url of endpoints) {
    const res = http.get(url, { redirects: 1 });
    check(res, {
      'status is 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
