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

export async function sendTelegramMessage(
  text: string,
  targetChatId?: string | number
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
    'point-xxl': 'XXL',
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
  }> = {};
  const productMap: Record<string, { quantity: number; netTotal: number; grossTotal: number }> = {};
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
        count: 0
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

      if (!productMap[name]) {
        productMap[name] = { quantity: 0, netTotal: 0, grossTotal: 0 };
      }
      productMap[name].quantity += qty;
      productMap[name].netTotal += itNet;
      productMap[name].grossTotal += itGross;
    });
  });

  // Filter out gyms with 0 sales ("нулевой не показывай") and sort by grossTotal descending
  const sortedGyms = Object.values(gymMap)
    .filter(g => g.units > 0 || g.grossTotal > 0)
    .sort((a, b) => b.grossTotal - a.grossTotal);

  const gymsList = sortedGyms.map(gym => {
    const payParts = [];
    if (gym.cardTotal > 0) payParts.push(`💳 ${formatAmount(gym.cardTotal)} ₾`);
    if (gym.cashTotal > 0) payParts.push(`💵 ${formatAmount(gym.cashTotal)} ₾`);
    if (gym.discountTotal > 0) payParts.push(`🎁 ${formatAmount(gym.discountTotal)} ₾`);
    if (gym.freeTotal > 0) payParts.push(`🆓 ${formatAmount(gym.freeTotal)} ₾`);
    const payStr = payParts.length > 0 ? ` (${payParts.join(' / ')})` : '';
    return `   🏋️‍♂️ <b>${gym.name}:</b> ${formatAmount(gym.grossTotal)} ₾${payStr} — ${gym.units} ც.`;
  }).join('\n');

  const sortedProducts = Object.entries(productMap).sort(
    (a, b) => b[1].quantity - a[1].quantity || b[1].netTotal - a[1].netTotal
  );

  const positionsList = sortedProducts.map(([name, data], idx) => 
    `   ${idx + 1}. ${name} - ${data.quantity} ც = ${formatAmount(data.netTotal)} ₾`
  ).join('\n');

  const productsSectionHeader = options?.isMonth ? '📦 <b>ტოპ პროდუქტები:</b>' : '📦 <b>პოზიციები:</b>';

  const monthCountSummary = options?.isMonth ? `
━━━━━━━━━━━━━━━━━━━━━
🧾 <b>ჩეკების რაოდენობა:</b> ${filteredSales.length}
📦 <b>სულ გაყიდული:</b> ${totalUnits} ც.` : '';

  return `
${title}
━━━━━━━━━━━━━━━━━━━━━
${productsSectionHeader}
${positionsList}

━━━━━━━━━━━━━━━━━━━━━
🏢 <b>დარბაზების მიხედვით:</b>
${gymsList}
${monthCountSummary}
━━━━━━━━━━━━━━━━━━━━━
💰 <b>სულ ჯამი:</b> ${formatAmount(grossTotal)} ₾
💳 <b>ტერმინალი:</b> ${formatAmount(cardTotal)} ₾
💵 <b>ნაღდი:</b> ${formatAmount(cashTotal)} ₾
🎁 <b>ფასდაკლება:</b> ${formatAmount(discountTotal)} ₾
🆓 <b>უფასო:</b> ${formatAmount(freeTotal)} ₾
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

export async function handleTelegramCommand(commandText: string, chatId?: string | number) {
  const cleanCmd = commandText.trim().toLowerCase().split('@')[0];

  if (
    cleanCmd === '/stats' || 
    cleanCmd === '/today' || 
    cleanCmd === '/dges' || 
    cleanCmd === '/დღეს' || 
    cleanCmd === '/сегодня'
  ) {
    const msg = await getTodayStatsMessage();
    return await sendTelegramMessage(msg, chatId);
  } else if (
    cleanCmd === '/yesterday' || 
    cleanCmd === '/gushin' || 
    cleanCmd === '/გუშინ' || 
    cleanCmd === '/вчера' || 
    cleanCmd === '/yday'
  ) {
    const msg = await getYesterdayStatsMessage();
    return await sendTelegramMessage(msg, chatId);
  } else if (
    cleanCmd === '/month' || 
    cleanCmd === '/tve' || 
    cleanCmd === '/თვე' || 
    cleanCmd === '/месяц'
  ) {
    const msg = await getMonthStatsMessage();
    return await sendTelegramMessage(msg, chatId);
  } else if (cleanCmd === '/start' || cleanCmd === '/help') {
    const helpMsg = `
🤖 <b>Fitness Food Bot — ხელმისაწვდომი ბრძანებები:</b>
━━━━━━━━━━━━━━━━━━━━━
📊 /stats — დღევანდელი გაყიდვები დარბაზების მიხედვით
⏪ /yesterday — გუშინდელი გაყიდვები დარბაზების მიხედვით
🏆 /month — მიმდინარე თვის გაყიდვები და დარბაზების სტატისტიკა
❓ /help — დახმარება
`.trim();
    return await sendTelegramMessage(helpMsg, chatId);
  }

  return { success: false, error: 'Unknown command' };
}

