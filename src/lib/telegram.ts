import { supabase, isSupabaseConfigured } from './supabaseClient';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8972637201:AAHV3BXwLmJygrcSL-ZU6z3INMdt3Bhw6x8';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-5407724249';

export const GEORGIAN_MONTHS = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
];

export function formatAmount(val: number): string {
  if (val === undefined || isNaN(val)) return '0';
  const rounded = Math.round(val * 100) / 100;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
}

export function isTodayTbilisi(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(date) === fmt.format(now);
}

export function isCurrentMonthTbilisi(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
  });
  return fmt.format(date) === fmt.format(now);
}

/** Inline keyboard shown under the bot's replies: callback_data values are handled in handleTelegramCallback. */
export const BOT_MENU_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '🗑️ ჩამოწერა', callback_data: 'writeoff' },
      { text: '⏪ გუშინ', callback_data: 'yesterday' },
      { text: '📊 სტატისტიკა', callback_data: 'finance' },
    ],
  ],
};

export async function sendTelegramMessage(
  text: string,
  targetChatId?: string | number,
  replyMarkup?: object
): Promise<{ success: boolean; error?: string }> {
  try {
    const candidateIds = targetChatId
      ? [String(targetChatId)]
      : [TELEGRAM_CHANNEL_ID, '-5407724249', '-1005407724249'];

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
          ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
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
  receiptNumber?: string;
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
    sale.paymentMethod === 'card' ? '💳 საბანკო ბარათი' :
    sale.paymentMethod === 'cash' ? '💵 ნაღდი ფული' :
    sale.paymentMethod === 'split' ? `⚖️ შერეული (💵 ${formatAmount(sale.splitDetails?.cashAmount || 0)} ₾ / 💳 ${formatAmount(sale.splitDetails?.cardAmount || 0)} ₾)` :
    '🎁 უფასო';

  const itemsList = sale.items.map((it, idx) => 
    `   ${idx + 1}. ${it.productName} - ${it.quantity} ც. × ${formatAmount(it.pricePerUnit)} ₾ = ${formatAmount(it.totalPrice)} ₾`
  ).join('\n');

  const discountInfo = sale.discountAmount && sale.discountAmount > 0
    ? `\n🎁 <b>ფასდაკლება:</b> -${formatAmount(sale.discountAmount)} ₾ ${sale.discountComment ? `(${sale.discountComment})` : ''}`
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
🛒 <b>ახალი გაყიდვა</b>
━━━━━━━━━━━━━━━━━━━━━
🏢 <b>წერტილი:</b> ${sale.pointName}
⏰ <b>დრო:</b> ${timeStr}

📦 <b>პოზიციები:</b>
${itemsList}
${discountInfo}
━━━━━━━━━━━━━━━━━━━━━
<b>გადახდილი:</b> ${sale.totalAmount.toFixed(2)} ₾
${paymentMethodLabel}
`.trim();
}

export function formatPreorderNotification(preorder: {
  pointName: string;
  preorderNumber?: string;
  items: { productName: string; quantity: number; pricePerUnit: number; totalPrice: number }[];
  originalAmount: number;
  discountAmount?: number;
  totalAmount: number;
  comment: string;
  pickupDate?: string;
  paymentMethod: string;
  sellerRole?: string;
}): string {
  const paymentMethodLabel =
    preorder.paymentMethod === 'card' ? '💳 საბანკო ბარათი' : '💵 ნაღდი ფული';

  const itemsList = preorder.items.map((it, idx) =>
    `   ${idx + 1}. ${it.productName} - ${it.quantity} ც. × ${formatAmount(it.pricePerUnit)} ₾ = ${formatAmount(it.totalPrice)} ₾`
  ).join('\n');

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
📝 <b>ახალი წინასწარი შეკვეთა (Предзаказ)</b>
━━━━━━━━━━━━━━━━━━━━━
🏢 <b>წერტილი:</b> ${preorder.pointName}
⏰ <b>დრო:</b> ${timeStr}
📅 <b>გატანის თარიღი:</b> ${preorder.pickupDate || '—'}
👤 <b>ვისთვის / კომენტარი:</b> ${preorder.comment}

📦 <b>პოზიციები:</b>
${itemsList}

🏷️ <b>ფასდაკლება (კერძი -3 ₾):</b> -${formatAmount(preorder.discountAmount || 0)} ₾
━━━━━━━━━━━━━━━━━━━━━
<b>გადახდილი ავანსად:</b> ${preorder.totalAmount.toFixed(2)} ₾
${paymentMethodLabel}
`.trim();
}

export function formatShipmentNotification(shipment: {
  pointName: string;
  shipmentNumber?: string;
  items: { productName: string; quantity: number }[];
  totalUnits: number;
  note?: string;
  sellerRole?: string;
}): string {
  const itemsList = shipment.items.map((it, idx) =>
    `   ${idx + 1}. ${it.productName} - +${it.quantity} ც.`
  ).join('\n');

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
📦 <b>მარაგის შევსება (Пополнение склада)</b>
━━━━━━━━━━━━━━━━━━━━━
🏢 <b>წერტილი:</b> ${shipment.pointName}
⏰ <b>დრო:</b> ${timeStr}
${shipment.shipmentNumber ? `🔖 <b>ზედნადები:</b> #${shipment.shipmentNumber}\n` : ''}
📦 <b>პოზიციები:</b>
${itemsList}
${shipment.note ? `\n💬 <b>კომენტარი:</b> ${shipment.note}` : ''}
━━━━━━━━━━━━━━━━━━━━━
<b>სულ შევსებული:</b> +${shipment.totalUnits} ც.
`.trim();
}

export function formatWriteOffNotification(writeOff: {
  pointName: string;
  items: { productName: string; quantity: number; totalValue?: number }[];
  totalUnits: number;
  totalValue?: number;
  reasonText: string;
  note?: string;
  sellerRole?: string;
}): string {
  const itemsList = writeOff.items.map((it, idx) =>
    `   ${idx + 1}. ${it.productName} - -${it.quantity} ც.${it.totalValue ? ` (-${formatAmount(it.totalValue)} ₾)` : ''}`
  ).join('\n');

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
🗑️ <b>ჩამოწერა (Списание)</b>
━━━━━━━━━━━━━━━━━━━━━
🏢 <b>წერტილი:</b> ${writeOff.pointName}
⏰ <b>დრო:</b> ${timeStr}
📋 <b>მიზეზი:</b> ${writeOff.reasonText}

📦 <b>პოზიციები:</b>
${itemsList}
${writeOff.note ? `\n💬 <b>შენიშვნა:</b> ${writeOff.note}` : ''}
━━━━━━━━━━━━━━━━━━━━━
<b>სულ ჩამოწერილი:</b> -${writeOff.totalUnits} ც.${writeOff.totalValue ? ` (-${formatAmount(writeOff.totalValue)} ₾)` : ''}
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

const escapeHtml = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A ration (meal-plan) order placed on the /order page. */
export function formatRationOrderNotification(o: {
  orderId: string;
  customerName: string;
  phone: string;
  program: string;
  calories: number;
  days: number;
  startDate: string;
  slot: string;
  zone: string;
  address: string;
  payment: string;
  payCode?: string;
  total: number;
  stopList?: string[];
  swaps?: string[];
  comment?: string;
  language?: string;
}): string {
  const lines = [
    `🥗 <b>НОВЫЙ ЗАКАЗ РАЦИОНА! / ახალი შეკვეთა</b>  <code>${escapeHtml(o.orderId)}</code>`,
    '━━━━━━━━━━━━━━━━━━━━━',
    `👤 <b>${escapeHtml(o.customerName)}</b>`,
    `📞 <code>${escapeHtml(o.phone)}</code>`,
    `🎯 <b>${escapeHtml(o.program)}</b> · ${o.calories} ккал · ${o.days} дн.`,
    `📅 Старт: <b>${escapeHtml(o.startDate)}</b> · слот: ${escapeHtml(o.slot)}`,
    `📍 ${escapeHtml(o.zone)} — ${escapeHtml(o.address)}`,
    `💳 ${escapeHtml(o.payment)} · <b>${o.total} GEL</b>`,
  ];
  if (o.payCode) lines.push(`🔑 Код оплаты: <code>${escapeHtml(o.payCode)}</code>`);
  if (o.stopList && o.stopList.length) lines.push(`⛔ <b>Стоп-лист:</b> ${escapeHtml(o.stopList.join(', '))}`);
  if (o.swaps && o.swaps.length) lines.push(`🔄 <b>Замены:</b> ${escapeHtml(o.swaps.join('; '))}`);
  if (o.comment) lines.push(`💬 <i>${escapeHtml(o.comment)}</i>`);
  lines.push(`🌐 ${(o.language || 'ru').toUpperCase()}`);
  return lines.join('\n');
}

export function isYesterdayTbilisi(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayTbilisiStr = fmt.format(now);
  const [y, m, d] = todayTbilisiStr.split('-').map(Number);
  const yesterdayDate = new Date(Date.UTC(y, m - 1, d - 1));
  const yesterdayTbilisiStr = yesterdayDate.toISOString().slice(0, 10);
  return fmt.format(date) === yesterdayTbilisiStr;
}

export function getYesterdayDateStrKa(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayTbilisiStr = fmt.format(now);
  const [y, m, d] = todayTbilisiStr.split('-').map(Number);
  const yesterdayDate = new Date(Date.UTC(y, m - 1, d - 1));
  const yYear = yesterdayDate.getUTCFullYear();
  const yMonth = String(yesterdayDate.getUTCMonth() + 1).padStart(2, '0');
  const yDay = String(yesterdayDate.getUTCDate()).padStart(2, '0');
  return `${yDay}.${yMonth}.${yYear}`;
}

async function getPointNamesMap(): Promise<Record<string, string>> {
  const pointNames: Record<string, string> = {
    'point-mega-gym': 'Mega Gym',
    'point-fitness-academy': 'Fitness Academy',
  };

  try {
    const { data: points } = await supabase.from('partner_points').select('id, name');
    if (points) {
      points.forEach((p: any) => {
        let name = p.id;
        if (typeof p.name === 'object' && p.name) {
          name = p.name.ka || p.name.ru || p.name.en || p.id;
        } else if (typeof p.name === 'string') {
          name = p.name;
        }
        pointNames[p.id] = name;
      });
    }
  } catch (err) {
    console.warn('Failed to fetch partner points for telegram stats:', err);
  }

  return pointNames;
}

function buildPeriodStatsMessage(
  title: string,
  emptyMessage: string,
  filteredSales: any[],
  pointNames: Record<string, string>,
  options?: { isMonth?: boolean }
): string {
  if (filteredSales.length === 0) {
    return `
${title}
━━━━━━━━━━━━━━━━━━━━━
${emptyMessage}
`.trim();
  }

  const gymMap: Record<string, {
    name: string;
    grossTotal: number;
    cardTotal: number;
    cashTotal: number;
    discountTotal: number;
    freeTotal: number;
    units: number;
    count: number;
    products: Record<string, { quantity: number; netTotal: number; grossTotal: number }>;
  }> = {};
  
  let grossTotal = 0;
  let cardTotal = 0;
  let cashTotal = 0;
  let discountTotal = 0;
  let freeTotal = 0;
  let totalUnits = 0;

  filteredSales.forEach(s => {
    const orig = Number(s.original_amount || s.total_amount || 0);
    const disc = Number(s.discount_amount || 0);
    const total = Number(s.total_amount || 0);
    const isFree = s.payment_method === 'free' || s.discount_type === 'free';
    const ptId = s.point_id || 'unknown';
    const ptName = pointNames[ptId] || ptId;

    if (!gymMap[ptId]) {
      gymMap[ptId] = {
        name: ptName,
        grossTotal: 0,
        cardTotal: 0,
        cashTotal: 0,
        discountTotal: 0,
        freeTotal: 0,
        units: 0,
        count: 0,
        products: {}
      };
    }

    const gym = gymMap[ptId];
    gym.grossTotal += orig;
    gym.count += 1;
    grossTotal += orig;

    if (isFree) {
      freeTotal += orig;
      gym.freeTotal += orig;
    } else {
      if (disc > 0 && s.discount_type !== 'free') {
        discountTotal += disc;
        gym.discountTotal += disc;
      }
      if (s.payment_method === 'card') {
        cardTotal += total;
        gym.cardTotal += total;
      } else if (s.payment_method === 'cash') {
        cashTotal += total;
        gym.cashTotal += total;
      } else if (s.payment_method === 'split' && s.split_details) {
        const cAmt = Number(s.split_details.cardAmount || 0);
        const kAmt = Number(s.split_details.cashAmount || 0);
        cardTotal += cAmt;
        gym.cardTotal += cAmt;
        cashTotal += kAmt;
        gym.cashTotal += kAmt;
      }
    }

    const discountRatio = (orig > 0 && disc > 0) ? (disc / orig) : 0;

    (s.items || []).forEach((it: any) => {
      const name = it.productName || 'უცნობი';
      const qty = Number(it.quantity || 1);
      const itGross = Number(it.totalPrice !== undefined ? it.totalPrice : (it.pricePerUnit * qty));
      const itNet = isFree ? 0 : Math.max(0, itGross * (1 - discountRatio));

      totalUnits += qty;
      gym.units += qty;

      if (!gym.products[name]) {
        gym.products[name] = { quantity: 0, netTotal: 0, grossTotal: 0 };
      }
      gym.products[name].quantity += qty;
      gym.products[name].netTotal += itNet;
      gym.products[name].grossTotal += itGross;
    });
  });

  // Filter out gyms with 0 sales and sort by grossTotal descending
  const sortedGyms = Object.values(gymMap)
    .filter(g => g.units > 0 || g.grossTotal > 0)
    .sort((a, b) => b.grossTotal - a.grossTotal);

  if (sortedGyms.length === 0) {
    return `
${title}
━━━━━━━━━━━━━━━━━━━━━
${emptyMessage}
`.trim();
  }

  const gymsSections = sortedGyms.map(gym => {
    const sortedProducts = Object.entries(gym.products).sort(
      (a, b) => b[1].quantity - a[1].quantity || b[1].netTotal - a[1].netTotal
    );

    const positionsList = sortedProducts.map(([name, data], idx) => 
      `   ${idx + 1}. ${name} - ${data.quantity} ც. = ${formatAmount(data.netTotal)} ₾`
    ).join('\n');

    const payParts = [];
    if (gym.cardTotal > 0) payParts.push(`💳 ${formatAmount(gym.cardTotal)} ₾`);
    if (gym.cashTotal > 0) payParts.push(`💵 ${formatAmount(gym.cashTotal)} ₾`);
    if (gym.discountTotal > 0) payParts.push(`🎁 ${formatAmount(gym.discountTotal)} ₾`);
    if (gym.freeTotal > 0) payParts.push(`🆓 ${formatAmount(gym.freeTotal)} ₾`);
    const payStr = payParts.length > 0 ? ` (${payParts.join(' / ')})` : '';

    return `🏋️‍♂️ <b>${gym.name}</b>
📦 <b>პოზიციები:</b>
${positionsList}
📊 <b>ჯამი:</b> ${formatAmount(gym.grossTotal)} ₾${payStr} — ${gym.units} ც.`;
  }).join('\n\n━━━━━━━━━━━━━━━━━━━━━\n\n');

  return `
${title}
━━━━━━━━━━━━━━━━━━━━━

${gymsSections}

━━━━━━━━━━━━━━━━━━━━━
💰 <b>საერთო ჯამი:</b> ${formatAmount(grossTotal)} ₾
💳 <b>ტერმინალი:</b> ${formatAmount(cardTotal)} ₾
💵 <b>ნაღდი:</b> ${formatAmount(cashTotal)} ₾
🎁 <b>ფასდაკლება:</b> ${formatAmount(discountTotal)} ₾
🆓 <b>უფასო:</b> ${formatAmount(freeTotal)} ₾
📦 <b>სულ გაყიდული:</b> ${totalUnits} ც.
🧾 <b>ჩეკების რაოდენობა:</b> ${filteredSales.length}
`.trim();
}

export async function getTodayStatsMessage(): Promise<string> {
  const now = new Date();
  const todayDateStr = now.toLocaleDateString('ka-GE', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  if (!isSupabaseConfigured) {
    return `📊 <b>დღევანდელი გაყიდვები (${todayDateStr})</b>\n\nმონაცემთა ბაზა მიუწვდომელია.`;
  }

  try {
    const pointNames = await getPointNamesMap();
    const { data: sales, error } = await supabase
      .from('partner_sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !sales) {
      return `📊 <b>დღევანდელი გაყიდვები (${todayDateStr})</b>\n\nმონაცემების ჩატვირთვა ვერ მოხერხდა.`;
    }

    const todaySales = sales.filter(s => s.status !== 'refunded' && isTodayTbilisi(s.created_at));

    return buildPeriodStatsMessage(
      `📊 <b>დღევანდელი გაყიდვები (${todayDateStr})</b>`,
      'დღეს გაყიდვები ჯერ არ არის.',
      todaySales,
      pointNames
    );
  } catch (err: any) {
    console.error('Error calculating today stats:', err);
    return `📊 შეცდომა სტატისტიკის დათვლისას: ${err.message || 'უცნობი'}`;
  }
}

export async function getYesterdayStatsMessage(): Promise<string> {
  const yesterdayDateStr = getYesterdayDateStrKa();

  if (!isSupabaseConfigured) {
    return `⏪ <b>გუშინდელი გაყიდვები (${yesterdayDateStr})</b>\n\nმონაცემთა ბაზა მიუწვდომელია.`;
  }

  try {
    const pointNames = await getPointNamesMap();
    const { data: sales, error } = await supabase
      .from('partner_sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !sales) {
      return `⏪ <b>გუშინდელი გაყიდვები (${yesterdayDateStr})</b>\n\nმონაცემების ჩატვირთვა ვერ მოხერხდა.`;
    }

    const yesterdaySales = sales.filter(s => s.status !== 'refunded' && isYesterdayTbilisi(s.created_at));

    return buildPeriodStatsMessage(
      `⏪ <b>გუშინდელი გაყიდვები (${yesterdayDateStr})</b>`,
      'გუშინ გაყიდვები არ ყოფილა.',
      yesterdaySales,
      pointNames
    );
  } catch (err: any) {
    console.error('Error calculating yesterday stats:', err);
    return `⏪ შეცდომა გუშინდელი სტატისტიკის დათვლისას: ${err.message || 'უცნობი'}`;
  }
}

export async function getMonthStatsMessage(): Promise<string> {
  const now = new Date();
  const monthIndex = now.getMonth();
  const year = now.getFullYear();
  const monthNameKa = GEORGIAN_MONTHS[monthIndex];

  if (!isSupabaseConfigured) {
    return `🏆 <b>თვის გაყიდვები (${monthNameKa} ${year})</b>\n\nმონაცემთა ბაზა მიუწვდომელია.`;
  }

  try {
    const pointNames = await getPointNamesMap();
    const { data: sales, error } = await supabase
      .from('partner_sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !sales) {
      return `🏆 <b>თვის გაყიდვები (${monthNameKa} ${year})</b>\n\nმონაცემების ჩატვირთვა ვერ მოხერხდა.`;
    }

    const monthSales = sales.filter(s => s.status !== 'refunded' && isCurrentMonthTbilisi(s.created_at));

    return buildPeriodStatsMessage(
      `🏆 <b>მიმდინარე თვის გაყიდვები (${monthNameKa} ${year})</b>`,
      'მიმდინარე თვეში გაყიდვები ჯერ არ არის.',
      monthSales,
      pointNames,
      { isMonth: true }
    );
  } catch (err: any) {
    console.error('Error calculating month stats:', err);
    return `🏆 შეცდომა თვის სტატისტიკის დათვლისას: ${err.message || 'უცნობი'}`;
  }
}

/** Current month in Asia/Tbilisi: { year, month (1-12), key: 'YYYY-MM' }. */
function getTbilisiYearMonth(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const year = Number(parts.find(p => p.type === 'year')?.value);
  const month = Number(parts.find(p => p.type === 'month')?.value);
  return { year, month, key: `${year}-${String(month).padStart(2, '0')}` };
}

/** Reads every row of a query, paging past Supabase's 1000-row response cap. */
async function fetchAllRows(
  build: (from: number, to: number) => PromiseLike<{ data: any[] | null; error: any }>
): Promise<any[] | null> {
  const PAGE = 1000;
  const rows: any[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error || !data) return null;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

/** Write-offs of the current Tbilisi month, each with its value in ₾ (retail price, falling back to the product price). */
async function loadMonthWriteOffs(monthKey: string) {
  const rows = await fetchAllRows((from, to) =>
    supabase
      .from('partner_write_offs')
      .select('*')
      .gte('created_at', `${monthKey}-01T00:00:00+04:00`)
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, to)
  );
  if (!rows) return null;

  const monthRows = rows.filter(w => isCurrentMonthTbilisi(w.created_at));

  const productPrices: Record<string, number> = {};
  if (monthRows.some(w => !(Number(w.retail_price) > 0))) {
    const { data: products } = await supabase.from('partner_products').select('id, price');
    (products || []).forEach((p: any) => { productPrices[p.id] = Number(p.price) || 0; });
  }

  return monthRows.map(w => {
    const qty = Number(w.quantity) || 0;
    const unitPrice = Number(w.retail_price) > 0 ? Number(w.retail_price) : (productPrices[w.product_id] || 0);
    return { ...w, qty, value: unitPrice * qty };
  });
}

export async function getWriteOffMonthMessage(): Promise<string> {
  const { year, month, key } = getTbilisiYearMonth();
  const title = `🗑️ <b>ჩამოწერა — ${GEORGIAN_MONTHS[month - 1]} ${year}</b>`;

  if (!isSupabaseConfigured) {
    return `${title}\n\nმონაცემთა ბაზა მიუწვდომელია.`;
  }

  try {
    const [writeOffs, pointNames] = await Promise.all([loadMonthWriteOffs(key), getPointNamesMap()]);
    if (!writeOffs) {
      return `${title}\n\nმონაცემების ჩატვირთვა ვერ მოხერხდა.`;
    }
    if (writeOffs.length === 0) {
      return `${title}\n━━━━━━━━━━━━━━━━━━━━━\nამ თვეში ჩამოწერა ჯერ არ არის.`;
    }

    const byPoint: Record<string, { units: number; value: number }> = {};
    const byReason: Record<string, { units: number; value: number }> = {};
    const byProduct: Record<string, { units: number; value: number }> = {};
    let totalUnits = 0;
    let totalValue = 0;

    writeOffs.forEach(w => {
      const ptName = pointNames[w.point_id] || w.point_id || '—';
      const reason = w.reason_text || w.reason || '—';
      const product = w.product_name || '—';
      [[byPoint, ptName], [byReason, reason], [byProduct, product]].forEach(([map, k]) => {
        const m = map as Record<string, { units: number; value: number }>;
        const name = k as string;
        if (!m[name]) m[name] = { units: 0, value: 0 };
        m[name].units += w.qty;
        m[name].value += w.value;
      });
      totalUnits += w.qty;
      totalValue += w.value;
    });

    const line = (name: string, d: { units: number; value: number }) =>
      `${escapeHtml(name)} — ${d.units} ც. (-${formatAmount(d.value)} ₾)`;
    const sorted = (map: Record<string, { units: number; value: number }>) =>
      Object.entries(map).sort((a, b) => b[1].value - a[1].value || b[1].units - a[1].units);

    const pointsList = sorted(byPoint).map(([n, d]) => `   🏋️‍♂️ ${line(n, d)}`).join('\n');
    const reasonsList = sorted(byReason).map(([n, d]) => `   • ${line(n, d)}`).join('\n');
    // Top 15 positions only, so a busy month can't exceed Telegram's 4096-character message limit
    const productsList = sorted(byProduct).slice(0, 15).map(([n, d], i) => `   ${i + 1}. ${line(n, d)}`).join('\n');

    return `
${title}
━━━━━━━━━━━━━━━━━━━━━
🏢 <b>დარბაზების მიხედვით:</b>
${pointsList}

📋 <b>მიზეზების მიხედვით:</b>
${reasonsList}

📦 <b>პოზიციები:</b>
${productsList}
━━━━━━━━━━━━━━━━━━━━━
📦 <b>სულ ჩამოწერილი:</b> ${totalUnits} ც.
💸 <b>ღირებულება:</b> -${formatAmount(totalValue)} ₾
🧾 <b>ოპერაციების რაოდენობა:</b> ${writeOffs.length}
`.trim();
  } catch (err: any) {
    console.error('Error calculating write-off stats:', err);
    return `🗑️ შეცდომა ჩამოწერის დათვლისას: ${err.message || 'უცნობი'}`;
  }
}

/** Monthly finance summary: income (POS sales) / expenses (+ payroll paid) / write-offs / net revenue. */
export async function getFinanceMonthMessage(): Promise<string> {
  const { year, month, key } = getTbilisiYearMonth();
  const title = `📊 <b>სტატისტიკა — ${GEORGIAN_MONTHS[month - 1]} ${year}</b>`;

  if (!isSupabaseConfigured) {
    return `${title}\n\nმონაცემთა ბაზა მიუწვდომელია.`;
  }

  try {
    const monthStart = `${key}-01T00:00:00+04:00`;
    const [salesRows, expenseRows, salaryRows, writeOffs] = await Promise.all([
      fetchAllRows((from, to) =>
        supabase.from('partner_sales').select('*').gte('created_at', monthStart)
          .order('created_at', { ascending: false }).order('id').range(from, to)
      ),
      fetchAllRows((from, to) =>
        supabase.from('admin_expenses').select('*').gte('date', `${key}-01`)
          .order('date', { ascending: false }).order('id').range(from, to)
      ),
      fetchAllRows((from, to) =>
        supabase.from('admin_salaries').select('*').eq('payment_status', 'paid')
          .order('id').range(from, to)
      ),
      loadMonthWriteOffs(key),
    ]);

    if (!salesRows || !expenseRows || !salaryRows || !writeOffs) {
      return `${title}\n\nმონაცემების ჩატვირთვა ვერ მოხერხდა.`;
    }

    // Income: money actually received from this month's non-refunded sales
    let income = 0;
    let card = 0;
    let cash = 0;
    let receipts = 0;
    salesRows
      .filter(s => s.status !== 'refunded' && isCurrentMonthTbilisi(s.created_at))
      .forEach(s => {
        const total = Number(s.total_amount || 0);
        receipts += 1;
        income += total;
        if (s.payment_method === 'card') card += total;
        else if (s.payment_method === 'cash') cash += total;
        else if (s.payment_method === 'split' && s.split_details) {
          card += Number(s.split_details.cardAmount || 0);
          cash += Number(s.split_details.cashAmount || 0);
        }
      });

    // Expenses: this month's expense records + salaries paid this month
    const expenses = expenseRows
      .filter(e => String(e.date || '').startsWith(key))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const payroll = salaryRows
      .filter(s => String(s.last_paid_date || '').startsWith(key))
      .reduce((sum, s) => sum + (Number(s.total_to_pay) || 0), 0);
    const totalExpenses = expenses + payroll;

    const writeOffValue = writeOffs.reduce((sum, w) => sum + w.value, 0);
    const writeOffUnits = writeOffs.reduce((sum, w) => sum + w.qty, 0);

    const net = income - totalExpenses - writeOffValue;
    const netIcon = net >= 0 ? '✅' : '🔻';

    return `
${title}
━━━━━━━━━━━━━━━━━━━━━
💰 <b>შემოსავალი (შემოსვლა):</b> ${formatAmount(income)} ₾
   💳 ტერმინალი: ${formatAmount(card)} ₾
   💵 ნაღდი: ${formatAmount(cash)} ₾
   🧾 ჩეკები: ${receipts}

💸 <b>ხარჯი:</b> -${formatAmount(totalExpenses)} ₾
   🧾 ხარჯები: -${formatAmount(expenses)} ₾
   👥 ხელფასები: -${formatAmount(payroll)} ₾

🗑️ <b>ჩამოწერა:</b> -${formatAmount(writeOffValue)} ₾ (${writeOffUnits} ც.)
━━━━━━━━━━━━━━━━━━━━━
${netIcon} <b>წმინდა შემოსავალი:</b> ${formatAmount(net)} ₾
`.trim();
  } catch (err: any) {
    console.error('Error calculating finance stats:', err);
    return `📊 შეცდომა სტატისტიკის დათვლისას: ${err.message || 'უცნობი'}`;
  }
}

/** Builds the reply for a bot action (slash command or inline button). Null if the action is unknown. */
async function buildBotReply(action: string): Promise<string | null> {
  switch (action) {
    case 'stats':
      return getTodayStatsMessage();
    case 'yesterday':
      return getYesterdayStatsMessage();
    case 'month':
      return getMonthStatsMessage();
    case 'writeoff':
      return getWriteOffMonthMessage();
    case 'finance':
      return getFinanceMonthMessage();
    case 'help':
      return `
🤖 <b>Fitness Food Bot — ხელმისაწვდომი ბრძანებები:</b>
━━━━━━━━━━━━━━━━━━━━━
🗑️ /writeoff — ჩამოწერა მიმდინარე თვეში
⏪ /yesterday — გუშინდელი გაყიდვები დარბაზების მიხედვით
📊 /finance — სტატისტიკა: შემოსავალი / ხარჯი / ჩამოწერა / წმინდა შემოსავალი
📅 /stats — დღევანდელი გაყიდვები დარბაზების მიხედვით
🏆 /month — მიმდინარე თვის გაყიდვები და დარბაზების სტატისტიკა
❓ /help — დახმარება
`.trim();
    default:
      return null;
  }
}

const COMMAND_ALIASES: Record<string, string> = {
  '/stats': 'stats', '/today': 'stats', '/dges': 'stats', '/დღეს': 'stats', '/сегодня': 'stats',
  '/yesterday': 'yesterday', '/gushin': 'yesterday', '/გუშინ': 'yesterday', '/вчера': 'yesterday', '/yday': 'yesterday',
  '/month': 'month', '/tve': 'month', '/თვე': 'month', '/месяц': 'month',
  '/writeoff': 'writeoff', '/ჩამოწერა': 'writeoff', '/списание': 'writeoff',
  '/finance': 'finance', '/სტატისტიკა': 'finance', '/статистика': 'finance',
  '/start': 'help', '/help': 'help',
};

export async function handleTelegramCommand(commandText: string, chatId?: string | number) {
  const cleanCmd = commandText.trim().toLowerCase().split('@')[0];
  const action = COMMAND_ALIASES[cleanCmd];
  if (!action) return { success: false, error: 'Unknown command' };

  const msg = await buildBotReply(action);
  if (!msg) return { success: false, error: 'Unknown command' };
  return await sendTelegramMessage(msg, chatId, BOT_MENU_KEYBOARD);
}

/** Handles a tap on one of the inline menu buttons (callback_data = action name). */
export async function handleTelegramCallback(callbackData: string, chatId?: string | number) {
  const msg = await buildBotReply(callbackData);
  if (!msg) return { success: false, error: 'Unknown action' };
  return await sendTelegramMessage(msg, chatId, BOT_MENU_KEYBOARD);
}

/** Acknowledges a button tap so Telegram stops showing the loading spinner on it. */
export async function answerTelegramCallback(callbackQueryId: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    });
  } catch (err) {
    console.warn('answerCallbackQuery failed:', err);
  }
}

