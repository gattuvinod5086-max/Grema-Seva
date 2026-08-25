
CREATE TABLE news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_en TEXT NOT NULL,
  title_te TEXT,
  short_description_en TEXT,
  short_description_te TEXT,
  content_en TEXT NOT NULL,
  content_te TEXT,
  category TEXT NOT NULL,
  image_key TEXT,
  district TEXT,
  mandal TEXT,
  village TEXT,
  visibility_scope TEXT NOT NULL DEFAULT 'VILLAGE',
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  approval_status TEXT NOT NULL DEFAULT 'APPROVED',
  author_id TEXT NOT NULL,
  author_name TEXT,
  published_at DATETIME,
  scheduled_at DATETIME,
  expires_at DATETIME,
  view_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE news_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  news_id INTEGER NOT NULL,
  user_id TEXT,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_news_status ON news(status);
CREATE INDEX idx_news_category ON news(category);
CREATE INDEX idx_news_district ON news(district);
CREATE INDEX idx_news_mandal ON news(mandal);
CREATE INDEX idx_news_village ON news(village);
CREATE INDEX idx_news_published ON news(published_at);
CREATE INDEX idx_news_priority ON news(priority);
CREATE INDEX idx_news_views_news ON news_views(news_id);
