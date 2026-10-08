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
    'point-xxl': 'XXL',
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

async function sendTelegramMessage(text, targetChatId) {
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

async function handleCommand(text, chatId) {
  const cleanCmd = text.trim().toLowerCase().split('@')[0];
  console.log(`Processing command: "${cleanCmd}" from chat: ${chatId}`);

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
}

async function setupBotCommands() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'stats', description: '📊 დღევანდელი გაყიდვები დარბაზებით (Сегодня)' },
          { command: 'yesterday', description: '⏪ გუშინდელი გაყიდვები დარბაზებით (Вчера)' },
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
