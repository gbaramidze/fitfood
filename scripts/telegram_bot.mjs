import { createClient } from '@supabase/supabase-js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8972637201:AAHV3BXwLmJygrcSL-ZU6z3INMdt3Bhw6x8';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-5407724249';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzmvjtddynulbpjiukqk.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56bXZqdGRkeW51bGJwaml1a3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MjQ3NTgsImV4cCI6MjEwNjQwMDc1OH0.N_CqUjgaTLDHnM0e7JP50um8OKdZt_CDOD86Q4DAUGo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const GEORGIAN_MONTHS = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
];

function formatAmount(val) {
  if (val === undefined || isNaN(val)) return '0';
  const rounded = Math.round(val * 100) / 100;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
}

function getTbilisiDateStr(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function isTodayTbilisi(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  return getTbilisiDateStr(date) === getTbilisiDateStr(now);
}

function isYesterdayTbilisi(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const todayTbilisiStr = getTbilisiDateStr(now);
  const [y, m, d] = todayTbilisiStr.split('-').map(Number);
  const yesterdayDate = new Date(Date.UTC(y, m - 1, d - 1));
  const yesterdayTbilisiStr = yesterdayDate.toISOString().slice(0, 10);
  return getTbilisiDateStr(date) === yesterdayTbilisiStr;
}

function getYesterdayDateStrKa() {
  const now = new Date();
  const todayTbilisiStr = getTbilisiDateStr(now);
  const [y, m, d] = todayTbilisiStr.split('-').map(Number);
  const yesterdayDate = new Date(Date.UTC(y, m - 1, d - 1));
  const yYear = yesterdayDate.getUTCFullYear();
  const yMonth = String(yesterdayDate.getUTCMonth() + 1).padStart(2, '0');
  const yDay = String(yesterdayDate.getUTCDate()).padStart(2, '0');
  return `${yDay}.${yMonth}.${yYear}`;
}

function isCurrentMonthTbilisi(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
  });
  return fmt.format(date) === fmt.format(now);
}

async function getPointNamesMap() {
  const pointNames = {
    'point-mega-gym': 'Mega Gym',
    'point-fitness-academy': 'Fitness Academy',
  };

  try {
    const { data: points } = await supabase.from('partner_points').select('id, name');
    if (points) {
      points.forEach(p => {
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

// Inline keyboard shown under the bot's replies: callback_data values are handled in buildBotReply.
const BOT_MENU_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '🗑️ ჩამოწერა', callback_data: 'writeoff' },
      { text: '⏪ გუშინ', callback_data: 'yesterday' },
      { text: '📊 სტატისტიკა', callback_data: 'finance' },
    ],
  ],
};

async function sendTelegramMessage(text, targetChatId, replyMarkup) {
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
  } catch (err) {
    console.error('Telegram send error:', err);
    return { success: false, error: err.message };
  }
}

function buildPeriodStatsMessage(title, emptyMessage, filteredSales, pointNames, options) {
  if (filteredSales.length === 0) {
    return `
${title}
━━━━━━━━━━━━━━━━━━━━━
${emptyMessage}
`.trim();
  }

  const gymMap = {};
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

    (s.items || []).forEach(it => {
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

async function getTodayStatsMessage() {
  const now = new Date();
  const todayDateStr = now.toLocaleDateString('ka-GE', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

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
  } catch (err) {
    console.error('Error calculating today stats:', err);
    return `📊 შეცდომა სტატისტიკის დათვლისას: ${err.message || 'უცნობი'}`;
  }
}

async function getYesterdayStatsMessage() {
  const yesterdayDateStr = getYesterdayDateStrKa();

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
  } catch (err) {
    console.error('Error calculating yesterday stats:', err);
    return `⏪ შეცდომა გუშინდელი სტატისტიკის დათვლისას: ${err.message || 'უცნობი'}`;
  }
}

async function getMonthStatsMessage() {
  const now = new Date();
  const monthIndex = now.getMonth();
  const year = now.getFullYear();
  const monthNameKa = GEORGIAN_MONTHS[monthIndex];

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
  } catch (err) {
    console.error('Error calculating month stats:', err);
    return `🏆 შეცდომა თვის სტატისტიკის დათვლისას: ${err.message || 'უცნობი'}`;
  }
}

function getTbilisiYearMonth(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const year = Number(parts.find(p => p.type === 'year')?.value);
  const month = Number(parts.find(p => p.type === 'month')?.value);
  return { year, month, key: `${year}-${String(month).padStart(2, '0')}` };
}

// Reads every row of a query, paging past Supabase's 1000-row response cap.
async function fetchAllRows(build) {
  const PAGE = 1000;
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error || !data) return null;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Write-offs of the current Tbilisi month, each with its value in ₾ (retail price, falling back to the product price).
async function loadMonthWriteOffs(monthKey) {
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

  const productPrices = {};
  if (monthRows.some(w => !(Number(w.retail_price) > 0))) {
    const { data: products } = await supabase.from('partner_products').select('id, price');
    (products || []).forEach(p => { productPrices[p.id] = Number(p.price) || 0; });
  }

  return monthRows.map(w => {
    const qty = Number(w.quantity) || 0;
    const unitPrice = Number(w.retail_price) > 0 ? Number(w.retail_price) : (productPrices[w.product_id] || 0);
    return { ...w, qty, value: unitPrice * qty };
  });
}

async function getWriteOffMonthMessage() {
  const { year, month, key } = getTbilisiYearMonth();
  const title = `🗑️ <b>ჩამოწერა — ${GEORGIAN_MONTHS[month - 1]} ${year}</b>`;

  try {
    const [writeOffs, pointNames] = await Promise.all([loadMonthWriteOffs(key), getPointNamesMap()]);
    if (!writeOffs) {
      return `${title}\n\nმონაცემების ჩატვირთვა ვერ მოხერხდა.`;
    }
    if (writeOffs.length === 0) {
      return `${title}\n━━━━━━━━━━━━━━━━━━━━━\nამ თვეში ჩამოწერა ჯერ არ არის.`;
    }

    const byPoint = {};
    const byReason = {};
    const byProduct = {};
    let totalUnits = 0;
    let totalValue = 0;

    writeOffs.forEach(w => {
      const ptName = pointNames[w.point_id] || w.point_id || '—';
      const reason = w.reason_text || w.reason || '—';
      const product = w.product_name || '—';
      [[byPoint, ptName], [byReason, reason], [byProduct, product]].forEach(([m, name]) => {
        if (!m[name]) m[name] = { units: 0, value: 0 };
        m[name].units += w.qty;
        m[name].value += w.value;
      });
      totalUnits += w.qty;
      totalValue += w.value;
    });

    const line = (name, d) => `${escapeHtml(name)} — ${d.units} ც. (-${formatAmount(d.value)} ₾)`;
    const sorted = map => Object.entries(map).sort((a, b) => b[1].value - a[1].value || b[1].units - a[1].units);

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
  } catch (err) {
    console.error('Error calculating write-off stats:', err);
    return `🗑️ შეცდომა ჩამოწერის დათვლისას: ${err.message || 'უცნობი'}`;
  }
}

// Monthly finance summary: income (POS sales) / expenses (+ payroll paid) / write-offs / net revenue.
async function getFinanceMonthMessage() {
  const { year, month, key } = getTbilisiYearMonth();
  const title = `📊 <b>სტატისტიკა — ${GEORGIAN_MONTHS[month - 1]} ${year}</b>`;

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
  } catch (err) {
    console.error('Error calculating finance stats:', err);
    return `📊 შეცდომა სტატისტიკის დათვლისას: ${err.message || 'უცნობი'}`;
  }
}

