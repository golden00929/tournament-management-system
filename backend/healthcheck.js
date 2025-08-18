/**
 * 🏥 Docker 헬스체크 스크립트
 * 컨테이너가 정상적으로 동작하는지 확인
 */

const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.PORT || 5000,
  timeout: 2000,
  method: 'GET',
  path: '/health'
};

const request = http.request(options, (res) => {
  console.log('Health check status:', res.statusCode);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error('Health check failed:', err.message);
  process.exit(1);
});

request.end();