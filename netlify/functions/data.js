
const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors(), body: '' };
  }

  try {
    const store = getStore({ name: 'ggt-data', consistency: 'strong' });
    const what = (event.queryStringParameters || {}).what || 'all';

    if (what === 'image') {
      const code = (event.queryStringParameters || {}).code || '';
      const img = await store.get('img_' + code);
      if (!img) return { statusCode: 404, headers: cors(), body: 'not found' };
      return { statusCode: 200, headers: cors(), body: JSON.stringify({ img }) };
    }

    // Load products
    const prodsRaw = await store.get('products');
    const products = prodsRaw ? JSON.parse(prodsRaw) : null;

    // Load event info
    const evRaw = await store.get('event_info');
    const eventInfo = evRaw ? JSON.parse(evRaw) : null;

    // Load hero texts
    const heroRaw = await store.get('hero_texts');
    const heroTexts = heroRaw ? JSON.parse(heroRaw) : null;

    // Load image codes list
    const codesRaw = await store.get('image_codes');
    const imageCodes = codesRaw ? JSON.parse(codesRaw) : [];

    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify({ products, eventInfo, heroTexts, imageCodes })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({ error: err.message })
    };
  }
};

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}
