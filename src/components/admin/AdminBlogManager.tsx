'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAdmin } from '@/context/AdminContext';
import { AdminBlogPost } from '@/types/admin';

export const AdminBlogManager: React.FC = () => {
  const { 
    blogPosts, 
    addBlogPost, 
    updateBlogPost, 
    deleteBlogPost, 
    togglePostPublished 
  } = useAdmin();

  const [editingPost, setEditingPost] = useState<AdminBlogPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);

  // Form states
  const [formTitleRu, setFormTitleRu] = useState('');
  const [formTitleKa, setFormTitleKa] = useState('');
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formExcerptRu, setFormExcerptRu] = useState('');
  const [formContentRu, setFormContentRu] = useState('');
  const [formCategory, setFormCategory] = useState<'nutrition' | 'fitness' | 'recipes' | 'company' | 'lifestyle'>('nutrition');
  const [formAuthor, setFormAuthor] = useState('Нино Двали (Врач-диетолог FitFood)');
  const [formCoverImage, setFormCoverImage] = useState('/images/meals/chicken-ptitim.webp');
  const [formReadTime, setFormReadTime] = useState(4);
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formSeoDesc, setFormSeoDesc] = useState('');
  const [formPublished, setFormPublished] = useState(true);

  const openCreateModal = () => {
    setEditingPost(null);
    setFormTitleRu('');
    setFormTitleKa('');
    setFormTitleEn('');
    setFormExcerptRu('');
    setFormContentRu('### Введение\nТекст статьи с полезными советами по правильному питанию в Батуми...');
    setFormCategory('nutrition');
    setFormAuthor('Нино Двали (Врач-диетолог FitFood)');
    setFormCoverImage('/images/meals/beef-demiglace-puree.webp');
    setFormReadTime(4);
    setFormSeoTitle('');
    setFormSeoDesc('');
    setFormPublished(true);
    setPreviewActive(false);
    setIsModalOpen(true);
  };

  const openEditModal = (post: AdminBlogPost) => {
    setEditingPost(post);
    setFormTitleRu(post.title.ru);
    setFormTitleKa(post.title.ka);
    setFormTitleEn(post.title.en);
    setFormExcerptRu(post.excerpt.ru);
    setFormContentRu(post.content.ru);
    setFormCategory(post.category);
    setFormAuthor(post.author);
    setFormCoverImage(post.coverImage);
    setFormReadTime(post.readTimeMin);
    setFormSeoTitle(post.seoTitle?.ru || post.title.ru);
    setFormSeoDesc(post.seoDescription?.ru || post.excerpt.ru);
    setFormPublished(post.published);
    setPreviewActive(false);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitleRu.trim()) {
      alert('Укажите заголовок статьи');
      return;
    }

    const payload = {
      slug: formTitleRu.toLowerCase().replace(/[^a-z0-9]/gi, '-').slice(0, 35),
      title: {
        ru: formTitleRu,
        ka: formTitleKa || formTitleRu,
        en: formTitleEn || formTitleRu,
      },
      excerpt: {
        ru: formExcerptRu,
        ka: formExcerptRu,
        en: formExcerptRu,
      },
      content: {
        ru: formContentRu,
        ka: formContentRu,
        en: formContentRu,
      },
      category: formCategory,
      coverImage: formCoverImage,
      readTimeMin: Number(formReadTime),
      author: formAuthor,
      published: formPublished,
      publishedAt: new Date().toISOString(),
      seoTitle: {
        ru: formSeoTitle || formTitleRu,
        ka: formSeoTitle || formTitleRu,
        en: formSeoTitle || formTitleRu,
      },
      seoDescription: {
        ru: formSeoDesc || formExcerptRu,
        ka: formSeoDesc || formExcerptRu,
        en: formSeoDesc || formExcerptRu,
      },
    };

    if (editingPost) {
      updateBlogPost(editingPost.id, payload);
    } else {
      addBlogPost(payload);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="admin-view-container">
      {/* Header */}
      <div className="admin-page-hero">
        <div>
          <h1 className="admin-page-title">Блог & Контентные Страницы (CMS)</h1>
          <p className="admin-page-subtitle">
            Публикация экспертных статей, рецептов, гидов по КБЖУ и оптимизация SEO-показателей для fitnessfood.ge
          </p>
        </div>
        <button onClick={openCreateModal} className="admin-btn-primary">
          + Написать статью
        </button>
      </div>

      {/* Blog Cards Grid */}
      <div className="admin-grid-2col">
        {blogPosts.map((post) => (
          <div key={post.id} className="admin-card blog-post-card">
            <div className="blog-card-media">
              <div style={{ position: 'relative', width: '100%', height: '180px' }}>
                <Image
                  src={post.coverImage || '/images/meals/chicken-ptitim.webp'}
                  alt={post.title.ru}
                  fill
                  style={{ objectFit: 'cover', borderRadius: '8px' }}
                />
              </div>
              <span className="blog-category-tag">
                {post.category === 'nutrition' ? '🥗 Нутрициология' :
                 post.category === 'recipes' ? '🍳 Технологии' :
                 post.category === 'fitness' ? '💪 Фитнес' : 'Статья'}
              </span>
            </div>

            <div className="blog-card-content">
              <div className="blog-meta-row">
                <span className="blog-author">{post.author}</span>
                <span className="blog-views">👁️ {post.viewsCount.toLocaleString()} просм.</span>
                <button
                  onClick={() => togglePostPublished(post.id)}
                  className={`status-chip ${post.published ? 'chip-active' : 'chip-disabled'}`}
                >
                  {post.published ? '● Опубликована' : '○ Черновик'}
                </button>
              </div>

              <h3 className="blog-title">{post.title.ru}</h3>
              <p className="blog-excerpt">{post.excerpt.ru}</p>

              <div className="blog-footer-row">
                <span className="blog-date">{new Date(post.publishedAt).toLocaleDateString('ru-RU')} • {post.readTimeMin} мин чтения</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEditModal(post)} className="btn-dish-edit">
                    ✏️ Редактировать
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Удалить статью «${post.title.ru}»?`)) {
                        deleteBlogPost(post.id);
                      }
                    }} 
                    className="btn-dish-delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create / Edit Article */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container modal-wide">
            <div className="admin-modal-header">
              <h2>{editingPost ? 'Редактирование статьи блога' : 'Новая статья для блога'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">×</button>
            </div>

            <form onSubmit={handleSave} className="admin-modal-form">
              {/* Title inputs */}
              <div className="form-grid-3">
                <div className="form-col">
                  <label className="form-label">Заголовок (Русский) *</label>
                  <input
                    type="text"
                    required
                    value={formTitleRu}
                    onChange={(e) => setFormTitleRu(e.target.value)}
                    placeholder="Например: Как рассчитать дефицит калорий..."
                    className="admin-input"
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">Заголовок (Грузинский)</label>
                  <input
                    type="text"
                    value={formTitleKa}
                    onChange={(e) => setFormTitleKa(e.target.value)}
                    placeholder="სტატიის სათაური ქართულად..."
                    className="admin-input"
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">Заголовок (English)</label>
                  <input
                    type="text"
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    placeholder="Article title in English..."
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Category, Author, Read time */}
              <div className="form-grid-3">
                <div className="form-col">
                  <label className="form-label">Категория</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="admin-select-input"
                  >
                    <option value="nutrition">Нутрициология & КБЖУ</option>
                    <option value="recipes">Технологии кухни & Рецепты</option>
                    <option value="fitness">Спорт & Тренировки</option>
                    <option value="lifestyle">Здоровый образ жизни</option>
                    <option value="company">Новости компании FitFood</option>
                  </select>
                </div>
                <div className="form-col">
                  <label className="form-label">Автор статьи</label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    className="admin-input"
                  />
                </div>
                <div className="form-col">
                  <label className="form-label">Время чтения (минут)</label>
                  <input
                    type="number"
                    min="1"
                    value={formReadTime}
                    onChange={(e) => setFormReadTime(Number(e.target.value))}
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="form-row">
                <div className="form-col full-width">
                  <label className="form-label">Краткий анонс / Лид (Excerpt)</label>
                  <textarea
                    rows={2}
                    value={formExcerptRu}
                    onChange={(e) => setFormExcerptRu(e.target.value)}
                    placeholder="Краткое описание статьи для превью в ленте..."
                    className="admin-textarea"
                  />
                </div>
              </div>

              {/* Article Markdown Content */}
              <div className="form-row">
                <div className="form-col full-width">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Полный текст статьи (Поддерживает Markdown форматирование)</label>
                    <button
                      type="button"
                      onClick={() => setPreviewActive(!previewActive)}
                      className="admin-mini-btn"
                    >
                      {previewActive ? '✎ Режим редактора' : '👁️ Предпросмотр'}
                    </button>
                  </div>

                  {previewActive ? (
                    <div className="article-preview-box">
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{formContentRu}</div>
                    </div>
                  ) : (
                    <textarea
                      rows={8}
                      value={formContentRu}
                      onChange={(e) => setFormContentRu(e.target.value)}
                      placeholder="Напишите текст статьи, используя заголовки ##, списки и выделения..."
                      className="admin-textarea"
                      style={{ fontFamily: 'monospace' }}
                    />
                  )}
                </div>
              </div>

              {/* SEO Meta Box */}
              <div className="form-section-highlight">
                <label className="form-section-title">🔍 SEO Оптимизация (Поисковые системы Google / Яндекс)</label>
                <div className="form-grid-2">
                  <div className="form-col">
                    <label className="form-label">SEO Title (Заголовок во вкладке браузера)</label>
                    <input
                      type="text"
                      value={formSeoTitle}
                      onChange={(e) => setFormSeoTitle(e.target.value)}
                      placeholder="Дефицит калорий Батуми — FitFood"
                      className="admin-input"
                    />
                  </div>
                  <div className="form-col">
                    <label className="form-label">SEO Meta Description (Сниппет в выдаче)</label>
                    <input
                      type="text"
                      value={formSeoDesc}
                      onChange={(e) => setFormSeoDesc(e.target.value)}
                      placeholder="Полный гид по расчету рациона от нутрициологов FitFood..."
                      className="admin-input"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="admin-modal-footer">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formPublished}
                    onChange={(e) => setFormPublished(e.target.checked)}
                  />
                  <span>Опубликовать сразу на сайте</span>
                </label>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="admin-btn-secondary">
                    Отмена
                  </button>
                  <button type="submit" className="admin-btn-primary">
                    💾 Сохранить статью
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
