import http from 'k6/http';
import { sleep, check } from 'k6';

const sec = '15s';

export let options = {
  stages: [
    { duration: sec, target: 5 },
    { duration: sec, target: 10 },
    { duration: sec, target: 15 },
    { duration: sec, target: 20 },
    { duration: sec, target: 25 },
    { duration: sec, target: 30 },
    { duration: sec, target: 35 },
    { duration: sec, target: 40 },
    { duration: sec, target: 45 },
    { duration: sec, target: 50 },
    { duration: sec, target: 60 },
    { duration: sec, target: 70 },
    { duration: sec, target: 80 },
    { duration: sec, target: 90 },
    { duration: sec, target: 100 },
    { duration: sec, target: 250 },
    { duration: sec, target: 300 },
    { duration: sec, target: 450 },
    { duration: sec, target: 500 },
    { duration: sec, target: 600 },
    { duration: sec, target: 700 },
    { duration: sec, target: 800 },
    { duration: sec, target: 900 },
    { duration: sec, target: 1000 },
    { duration: sec, target: 1200 },
    { duration: sec, target: 1400 },
    { duration: sec, target: 1600 },
    { duration: sec, target: 1800 },
    { duration: sec, target: 2000 },
    { duration: sec, target: 2500 },
    { duration: sec, target: 3000 },
    { duration: sec, target: 3500 },
    { duration: sec, target: 4000 }
  ],
};

export default function () {
  const res = http.get('http://app:8000/metrics');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}