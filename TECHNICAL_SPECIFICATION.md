# Техническое задание: Сайт Vavip

## 1. ОБЩЕЕ ОПИСАНИЕ ПРОЕКТА

### 1.1. Назначение
Веб-приложение компании Vavip — премиальная платформа для демонстрации услуг в области инженерных систем, проектирования BIM, монтажа и продажи оборудования. Платформа включает корпоративный сайт, интернет-магазин, личный кабинет клиентов и административные дашборды. Выполнена в стиле премиум-дизайна (Bork-style) с акцентом на визуальную привлекательность, сложные плавные анимации и современный UX.

### 1.2. Целевая аудитория
- Руководители строительных компаний
- Проектировщики и архитекторы
- Дизайнеры интерьеров
- Дистрибьюторы оборудования
- Конечные клиенты, заинтересованные в инженерных решениях
- Администраторы и менеджеры компании

### 1.3. Основные цели
- Презентация услуг компании (Узел ввода, Проектирование BIM, Монтаж, Магазин)
- Интернет-магазин с корзиной и оплатой
- Личный кабинет для клиентов
- Административные дашборды и аналитика
- Предоставление контактной информации по регионам
- Сбор обратной связи от клиентов
- Реальное время обновления данных (WebSocket)
- Демонстрация премиального уровня компании через дизайн и UX

---

## 2. АРХИТЕКТУРА И ТЕХНОЛОГИИ

### 2.1. Backend

#### 2.1.1. Фреймворк и язык
- **Flask 3.1.2** (Python) — REST API backend
- **Application Factory Pattern** для модульной структуры
- **Blueprint-based routing** для организации маршрутов
- **Flask-SocketIO** для WebSocket соединений

#### 2.1.2. Структура проекта (Backend)
```
backend/
├── vavip/
│   ├── __init__.py          # Application factory
│   ├── config.py            # Конфигурация приложения
│   ├── extensions.py        # Расширения (DB, Migrate, SocketIO)
│   ├── api/                 # REST API endpoints
│   │   ├── __init__.py
│   │   ├── auth.py          # Аутентификация
│   │   ├── products.py      # Товары и магазин
│   │   ├── orders.py        # Заказы
│   │   ├── contacts.py      # Контакты
│   │   ├── feedback.py      # Обратная связь
│   │   ├── dashboard.py     # Дашборды и аналитика
│   │   └── websocket.py     # WebSocket handlers
│   ├── models/              # Модели БД
│   │   ├── __init__.py
│   │   ├── user.py          # Пользователи
│   │   ├── product.py       # Товары
│   │   ├── order.py         # Заказы
│   │   ├── contact.py       # Контакты
│   │   └── feedback.py      # Обратная связь
│   ├── services/            # Бизнес-логика
│   │   ├── auth_service.py
│   │   ├── order_service.py
│   │   └── analytics_service.py
│   └── utils/              # Утилиты
│       ├── validators.py
│       └── helpers.py
├── migrations/             # Alembic миграции
├── tests/                  # Тесты
└── requirements.txt
```

#### 2.1.3. База данных
- **PostgreSQL** (продакшен) / **SQLite** (разработка)
- **SQLAlchemy** для ORM
- **Flask-Migrate** для миграций
- **Redis** для кэширования и сессий
- **Celery** для фоновых задач (опционально)

#### 2.1.4. API Архитектура
- **REST API** для всех операций
- **WebSocket** для реального времени (уведомления, обновления заказов)
- **JWT** для аутентификации
- **OpenAPI/Swagger** для документации API

#### 2.1.5. Конфигурация
- Использование `.env` файла для переменных окружения
- Поддержка разных окружений (development/staging/production)
- Настройки через класс `Config` в `vavip/config.py`

### 2.2. Frontend

#### 2.2.1. Технологии
- **React 18+** с хуками
- **TypeScript 5+** для типобезопасности
- **Vite** для сборки и разработки
- **React Router** для маршрутизации
- **Framer Motion** для сложных анимаций (Bork-style)
- **GSAP** для продвинутых анимаций (опционально)
- **Zustand** или **Redux Toolkit** для state management
- **React Query (TanStack Query)** для работы с API
- **Socket.IO Client** для WebSocket
- **Zod** для валидации форм
- **React Hook Form** для работы с формами

