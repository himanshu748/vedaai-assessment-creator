async function testChromeEndpoints() {
  const endpoints = [
    'http://127.0.0.1:9222/json',
    'http://127.0.0.1:9222/json/list',
    'http://127.0.0.1:9222/json/version',
    'http://localhost:9222/json',
    'http://localhost:9222/json/list'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Fetching: ${endpoint}`);
      const res = await fetch(endpoint);
      console.log(`  Status: ${res.status}`);
      const text = await res.text();
      console.log(`  Response: ${text.slice(0, 300)}`);
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }
  }
}

testChromeEndpoints();
