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

function isTodayTbilisi(dateStr) {
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

async function getTodayStatsMessage() {
  const now = new Date();
  const todayDateStr = now.toLocaleDateString('ka-GE', {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  try {
    const { data: sales, error } = await supabase
      .from('partner_sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !sales) {
      return `📊 <b>დღევანდელი გაყიდვები (${todayDateStr})</b>\n\nმონაცემების ჩატვირთვა ვერ მოხერხდა.`;
    }

    const todaySales = sales.filter(s => s.status !== 'refunded' && isTodayTbilisi(s.created_at));

    if (todaySales.length === 0) {
      return `
📊 <b>დღევანდელი გაყიდვები (${todayDateStr})</b>
━━━━━━━━━━━━━━━━━━━━━
დღეს გაყიდვები ჯერ არ არის.
`.trim();
    }

    const productMap = {};
    let grossTotal = 0;
    let cardTotal = 0;
    let cashTotal = 0;
    let discountTotal = 0;
    let freeTotal = 0;

    todaySales.forEach(s => {
      const orig = Number(s.original_amount || s.total_amount || 0);
      const disc = Number(s.discount_amount || 0);
      const total = Number(s.total_amount || 0);
      const isFree = s.payment_method === 'free' || s.discount_type === 'free';

      grossTotal += orig;

      if (isFree) {
        freeTotal += orig;
      } else {
        if (disc > 0 && s.discount_type !== 'free') {
          discountTotal += disc;
        }
        if (s.payment_method === 'card') {
          cardTotal += total;
        } else if (s.payment_method === 'cash') {
          cashTotal += total;
        } else if (s.payment_method === 'split' && s.split_details) {
          cardTotal += Number(s.split_details.cardAmount || 0);
          cashTotal += Number(s.split_details.cashAmount || 0);
        }
      }

      const discountRatio = (orig > 0 && disc > 0) ? (disc / orig) : 0;

      (s.items || []).forEach(it => {
        const name = it.productName || 'უცნობი';
        const qty = Number(it.quantity || 1);
        const itGross = Number(it.totalPrice !== undefined ? it.totalPrice : (it.pricePerUnit * qty));
        const itNet = isFree ? 0 : Math.max(0, itGross * (1 - discountRatio));

        if (!productMap[name]) {
          productMap[name] = { quantity: 0, netTotal: 0, grossTotal: 0 };
        }
        productMap[name].quantity += qty;
        productMap[name].netTotal += itNet;
        productMap[name].grossTotal += itGross;
      });
    });

    const sorted = Object.entries(productMap).sort(
      (a, b) => b[1].quantity - a[1].quantity || b[1].netTotal - a[1].netTotal
    );

    const positionsList = sorted.map(([name, data], idx) => 
      `   ${idx + 1}. ${name} - ${data.quantity} ც = ${formatAmount(data.netTotal)} ₾`
    ).join('\n');

    return `
📊 <b>დღევანდელი გაყიდვები (${todayDateStr})</b>
━━━━━━━━━━━━━━━━━━━━━
📦 <b>პოზიციები:</b>
${positionsList}

━━━━━━━━━━━━━━━━━━━━━
💰 <b>სულ ჯამი:</b> ${formatAmount(grossTotal)} ₾
💳 <b>ტერმინალი:</b> ${formatAmount(cardTotal)} ₾
💵 <b>ნაღდი:</b> ${formatAmount(cashTotal)} ₾
🎁 <b>ფასდაკლება:</b> ${formatAmount(discountTotal)} ₾
🆓 <b>უფასო:</b> ${formatAmount(freeTotal)} ₾
`.trim();
  } catch (err) {
    console.error('Error calculating today stats:', err);
    return `📊 შეცდომა სტატისტიკის დათვლისას: ${err.message || 'უცნობი'}`;
  }
}

async function getMonthStatsMessage() {
  const now = new Date();
  const monthIndex = now.getMonth();
  const year = now.getFullYear();
  const monthNameKa = GEORGIAN_MONTHS[monthIndex];

  try {
    const { data: sales, error } = await supabase
      .from('partner_sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !sales) {
      return `🏆 <b>თვის გაყიდვები (${monthNameKa} ${year})</b>\n\nმონაცემების ჩატვირთვა ვერ მოხერხდა.`;
    }

    const monthSales = sales.filter(s => s.status !== 'refunded' && isCurrentMonthTbilisi(s.created_at));

    if (monthSales.length === 0) {
      return `
🏆 <b>მიმდინარე თვის გაყიდვები (${monthNameKa} ${year})</b>
━━━━━━━━━━━━━━━━━━━━━
მიმდინარე თვეში გაყიდვები ჯერ არ არის.
`.trim();
    }

    const productMap = {};
    let grossTotal = 0;
    let cardTotal = 0;
    let cashTotal = 0;
    let discountTotal = 0;
    let freeTotal = 0;
    let totalUnits = 0;

    monthSales.forEach(s => {
      const orig = Number(s.original_amount || s.total_amount || 0);
      const disc = Number(s.discount_amount || 0);
      const total = Number(s.total_amount || 0);
      const isFree = s.payment_method === 'free' || s.discount_type === 'free';

      grossTotal += orig;

      if (isFree) {
        freeTotal += orig;
      } else {
        if (disc > 0 && s.discount_type !== 'free') {
          discountTotal += disc;
        }
        if (s.payment_method === 'card') {
          cardTotal += total;
        } else if (s.payment_method === 'cash') {
          cashTotal += total;
        } else if (s.payment_method === 'split' && s.split_details) {
          cardTotal += Number(s.split_details.cardAmount || 0);
          cashTotal += Number(s.split_details.cashAmount || 0);
        }
      }

      const discountRatio = (orig > 0 && disc > 0) ? (disc / orig) : 0;

      (s.items || []).forEach(it => {
        const name = it.productName || 'უცნობი';
        const qty = Number(it.quantity || 1);
        const itGross = Number(it.totalPrice !== undefined ? it.totalPrice : (it.pricePerUnit * qty));
        const itNet = isFree ? 0 : Math.max(0, itGross * (1 - discountRatio));

        totalUnits += qty;

        if (!productMap[name]) {
          productMap[name] = { quantity: 0, netTotal: 0, grossTotal: 0 };
        }
        productMap[name].quantity += qty;
        productMap[name].netTotal += itNet;
        productMap[name].grossTotal += itGross;
      });
    });

    const sorted = Object.entries(productMap).sort(
      (a, b) => b[1].quantity - a[1].quantity || b[1].netTotal - a[1].netTotal
    );

    const positionsList = sorted.map(([name, data], idx) => 
      `   ${idx + 1}. ${name} - ${data.quantity} ც = ${formatAmount(data.netTotal)} ₾`
    ).join('\n');

    return `
🏆 <b>მიმდინარე თვის გაყიდვები (${monthNameKa} ${year})</b>
━━━━━━━━━━━━━━━━━━━━━
📦 <b>ტოპ პროდუქტები:</b>
${positionsList}

━━━━━━━━━━━━━━━━━━━━━
🧾 <b>ჩეკების რაოდენობა:</b> ${monthSales.length}
📦 <b>სულ გაყიდული:</b> ${totalUnits} ც.
━━━━━━━━━━━━━━━━━━━━━
💰 <b>სულ ჯამი:</b> ${formatAmount(grossTotal)} ₾
💳 <b>ტერმინალი:</b> ${formatAmount(cardTotal)} ₾
💵 <b>ნაღდი:</b> ${formatAmount(cashTotal)} ₾
🎁 <b>ფასდაკლება:</b> ${formatAmount(discountTotal)} ₾
🆓 <b>უფასო:</b> ${formatAmount(freeTotal)} ₾
`.trim();
  } catch (err) {
    console.error('Error calculating month stats:', err);
    return `🏆 შეცდომა თვის სტატისტიკის დათვლისას: ${err.message || 'უცნობი'}`;
  }
}

async function handleCommand(text, chatId) {
  const cleanCmd = text.trim().toLowerCase().split('@')[0];
  console.log(`Processing command: "${cleanCmd}" from chat: ${chatId}`);

  if (cleanCmd === '/stats' || cleanCmd === '/today' || cleanCmd === '/dges' || cleanCmd === '/დღეს') {
    const msg = await getTodayStatsMessage();
    return await sendTelegramMessage(msg, chatId);
  } else if (cleanCmd === '/month' || cleanCmd === '/tve' || cleanCmd === '/თვე') {
    const msg = await getMonthStatsMessage();
    return await sendTelegramMessage(msg, chatId);
  } else if (cleanCmd === '/start' || cleanCmd === '/help') {
    const helpMsg = `
🤖 <b>Fitness Food Bot — ხელმისაწვდომი ბრძანებები:</b>
━━━━━━━━━━━━━━━━━━━━━
📊 /stats — დღევანდელი გაყიდვების სტატისტიკა და პოზიციები
🏆 /month — მიმდინარე თვის გაყიდვები და TOP პროდუქტები
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
          { command: 'stats', description: '📊 დღევანდელი გაყიდვები (Статистика за сегодня)' },
          { command: 'month', description: '🏆 თვის გაყიდვები და ტოპ პროდუქტები (ТОП за месяц)' },
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