#### 2.2.2. Структура проекта (Frontend)
```
frontend/
├── public/                 # Статические файлы
│   ├── images/
│   ├── videos/
│   └── favicon.ico
├── src/
│   ├── assets/            # Ресурсы (изображения, стили)
│   │   ├── images/
│   │   ├── videos/
│   │   └── styles/
│   │       ├── globals.css
│   │       └── variables.css
│   ├── components/        # Переиспользуемые компоненты
│   │   ├── ui/            # Базовые UI компоненты
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   └── Card/
│   │   ├── layout/        # Компоненты layout
│   │   │   ├── Header/
│   │   │   ├── Footer/
│   │   │   └── Sidebar/
│   │   ├── animations/    # Анимационные компоненты
│   │   │   ├── IntroLoader/
│   │   │   ├── VideoSection/
│   │   │   └── Curtain/
│   │   └── features/      # Функциональные компоненты
│   │       ├── ProductCard/
│   │       ├── Cart/
│   │       └── ContactMap/
│   ├── pages/             # Страницы приложения
│   │   ├── Home/
│   │   ├── Shop/
│   │   ├── Product/
│   │   ├── Cart/
│   │   ├── Checkout/
│   │   ├── Account/
│   │   ├── Dashboard/
│   │   └── Contacts/
│   ├── features/          # Feature-based структура
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── store/
│   │   ├── shop/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── store/
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── store/
│   │   └── contacts/
│   ├── hooks/             # Кастомные хуки
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   └── useScroll.ts
│   ├── store/             # State management
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   └── uiStore.ts
│   ├── services/          # API сервисы
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   ├── products.ts
│   │   │   └── orders.ts
│   │   └── websocket.ts
│   ├── utils/             # Утилиты
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   ├── types/             # TypeScript типы
│   │   ├── api.ts
│   │   ├── models.ts
│   │   └── common.ts
│   ├── App.tsx            # Главный компонент
│   ├── main.tsx           # Точка входа
│   └── vite-env.d.ts      # Типы Vite
├── .env
├── .env.example
├── index.html
├── tsconfig.json
├── vite.config.ts
├── package.json
└── tailwind.config.js     # Если используется Tailwind
```

#### 2.2.3. Стилизация
- **CSS Modules** или **Styled Components** для компонентов
- **Tailwind CSS** (опционально) для утилитарных классов
- **CSS Variables** для темизации
- **Framer Motion** для анимаций
- **PostCSS** для обработки CSS

#### 2.2.4. Анимации (Bork-style)
- **Framer Motion** для основных анимаций:
  - Intro loader (curtain animation)
  - Video sections transitions
  - Page transitions
  - Micro-interactions
- **GSAP** для сложных последовательностей (опционально)
- **React Spring** для физических анимаций (опционально)

---

## 3. ФУНКЦИОНАЛЬНОСТЬ

### 3.1. Главная страница

#### 3.1.1. Анимация загрузки (Intro)
- **Технология**: Framer Motion
- **Компоненты**:
  - Логотип с появлением (scale + fade)
  - Занавес, уходящий вверх (curtain animation)
  - Блокировка скролла во время анимации
  - Автоматическое скрытие после завершения
- **Время анимации**: ~1.7 секунды
- **Файлы**: `src/components/animations/IntroLoader/`

#### 3.1.2. Видео-секции (Fullscreen Sections)
- **Технология**: React + Framer Motion
- **Количество секций**: 4
  1. УЗЕЛ ВВОДА
  2. ПРОЕКТИРОВАНИЕ BIM
  3. МОНТАЖ
  4. МАГАЗИН
- **Особенности**:
  - Каждая секция занимает 95% высоты viewport (5% peek-эффект)
  - Sticky positioning для эффекта наложения
  - Плавное затемнение неактивных секций
  - Автоматическое переключение при скролле
  - Snap-эффект для точного выравнивания
  - Поддержка touch-событий
