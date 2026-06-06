export default async function handler(req, res) {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      status: 'error',
      message: 'NEWS_API_KEY не задан в Vercel',
    });
  }

  const queries = [
    { language: 'ru', country: 'kg' },
    { country: 'kg' },
  ];

  try {
    for (const params of queries) {
      const search = new URLSearchParams({ apikey: apiKey, ...params });
      const response = await fetch(`https://newsdata.io/api/1/news?${search}`);
      const data = await response.json();

      if (response.ok && data.status === 'success' && data.results?.length) {
        return res.status(200).json(data);
      }
    }

    return res.status(200).json({
      status: 'success',
      results: [],
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
}
