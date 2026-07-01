async function postToDiscord(webhookUrl, embed) {
  const body = JSON.stringify({ embeds: [embed] });

  let response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (response.status === 429) {
    const retryAfter = await response
      .json()
      .then((data) => data.retry_after)
      .catch(() => 1);
    await new Promise((resolve) => setTimeout(resolve, (retryAfter || 1) * 1000));
    response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Discord webhook responded ${response.status}: ${text}`);
  }
}

module.exports = { postToDiscord };