- **Анимации**:
  - Появление подписей с blur-эффектом
  - Изменение яркости видео при активации
  - Плавные переходы между секциями
- **Файлы**: `src/components/animations/VideoSection/`

### 3.2. Интернет-магазин

#### 3.2.1. Каталог товаров
- **Страница**: `/shop`
- **Функции**:
  - Список товаров с фильтрацией
  - Поиск по товарам
  - Сортировка (цена, популярность, новизна)
  - Пагинация или бесконечный скролл
  - Фильтры по категориям, цене, характеристикам
- **Компоненты**: `src/features/shop/components/ProductList/`

#### 3.2.2. Страница товара
- **Страница**: `/shop/product/:id`
- **Функции**:
  - Детальная информация о товаре
  - Галерея изображений
  - Характеристики и описание
  - Добавление в корзину
  - Рекомендации похожих товаров
- **Компоненты**: `src/features/shop/components/ProductDetail/`

#### 3.2.3. Корзина
- **Страница**: `/cart`
- **Функции**:
  - Список товаров в корзине
  - Изменение количества
  - Удаление товаров
  - Расчет стоимости
  - Применение промокодов
  - Сохранение в localStorage
  - Синхронизация с сервером (для авторизованных)
- **State**: Zustand store (`src/store/cartStore.ts`)
- **Компоненты**: `src/features/shop/components/Cart/`

#### 3.2.4. Оформление заказа
- **Страница**: `/checkout`
- **Функции**:
  - Форма доставки (валидация через Zod)
  - Выбор способа оплаты
  - Интеграция с платежными системами
  - Подтверждение заказа
  - Отслеживание статуса заказа (WebSocket)
- **Валидация**: React Hook Form + Zod
- **Компоненты**: `src/features/shop/components/Checkout/`

### 3.3. Личный кабинет

#### 3.3.1. Аутентификация
- **Страницы**: `/login`, `/register`, `/forgot-password`
- **Функции**:
  - Регистрация с валидацией
  - Вход (JWT токены)
  - Восстановление пароля
  - Двухфакторная аутентификация (опционально)
- **State**: Zustand store (`src/store/authStore.ts`)
- **API**: `src/services/api/auth.ts`

#### 3.3.2. Профиль пользователя
- **Страница**: `/account`
- **Функции**:
  - Просмотр и редактирование профиля
  - История заказов
  - Избранные товары
  - Адреса доставки
  - Настройки уведомлений
- **Компоненты**: `src/features/auth/components/Account/`

#### 3.3.3. История заказов
- **Страница**: `/account/orders`
- **Функции**:
  - Список всех заказов
  - Детали заказа
  - Статус заказа в реальном времени (WebSocket)
  - Повтор заказа
  - Отмена заказа
- **WebSocket**: Обновления статуса в реальном времени

### 3.4. Административные дашборды

#### 3.4.1. Главный дашборд
- **Страница**: `/dashboard` (только для админов)
- **Функции**:
  - Статистика продаж
  - Графики и аналитика
  - Последние заказы
  - Популярные товары
  - Уведомления
- **Технологии**: Chart.js или Recharts
- **WebSocket**: Обновления в реальном времени
- **Компоненты**: `src/features/dashboard/components/`

#### 3.4.2. Управление товарами
- **Страница**: `/dashboard/products`
- **Функции**:
  - CRUD операции с товарами
  - Загрузка изображений
  - Управление категориями
  - Импорт/экспорт данных

#### 3.4.3. Управление заказами
- **Страница**: `/dashboard/orders`
- **Функции**:
  - Список всех заказов
  - Изменение статуса заказа
  - Печать документов
  - Экспорт отчетов

#### 3.4.4. Аналитика
- **Страница**: `/dashboard/analytics`
- **Функции**:
  - Графики продаж
  - Анализ трафика
  - Конверсии
  - Отчеты по периодам

### 3.5. Контакты

#### 3.5.1. Интерактивная карта
- **Страница**: `/contacts`
- **Функции**:
  - Выбор стран/городов
  - Отображение контактов
  - Карты (Google Maps или Yandex Maps)
  - Плитки разделов (Tom Ford-style)
