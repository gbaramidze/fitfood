import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramCommand } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const msg = update.message || update.channel_post || update.edited_message || update.edited_channel_post;

    if (msg && msg.text) {
      const text = msg.text.trim();
      const chatId = msg.chat?.id;

      if (text.startsWith('/')) {
        await handleTelegramCommand(text, chatId);
      }
    }

    // Always respond with 200 OK so Telegram doesn't retry
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error handling Telegram Webhook:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    description: 'Fitness Food Telegram Webhook Endpoint',
    endpoints: {
      stats: '/stats',
      month: '/month',
    }
  });
}
