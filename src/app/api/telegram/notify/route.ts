import { NextRequest, NextResponse } from 'next/server';
import {
  sendTelegramMessage,
  formatSaleNotification,
  formatPreorderNotification,
  formatShipmentNotification,
  formatWriteOffNotification,
  formatLeadNotification,
  formatRationOrderNotification,
  getTodayStatsMessage,
  getYesterdayStatsMessage,
  getMonthStatsMessage,
  handleTelegramCommand
} from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data, rawMessage, chatId, command } = body;

    let messageText = '';

    if (command) {
      const cmdResult = await handleTelegramCommand(command, chatId);
      return NextResponse.json(cmdResult);
    }

    if (rawMessage) {
      messageText = rawMessage;
    } else if (type === 'sale') {
      messageText = formatSaleNotification(data);
    } else if (type === 'preorder') {
      messageText = formatPreorderNotification(data);
    } else if (type === 'shipment') {
      messageText = formatShipmentNotification(data);
    } else if (type === 'writeoff') {
      messageText = formatWriteOffNotification(data);
    } else if (type === 'ration_order') {
      messageText = formatRationOrderNotification(data);
    } else if (type === 'lead') {
      messageText = formatLeadNotification(data);
    } else if (type === 'stats' || type === 'today' || type === 'dges') {
      messageText = await getTodayStatsMessage();
    } else if (type === 'yesterday' || type === 'gushin') {
      messageText = await getYesterdayStatsMessage();
    } else if (type === 'month' || type === 'tve') {
      messageText = await getMonthStatsMessage();
    } else {
      return NextResponse.json({ success: false, error: 'Invalid notification type' }, { status: 400 });
    }

    const result = await sendTelegramMessage(messageText, chatId);

    if (result.success) {
      return NextResponse.json({ success: true, message: messageText });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (err: any) {
    console.error('Error in /api/telegram/notify:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