- **Компоненты**: `src/features/contacts/components/`

#### 3.5.2. Форма обратной связи
- **Функции**:
  - Валидация через Zod
  - Отправка на сервер
  - Уведомления об успехе/ошибке
- **Валидация**: React Hook Form + Zod

### 3.6. WebSocket (Реальное время)

#### 3.6.1. События
- Обновления статуса заказов
- Уведомления для пользователей
- Обновления дашборда в реальном времени
- Онлайн статус пользователей (опционально)

#### 3.6.2. Реализация
- **Backend**: Flask-SocketIO
- **Frontend**: Socket.IO Client
- **Hook**: `src/hooks/useWebSocket.ts`

---

## 4. ДИЗАЙН И UX

### 4.1. Дизайн-система

#### 4.1.1. Цветовая палитра
- **Фон**: `#0a0a0a` (темный)
- **Акцент**: `#17a56f` (зеленый)
- **Текст**: `#fff`, `#c0c0c0`, `#96a0cb`
- **Hover**: `rgba(23,165,111,.30)`

#### 4.1.2. Типографика
- **Основной шрифт**: 'Gotham', Helvetica, Arial, sans-serif
- **Размеры**: Адаптивные с использованием `clamp()`
- **Letter-spacing**: 0.05em - 0.15em (заголовки)

#### 4.1.3. Анимации
- **Framer Motion** для всех анимаций
- **Стандартные переходы**:
  - Fast: 0.2s
  - Medium: 0.3s
  - Slow: 0.35s
  - Long: 0.6s
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`

### 4.2. UX-паттерны

#### 4.2.1. Микро-интеракции
- Hover-эффекты на всех интерактивных элементах
- Плавные переходы цветов
- Легкий lift-эффект на кнопках
- Glow-эффект на иконках

#### 4.2.2. Доступность (A11y)
- Семантическая HTML-разметка
- ARIA-атрибуты
- Поддержка навигации с клавиатуры
- Видимые focus-индикаторы
- Поддержка `prefers-reduced-motion`

---

## 5. АДАПТИВНОСТЬ

### 5.1. Breakpoints
- **Mobile**: < 720px
- **Tablet**: 720px - 1024px
- **Desktop**: > 1024px

### 5.2. Мобильные особенности
- Адаптивная навигация
- Touch-оптимизированные жесты
- Упрощенные анимации для производительности
- Мобильная версия магазина

---

## 6. ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ

### 6.1. Производительность
- **Lighthouse Score**: > 90
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle size**: Оптимизация через code splitting
- **Lazy loading**: Для изображений и компонентов

### 6.2. SEO
- **SSR/SSG**: Next.js или React SSR (опционально)
- **Мета-теги**: Динамические для каждой страницы
- **Open Graph**: Для социальных сетей
- **Sitemap.xml**: Автоматическая генерация
- **Structured Data**: JSON-LD

### 6.3. Безопасность
- **HTTPS**: Обязательно
- **JWT**: Для аутентификации
- **CSRF**: Защита форм
- **XSS**: Санитизация данных
- **Rate Limiting**: Для API
- **Валидация**: На клиенте и сервере

### 6.4. Тестирование
- **Unit tests**: Jest + React Testing Library
- **E2E tests**: Playwright или Cypress
- **API tests**: pytest для backend
- **Coverage**: > 80%

---

## 7. ИНТЕГРАЦИИ

### 7.1. Платежные системы
- **Stripe** или **ЮKassa** (Яндекс.Касса)
- **PayPal** (опционально)
- Интеграция через API

### 7.2. Аналитика
- **Google Analytics 4**
- **Yandex.Metrica**
- События для отслеживания конверсий

### 7.3. Email
- **SendGrid** или **Mailgun**
- Транзакционные письма
- Уведомления

### 7.4. Карты
- **Google Maps API** или **Yandex Maps API**
- Отображение офисов и складов

---

## 8. РАЗВЕРТЫВАНИЕ

### 8.1. Окружение разработки
- **Node.js**: 18+
- **Python**: 3.10+
- **PostgreSQL**: 14+
- **Redis**: 7+

### 8.2. CI/CD
- **GitHub Actions** или **GitLab CI**
- Автоматические тесты
- Автоматический деплой
- Docker контейнеры

### 8.3. Продакшен
- **Frontend**: Vercel, Netlify, или собственный сервер
- **Backend**: Gunicorn + Nginx
- **Database**: PostgreSQL на отдельном сервере
- **CDN**: CloudFlare или AWS CloudFront
- **Monitoring**: Sentry для ошибок

---

## 9. ПЛАН РАЗВИТИЯ

### Фаза 1: Базовая структура (2-3 недели)
- ✅ Настройка проекта (React + Vite + TypeScript)
- ✅ Настройка backend (Flask API)
- ✅ Базовая структура компонентов
- ✅ Роутинг
- ✅ Аутентификация

### Фаза 2: Главная страница и анимации (2-3 недели)
- ⏳ Главная страница с видео-секциями
- ⏳ Intro loader анимация
- ⏳ Выпадающие меню
- ⏳ Контакты

### Фаза 3: Интернет-магазин (3-4 недели)
- ⏳ Каталог товаров
- ⏳ Страница товара
- ⏳ Корзина
- ⏳ Оформление заказа
- ⏳ Интеграция с платежами

### Фаза 4: Личный кабинет (2-3 недели)
- ⏳ Профиль пользователя
- ⏳ История заказов
- ⏳ Избранное

### Фаза 5: Дашборды (2-3 недели)
- ⏳ Административный дашборд
- ⏳ Управление товарами
- ⏳ Управление заказами
- ⏳ Аналитика

### Фаза 6: WebSocket и реальное время (1-2 недели)
- ⏳ Настройка WebSocket
- ⏳ Обновления статуса заказов
- ⏳ Уведомления

### Фаза 7: Оптимизация и тестирование (2-3 недели)
- ⏳ Оптимизация производительности
- ⏳ Тестирование
- ⏳ SEO оптимизация
- ⏳ Безопасность

---

## 10. ЗАВИСИМОСТИ

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "framer-motion": "^10.16.16",
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.14.2",
    "react-hook-form": "^7.49.2",
    "zod": "^3.22.4",
    "socket.io-client": "^4.6.1",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0"
  }
}
```

