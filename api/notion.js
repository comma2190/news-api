const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const { method, body } = req;
  const { action, database_id, page_id, data } = typeof body === 'string' ? JSON.parse(body) : (body || {});

  const notionRequest = (method, path, data) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.notion.com',
        path,
        method,
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      };
      const req = https.request(options, (r) => {
        let body = '';
        r.on('data', chunk => body += chunk);
        r.on('end', () => resolve(JSON.parse(body)));
      });
      req.on('error', reject);
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  };

  try {
    let result;

    // 데이터베이스 조회
    if (action === 'query') {
      result = await notionRequest('POST', `/v1/databases/${database_id}/query`, data || {});
    }
    // 페이지 생성 (새 항목 추가)
    else if (action === 'create') {
      result = await notionRequest('POST', `/v1/pages`, data);
    }
    // 페이지 수정 (항목 업데이트)
    else if (action === 'update') {
      result = await notionRequest('PATCH', `/v1/pages/${page_id}`, data);
    }
    // 데이터베이스 구조 조회
    else if (action === 'database') {
      result = await notionRequest('GET', `/v1/databases/${database_id}`);
    }
    else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
