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
    const today = new Date().toLocaleDateString('ko-KR', {timeZone:'Asia/Seoul'}).replace(/\. /g,'').replace('.','');
    const d = new Date();
    const ymd = d.getFullYear().toString() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
    path = `/portal/openapi/nzmimeepazxkubdpn?KEY=${KEY}&Type=json&pIndex=1&pSize=7&FROM_YMD=${ymd}&TO_YMD=${ymd}`;
  } else if(type === 'bills') {
    path = `/portal/openapi/nwbpacrgavhjryiph?KEY=${KEY}&Type=json&pIndex=1&pSize=7&CMIT_NM=%EB%B3%B4%EA%B1%B4%EB%B3%B5%EC%A7%80%EC%9C%84%EC%9B%90%ED%9A%8C`;
  } else {
    return res.status(400).json({ error: 'Invalid type' });
  }

  const data = await new Promise((resolve, reject) => {
    https.get({ hostname: 'open.assembly.go.kr', path }, (r) => {
      let body = '';
      r.on('data', chunk => body += chunk);
      r.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { resolve({ error: body }); } });
    }).on('error', reject);
  });

  res.status(200).json(data);
};
