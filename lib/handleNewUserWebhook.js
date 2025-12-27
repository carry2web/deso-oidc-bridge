import 'dotenv/config';

const CLIENT_STATE = process.env.GRAPH_CLIENT_STATE || 'SuperSecretState';

export async function handleNewUserWebhook(req, res) {
  // Microsoft Graph sends notifications in req.body.value (array)
  const notifications = req.body.value;
  if (!Array.isArray(notifications)) {
    return res.status(400).send('Invalid notification payload');
  }

  for (const notification of notifications) {
    // Validate clientState
    if (notification.clientState !== CLIENT_STATE) {
      console.warn('[Webhook] Invalid clientState:', notification.clientState);
      continue;
    }
    if (notification.changeType === 'created' && notification.resource && notification.resource.startsWith('users/')) {
      // Extract user ID from resource string
      const userId = notification.resource.split('/')[1];
      console.log(`[Webhook] New user created: ${userId}`);
      // TODO: Patch user with DeSo handle if available (call setDesoHandle.js)
      // await setDesoHandle(userId, ...);
    }
  }
  // Respond quickly to avoid throttling
  res.status(200).send('OK');
}
