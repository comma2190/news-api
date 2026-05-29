export const config = { runtime: 'edge' };

export default async function handler(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get('keyword');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!keyword) {
    return new Response(JSON.stringify({ error: '키워드가 없습니다' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const NAVER_ID = process.env.NAVER_CLIENT_ID;
  const NAVER_SECRET = process.env.NAVER_CLIENT_SECRET;

  const body = JSON.stringify({
    startDate,
    endDate,
    timeUnit: 'date',
    keywordGroups: [{ groupName: keyword, keywords: [keyword] }],
  });

  try {
    const response = await fetch('https://openapi.naver.com/v1/datalab/search', {
      method: 'POST',
      headers: {
        'X-Naver-Client-Id': NAVER_ID,
        'X-Naver-Client-Secret': NAVER_SECRET,
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
