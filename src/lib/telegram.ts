const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8972637201:AAHV3BXwLmJygrcSL-ZU6z3INMdt3Bhw6x8';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-5407724249';

export async function sendTelegramMessage(text: string): Promise<{ success: boolean; error?: string }> {
  try {
    const candidateIds = [TELEGRAM_CHANNEL_ID, '-5407724249', '-1005407724249'];
    
    let lastError = '';
    for (const chatId of candidateIds) {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      const resJson = await response.json();
      if (resJson.ok) {
        return { success: true };
      } else {
        lastError = resJson.description || 'Unknown error';
      }
    }

    return { success: false, error: lastError };
  } catch (err: any) {
    console.error('Telegram notification error:', err);
    return { success: false, error: err.message || 'Network error' };
  }
}

export function formatSaleNotification(sale: {
  pointName: string;
  receiptNumber: string;
  items: { productName: string; quantity: number; pricePerUnit: number; totalPrice: number }[];
  originalAmount: number;
  discountAmount?: number;
  discountType?: string;
  discountComment?: string;
  totalAmount: number;
  paymentMethod: string;
  splitDetails?: { cashAmount: number; cardAmount: number };
  sellerRole?: string;
}): string {
  const paymentMethodLabel = 
    sale.paymentMethod === 'card' ? '💳 საბანკო ბარათი (Карта)' :
    sale.paymentMethod === 'cash' ? '💵 ნაღდი ფული (Наличные)' :
    sale.paymentMethod === 'split' ? `⚖️ შერეული (Раздельно: 💵 ${sale.splitDetails?.cashAmount || 0}₾ / 💳 ${sale.splitDetails?.cardAmount || 0}₾)` :
    '🎁 უფასო (Бесплатно)';

  const itemsList = sale.items.map((it, idx) => 
    `   ${idx + 1}. <b>${it.productName}</b> — ${it.quantity} ც. × ${it.pricePerUnit} ₾ = <b>${it.totalPrice} ₾</b>`
  ).join('\n');

  const discountInfo = sale.discountAmount && sale.discountAmount > 0
    ? `\n🎁 <b>ფასდაკლება:</b> -${sale.discountAmount} ₾ ${sale.discountComment ? `(<i>${sale.discountComment}</i>)` : ''}`
    : '';

  const timeStr = new Date().toLocaleString('ka-GE', { 
    timeZone: 'Asia/Tbilisi', 
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return `
🛒 <b>ახალი გაყიდვა POS ტერმინალიდან!</b>
━━━━━━━━━━━━━━━━━━━━━
🏢 <b>წერტილი:</b> <code>${sale.pointName}</code>
🧾 <b>ჩეკი:</b> <code>#${sale.receiptNumber}</code>
👤 <b>მოლარე:</b> ${sale.sellerRole === 'manager' ? 'მენეჯერი' : 'მოლარე'}
⏰ <b>დრო:</b> ${timeStr}

📦 <b>პოზიციები:</b>
${itemsList}
${discountInfo}
━━━━━━━━━━━━━━━━━━━━━
💰 <b>სულ გადასახდელი:</b> <b><u>${sale.totalAmount.toFixed(2)} ₾</u></b>
💳 <b>გადახდის მეთოდი:</b> ${paymentMethodLabel}
`.trim();
}

export function formatLeadNotification(lead: {
  customerName: string;
  phone: string;
  goal?: string;
  comment?: string;
  language?: string;
}): string {
  const timeStr = new Date().toLocaleString('ka-GE', { 
    timeZone: 'Asia/Tbilisi', 
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
🥗 <b>НОВАЯ ЗАЯВКА С САЙТА FITNESS FOOD!</b>
━━━━━━━━━━━━━━━━━━━━━
👤 <b>Клиент / კლიენტი:</b> <b>${lead.customerName}</b>
📞 <b>Телефон / ტელეფონი:</b> <code>${lead.phone}</code>
🎯 <b>Выбранный рацион / პროგრამა:</b> <b>${lead.goal || 'Стандартный рацион'}</b>
🌐 <b>Язык / ენა:</b> ${lead.language?.toUpperCase() || 'RU'}
⏰ <b>Время / დრო:</b> ${timeStr}
${lead.comment ? `💬 <b>Пожелания / ალერგია:</b> <i>${lead.comment}</i>\n` : ''}━━━━━━━━━━━━━━━━━━━━━
⚡ <i>Клиент ждет старта доставки и спецпредложение к открытию!</i>
`.trim();
}
