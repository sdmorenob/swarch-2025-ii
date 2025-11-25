import http from 'k6/http';

const duration = '2m';

export let options = {
  scenarios: {
    stress_rps: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 300,
      stages: [
        { target: 2, duration: duration },
        { target: 5, duration: duration },
        { target: 7, duration: duration },
        { target: 10, duration: duration },
        { target: 15, duration: duration },
        { target: 20, duration: duration },
        { target: 25, duration: duration },
        { target: 30, duration: duration },
        { target: 35, duration: duration },
        { target: 40, duration: duration },
        { target: 45, duration: duration },
        { target: 50, duration: duration },
        { target: 60, duration: duration },
        { target: 70, duration: duration },
        { target: 80, duration: duration },
        { target: 90, duration: duration },
        { target: 100, duration: duration },
        { target: 125, duration: duration },
        { target: 150, duration: duration },
        { target: 175, duration: duration },
        { target: 200, duration: duration }
      ],
    },
  },
};

export default function () {
  let res = http.get('http://172.17.0.2:30000/metrics');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}