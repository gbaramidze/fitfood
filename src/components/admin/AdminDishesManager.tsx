'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useAdmin } from '@/context/AdminContext';
import { AdminDish, DishCategory } from '@/types/admin';
import { MealType, DayOfWeek } from '@/types';
import { LazyProductImage } from '@/components/partner/LazyProductImage';
import { productImageService } from '@/services/productImageService';
import { supabaseStorageService, compressImageToBlob } from '@/services/supabaseStorageService';

const PRESET_IMAGES = [
  { url: '/images/meals/syrniki-strawberry.webp', label: 'სირნიკები მარწყვით' },
  { url: '/images/meals/chicken-ptitim.webp', label: 'ქათამი პტიტიმით' },
  { url: '/images/meals/beef-demiglace-puree.webp', label: 'საქონლის ხორცი დემიგლასით' },
  { url: '/images/meals/fish-cheese-risotto.webp', label: 'თევზი რიზოტოთი' },
  { url: '/images/meals/protein-pancakes.webp', label: 'პროტეინის ბლინები' },
  { url: '/images/meals/curd-casserole.webp', label: 'ხაჭოს ზაპეკანკა' },
  { url: '/images/meals/meatloaf-bbq.webp', label: 'მითლოფი BBQ' },
  { url: '/images/meals/cutlet-kasha.webp', label: 'კოტლეტი ფაფით' },
  { url: '/images/meals/fish-cutlet-potato.webp', label: 'თევზის კოტლეტი' },
  { url: '/images/meals/fish-rice.webp', label: 'ორაგული ბრინჯით' },
  { url: '/images/meals/chicken-roll-bulgur.webp', label: 'ქათმის რულეტი ბულგურით' },
  { url: '/images/meals/chicken-cheese-buckwheat.webp', label: 'ფილე წიწიბურით' },
  { url: '/images/meals/orzo-shrimp.webp', label: 'ორზო კრევეტებით' },
  { url: '/images/meals/risotto-vegetables.webp', label: 'რიზოტო ბოსტნეულით' },
  { url: '/images/meals/pumpkin-bluecheese.webp', label: 'გოგრა ბლუჩიზით' },
  { url: '/images/meals/bulgur-mushrooms.webp', label: 'ბულგური სოკოთი' },
  { url: '/images/meals/beetroot-salad.webp', label: 'ჭარხლის სალათი' },
  { url: '/images/meals/cream-cranberry.webp', label: 'ხაჭოს კრემი მოცვით' },
  { url: '/images/meals/mousse-granola.webp', label: 'მუსი გრანოლით' },
];

const DAYS_MAP: { id: DayOfWeek; label: string }[] = [
  { id: 'mon', label: 'ორშაბათი' },
  { id: 'tue', label: 'სამშაბათი' },
  { id: 'wed', label: 'ოთხშაბათი' },
  { id: 'thu', label: 'ხუთშაბათი' },
  { id: 'fri', label: 'პარასკევი' },
  { id: 'sat', label: 'შაბათი' },
  { id: 'sun', label: 'კვირა' },
];

const CATEGORY_OPTIONS: { id: DishCategory; label: string; icon: string }[] = [
  { id: 'poultry', label: 'ქათამი / ფრინველი', icon: '🍗' },
  { id: 'meat', label: 'საქონლის ხორცი', icon: '🥩' },
  { id: 'fish', label: 'თევზი & ზღვის პროდუქტები', icon: '🐟' },
  { id: 'breakfast', label: 'საუზმე & ხაჭო', icon: '🥞' },
  { id: 'salad', label: 'სალათი & ბოსტნეული', icon: '🥗' },
  { id: 'soup', label: 'წვნიანი & სუპი', icon: '🍲' },
  { id: 'dessert', label: 'ჯანსაღი დესერტი', icon: '🧁' },
  { id: 'drinks', label: 'სასმელები & სმუზი', icon: '🥤' },
];

const ALLERGEN_OPTIONS = [
  'გლუტენი', 'ლაქტოზა', 'კვერცხი', 'თხილი/არაქისი', 'თევზი', 'ზღვის პროდუქტები', 'სოიო', 'სეზამი', 'შაქრის გარეშე'
];

const STORAGE_SETUP_SQL = `-- 1. FitFood Product Images Bucket Setup
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Product Images" ON storage.objects;

-- 3. Enable public read and write policies
CREATE POLICY "Public Read Product Images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Public Upload Product Images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Public Update Product Images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images');

CREATE POLICY "Public Delete Product Images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images');`;