// Builds the reply for a bot action (slash command or inline button). Null if the action is unknown.
async function buildBotReply(action) {
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

const COMMAND_ALIASES = {
  '/stats': 'stats', '/today': 'stats', '/dges': 'stats', '/დღეს': 'stats', '/сегодня': 'stats',
  '/yesterday': 'yesterday', '/gushin': 'yesterday', '/გუშინ': 'yesterday', '/вчера': 'yesterday', '/yday': 'yesterday',
  '/month': 'month', '/tve': 'month', '/თვე': 'month', '/месяц': 'month',
  '/writeoff': 'writeoff', '/ჩამოწერა': 'writeoff', '/списание': 'writeoff',
  '/finance': 'finance', '/სტატისტიკა': 'finance', '/статистика': 'finance',
  '/start': 'help', '/help': 'help',
};

async function handleCommand(text, chatId) {
  const cleanCmd = text.trim().toLowerCase().split('@')[0];
  console.log(`Processing command: "${cleanCmd}" from chat: ${chatId}`);

  const action = COMMAND_ALIASES[cleanCmd];
  if (!action) return;
  const msg = await buildBotReply(action);
  if (!msg) return;
  return await sendTelegramMessage(msg, chatId, BOT_MENU_KEYBOARD);
}

// Handles a tap on one of the inline menu buttons (callback_data = action name).
async function handleCallback(callbackQuery) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQuery.id }),
    });
  } catch (err) {
    console.warn('answerCallbackQuery failed:', err.message);
  }

  const chatId = callbackQuery.message?.chat?.id;
  if (!callbackQuery.data || !chatId) return;
  console.log(`Processing button: "${callbackQuery.data}" from chat: ${chatId}`);
  const msg = await buildBotReply(callbackQuery.data);
  if (!msg) return;
  return await sendTelegramMessage(msg, chatId, BOT_MENU_KEYBOARD);
}

async function setupBotCommands() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'writeoff', description: '🗑️ ჩამოწერა მიმდინარე თვეში (Списание)' },
          { command: 'yesterday', description: '⏪ გუშინდელი გაყიდვები დარბაზებით (Вчера)' },
          { command: 'finance', description: '📊 სტატისტიკა: შემოსავალი/ხარჯი/ჩამოწერა (Статистика)' },
          { command: 'stats', description: '📅 დღევანდელი გაყიდვები დარბაზებით (Сегодня)' },
          { command: 'month', description: '🏆 თვის გაყიდვები დარბაზებით (За месяц)' },
          { command: 'help', description: '❓ დახმარება (Помощь)' }
        ]
      })
    });
    const data = await res.json();
    console.log('Bot commands registered:', data.ok ? 'SUCCESS' : data.description);
  } catch (err) {
    console.warn('Failed to set bot commands:', err.message);
  }
}

async function startPolling() {
  await setupBotCommands();
  console.log('🚀 Fitness Food Telegram Bot Polling started...');

  let offset = 0;

  while (true) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=25`
      );
      const data = await response.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;

          if (update.callback_query) {
            await handleCallback(update.callback_query);
            continue;
          }

          const msg = update.message || update.channel_post || update.edited_message || update.edited_channel_post;

          if (msg && msg.text && msg.text.startsWith('/')) {
            await handleCommand(msg.text, msg.chat?.id);
          }
        }
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (err) {
      console.error('Polling error:', err.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

startPolling();
