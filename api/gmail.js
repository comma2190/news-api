const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if(req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers['authorization']?.replace('Bearer ','') || req.query.token;
  if(!token) return res.status(401).json({ error: 'No token' });

  const { after, maxResults } = req.query;
  let query = 'in:inbox';
  if(after) query += ' after:'+after;

  const listPath = `/gmail/v1/users/me/messages?maxResults=${maxResults||10}&q=${encodeURIComponent(query)}`;

  try {
    // 메시지 목록 가져오기
    const listData = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'gmail.googleapis.com',
        path: listPath,
        method: 'GET',
        headers: { 'Authorization': 'Bearer '+token }
      };
      https.get(options, (r) => {
        let body='';
        r.on('data', chunk => body+=chunk);
        r.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { resolve({error:body}); } });
      }).on('error', reject);
    });

    if(!listData.messages || !listData.messages.length) {
      return res.status(200).json({ messages: [] });
    }

    // 각 메시지 상세 가져오기
    const messages = await Promise.all(listData.messages.slice(0, parseInt(maxResults)||10).map(async (msg) => {
      const detail = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'gmail.googleapis.com',
          path: `/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          method: 'GET',
          headers: { 'Authorization': 'Bearer '+token }
        };
        https.get(options, (r) => {
          let body='';
          r.on('data', chunk => body+=chunk);
          r.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { resolve({}); } });
        }).on('error', () => resolve({}));
      });

      const headers = detail.payload?.headers || [];
      const getHeader = (name) => headers.find(h => h.name===name)?.value || '';
      const isUnread = detail.labelIds?.includes('UNREAD') || false;

      // 날짜 포맷
      const dateStr = getHeader('Date');
      let dateFormatted = '';
      try {
        const d = new Date(dateStr);
        dateFormatted = (d.getMonth()+1)+'/'+(d.getDate())+' '+(d.getHours()).toString().padStart(2,'0')+':'+(d.getMinutes()).toString().padStart(2,'0');
      } catch(e) {}

      // 발신자 이름만 추출
      let from = getHeader('From');
      const nameMatch = from.match(/^"?([^"<]+)"?\s*</);
      if(nameMatch) from = nameMatch[1].trim();

      return {
        id: msg.id,
        from,
        subject: getHeader('Subject'),
        date: dateFormatted,
        unread: isUnread
      };
    }));

    res.status(200).json({ messages });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
