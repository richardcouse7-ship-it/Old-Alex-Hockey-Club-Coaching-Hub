import http from 'node:http';

async function main() {
  // 1. Fetch JSON endpoints from CDP
  const listResp = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9333/json/list', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  }).catch(() => null);

  console.log('List response:', listResp?.length);
}

main().catch(console.error);
