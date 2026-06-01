const https = require('https');

function httpsGet(url, redirectCount) {
  redirectCount = redirectCount || 0;
  if (redirectCount > 5) return Promise.reject(new Error('Too many redirects'));

  return new Promise((resolve, reject) => {
    https.get(url, (r) => {
      if (r.statusCode === 301 || r.statusCode === 302) {
        return httpsGet(r.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }
      let data = '';
      r.on('data', chunk => data += chunk);
      r.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve({ error: data }); }
      });
    }).on('error', reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { eventId, calendarId, title, date, start, end, location, description } = req.body;

    const qs = new URLSearchParams({
      action: 'updateEvent',
      eventId: eventId || '',
      calendarId: calendarId || '',
      title: title || '',
      date: date || '',
      start: start || '',
      end: end || '',
      location: location || '',
      description: description || ''
    }).toString();

    const url = 'https://script.google.com/macros/s/AKfycbyBdRwmOAZJj0W_OoO4KFrQ8XUkQVafHSHVCj1mJCpT6TKlI-9ob2Qxwy9F2IvIctsU/exec?' + qs;
    const result = await httpsGet(url);
    res.status(200).json(result);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};
