const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { action, database_id, page_id, data } = body;

  const notionRequest = (method, path, payload) => {
    return new Promise((resolve, reject) => {
      const postData = payload ? JSON.stringify(payload) : null;
      const options = {
        hostname: 'api.notion.com',
        path,
        method,
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
          ...(postData ? {'Content-Length': Buffer.byteLength(postData)} : {})
        }
      };
      const request = https.request(options, (r) => {
        let body = '';
        r.on('data', chunk => body += chunk);
        r.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { resolve({error: body}); } });
      });
      request.on('error', reject);
      if (postData) request.write(postData);
      request.end();
    });
  };

  try {
    let result;

    if (action === 'query') {
      result = await notionRequest('POST', `/v1/databases/${database_id}/query`, data || {});
    }
    else if (action === 'create') {
      result = await notionRequest('POST', `/v1/pages`, data);
    }
    else if (action === 'create_database') {
      result = await notionRequest('POST', `/v1/databases`, data);
    }
    else if (action === 'update') {
      result = await notionRequest('PATCH', `/v1/pages/${page_id}`, data);
    }
    else if (action === 'database') {
      result = await notionRequest('GET', `/v1/databases/${database_id}`, null);
    }
    else if (action === 'update_database') {
      result = await notionRequest('PATCH', `/v1/databases/${database_id}`, data);
    }
    else if (action === 'search') {
      result = await notionRequest('POST', `/v1/search`, data || {});
    }
    else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
