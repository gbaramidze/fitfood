import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, formatSaleNotification, formatLeadNotification } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data, rawMessage } = body;

    let messageText = '';

    if (rawMessage) {
      messageText = rawMessage;
    } else if (type === 'sale') {
      messageText = formatSaleNotification(data);
    } else if (type === 'lead') {
      messageText = formatLeadNotification(data);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid notification type' }, { status: 400 });
    }

    const result = await sendTelegramMessage(messageText);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (err: any) {
    console.error('Error in /api/telegram/notify:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
