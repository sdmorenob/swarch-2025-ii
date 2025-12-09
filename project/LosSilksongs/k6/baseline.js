import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración para Kubernetes con NGINX Ingress
// Para ejecutar: k6 run k6/baseline.js --env BASE_URL=http://localhost
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp-up a 50 VUs en 2 minutos
    { duration: '5m', target: 100 },  // Ramp-up a 100 VUs en 5 minutos
    { duration: '5m', target: 100 },  // Mantener 100 VUs por 5 minutos (test principal)
    { duration: '2m', target: 0 },    // Ramp-down a 0 VUs en 2 minutos
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],     // <1% errores
    http_req_duration: ['p(95)<1000'],  // p95 < 1000ms
    http_req_duration: ['p(99)<2000'],  // p99 < 2000ms
  },
  insecureSkipTLSVerify: true, // Aceptar certificados self-signed
};

// Para Kubernetes: usar http://localhost o la IP externa del Ingress
const BASE_URL = __ENV.BASE_URL || 'http://localhost';

export default function () {
  // Endpoints a través del NGINX Ingress
  const endpoints = [
    `${BASE_URL}/api/users/health`,
    `${BASE_URL}/api/music/health`,
    `${BASE_URL}/api/social/actuator/health`,
    `${BASE_URL}/api/notifications/health`,
  ];

  // Seleccionar un endpoint aleatorio
  const url = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  const res = http.get(url, { 
    redirects: 1,
    timeout: '10s',
  });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(Math.random() * 2); // Sleep aleatorio entre 0-2 segundos
}