### Backend (requirements.txt)
```
Flask==3.1.2
Flask-SQLAlchemy==3.1.1
Flask-Migrate==4.0.5
Flask-SocketIO==5.3.6
Flask-JWT-Extended==4.6.0
Flask-CORS==4.0.0
python-dotenv==1.0.0
psycopg2-binary==2.9.9
redis==5.0.1
celery==5.3.4
pytest==7.4.3
```

---

## 11. МЕДИАФАЙЛЫ (ЧЕКЛИСТ)

### 11.1. Логотипы и брендинг

#### Основные логотипы
- [ ] `static/images/logo.png` - Основной логотип Vavip (используется в шапке и intro loader)
- [ ] `static/images/vavip_logo_text.png` - Текстовый логотип Vavip (используется в футере)
- [ ] `static/favicon.ico` - Favicon для браузера (16x16, 32x32, 48x48)
- [ ] `static/images/favicon-16x16.png` - Favicon 16x16
- [ ] `static/images/favicon-32x32.png` - Favicon 32x32
- [ ] `static/images/apple-touch-icon.png` - Иконка для iOS (180x180)

### 11.2. Видео для главной страницы

#### Фоновые видео секций
- [ ] `static/videos/background1.mp4` - Видео для секции "УЗЕЛ ВВОДА"
- [ ] `static/videos/background2.mp4` - Видео для секции "ПРОЕКТИРОВАНИЕ BIM"
- [ ] `static/videos/background3.mp4` - Видео для секции "МОНТАЖ"
- [ ] `static/videos/background4.mp4` - Видео для секции "МАГАЗИН"

**Требования к видео:**
- Формат: MP4 (H.264)
- Разрешение: 1920x1080 (Full HD) минимум, 4K предпочтительно
- Длительность: 10-30 секунд (зацикленное)
- Размер файла: < 10MB на видео (оптимизировано)
- Без звука (muted)

