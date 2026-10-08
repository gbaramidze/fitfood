const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8972637201:AAHV3BXwLmJygrcSL-ZU6z3INMdt3Bhw6x8';

const domain = process.argv[2];

if (!domain) {
  console.log('Использование:');
  console.log('  node scripts/set_webhook.mjs https://your-domain.com');
  console.log('  node scripts/set_webhook.mjs info     (проверить текущий статус)');
  console.log('  node scripts/set_webhook.mjs delete   (удалить вебхук)');
  process.exit(1);
}

async function main() {
  if (domain === 'info') {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    const data = await res.json();
    console.log('Текущий статус Webhook:', JSON.stringify(data, null, 2));
    return;
  }

  if (domain === 'delete') {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`);
    const data = await res.json();
    console.log('Webhook удален:', JSON.stringify(data, null, 2));
    return;
  }

  const cleanDomain = domain.replace(/\/+$/, '');
  const webhookUrl = `${cleanDomain}/api/telegram/webhook`;

  console.log(`Устанавливаем Webhook на: ${webhookUrl}`);

  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      drop_pending_updates: false,
    }),
  });

  const data = await res.json();
  if (data.ok) {
    console.log('✅ Вебхук успешно установлен!');
  } else {
    console.error('❌ Ошибка установки вебхука:', data.description);
  }
}

main();
