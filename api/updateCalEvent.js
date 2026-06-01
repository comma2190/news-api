const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;
    const APPS_URL = 'https://script.google.com/macros/s/AKfycbyBdRwmOAZJj0W_OoO4KFrQ8XUkQVafHSHVCj1mJCpT6TKlI-9ob2Qxwy9F2IvIctsU/exec';

    const postData = JSON.stringify(Object.assign({ action: 'updateEvent' }, body));

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'script.google.com',
        path: '/macros/s/AKfycbyBdRwmOAZJj0W_OoO4KFrQ8XUkQVafHSHVCj1mJCpT6TKlI-9ob2Qxwy9F2IvIctsU/exec',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      const request = https.request(options, (r) => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => {
          try { resolve(JSON.parse(data)); } catch(e) { resolve({ error: data }); }
        });
      });
      request.on('error', reject);
      request.write(postData);
      request.end();
    });

    res.status(200).json(result);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};