#### Постеры для видео (fallback)
- [ ] `static/images/video-poster.jpg` - Постер для background1.mp4 (Узел ввода)
- [ ] `static/images/video-poster2.jpg` - Постер для background2.mp4 (Проектирование BIM)
- [ ] `static/images/video-poster3.jpg` - Постер для background3.mp4 (Монтаж)
- [ ] `static/images/video-poster4.jpg` - Постер для background4.mp4 (Магазин)

**Требования к постерам:**
- Формат: JPG
- Разрешение: 1920x1080
- Размер файла: < 500KB

### 11.3. Иконки социальных сетей

#### SVG иконки
- [ ] `static/images/icons/telegram.svg` - Иконка Telegram
- [ ] `static/images/icons/instagram.svg` - Иконка Instagram
- [ ] `static/images/icons/vk.svg` - Иконка VK
- [ ] `static/images/icons/pinterest.svg` - Иконка Pinterest
- [ ] `static/images/icons/youtube.svg` - Иконка YouTube
- [ ] `static/images/icons/whatsapp1.svg` - Иконка WhatsApp (основная)
- [ ] `static/images/icons/whatsapp11.svg` - Иконка WhatsApp (альтернативная)
- [ ] `static/images/icons/green_whatsapp1.svg` - Иконка WhatsApp (зеленая)
- [ ] `static/images/icons/1vk.svg` - Иконка VK (альтернативная)

**Требования к иконкам:**
- Формат: SVG
- Размер: 20x20px - 64x64px (в зависимости от использования)
- Цвет: Монохромные или с возможностью изменения цвета через CSS

### 11.4. Изображения для секции "Контакты"

#### Фоновые изображения
- [ ] `static/images/contacts/contacts-bg-anim.gif` - Анимированный фон для контактов

#### Изображения для плиток разделов (Tom Ford-style)
- [ ] `static/images/contacts/words/word-1.jpg` - Изображение для плитки "УЗЕЛ ВВОДА"
- [ ] `static/images/contacts/words/word-2.jpg` - Изображение для плитки "ПРОЕКТИРОВАНИЕ"
- [ ] `static/images/contacts/words/word-3.jpg` - Изображение для плитки "МОНТАЖ"
- [ ] `static/images/contacts/words/word-4.jpg` - Изображение для плитки "МАГАЗИН"

**Требования к плиткам:**
- Формат: JPG
- Разрешение: 1920x1080 или выше
- Размер файла: < 1MB
- Стиль: Премиальный, в стиле Bork

#### Фотографии городов
- [ ] `static/images/contacts/photo-moscow.jpg` - Фото Москвы
- [ ] `static/images/contacts/photo-spb.jpg` - Фото Санкт-Петербурга
- [ ] `static/images/contacts/photo-krasnodar.jpg` - Фото Краснодара
- [ ] `static/images/contacts/photo-rostov.jpg` - Фото Ростова-на-Дону
- [ ] `static/images/contacts/photo-samara.jpg` - Фото Самары
- [ ] `static/images/contacts/photo-voronezh.jpg` - Фото Воронежа
- [ ] `static/images/contacts/photo-minsk.jpg` - Фото Минска
- [ ] `static/images/contacts/photo-astana.jpg` - Фото Астаны
- [ ] `static/images/contacts/photo-aktobe.jpg` - Фото Актобе
- [ ] `static/images/contacts/photo-tbilisi.jpg` - Фото Тбилиси
- [ ] `static/images/contacts/photo-batumi.jpg` - Фото Батуми
- [ ] `static/images/contacts/photo-dubai.jpg` - Фото Дубая
- [ ] `static/images/contacts/photo-abudhabi.jpg` - Фото Абу-Даби

**Требования к фото городов:**
- Формат: JPG
- Разрешение: 1920x1080 или выше
- Размер файла: < 800KB
- Стиль: Премиальный, архитектурные/городские пейзажи

