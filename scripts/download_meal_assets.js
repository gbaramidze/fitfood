import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const publicDir = path.resolve(process.cwd(), 'public');
const mealsDir = path.join(publicDir, 'images', 'meals');
const bannersDir = path.join(publicDir, 'images', 'banners');
const reviewsDir = path.join(publicDir, 'images', 'reviews');

[mealsDir, bannersDir, reviewsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const downloads = [
  // GrowFood Real Meal Containers
  {
    url: 'https://cdn.growfood.pro/s1/images/menus/big_YplubhGIsFkQ4Gk5.png?fmt=webp&quality=90',
    dest: path.join(mealsDir, 'cream-cranberry.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/menus/big_8MnoAxfiAAnceYkZ.png?fmt=webp&quality=90',
    dest: path.join(mealsDir, 'chicken-ptitim.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/menus/big_s5jm77ataChfgsAU.png?fmt=webp&quality=90',
    dest: path.join(mealsDir, 'fish-rice.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/menus/big_BpvfUYnySyf3ElGW.png?fmt=webp&quality=90',
    dest: path.join(mealsDir, 'syrniki-strawberry.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/menus/big_8I4e7IHFXTlq0lxd.png?fmt=webp&quality=90',
    dest: path.join(mealsDir, 'cutlet-kasha.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/menus/big_pivc0ZlZNQQ7qYqY.png?fmt=webp&quality=90',
    dest: path.join(mealsDir, 'fish-cutlet-potato.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/menus/big_kIXCgI3u6JQATKdY.png?fmt=webp&quality=90',
    dest: path.join(mealsDir, 'curd-casserole.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/menus/big_pdnW79Wr2hwbaZcq.png?fmt=webp&quality=90',
    dest: path.join(mealsDir, 'beef-demiglace-puree.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/menus/big_ZEUJghLec6NxCxJ0.png?fmt=webp&quality=90',
    dest: path.join(mealsDir, 'chicken-cheese-buckwheat.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/menus/big_ClzmQAhxrWYxDaSN.png?fmt=webp&quality=90',
    dest: path.join(mealsDir, 'beetroot-salad.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/menus/big_SEJ8QUZ6DYxrMntO.png?fmt=webp&quality=90',
    dest: path.join(mealsDir, 'protein-pancakes.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/menus/big_6NK4oRkSRxyfHr8F.png?fmt=webp&quality=90',
    dest: path.join(mealsDir, 'orzo-shrimp.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/menus/big_oNJ7c1XGuxDSvFDf.png?fmt=webp&quality=90',
    dest: path.join(mealsDir, 'mousse-granola.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/menus/big_JN7kzWyJI1dtx7Nj.png?fmt=webp&quality=90',
    dest: path.join(mealsDir, 'bulgur-mushrooms.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/menus/big_jrEyrWegl0V5N2JK.png?fmt=webp&quality=90',
    dest: path.join(mealsDir, 'risotto-vegetables.webp')
  },
  // Level Kitchen Real Dishes
  {
    url: 'https://web-api-v2.int2.p-group.ru/api/bucket/upload/images/17791160092401a8110001c133b79b2d43f2b0ff87dee.webp',
    dest: path.join(mealsDir, 'chicken-roll-bulgur.webp')
  },
  {
    url: 'https://web-api-v2.int2.p-group.ru/api/bucket/upload/images/17482712817843ec78f378b0497d262a30a4cdab5ec7c.webp',
    dest: path.join(mealsDir, 'meatloaf-bbq.webp')
  },
  {
    url: 'https://web-api-v2.int2.p-group.ru/api/bucket/upload/images/1779116009548b46b5edc2f5212f6459cc15cde357f10.webp',
    dest: path.join(mealsDir, 'fish-cheese-risotto.webp')
  },
  {
    url: 'https://web-api-v2.int2.p-group.ru/api/bucket/upload/images/175883155909092b3283bfb12ffb670312785d220517a.webp',
    dest: path.join(mealsDir, 'pumpkin-bluecheese.webp')
  },
  // Banners & Reviews
  {
    url: 'https://web-api-v2.int2.p-group.ru/api/bucket/content/17848041623990926cb0bf7510e4326c7e50cf4dbfb72.webp',
    dest: path.join(bannersDir, 'hero-banner-1.webp')
  },
  {
    url: 'https://web-api-v2.int2.p-group.ru/api/bucket/content/1782906771340cf6f24794e1885490f8915d22dbc4fbd.webp',
    dest: path.join(bannersDir, 'hero-banner-2.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/vcp/sILmR32512iP0Lrb.webp?fmt=webp&quality=95',
    dest: path.join(reviewsDir, 'anna-before.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/vcp/ZXHlyjuk0NLaSR8O.webp?fmt=webp&quality=95',
    dest: path.join(reviewsDir, 'anna-after.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/vcp/18JUCHKUFqCM5RcU.webp?fmt=webp&quality=95',
    dest: path.join(reviewsDir, 'alex-before.webp')
  },
  {
    url: 'https://cdn.growfood.pro/s1/images/vcp/QcqOHt0VIXPMKPdi.webp?fmt=webp&quality=95',
    dest: path.join(reviewsDir, 'alex-after.webp')
  }
];

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`Downloaded: ${path.basename(dest)}`);
          resolve(true);
        });
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log(`Starting download of ${downloads.length} high-res assets...`);
  for (const item of downloads) {
    try {
      await downloadFile(item.url, item.dest);
    } catch (err) {
      console.warn(`Warning downloading ${item.url}:`, err.message);
    }
  }
  console.log('Finished downloading meal assets!');
}

run();
