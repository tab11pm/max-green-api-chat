const instanceId = process.env.GREEN_API_ID?.trim();
const apiToken = process.env.GREEN_API_TOKEN?.trim();
const apiUrl = (process.env.GREEN_API_URL ?? 'https://api.green-api.com').replace(/\/$/, '');

if (!instanceId || !apiToken) {
  console.error('Missing GREEN_API_ID or GREEN_API_TOKEN. The token is never printed.')
  process.exitCode = 2
} else {
  const endpoint = `${apiUrl}/waInstance${instanceId}/getStateInstance/${apiToken}`;
  const displayId = instanceId.length > 4 ? `${instanceId.slice(0, 4)}…` : '…';

  try {
    const response = await fetch(endpoint);
    const body = await response.text();
    let state;

    try {
      const json = JSON.parse(body);
      state = typeof json.stateInstance === 'string' ? json.stateInstance : undefined;
    } catch {
      // Deliberately do not print an HTML/error response, which can contain proxy details.
    }

    console.log(`GREEN-API host: ${apiUrl}`);
    console.log(`Instance: ${displayId}`);
    console.log(`HTTP status: ${response.status}`);

    if (!response.ok) {
      console.error('Credential or API-host check failed. Verify GREEN_API_URL, id, and token in the GREEN-API console.')
      process.exitCode = 1;
    } else if (!state) {
      console.error('The API returned no readable instance state.')
      process.exitCode = 1;
    } else {
      console.log(`Instance state: ${state}`);
      if (state !== 'authorized') {
        console.error('The credentials work, but the instance is not authorized. Authorize it before sending messages.')
        process.exitCode = 1;
      } else {
        console.log('Connection check passed: the API host, credentials, and instance authorization are valid.')
      }
    }
  } catch {
    console.error(`Network request failed while contacting ${apiUrl}. Check connectivity and GREEN_API_URL.`)
    process.exitCode = 1;
  }
}