#### Карты стран
- [ ] `static/images/contacts/maps/map-ru.jpg` - Карта России
- [ ] `static/images/contacts/maps/map-by.jpg` - Карта Беларуси
- [ ] `static/images/contacts/maps/map-kz.jpg` - Карта Казахстана
- [ ] `static/images/contacts/maps/map-ge.jpg` - Карта Грузии
- [ ] `static/images/contacts/maps/map-ae.jpg` - Карта ОАЭ

**Требования к картам:**
- Формат: JPG
- Разрешение: 1920x1080 или выше
- Размер файла: < 500KB
- Стиль: Стилизованные карты с маркерами городов

### 11.5. Placeholder изображения для дропдаунов

#### Изображения для разделов
- [ ] `static/images/placeholder.jpg` - Placeholder для дропдауна "О КОМПАНИИ"
- [ ] `static/images/placeholder.jpg` - Placeholder для дропдауна "УЗЕЛ ВВОДА" (или отдельный файл)
- [ ] `static/images/placeholder.jpg` - Placeholder для дропдауна "ПРОЕКТИРОВАНИЕ BIM" (или отдельный файл)
- [ ] `static/images/placeholder.jpg` - Placeholder для дропдауна "МОНТАЖ" (или отдельный файл)
- [ ] `static/images/placeholder.jpg` - Placeholder для дропдауна "МАГАЗИН" (или отдельный файл)

**Рекомендация:** Создать отдельные изображения для каждого раздела:
- `static/images/dropdowns/about.jpg`
- `static/images/dropdowns/node.jpg`
- `static/images/dropdowns/bim.jpg`
- `static/images/dropdowns/montage.jpg`
- `static/images/dropdowns/shop.jpg`

**Требования:**
- Формат: JPG
- Разрешение: 1920x1080
- Размер файла: < 500KB

### 11.6. Изображения для интернет-магазина (будущее)

#### Изображения товаров
- [ ] `static/images/products/` - Папка для изображений товаров
  - Структура: `products/{category}/{product-slug}/`
  - Форматы: JPG, WebP (для оптимизации)
  - Разрешение: 1200x1200px (квадратные) или 1920x1080 (прямоугольные)
  - Варианты:
    - `main.jpg` - Основное изображение
    - `gallery-1.jpg`, `gallery-2.jpg`, ... - Галерея
    - `thumbnail.jpg` - Миниатюра (300x300)

#### Категории товаров
- [ ] `static/images/categories/category-1.jpg` - Изображение категории 1
- [ ] `static/images/categories/category-2.jpg` - Изображение категории 2
- [ ] И т.д. для каждой категории

**Требования:**
- Формат: JPG или WebP
- Разрешение: 1920x1080
- Размер файла: < 500KB

### 11.7. Изображения для дашборда (будущее)

#### Иконки и иллюстрации
- [ ] `static/images/dashboard/chart-placeholder.svg` - Placeholder для графиков
- [ ] `static/images/dashboard/no-data.svg` - Иллюстрация "Нет данных"
- [ ] `static/images/dashboard/empty-state.svg` - Иллюстрация пустого состояния

### 11.8. Оптимизация изображений

#### Рекомендации по оптимизации
- [ ] Все JPG изображения оптимизированы (сжатие 80-85%)
- [ ] WebP версии созданы для современных браузеров
- [ ] Responsive images: разные размеры для разных экранов
- [ ] Lazy loading для всех изображений ниже fold
- [ ] Использование `<picture>` элемента для адаптивных изображений

#### Структура для оптимизации
```
static/images/
├── [filename].jpg          # Оригинал
├── [filename].webp         # WebP версия
├── [filename]-thumb.jpg    # Миниатюра
└── [filename]-thumb.webp   # WebP миниатюра
```

### 11.9. Чеклист подготовки медиафайлов

#### Перед началом разработки
- [ ] Все логотипы подготовлены в нужных размерах
- [ ] Все видео записаны и оптимизированы
- [ ] Постеры для видео созданы
- [ ] Иконки социальных сетей в SVG формате
- [ ] Фотографии городов подготовлены
- [ ] Карты стран созданы
- [ ] Изображения для плиток готовы

