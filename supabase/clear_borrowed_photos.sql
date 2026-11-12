-- The 14 ration dishes from the Excel base got stand-in photos of OTHER dishes (/images/meals/...).
-- This clears them, so the site shows a neutral plate until the real photo is uploaded in the admin panel.
-- Only rows that still point at those stand-ins are touched; photos uploaded in the admin panel are kept.
UPDATE partner_products
SET image = ''
WHERE id LIKE 'dish-xl-%'
  AND image LIKE '/images/meals/%';
