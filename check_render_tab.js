async function checkChromeTabs() {
  try {
    const response = await fetch('http://localhost:9222/json');
    if (!response.ok) {
      throw new Error(`Failed to fetch Chrome tabs: ${response.statusText}`);
    }
    const tabs = await response.json();
    console.log("Active Chrome Tabs on Device:");
    tabs.forEach(tab => {
      console.log(`- Title: "${tab.title}"`);
      console.log(`  URL: ${tab.url}`);
      console.log(`  Type: ${tab.type}`);
      console.log(`  WebSocket URL: ${tab.webSocketDebuggerUrl}`);
    });
  } catch (err) {
    console.error("Error querying Chrome tabs:", err);
  }
}

checkChromeTabs();