#### Во время разработки
- [ ] Placeholder изображения заменены на финальные
- [ ] Все изображения оптимизированы
- [ ] WebP версии созданы
- [ ] Responsive images настроены
- [ ] Lazy loading реализован

#### Перед запуском
- [ ] Все медиафайлы проверены на качество
- [ ] Размеры файлов оптимизированы
- [ ] Alt-тексты добавлены ко всем изображениям
- [ ] Favicon и иконки для всех платформ готовы
- [ ] Изображения для товаров (если магазин готов)

---

## 12. КРИТЕРИИ ПРИЕМКИ

### 11.1. Функциональность
- ✅ Все функции работают корректно
- ✅ Анимации плавные (60 FPS)
- ✅ Адаптивность на всех устройствах
- ✅ WebSocket работает стабильно

### 11.2. Производительность
- ✅ Lighthouse Score > 90
- ✅ Время загрузки < 3 секунд
- ✅ Bundle size оптимизирован
- ✅ Code splitting реализован

### 11.3. Безопасность
- ✅ HTTPS
- ✅ JWT аутентификация
- ✅ CSRF защита
- ✅ Валидация данных

### 11.4. Тестирование
- ✅ Unit tests покрытие > 80%
- ✅ E2E тесты для критичных путей
- ✅ API тесты

---

## 13. ДОКУМЕНТАЦИЯ

### 12.1. Техническая документация
- API документация (OpenAPI/Swagger)
- Компонентная библиотека (Storybook опционально)
- Архитектурные решения (ADR)

### 12.2. Пользовательская документация
- Руководство пользователя
- FAQ
- Инструкции для администраторов

---

---

## ПРИЛОЖЕНИЕ: СТРУКТУРА МЕДИАФАЙЛОВ

```
static/
├── images/
│   ├── logo.png
│   ├── vavip_logo_text.png
│   ├── favicon.ico
│   ├── video-poster.jpg
│   ├── video-poster2.jpg
│   ├── video-poster3.jpg
│   ├── video-poster4.jpg
│   ├── placeholder.jpg
│   ├── icons/
│   │   ├── telegram.svg
│   │   ├── instagram.svg
│   │   ├── vk.svg
│   │   ├── pinterest.svg
│   │   ├── youtube.svg
│   │   ├── whatsapp1.svg
│   │   ├── whatsapp11.svg
│   │   └── green_whatsapp1.svg
│   ├── contacts/
│   │   ├── contacts-bg-anim.gif
│   │   ├── words/
│   │   │   ├── word-1.jpg
│   │   │   ├── word-2.jpg
│   │   │   ├── word-3.jpg
│   │   │   └── word-4.jpg
│   │   ├── maps/
│   │   │   ├── map-ru.jpg
│   │   │   ├── map-by.jpg
│   │   │   ├── map-kz.jpg
│   │   │   ├── map-ge.jpg
│   │   │   └── map-ae.jpg
│   │   ├── photo-moscow.jpg
│   │   ├── photo-spb.jpg
│   │   ├── photo-krasnodar.jpg
│   │   ├── photo-rostov.jpg
│   │   ├── photo-samara.jpg
│   │   ├── photo-voronezh.jpg
│   │   ├── photo-minsk.jpg
│   │   ├── photo-astana.jpg
│   │   ├── photo-aktobe.jpg
│   │   ├── photo-tbilisi.jpg
│   │   ├── photo-batumi.jpg
│   │   ├── photo-dubai.jpg
│   │   └── photo-abudhabi.jpg
│   ├── products/          # Для будущего магазина
│   │   └── [category]/
│   │       └── [product-slug]/
│   │           ├── main.jpg
│   │           ├── gallery-1.jpg
│   │           └── thumbnail.jpg
│   └── categories/        # Для будущего магазина
│       └── category-*.jpg
└── videos/
    ├── background1.mp4
    ├── background2.mp4
    ├── background3.mp4
    └── background4.mp4
```

---

**Версия документа**: 2.0  
**Дата создания**: 2024  
**Последнее обновление**: 2024  
**Статус**: Активная разработка