export const AdminDishesManager: React.FC = () => {
  const { dishes, addDish, updateDish, deleteDish, searchQuery, refreshDishes, isLoadingDishes } = useAdmin();

  const [channelFilter, setChannelFilter] = useState<'all' | 'site' | 'pos'>('all');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [editingDish, setEditingDish] = useState<AdminDish | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Storage Modal & State
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{ exists: boolean; canUpload: boolean; checking: boolean; error?: string }>({
    exists: false,
    canUpload: false,
    checking: false,
  });
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<{ current: number; total: number; dishName: string; status: string } | null>(null);
  const [migrationResult, setMigrationResult] = useState<{ total: number; migrated: number; skipped: number; errors: string[] } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // JSON Import Modal State
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInputText, setJsonInputText] = useState('');
  const [jsonParseError, setJsonParseError] = useState('');

  // Photo Mode State
  const [photoTab, setPhotoTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadNotice, setImageUploadNotice] = useState<{ type: 'success' | 'warn' | 'error'; text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Language Tab State for Modal
  const [langTab, setLangTab] = useState<'ka' | 'ru' | 'en'>('ka');

  // Form Multilingual State
  const [formNameKa, setFormNameKa] = useState('');
  const [formNameRu, setFormNameRu] = useState('');
  const [formNameEn, setFormNameEn] = useState('');

  const [formDescKa, setFormDescKa] = useState('');
  const [formDescRu, setFormDescRu] = useState('');
  const [formDescEn, setFormDescEn] = useState('');

  const [formIngredientsKa, setFormIngredientsKa] = useState('');
  const [formIngredientsRu, setFormIngredientsRu] = useState('');
  const [formIngredientsEn, setFormIngredientsEn] = useState('');

  const [formCategory, setFormCategory] = useState<DishCategory>('poultry');
  const [formMealType, setFormMealType] = useState<MealType>('lunch');
  const [formDay, setFormDay] = useState<DayOfWeek>('mon');
  const [formCalories, setFormCalories] = useState(450);
  const [formProtein, setFormProtein] = useState(38);
  const [formFat, setFormFat] = useState(12);
  const [formCarbs, setFormCarbs] = useState(45);
  const [formWeight, setFormWeight] = useState(320);
  const [formCostPrice, setFormCostPrice] = useState(6.5);
  const [formRetailPrice, setFormRetailPrice] = useState(15.0);
  const [formImage, setFormImage] = useState(PRESET_IMAGES[1].url);
  const [formCustomUrl, setFormCustomUrl] = useState('');
  const [formChannels, setFormChannels] = useState<('site' | 'pos')[]>(['site', 'pos']);
  const [formAllergens, setFormAllergens] = useState<string[]>([]);
  const [formCookingMethod, setFormCookingMethod] = useState<'sous_vide' | 'baked' | 'steamed' | 'grilled' | 'raw'>('sous_vide');

  const [lastAddedDishId, setLastAddedDishId] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Check Storage Status on mount & when opening storage modal
  const checkStorage = async () => {
    setStorageStatus(prev => ({ ...prev, checking: true }));
    const res = await supabaseStorageService.checkBucketStatus();
    setStorageStatus({
      exists: res.exists,
      canUpload: res.canUpload,
      checking: false,
      error: res.error,
    });
  };

  useEffect(() => {
    checkStorage();
  }, []);

  // Compute image storage statistics
  const imageStats = useMemo(() => {
    let storageUrls = 0;
    let base64Blobs = 0;
    let presets = 0;
    let externalUrls = 0;

    dishes.forEach(d => {
      const img = d.image || '';
      if (img.includes('supabase.co/storage')) {
        storageUrls++;
      } else if (img.startsWith('data:image/')) {
        base64Blobs++;
      } else if (img.startsWith('/images/')) {
        presets++;
      } else if (img.startsWith('http')) {
        externalUrls++;
      }
    });

    return { storageUrls, base64Blobs, presets, externalUrls, total: dishes.length };
  }, [dishes]);

  // Handle Image File Upload directly to Supabase Storage
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('გთხოვთ აირჩიოთ სურათის ფაილი (JPG, PNG, WEBP)');
      return;
    }

    setIsUploadingImage(true);
    setImageUploadNotice(null);

    try {
      // 1. Compress image to high-efficiency WebP
      const { blob } = await compressImageToBlob(file, 1200, 1200, 0.85);

      // 2. Try upload to Supabase Storage
      const uploadRes = await supabaseStorageService.uploadProductImage(blob, 'dish');

      if (uploadRes && uploadRes.publicUrl) {
        setFormImage(uploadRes.publicUrl);
        setFormCustomUrl('');
        setUploadedFileName(file.name);
        setImageUploadNotice({
          type: 'success',
          text: `✓ სურათი წარმატებით აიტვირთა Supabase Storage-ში (${(blob.size / 1024).toFixed(0)} KB WebP)`
        });
      } else {
        // Fallback: Read as base64 data url if bucket is not yet active
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const dataUrl = e.target.result as string;
            setFormImage(dataUrl);
            setFormCustomUrl('');
            setUploadedFileName(file.name);
            setImageUploadNotice({
              type: 'warn',
              text: '⚠️ შენახულია დროებით. სრული Storage-სთვის შექმენით "product-images" bucket Supabase-ში.'
            });
          }
        };
        reader.readAsDataURL(blob);
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setImageUploadNotice({
        type: 'error',
        text: `ატვირთვის შეცდომა: ${err.message || 'ვერ მოხერხდა'}`
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Run Base64 to Storage migration
  const handleRunMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    setMigrationProgress({ current: 0, total: imageStats.base64Blobs, dishName: 'დაწყება...', status: 'starting' });

    try {
      const result = await supabaseStorageService.migrateAllBase64ImagesToStorage((p) => {
        setMigrationProgress(p);
      });

      setMigrationResult(result);
      await refreshDishes();
      await checkStorage();
    } catch (e: any) {
      setMigrationResult({ total: 0, migrated: 0, skipped: 0, errors: [e.message] });
    } finally {
      setIsMigrating(false);
    }
  };

  const parseIngredientsText = (text: string): string[] => {
    return text
      .split('\n')
      .map(line => line.replace(/^[\*\-\•]\s*/, '').trim())
      .filter(Boolean);
  };

  const SAMPLE_DISH_JSON = JSON.stringify({
    name: {
      ru: "Куриное филе по-мексикански",
      ka: "ქათმის ფილე მექსიკურად",
      en: "Mexican Style Chicken Breast"
    },
    description: {
      ru: "Сочное филе су-вид с кукурузой и сладким перцем",
      ka: "წვნიანი ფილე ბოსტნეულით და სუ-ვიდ ტექნოლოგიით",
      en: "Tender sous-vide chicken with peppers and herbs"
    },
    category: "poultry",
    mealType: "lunch",
    day: "mon",
    cookingMethod: "sous_vide",
    macros: {
      calories: 450,
      protein: 38,
      fat: 12,
      carbs: 45,
      weightGrams: 320
    },
    costPrice: 6.5,
    retailPrice: 15.0,
    image: "/images/meals/chicken-ptitim.webp",
    ingredients: {
      ru: [
        "Помидоры в собственном соку — 120 г",
        "Болгарский красный перец — 40 г",
        "Кукуруза — 30 г",
        "Красный лук — 15 г",
        "Петрушка — 3 г",
        "Соль — 1 г",
        "Чёрный перец — 0,5 г",
        "Орегано — 0,5 г"
      ],
      ka: [
        "პომიდორი საკუთარ წვენში — 120 გ",
        "ბულგარული წითელი წიწაკა — 40 გ",
        "სიმინდი — 30 გ",
        "წითელი ხახვი — 15 გ",
        "ოხრახუში — 3 გ",
        "მარილი — 1 გ",
        "შავი პილპილი — 0.5 გ",
        "ორეგანო — 0.5 გ"
      ],
      en: [
        "Peeled canned tomatoes — 120 g",
        "Red bell pepper — 40 g",
        "Sweet corn — 30 g",
        "Red onion — 15 g",
        "Fresh parsley — 3 g",
        "Salt — 1 g",
        "Black pepper — 0.5 g",
        "Oregano — 0.5 g"
      ]
    },
    allergens: ["გლუტენი"],
    targetChannels: ["site", "pos"]
  }, null, 2);

  // Apply JSON to populate the Form fields automatically
  const applyJsonToForm = (jsonString: string) => {
    try {
      setJsonParseError('');

      const cleanJson = jsonString
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

      if (!cleanJson) {
        setJsonParseError('გთხოვთ ჩასვათ JSON ტექსტი');
        return;
      }

      const parsed = JSON.parse(cleanJson);
      const item = Array.isArray(parsed) ? parsed[0] : parsed;

      if (!item || typeof item !== 'object') {
        throw new Error('არასწორი JSON ობიექტი');
      }

      // Names
      if (item.name && typeof item.name === 'object') {
        if (item.name.ka) setFormNameKa(item.name.ka);
        if (item.name.ru) setFormNameRu(item.name.ru);
        if (item.name.en) setFormNameEn(item.name.en);
      } else if (typeof item.name === 'string') {
        setFormNameKa(item.name);
        setFormNameRu(item.name);
      }
      if (item.title) {
        if (typeof item.title === 'object') {
          if (item.title.ka) setFormNameKa(item.title.ka);
          if (item.title.ru) setFormNameRu(item.title.ru);
          if (item.title.en) setFormNameEn(item.title.en);
        } else {
          setFormNameRu(String(item.title));
        }
      }
      if (item.name_ru || item.nameRu) setFormNameRu(item.name_ru || item.nameRu);
      if (item.name_ka || item.nameKa) setFormNameKa(item.name_ka || item.nameKa);
      if (item.name_en || item.nameEn) setFormNameEn(item.name_en || item.nameEn);

      // Descriptions
      if (item.description && typeof item.description === 'object') {
        if (item.description.ka) setFormDescKa(item.description.ka);
        if (item.description.ru) setFormDescRu(item.description.ru);
        if (item.description.en) setFormDescEn(item.description.en);
      } else if (typeof item.description === 'string') {
        setFormDescKa(item.description);
        setFormDescRu(item.description);
      }
      if (item.desc_ru || item.descRu) setFormDescRu(item.desc_ru || item.descRu);
      if (item.desc_ka || item.descKa) setFormDescKa(item.desc_ka || item.descKa);
      if (item.desc_en || item.descEn) setFormDescEn(item.desc_en || item.descEn);

      // Macros / KBJU
      if (item.macros && typeof item.macros === 'object') {
        if (item.macros.calories !== undefined) setFormCalories(Number(item.macros.calories));
        if (item.macros.protein !== undefined) setFormProtein(Number(item.macros.protein));
        if (item.macros.fat !== undefined) setFormFat(Number(item.macros.fat));
        if (item.macros.carbs !== undefined) setFormCarbs(Number(item.macros.carbs));
        if (item.macros.weightGrams !== undefined) setFormWeight(Number(item.macros.weightGrams));
        else if (item.macros.weight !== undefined) setFormWeight(Number(item.macros.weight));
      }
      if (item.calories !== undefined) setFormCalories(Number(item.calories));
      if (item.kcal !== undefined) setFormCalories(Number(item.kcal));
      if (item.protein !== undefined) setFormProtein(Number(item.protein));
      if (item.fat !== undefined) setFormFat(Number(item.fat));
      if (item.carbs !== undefined) setFormCarbs(Number(item.carbs));
      if (item.weight !== undefined) setFormWeight(Number(item.weight));
      if (item.weightGrams !== undefined) setFormWeight(Number(item.weightGrams));

      // Financials
      if (item.costPrice !== undefined) setFormCostPrice(Number(item.costPrice));
      else if (item.cost !== undefined) setFormCostPrice(Number(item.cost));
      else if (item.foodCost !== undefined) setFormCostPrice(Number(item.foodCost));

      if (item.retailPrice !== undefined) setFormRetailPrice(Number(item.retailPrice));
      else if (item.price !== undefined) setFormRetailPrice(Number(item.price));

      // Category, MealType, Day, CookingMethod
      if (item.category) setFormCategory(item.category);
      if (item.mealType) setFormMealType(item.mealType);
      if (item.day) setFormDay(item.day);
      if (item.cookingMethod) setFormCookingMethod(item.cookingMethod);

      // Image
      if (item.image) {
        setFormImage(item.image);
        setFormCustomUrl(item.image.startsWith('http') ? item.image : '');
        setPhotoTab(item.image.startsWith('http') ? 'url' : 'presets');
      }

      // Allergens
      if (Array.isArray(item.allergens)) setFormAllergens(item.allergens);

      // Channels
      if (Array.isArray(item.targetChannels)) setFormChannels(item.targetChannels);

      // Ingredients
      if (item.ingredients && typeof item.ingredients === 'object') {
        if (Array.isArray(item.ingredients.ka)) setFormIngredientsKa(item.ingredients.ka.join('\n'));
        else if (typeof item.ingredients.ka === 'string') setFormIngredientsKa(item.ingredients.ka);

        if (Array.isArray(item.ingredients.ru)) setFormIngredientsRu(item.ingredients.ru.join('\n'));
        else if (typeof item.ingredients.ru === 'string') setFormIngredientsRu(item.ingredients.ru);

        if (Array.isArray(item.ingredients.en)) setFormIngredientsEn(item.ingredients.en.join('\n'));
        else if (typeof item.ingredients.en === 'string') setFormIngredientsEn(item.ingredients.en);
      } else if (Array.isArray(item.ingredients)) {
        setFormIngredientsRu(item.ingredients.join('\n'));
        setFormIngredientsKa(item.ingredients.join('\n'));
      }

      setIsJsonModalOpen(false);
      setIsModalOpen(true);
    } catch (err: any) {
      setJsonParseError(`შეცდომა: ${err.message || 'შეამოწმეთ JSON სინტაქსი'}`);
    }
  };

  const filteredDishes = useMemo(() => {
    return dishes.filter(d => {
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const ka = (d.name?.ka || '').toLowerCase();
        const ru = (d.name?.ru || '').toLowerCase();
        const en = (d.name?.en || '').toLowerCase();
        if (!ka.includes(q) && !ru.includes(q) && !en.includes(q)) return false;
      }
      if (channelFilter !== 'all') {
        const channels = Array.isArray(d.targetChannels) ? d.targetChannels : ['site', 'pos'];
        if (!channels.includes(channelFilter)) return false;
      }
      if (dayFilter !== 'all') {
        const day = d.day || 'mon';
        if (day !== dayFilter) return false;
      }
      return true;
    });
  }, [dishes, searchQuery, channelFilter, dayFilter]);

  const openCreateModal = () => {
    setEditingDish(null);
    setLangTab('ka');
    setPhotoTab('upload');
    setUploadedFileName('');
    setImageUploadNotice(null);
    setFormNameKa('');
    setFormNameRu('');
    setFormNameEn('');
    setFormDescKa('');
    setFormDescRu('');
    setFormDescEn('');
    setFormIngredientsKa('პომიდორი საკუთარ წვენში — 120 გ\nბულგარული წითელი წიწაკა — 40 გ\nსიმინდი — 30 გ\nწითელი ხახვი — 15 გ\nოხრახუში — 3 გ\nმარილი — 1 გ\nშავი პილპილი — 0.5 გ\nორეგანო — 0.5 გ');
    setFormIngredientsRu('Помидоры в собственном соку — 120 г\nБолгарский красный перец — 40 г\nКукуруза — 30 г\nКрасный лук — 15 г\nПетрушка — 3 г\nСоль — 1 г\nЧёрный перец — 0,5 г\nОрегано — 0,5 г');
    setFormIngredientsEn('Peeled canned tomatoes — 120 g\nRed bell pepper — 40 g\nSweet corn — 30 g\nRed onion — 15 g\nFresh parsley — 3 g\nSalt — 1 g\nBlack pepper — 0.5 g\nOregano — 0.5 g');
    setFormCategory('poultry');
    setFormMealType('lunch');
    setFormDay('mon');
    setFormCalories(450);
    setFormProtein(38);
    setFormFat(12);
    setFormCarbs(45);
    setFormWeight(320);
    setFormCostPrice(6.5);
    setFormRetailPrice(15.0);
    setFormImage(PRESET_IMAGES[1].url);
    setFormCustomUrl('');
    setFormChannels(['site', 'pos']);
    setFormAllergens([]);
    setFormCookingMethod('sous_vide');
    setIsModalOpen(true);
  };

  const openEditModal = (dish: AdminDish) => {
    setEditingDish(dish);
    setLangTab('ka');
    setUploadedFileName('');
    setImageUploadNotice(null);
    setFormNameKa(dish.name.ka || '');
    setFormNameRu(dish.name.ru || dish.name.ka || '');
    setFormNameEn(dish.name.en || dish.name.ka || '');
    setFormDescKa(dish.description?.ka || '');
    setFormDescRu(dish.description?.ru || dish.description?.ka || '');
    setFormDescEn(dish.description?.en || dish.description?.ka || '');
    
    // Fill multiline ingredients for each language
    setFormIngredientsKa(Array.isArray(dish.ingredients?.ka) ? dish.ingredients.ka.join('\n') : '');
    setFormIngredientsRu(Array.isArray(dish.ingredients?.ru) ? dish.ingredients.ru.join('\n') : '');
    setFormIngredientsEn(Array.isArray(dish.ingredients?.en) ? dish.ingredients.en.join('\n') : '');

    setFormCategory(dish.category || 'poultry');
    setFormMealType(dish.mealType || 'lunch');
    setFormDay(dish.day || 'mon');
    setFormCalories(dish.macros?.calories || 450);
    setFormProtein(dish.macros?.protein || 35);
    setFormFat(dish.macros?.fat || 12);
    setFormCarbs(dish.macros?.carbs || 45);
    setFormWeight(dish.macros?.weightGrams || 320);
    setFormCostPrice(dish.costPrice || 6.5);
    setFormRetailPrice(dish.retailPrice || 15.0);
    
    const existingImg = dish.image || productImageService.getCachedImage(dish.id) || '/images/meals/chicken-ptitim.webp';
    setFormImage(existingImg);
    setFormCustomUrl(existingImg.startsWith('http') ? existingImg : '');
    setPhotoTab(existingImg.startsWith('data:') ? 'upload' : existingImg.startsWith('http') ? 'url' : 'presets');
    
    if (!dish.image || !dish.image.startsWith('http')) {
      productImageService.fetchProductImage(dish.id).then(img => {
        if (img) {
          setFormImage(img);
          setFormCustomUrl(img.startsWith('http') ? img : '');
          setPhotoTab(img.startsWith('data:') ? 'upload' : img.startsWith('http') ? 'url' : 'presets');
        }
      });
    }

    setFormChannels(Array.isArray(dish.targetChannels) ? dish.targetChannels : ['site', 'pos']);
    setFormAllergens(dish.allergens || []);
    setFormCookingMethod(dish.cookingMethod || 'sous_vide');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameKa.trim() && !formNameRu.trim()) {
      alert('გთხოვთ მიუთითოთ კერძის სახელწოდება');
      return;
    }

    setIsSaving(true);

    try {
      const finalImage = formCustomUrl.trim() || formImage;
      const nameKa = formNameKa.trim() || formNameRu.trim();
      const nameRu = formNameRu.trim() || nameKa;
      const nameEn = formNameEn.trim() || nameKa;

      const descKa = formDescKa.trim() || 'საბალანსირებული ჯანსაღი კერძი.';
      const descRu = formDescRu.trim() || descKa;
      const descEn = formDescEn.trim() || descKa;

      const ingKa = parseIngredientsText(formIngredientsKa);
      const ingRu = parseIngredientsText(formIngredientsRu).length > 0 ? parseIngredientsText(formIngredientsRu) : ingKa;
      const ingEn = parseIngredientsText(formIngredientsEn).length > 0 ? parseIngredientsText(formIngredientsEn) : ingKa;

      const payload = {
        slug: (formNameEn || formNameKa).toLowerCase().replace(/[^a-z0-9]/gi, '-').slice(0, 30) || 'dish',
        name: { ka: nameKa, ru: nameRu, en: nameEn },
        description: { ka: descKa, ru: descRu, en: descEn },
        category: formCategory,
        mealType: formMealType,
        day: formDay,
        macros: {
          calories: Number(formCalories),
          protein: Number(formProtein),
          fat: Number(formFat),
          carbs: Number(formCarbs),
          weightGrams: Number(formWeight),
        },
        costPrice: Number(formCostPrice),
        retailPrice: Number(formRetailPrice),
        targetChannels: formChannels,
        image: finalImage,
        tags: ['#FitFood'],
        allergens: formAllergens,
        cookingMethod: formCookingMethod,
        ingredients: {
          ka: ingKa,
          ru: ingRu,
          en: ingEn,
        },
        isGeorgianFit: true,
        inStockCount: editingDish ? editingDish.inStockCount : 0,
      };

      let targetId = '';
      if (editingDish) {
        await updateDish(editingDish.id, payload);
        targetId = editingDish.id;
        productImageService.invalidateImage(editingDish.id);
        setSaveSuccessMsg(`✓ კერძი «${nameKa}» წარმატებით განახლდა!`);
      } else {
        const created = await addDish(payload);
        targetId = created.id;
        setSaveSuccessMsg(`✓ ახალი კერძი «${nameKa}» წარმატებით დაემატა ბაზაში!`);
      }

      // Auto-adjust filters so the user ALWAYS sees their dish immediately
      setChannelFilter('all');
      setDayFilter('all');
      setLastAddedDishId(targetId);
      setIsModalOpen(false);

      // Auto-dismiss success notification after 7s
      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 7000);
    } catch (err: any) {
      alert(`შენახვის შეცდომა: ${err.message || 'დაფიქსირდა შეცდომა'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleChannel = (ch: 'site' | 'pos') => {
    setFormChannels(prev => {
      if (prev.includes(ch)) {
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== ch);
      } else {
        return [...prev, ch];
      }
    });
  };

  const toggleAllergen = (alg: string) => {
    setFormAllergens(prev => 
      prev.includes(alg) ? prev.filter(a => a !== alg) : [...prev, alg]
    );
  };

  return (
    <div className="admin-view-container">
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">კერძების ბაზა & კვირის მენიუ</h1>
          <p className="admin-page-subtitle">
            კერძების მართვა საიტის რაციონებისთვის (დღეების მიხედვით), დარბაზის POS ვიტრინისთვის და Supabase Storage ფოტოებისთვის
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              checkStorage();
              setIsStorageModalOpen(true);
            }}
            className="admin-btn-secondary"
            style={{
              borderColor: imageStats.base64Blobs > 0 ? '#F59E0B' : '#10B981',
              color: imageStats.base64Blobs > 0 ? '#FBBF24' : '#34D399',
            }}
            title="Supabase Storage სტატუსი & BLOB ფოტოების მიგრაცია"
          >
            🗄️ Storage & მიგრაცია {imageStats.base64Blobs > 0 ? `(${imageStats.base64Blobs} BLOB)` : '✓'}
          </button>
          <button
            onClick={() => refreshDishes()}
            disabled={isLoadingDishes}
            className="admin-btn-secondary"
            title="მონაცემების განახლება Supabase ბაზიდან"
          >
            {isLoadingDishes ? '⏳ იტვირთება...' : '🔄 განახლება'}
          </button>
          <button 
            onClick={() => {
              setJsonInputText('');
              setJsonParseError('');
              setIsJsonModalOpen(true);
            }} 
            className="admin-btn-secondary"
          >
            ⚡ JSON იმპორტი
          </button>
          <button onClick={openCreateModal} className="admin-btn-primary">
            + ახალი კერძის დამატება
          </button>
        </div>
      </div>

      {/* Supabase Storage Notice Banner if there are unmigrated BLOBs */}
      {imageStats.base64Blobs > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(180, 83, 9, 0.25))',
          border: '1px solid #F59E0B',
          borderRadius: '10px',
          padding: '12px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#FDE68A',
          fontSize: '13.5px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <div>
              <b>ბაზაში ნაპოვნია {imageStats.base64Blobs} მძიმე Base64 ფოტო (~{imageStats.base64Blobs * 3.5} MB).</b>
              <span style={{ opacity: 0.85, marginLeft: '6px' }}>
                გადაიტანეთ ისინი Supabase Storage-ში SQL ბაზის სრული განტვირთვისა და მყისიერი ჩატვირთვისთვის.
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              checkStorage();
              setIsStorageModalOpen(true);
            }}
            style={{
              background: '#F59E0B',
              color: '#451A03',
              fontWeight: 800,
              fontSize: '12px',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            მიგრაციის გაშვება →
          </button>
        </div>
      )}

      {/* Success notification banner */}
      {saveSuccessMsg && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(6, 78, 59, 0.28))',
          border: '1px solid #10B981',
          borderRadius: '10px',
          padding: '12px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#34D399',
          fontWeight: 600,
          fontSize: '14px',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🎉</span>
            <span>{saveSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setSaveSuccessMsg(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Filter Bars */}
      <div className="admin-filters-bar">
        {/* Channel Filter */}
        <div className="admin-filter-group">
          <span className="filter-group-label">არხი:</span>
          <div className="admin-toggle-buttons">
            <button
              onClick={() => setChannelFilter('all')}
              className={`filter-toggle-btn ${channelFilter === 'all' ? 'active' : ''}`}
            >
              ყველა ({dishes.length})
            </button>
            <button
              onClick={() => setChannelFilter('site')}
              className={`filter-toggle-btn ${channelFilter === 'site' ? 'active' : ''}`}
            >
              🌐 საიტის რაციონები ({dishes.filter(d => (d.targetChannels || ['site', 'pos']).includes('site')).length})
            </button>
            <button
              onClick={() => setChannelFilter('pos')}
              className={`filter-toggle-btn ${channelFilter === 'pos' ? 'active' : ''}`}
            >
              🏢 წერტილების ვიტრინა ({dishes.filter(d => (d.targetChannels || ['site', 'pos']).includes('pos')).length})
            </button>
          </div>
        </div>

        {/* Day of Week Filter */}
        <div className="admin-filter-group">
          <span className="filter-group-label">კვირის დღე:</span>
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="admin-select-input"
          >
            <option value="all">ყველა დღე</option>
            {DAYS_MAP.map(d => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters helper */}
        {(channelFilter !== 'all' || dayFilter !== 'all' || searchQuery.trim()) && (
          <button
            onClick={() => {
              setChannelFilter('all');
              setDayFilter('all');
            }}
            style={{
              background: '#1F2937',
              border: '1px solid #374151',
              color: '#9CA3AF',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              marginLeft: 'auto',
            }}
          >
            🔄 ფილტრების მოხსნა
          </button>
        )}
      </div>

      {/* Dishes Status Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 4px 14px 4px',
        fontSize: '12px',
        color: '#9CA3AF',
      }}>
        <div>
          ბაზაში სულ: <b style={{ color: '#F3F4F6' }}>{dishes.length} კერძი</b>
          {filteredDishes.length !== dishes.length && (
            <span> (ნაჩვენებია ფილტრით: <b style={{ color: '#10B981' }}>{filteredDishes.length}</b>)</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '14px' }}>
          <span>🗄️ Storage ფოტოები: <b style={{ color: '#34D399' }}>{imageStats.storageUrls}</b></span>
          {imageStats.base64Blobs > 0 && (
            <span>⚠️ BLOB ფოტოები: <b style={{ color: '#FBBF24' }}>{imageStats.base64Blobs}</b></span>
          )}
          <span>🖼️ გალერეა: <b style={{ color: '#9CA3AF' }}>{imageStats.presets}</b></span>
        </div>
      </div>

      {/* Empty State */}
      {filteredDishes.length === 0 ? (
        <div style={{
          background: '#111827',
          border: '1px dashed #374151',
          borderRadius: '12px',
          padding: '48px 24px',
          textAlign: 'center',
          color: '#9CA3AF',
          margin: '16px 0',
        }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#E5E7EB', marginBottom: '6px' }}>
            არჩეული ფილტრით კერძი ვერ მოიძებნა
          </div>
          <p style={{ fontSize: '13px', color: '#6B7280', maxWidth: '400px', margin: '0 auto 16px' }}>
            შეამოწმეთ კვირის დღის, არხის ან ძებნის ფილტრი.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setChannelFilter('all');
                setDayFilter('all');
              }}
              className="admin-btn-secondary"
            >
              🔄 ყველა კერძის ჩვენება ({dishes.length})
            </button>
            <button onClick={openCreateModal} className="admin-btn-primary">
              + ახალი კერძის დამატება
            </button>
          </div>
        </div>
      ) : (
        /* Dishes Grid */
        <div className="admin-dishes-grid">
          {filteredDishes.map((dish) => {
            const dayName = DAYS_MAP.find(d => d.id === dish.day)?.label || 'ორშაბათი';
            const margin = (dish.retailPrice || 0) - (dish.costPrice || 0);
            const isJustAdded = dish.id === lastAddedDishId;
            const isStorageImage = dish.image?.includes('supabase.co/storage');

            return (
              <div 
                key={dish.id} 
                className="admin-dish-card"
                style={isJustAdded ? {
                  borderColor: '#10B981',
                  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.4), 0 8px 24px rgba(16, 185, 129, 0.2)',
                  transition: 'all 0.3s ease',
                } : undefined}
              >
                <div className="admin-dish-image-wrapper">
                  <LazyProductImage
                    productId={dish.id}
                    src={dish.image}
                    alt={dish.name?.ka || dish.name?.ru || 'კერძი'}
                    sizes="(max-width: 768px) 100vw, 350px"
                  />
                  <div className="admin-dish-badges-overlay">
                    {isJustAdded && (
                      <span style={{
                        background: '#10B981',
                        color: '#064E3B',
                        fontWeight: 800,
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}>
                        ✨ ახალი
                      </span>
                    )}
                    {isStorageImage && (
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.9)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }} title="ფოტო ინახება Supabase Storage-ში">
                        ☁️ Storage
                      </span>
                    )}
                    {(!dish.targetChannels || dish.targetChannels.includes('site')) && <span className="channel-badge badge-site">🌐 საიტი</span>}
                    {(!dish.targetChannels || dish.targetChannels.includes('pos')) && <span className="channel-badge badge-pos">🏢 დარბაზი</span>}
                  </div>
                  <div className="admin-dish-cooking-badge">
                    📅 {dayName}
                  </div>
                </div>

                <div className="admin-dish-body">
                  <div className="admin-dish-header-row">
                    <span className="dish-category-label">
                      {dish.mealType === 'breakfast' ? 'საუზმე' :
                       dish.mealType === 'lunch' ? 'სადილი' :
                       dish.mealType === 'snack' ? 'სამხარი' :
                       dish.mealType === 'dinner' ? 'ვახშამი' : 'დესერტი'}
                    </span>
                    <span className="dish-weight">{dish.macros?.weightGrams || 300} გრამი</span>
                  </div>

                  <h3 className="admin-dish-title">{dish.name?.ka || dish.name?.ru || dish.name?.en || 'კერძი'}</h3>

                  {/* KBJU Strip */}
                  <div className="admin-kbju-strip">
                    <div className="kbju-box cal">
                      <span className="kbju-num">{dish.macros?.calories || 0}</span>
                      <span className="kbju-lbl">კკალ</span>
                    </div>
                    <div className="kbju-box p">
                      <span className="kbju-num">{dish.macros?.protein || 0}გ</span>
                      <span className="kbju-lbl">ცილა</span>
                    </div>
                    <div className="kbju-box f">
                      <span className="kbju-num">{dish.macros?.fat || 0}გ</span>
                      <span className="kbju-lbl">ცხიმი</span>
                    </div>
                    <div className="kbju-box c">
                      <span className="kbju-num">{dish.macros?.carbs || 0}გ</span>
                      <span className="kbju-lbl">ნახშ</span>
                    </div>
                  </div>

                  {/* Price and Margin */}
                  <div className="admin-dish-finance-row">
                    <div className="price-item">
                      <span className="price-label">თვითღირებულება:</span>
                      <span className="price-cost">{(dish.costPrice || 0).toFixed(1)} ₾</span>
                    </div>
                    <div className="price-item">
                      <span className="price-label">გასაყიდი:</span>
                      <span className="price-retail">{(dish.retailPrice || 0).toFixed(1)} ₾</span>
                    </div>
                    <div className="margin-item">
                      <span className="margin-pill">+{margin.toFixed(1)} ₾</span>
                    </div>
                  </div>

                  {/* Ingredients Recipe Preview */}
                  {dish.ingredients && ((dish.ingredients.ka && dish.ingredients.ka.length > 0) || (dish.ingredients.ru && dish.ingredients.ru.length > 0)) && (
                    <div style={{ fontSize: '11.5px', color: '#9CA3AF', margin: '8px 0', background: '#0D131F', padding: '6px 10px', borderRadius: '6px', border: '1px solid #1F2937' }}>
                      <div style={{ fontWeight: 600, color: '#E5E7EB', marginBottom: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>🥗 შემადგენლობა:</span>
                        <span style={{ fontSize: '10px', color: '#10B981', background: 'rgba(16, 185, 129, 0.12)', padding: '1px 6px', borderRadius: '4px' }}>
                          {dish.ingredients.ka?.length || dish.ingredients.ru?.length || 0} ინგრედიენტი
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: '1.4' }}>
                        {(dish.ingredients.ka?.length ? dish.ingredients.ka : dish.ingredients.ru || []).slice(0, 3).join(', ')}
                        {((dish.ingredients.ka?.length || dish.ingredients.ru?.length || 0) > 3) ? ' ...' : ''}
                      </div>
                    </div>
                  )}

                  {dish.allergens && dish.allergens.length > 0 && (
                    <div className="admin-dish-allergens">
                      {dish.allergens.map(a => (
                        <span key={a} className="allergen-tag">{a}</span>
                      ))}
                    </div>
                  )}

                  <div className="admin-dish-actions">
                    <button onClick={() => openEditModal(dish)} className="btn-dish-edit">
                      ✏️ რედაქტირება
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm(`წაიშალოს კერძი «${dish.name.ka}» ბაზიდან?`)) {
                          await deleteDish(dish.id);
                        }
                      }} 
                      className="btn-dish-delete"
                      title="კერძის წაშლა"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Supabase Storage Manager & BLOB Migration */}
      {isStorageModalOpen && (
        <div className="admin-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="admin-modal-container" style={{ maxWidth: '680px' }}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>🗄️</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px' }}>Supabase Storage & ფოტოების მართვა</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                    ფოტოების ატვირთვა Supabase Storage-ში (<code style={{ color: '#10B981' }}>product-images</code>) და SQL ბაზის განტვირთვა
                  </p>
                </div>
              </div>
              <button onClick={() => setIsStorageModalOpen(false)} className="modal-close-btn">×</button>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Storage Bucket Status Card */}
              <div style={{
                background: '#111827',
                border: storageStatus.exists ? '1px solid #10B981' : '1px solid #F59E0B',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{storageStatus.exists ? '🟢' : '🟡'}</span>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#F3F4F6' }}>
                      Storage Bucket: <code style={{ color: '#10B981' }}>product-images</code>
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                    {storageStatus.checking ? 'სტატუსის შემოწმება...' :
                     storageStatus.exists ? '✓ Bucket შექმნილია და მზადაა პირდაპირი ატვირთვებისთვის' :
                     'Bucket ჯერ არ არის შექმნილი Supabase-ში. შეასრულეთ 1-წამიანი SQL სკრიპტი ქვემოთ.'}
                  </div>
                </div>
                <button
                  onClick={checkStorage}
                  disabled={storageStatus.checking}
                  className="admin-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  {storageStatus.checking ? '⏳...' : '🔄 შემოწმება'}
                </button>
              </div>

              {/* Statistics Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                <div style={{ background: '#0D131F', padding: '12px', borderRadius: '8px', border: '1px solid #1F2937', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#34D399' }}>{imageStats.storageUrls}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>☁️ Storage ფოტოები</div>
                </div>
                <div style={{ background: '#0D131F', padding: '12px', borderRadius: '8px', border: '1px solid #1F2937', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: imageStats.base64Blobs > 0 ? '#FBBF24' : '#9CA3AF' }}>
                    {imageStats.base64Blobs}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>⚠️ SQL Base64 BLOB</div>
                </div>
                <div style={{ background: '#0D131F', padding: '12px', borderRadius: '8px', border: '1px solid #1F2937', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#60A5FA' }}>{imageStats.presets}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>🖼️ ლოკალური გალერეა</div>
                </div>
              </div>

              {/* Automated Migration Action */}
              {imageStats.base64Blobs > 0 && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid #F59E0B',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '18px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#FDE68A', fontSize: '14px' }}>
                        🚀 ავტომატური მიგრაცია Storage-ში
                      </div>
                      <div style={{ fontSize: '12px', color: '#D1D5DB', marginTop: '2px' }}>
                        ყველა Base64 BLOB დაკომპრესდება WebP ფორმატში, აიტვირთება Storage-ში და ბაზაში ჩაიწერება მოკლე URL.
                      </div>
                    </div>
                    <button
                      onClick={handleRunMigration}
                      disabled={isMigrating || !storageStatus.exists}
                      className="admin-btn-primary"
                      style={{
                        background: storageStatus.exists ? '#F59E0B' : '#4B5563',
                        color: storageStatus.exists ? '#451A03' : '#9CA3AF',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        cursor: storageStatus.exists ? 'pointer' : 'not-allowed'
                      }}
                      title={!storageStatus.exists ? 'ჯერ შეასრულეთ SQL სკრიპტი Bucket-ის შესაქმნელად' : 'მიგრაციის დაწყება'}
                    >
                      {isMigrating ? '⏳ მიგრაცია...' : !storageStatus.exists ? '⚠️ ჯერ შექმენით Bucket' : '🚀 დაწყება'}
                    </button>
                  </div>

                  {/* Migration Progress Bar */}
                  {isMigrating && migrationProgress && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#FDE68A', marginBottom: '4px' }}>
                        <span>იტვირთება: {migrationProgress.dishName}</span>
                        <span>{migrationProgress.current} / {migrationProgress.total}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#374151', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${(migrationProgress.current / Math.max(migrationProgress.total, 1)) * 100}%`,
                          height: '100%',
                          background: '#10B981',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Migration Result */}
                  {migrationResult && (
                    <div style={{ marginTop: '12px', fontSize: '12px', color: migrationResult.errors.length > 0 ? '#FCA5A5' : '#34D399' }}>
                      {migrationResult.errors.length === 0 ? (
                        <span>✓ წარმატებით გადავიდა {migrationResult.migrated} კერძის ფოტო Storage-ში!</span>
                      ) : (
                        <span>⚠️ დასრულდა შეცდომებით ({migrationResult.migrated} წარმატებული, {migrationResult.errors.length} შეცდომა): {migrationResult.errors.join(', ')}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SQL Instructions for 1-click Setup */}
              {!storageStatus.exists && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#E5E7EB' }}>
                      📝 Supabase SQL სკრიპტი Bucket-ის გასააქტიურებლად:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(STORAGE_SETUP_SQL);
                        setCopiedSql(true);
                        setTimeout(() => setCopiedSql(false), 3000);
                      }}
                      className="json-template-btn"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                    >
                      {copiedSql ? '✓ დაკოპირდა!' : '📋 SQL-ის კოპირება'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={STORAGE_SETUP_SQL}
                    rows={8}
                    className="json-code-textarea"
                    style={{ fontSize: '11.5px', color: '#34D399', background: '#0D1117' }}
                  />
                  <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '6px', lineHeight: '1.4' }}>
                    💡 გახსენით <b style={{ color: '#E5E7EB' }}>Supabase Dashboard → SQL Editor → New Query</b>, ჩასვით ეს კოდი და დააჭირეთ <b>RUN</b>. ამის შემდეგ დააჭირეთ ზემოთ «🔄 შემოწმება».
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={() => setIsStorageModalOpen(false)}
                className="admin-btn-primary"
              >
                დახურვა
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Dish */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container modal-wide">
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2>{editingDish ? 'კერძის რედაქტირება' : 'ახალი კერძის დამატება'}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setJsonInputText('');
                    setJsonParseError('');
                    setIsJsonModalOpen(true);
                  }}
                  className="json-template-btn"
                  title="ჩასვით JSON და ველები ავტომატურად შეივსება"
                >
                  ⚡ JSON-ით შევსება
                </button>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">×</button>
            </div>

            <form onSubmit={handleSave} className="admin-modal-form">
              {/* Channel Selector */}
              <div className="form-section-highlight">
                <label className="form-section-title">სად გაიყიდება ეს კერძი?</label>
                <div className="channel-checkboxes-row">
                  <label className={`channel-check-card ${formChannels.includes('site') ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={formChannels.includes('site')}
                      onChange={() => toggleChannel('site')}
                    />
                    <div>
                      <b>🌐 ვებსაიტის რაციონებში (fitnessfood.ge)</b>
                      <p>გამოიყენება ყოველდღიური მენიუს შესადგენად</p>
                    </div>
                  </label>

                  <label className={`channel-check-card ${formChannels.includes('pos') ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={formChannels.includes('pos')}
                      onChange={() => toggleChannel('pos')}
                    />
                    <div>
                      <b>🏢 წერტილების ვიტრინებში (დარბაზები & კაფეები)</b>
                      <p>ხელმისაწვდომია Mega Gym, XXL, Fitness Academy-ში გადასატანად</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Photo Uploader */}
              <div className="form-row">
                <div className="form-col full-width">
                  <label className="form-label">კერძის ფოტო (ავტომატური Storage ატვირთვა & კომპრესია)</label>
                  
                  <div className="photo-uploader-box">
                    {/* Tabs */}
                    <div className="photo-uploader-tabs">
                      <button
                        type="button"
                        onClick={() => setPhotoTab('upload')}
                        className={`photo-tab-btn ${photoTab === 'upload' ? 'active' : ''}`}
                      >
                        📁 ფაილის ატვირთვა (PC / Mobile)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoTab('presets')}
                        className={`photo-tab-btn ${photoTab === 'presets' ? 'active' : ''}`}
                      >
                        🖼️ FitFood გალერეა ({PRESET_IMAGES.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoTab('url')}
                        className={`photo-tab-btn ${photoTab === 'url' ? 'active' : ''}`}
                      >
                        🌐 ბმულით (URL)
                      </button>
                    </div>

                    {/* Active Image Preview Card */}
                    <div className="photo-active-preview">
                      <div className="photo-preview-img">
                        <Image
                          src={formCustomUrl.trim() || formImage}
                          alt="კერძის გადახედვა"
                          fill
                          style={{ objectFit: 'cover' }}
                          unoptimized={formImage.startsWith('data:') || formCustomUrl.startsWith('http') || formImage.startsWith('http')}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#F9FAFB' }}>
                          {isUploadingImage ? '⏳ სურათი მუშავდება და იტვირთება Storage-ში...' :
                           formImage.includes('supabase.co/storage') ? '✓ ატვირთულია Supabase Storage-ში' :
                           uploadedFileName ? `✓ არჩეულია ფაილი: ${uploadedFileName}` :
                           formCustomUrl ? '✓ მითითებულია პირდაპირი URL' :
                           '✓ არჩეულია კატალოგის ფოტო'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                          სურათი ოპტიმიზირდება WebP ფორმატში მაქსიმალური სისწრაფისთვის.
                        </div>

                        {imageUploadNotice && (
                          <div style={{
                            marginTop: '6px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: imageUploadNotice.type === 'success' ? '#34D399' :
                                   imageUploadNotice.type === 'warn' ? '#FBBF24' : '#F87171'
                          }}>
                            {imageUploadNotice.text}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tab Content: Direct Upload */}
                    {photoTab === 'upload' && (
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                        />
                        <div
                          className={`photo-dropzone ${isDragging ? 'drag-active' : ''}`}
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                        >
                          <div className="dropzone-icon">{isUploadingImage ? '⏳' : '📸'}</div>
                          <div className="dropzone-text">
                            {isUploadingImage ? 'მიმდინარეობს ატვირთვა...' : 'დააჭირეთ ფოტოს ასარჩევად ან ჩააგდეთ ფაილი აქ'}
                          </div>
                          <div className="dropzone-sub">ავტომატური კონვერტაცია მსუბუქ WebP ფორმატში და ატვირთვა Supabase Storage-ში</div>
                        </div>
                      </div>
                    )}

                    {/* Tab Content: Presets */}
                    {photoTab === 'presets' && (
                      <div className="preset-images-scroll">
                        {PRESET_IMAGES.map((img) => (
                          <div
                            key={img.url}
                            onClick={() => {
                              setFormImage(img.url);
                              setFormCustomUrl('');
                              setUploadedFileName('');
                              setImageUploadNotice(null);
                            }}
                            className={`preset-thumb ${formImage === img.url && !formCustomUrl ? 'selected' : ''}`}
                          >
                            <div style={{ position: 'relative', width: '80px', height: '60px' }}>
                              <Image src={img.url} alt={img.label} fill style={{ objectFit: 'cover', borderRadius: '6px' }} />
                            </div>
                            <span className="preset-label">{img.label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tab Content: Custom URL */}
                    {photoTab === 'url' && (
                      <div>
                        <input
                          type="text"
                          placeholder="ჩასვით ფოტოს პირდაპირი ბმული (https://images.unsplash.com/...)"
                          value={formCustomUrl}
                          onChange={(e) => setFormCustomUrl(e.target.value)}
                          className="admin-input"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Multilingual Dish Info & Recipe Composition Card */}
              <div className="ingredients-multilingual-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-section-title" style={{ margin: 0 }}>
                    🌐 კერძის დასახელება & შემადგენლობა ენების მიხედვით
                  </label>
                  
                  {/* Language Switcher Tabs */}
                  <div className="lang-switch-tabs">
                    <button
                      type="button"
                      onClick={() => setLangTab('ka')}
                      className={`lang-tab-pill ${langTab === 'ka' ? 'active' : ''}`}
                    >
                      🇬🇪 ქართული
                      <span className="lang-tab-badge">
                        {parseIngredientsText(formIngredientsKa).length} ინგრ.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLangTab('ru')}
                      className={`lang-tab-pill ${langTab === 'ru' ? 'active' : ''}`}
                    >
                      🇷🇺 Русский
                      <span className="lang-tab-badge">
                        {parseIngredientsText(formIngredientsRu).length} инг.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLangTab('en')}
                      className={`lang-tab-pill ${langTab === 'en' ? 'active' : ''}`}
                    >
                      🇬🇧 English
                      <span className="lang-tab-badge">
                        {parseIngredientsText(formIngredientsEn).length} ing.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Georgian Inputs */}
                {langTab === 'ka' && (
                  <>
                    <div className="form-grid-2">
                      <div className="form-col">
                        <label className="form-label">კერძის სახელწოდება (ქართულად) *</label>
                        <input
                          type="text"
                          required
                          value={formNameKa}
                          onChange={(e) => setFormNameKa(e.target.value)}
                          placeholder="მაგ: ქათმის ფილე მექსიკურად"
                          className="admin-input"
                        />
                      </div>
                      <div className="form-col">
                        <label className="form-label">მოკლე აღწერა (ქართულად)</label>
                        <input
                          type="text"
                          value={formDescKa}
                          onChange={(e) => setFormDescKa(e.target.value)}
                          placeholder="მაგ: წვნიანი ფილე ბოსტნეულით და სუ-ვიდ ტექნოლოგიით"
                          className="admin-input"
                        />
                      </div>
                    </div>

                    <div className="form-col full-width">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className="form-label" style={{ margin: 0 }}>
                          🥘 ინგრედიენტების შემადგენლობა გრამებით (თითო ხაზზე თითო ინგრედიენტი):
                        </label>
                        <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                          {parseIngredientsText(formIngredientsKa).length} ინგრედიენტი
                        </span>
                      </div>
                      <textarea
                        rows={6}
                        value={formIngredientsKa}
                        onChange={(e) => setFormIngredientsKa(e.target.value)}
                        placeholder={'პომიდორი საკუთარ წვენში — 120 გ\nბულგარული წითელი წიწაკა — 40 გ\nსიმინდი — 30 გ\nწითელი ხახვი — 15 გ\nოხრახუში — 3 გ\nმარილი — 1 გ\nშავი პილპილი — 0.5 გ\nორეგანო — 0.5 გ'}
                        className="ingredients-textarea"
                      />
                      <span className="ingredients-helper-note">
                        💡 შეიყვანეთ ინგრედიენტი და წონა გრამებში (მაგ: <b>პომიდორი — 120 გ</b>). სისტემა ავტომატურად დააფორმატებს კალათისა და საიტისთვის.
                      </span>
                    </div>
                  </>
                )}

                {/* Russian Inputs */}
                {langTab === 'ru' && (
                  <>
                    <div className="form-grid-2">
                      <div className="form-col">
                        <label className="form-label">Название блюда (на русском)</label>
                        <input
                          type="text"
                          value={formNameRu}
                          onChange={(e) => setFormNameRu(e.target.value)}
                          placeholder="Например: Куриное филе по-мексикански"
                          className="admin-input"
                        />
                      </div>
                      <div className="form-col">
                        <label className="form-label">Краткое описание (на русском)</label>
                        <input
                          type="text"
                          value={formDescRu}
                          onChange={(e) => setFormDescRu(e.target.value)}
                          placeholder="Например: Сочное филе су-вид с кукурузой и сладким перцем"
                          className="admin-input"
                        />
                      </div>
                    </div>

                    <div className="form-col full-width">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className="form-label" style={{ margin: 0 }}>
                          🥘 Состав блюда по ингредиентам и граммам (каждый с новой строки):
                        </label>
                        <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                          {parseIngredientsText(formIngredientsRu).length} ингредиентов
                        </span>
                      </div>
                      <textarea
                        rows={6}
                        value={formIngredientsRu}
                        onChange={(e) => setFormIngredientsRu(e.target.value)}
                        placeholder={'Помидоры в собственном соку — 120 г\nБолгарский красный перец — 40 г\nКукуруза — 30 г\nКрасный лук — 15 г\nПетрушка — 3 г\nСоль — 1 г\nЧёрный перец — 0,5 г\nОрегано — 0,5 г'}
                        className="ingredients-textarea"
                      />
                      <span className="ingredients-helper-note">
                        💡 Можно вставлять списком с маркерами (*, -, •). Система автоматически очистит и сохранит точный рецептурный состав.
                      </span>
                    </div>
                  </>
                )}

                {/* English Inputs */}
                {langTab === 'en' && (
                  <>
                    <div className="form-grid-2">
                      <div className="form-col">
                        <label className="form-label">Dish Name (in English)</label>
                        <input
                          type="text"
                          value={formNameEn}
                          onChange={(e) => setFormNameEn(e.target.value)}
                          placeholder="e.g.: Mexican Style Chicken Breast"
                          className="admin-input"
                        />
                      </div>
                      <div className="form-col">
                        <label className="form-label">Short Description (in English)</label>
                        <input
                          type="text"
                          value={formDescEn}
                          onChange={(e) => setFormDescEn(e.target.value)}
                          placeholder="e.g.: Tender sous-vide chicken with peppers and herbs"
                          className="admin-input"
                        />
                      </div>
                    </div>

                    <div className="form-col full-width">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className="form-label" style={{ margin: 0 }}>
                          🥘 Ingredients & Weight Breakdown (one per line):
                        </label>
                        <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                          {parseIngredientsText(formIngredientsEn).length} ingredients
                        </span>
                      </div>
                      <textarea
                        rows={6}
                        value={formIngredientsEn}
                        onChange={(e) => setFormIngredientsEn(e.target.value)}
                        placeholder={'Peeled canned tomatoes — 120 g\nRed bell pepper — 40 g\nSweet corn — 30 g\nRed onion — 15 g\nFresh parsley — 3 g\nSalt — 1 g\nBlack pepper — 0.5 g\nOregano — 0.5 g'}
                        className="ingredients-textarea"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Category, Day of Week & Cooking Method */}
              <div className="form-grid-3">
                <div className="form-col">
                  <label className="form-label">კატეგორია</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as DishCategory)}
                    className="admin-select-input"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-col">
                  <label className="form-label">კვირის დღე (მენიუსთვის)</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as DayOfWeek)}
                    className="admin-select-input"
                  >
                    {DAYS_MAP.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-col">
                  <label className="form-label">კვების ტიპი</label>
                  <select
                    value={formMealType}
                    onChange={(e) => setFormMealType(e.target.value as MealType)}
                    className="admin-select-input"
                  >
                    <option value="breakfast">🥞 საუზმე</option>
                    <option value="lunch">🍲 სადილი</option>
                    <option value="snack">🥪 სამხარი</option>
                    <option value="dinner">🥗 ვახშამი</option>
                    <option value="dessert">🧁 დესერტი</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-col">
                  <label className="form-label">მომზადების ტექნოლოგია</label>
                  <select
                    value={formCookingMethod}
                    onChange={(e) => setFormCookingMethod(e.target.value as any)}
                    className="admin-select-input"
                  >
                    <option value="sous_vide">სუ-ვიდ (Sous-Vide)</option>
                    <option value="baked">გამომცხვარი ღუმელში</option>
                    <option value="steamed">ორთქლზე მომზადებული</option>
                    <option value="grilled">გრილი (უცხიმო)</option>
                    <option value="raw">ნატურალური / ცოცხალი</option>
                  </select>
                </div>
                <div className="form-col">
                  <label className="form-label">⚖️ პორციის წონა (გ) *</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={formWeight}
                    onChange={(e) => setFormWeight(Number(e.target.value))}
                    className="admin-input"
                    placeholder="მაგ: 320"
                  />
                </div>
              </div>

              {/* Exact KBJU Inputs (Calories, Protein, Fat, Carbs) */}
              <div className="kbju-inputs-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-section-title" style={{ margin: 0 }}>
                    🔥 კბჟუ და კალორიულობა (კალორიები, ცილა, ცხიმი, ნახშირწყლები)
                  </label>
                  <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                    საიტისა და POS ვიტრინისთვის
                  </span>
                </div>

                <div className="kbju-inputs-row">
                  <div className="kbju-input-group highlight-cal">
                    <label>⚡ კალორია (კკალ) *</label>
                    <input
                      type="number"
                      required
                      min="10"
                      max="3000"
                      value={formCalories}
                      onChange={(e) => setFormCalories(Number(e.target.value))}
                      className="admin-input-num"
                      placeholder="მაგ: 450"
                    />
                  </div>

                  <div className="kbju-input-group">
                    <label>🥩 ცილები (გ) *</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min="0"
                      value={formProtein}
                      onChange={(e) => setFormProtein(Number(e.target.value))}
                      className="admin-input-num"
                      placeholder="მაგ: 38"
                    />
                  </div>

                  <div className="kbju-input-group">
                    <label>🥑 ცხიმები (გ) *</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min="0"
                      value={formFat}
                      onChange={(e) => setFormFat(Number(e.target.value))}
                      className="admin-input-num"
                      placeholder="მაგ: 12"
                    />
                  </div>

                  <div className="kbju-input-group">
                    <label>🌾 ნახშირწყლები (გ) *</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min="0"
                      value={formCarbs}
                      onChange={(e) => setFormCarbs(Number(e.target.value))}
                      className="admin-input-num"
                      placeholder="მაგ: 45"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Pricing (Food Cost & Retail Price) */}
              <div className="pricing-inputs-card">
                <label className="form-section-title" style={{ margin: 0 }}>
                  💰 ფასწარმოქმნა & თვითღირებულება (GEL ₾)
                </label>

                <div className="form-grid-2">
                  <div className="form-col">
                    <label className="form-label">თვითღირებულება (Food Cost) GEL *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={formCostPrice}
                      onChange={(e) => setFormCostPrice(Number(e.target.value))}
                      className="admin-input"
                      placeholder="მაგ: 6.5"
                    />
                    <span className="form-hint">ინგრედიენტების ჯამური ხარჯი პორციაზე</span>
                  </div>

                  <div className="form-col">
                    <label className="form-label">გასაყიდი ფასი (Retail Price) GEL *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={formRetailPrice}
                      onChange={(e) => setFormRetailPrice(Number(e.target.value))}
                      className="admin-input"
                      placeholder="მაგ: 15.0"
                    />
                    <span className="form-hint">
                      სუფთა მარჟა: <b className="text-success">+{(formRetailPrice - formCostPrice).toFixed(1)} ₾</b> ({(formRetailPrice > 0 ? Math.round(((formRetailPrice - formCostPrice) / formRetailPrice) * 100) : 0)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-col full-width">
                  <label className="form-label">ალერგენები</label>
                  <div className="allergens-checkbox-group">
                    {ALLERGEN_OPTIONS.map((alg) => (
                      <button
                        type="button"
                        key={alg}
                        onClick={() => toggleAllergen(alg)}
                        className={`allergen-toggle-btn ${formAllergens.includes(alg) ? 'active' : ''}`}
                      >
                        {formAllergens.includes(alg) ? '✓ ' : '+ '}{alg}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="admin-btn-secondary" disabled={isSaving}>
                  გაუქმება
                </button>
                <button type="submit" className="admin-btn-primary" disabled={isSaving}>
                  {isSaving ? '💾 ინახება...' : '💾 შენახვა'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Smart JSON Importer */}
      {isJsonModalOpen && (
        <div className="admin-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="admin-modal-container" style={{ maxWidth: '680px' }}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px' }}>JSON-ით მონაცემების შევსება</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                    ჩასვით კერძის JSON ობიექტი და სისტემა ავტომატურად შეავსებს კბჟუ-ს, ფასებს, სახელებსა და ინგრედიენტებს.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsJsonModalOpen(false)} className="modal-close-btn">×</button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#E5E7EB' }}>
                  ჩასვით JSON ტექსტი:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setJsonInputText(SAMPLE_DISH_JSON);
                    setJsonParseError('');
                  }}
                  className="json-template-btn"
                >
                  📋 ნიმუშის ჩასმა (Пример)
                </button>
              </div>

              <textarea
                value={jsonInputText}
                onChange={(e) => {
                  setJsonInputText(e.target.value);
                  setJsonParseError('');
                }}
                placeholder={'{\n  "name": {\n    "ru": "Куриное филе по-мексикански",\n    "ka": "ქათმის ფილე მექსიკურად",\n    "en": "Mexican Style Chicken"\n  },\n  "macros": {\n    "calories": 450,\n    "protein": 38,\n    "fat": 12,\n    "carbs": 45,\n    "weightGrams": 320\n  },\n  "costPrice": 6.5,\n  "retailPrice": 15.0,\n  "ingredients": {\n    "ru": [\n      "Помидоры в собственном соку — 120 г",\n      "Болгарский красный перец — 40 г"\n    ]\n  }\n}'}
                className="json-code-textarea"
                rows={12}
              />

              {jsonParseError && (
                <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '6px', color: '#FCA5A5', fontSize: '12.5px' }}>
                  ⚠️ {jsonParseError}
                </div>
              )}

              <div style={{ marginTop: '14px', background: '#111827', padding: '10px 14px', borderRadius: '6px', border: '1px solid #1F2937', fontSize: '11.5px', color: '#9CA3AF', lineHeight: '1.5' }}>
                💡 <b>მხარდაჭერილი ველები:</b> <code style={{ color: '#10B981' }}>name (ka/ru/en)</code>, <code style={{ color: '#10B981' }}>description</code>, <code style={{ color: '#10B981' }}>macros (calories, protein, fat, carbs, weightGrams)</code>, <code style={{ color: '#10B981' }}>costPrice</code>, <code style={{ color: '#10B981' }}>retailPrice</code>, <code style={{ color: '#10B981' }}>ingredients (ka/ru/en)</code>, <code style={{ color: '#10B981' }}>image</code>, <code style={{ color: '#10B981' }}>allergens</code>, <code style={{ color: '#10B981' }}>category</code>, <code style={{ color: '#10B981' }}>mealType</code>, <code style={{ color: '#10B981' }}>day</code>.
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="admin-btn-secondary"
              >
                გაუქმება
              </button>
              <button
                type="button"
                onClick={() => applyJsonToForm(jsonInputText)}
                className="admin-btn-primary"
                style={{ background: '#10B981', color: '#064E3B', fontWeight: 800 }}
              >
                ⚡ ამოცნობა და ველების შევსება
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
