const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();

  const { lat, lon } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  const url = `/data/2.5/weather?lat=${lat||37.5665}&lon=${lon||126.9780}&appid=${apiKey}&units=metric&lang=kr`;

  const data = await new Promise((resolve, reject) => {
    https.get({ hostname: 'api.openweathermap.org', path: url }, (r) => {
      let body = '';
      r.on('data', chunk => body += chunk);
      r.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });

  res.status(200).json(data);
};
