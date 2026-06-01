const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();

  const KEY = 'f7102ea8d59b497f9be684ea381bca3c';
  const { type } = req.query;

  let path;

  if(type === 'schedule') {
    // 국회 본회의/위원회 일정
    const d = new Date();
    const ymd = d.getFullYear().toString() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
    path = `/portal/openapi/nwbpacrgavhjryiph?KEY=${KEY}&Type=json&pIndex=1&pSize=7&AGE=22&START_DATE=${ymd}&END_DATE=${ymd}`;
  } else if(type === 'bills') {
    // 보건복지위원회 발의법률안 (22대)
    path = `/portal/openapi/nzmimeepazxkubdpn?KEY=${KEY}&Type=json&pIndex=1&pSize=7&AGE=22&CMIT_NM=%EB%B3%B4%EA%B1%B4%EB%B3%B5%EC%A7%80%EC%9C%84%EC%9B%90%ED%9A%8C`;
  } else {
    return res.status(400).json({ error: 'Invalid type' });
  }

  try {
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'open.assembly.go.kr',
        path,
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
      };
      https.get(options, (r) => {
        let body = '';
        r.on('data', chunk => body += chunk);
        r.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch(e) { resolve({ error: body.substring(0, 500) }); }
        });
      }).on('error', reject);
    });
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
