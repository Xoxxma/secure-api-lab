# Workshop 3 – Secure REST API (secure-api-lab)

Лабораторно-практична робота №3: **розробка та тестування захищеного REST API** на базі Node.js та Express.

API працює з двома основними ресурсами:

- `/documents` – документи компанії;
- `/employees` – список співробітників (конфіденційні дані, тільки для admin).

Реалізовано:

- захищені ендпоінти (аутентифікація + авторизація за ролями);
- middleware для логування всіх запитів;
- коректні HTTP-коди (200, 201, 204, 400, 401, 403, 404);
- Node.js-скрипт `test-client.js` для автоматичного тестування API.

---

## 1. Технології

- **Node.js** (серверне середовище виконання JavaScript)
- **Express** (фреймворк для створення веб-сервісів та REST API)
- **Postman** (ручне тестування ендпоінтів)
- Вбудований **`fetch`** у Node.js (для `test-client.js`)
- **Git + GitHub** (контроль версій та публічний репозиторій)

---

## 2. Структура проєкту

Основні файли:

    secure-api-lab/
    ├─ data.js          # "База даних" у пам'яті (users, documents, employees)
    ├─ server.js        # Сервер Express, middleware, маршрути та логіка API
    ├─ test-client.js   # Node.js-скрипт для програмного тестування API
    ├─ package.json     # Маніфест проєкту: залежності, npm-скрипти
    ├─ .gitignore       # Ігнорування node_modules та службових файлів
    └─ README.md        # Документація проєкту (цей файл)

---

## 3. Встановлення та запуск

### 3.1. Клонування репозиторію

(Приклад; заміни на власний URL)

    git clone https://github.com/<your-username>/secure-api-lab.git
    cd secure-api-lab

### 3.2. Встановлення залежностей

    npm install

### 3.3. Скрипти npm

У `package.json` налаштовані скрипти:

    "scripts": {
      "start": "node server.js",
      "test": "node test-client.js"
    }

Запуск сервера:

    npm start

Після запуску сервер слухає:

    http://localhost:3000

---

## 4. Аутентифікація та авторизація

### 4.1. Користувачі та ролі

У файлі `data.js` описані користувачі:

- `user1 / password123` – звичайний користувач з роллю `user`;
- `admin1 / password123` – адміністратор з роллю `admin`.

Аутентифікація виконується через HTTP-заголовки:

- `X-Login`
- `X-Password`

### 4.2. Аутентифікація (authMiddleware)

У `server.js` реалізовано middleware:

- читає `X-Login` і `X-Password` із заголовків;
- шукає відповідного користувача в `users[]`;
- якщо немає – повертає `401 Unauthorized` з повідомленням:
  `Authentication failed. Please provide valid credentials in headers X-Login and X-Password.`;
- якщо є – додає об’єкт користувача в `req.user` і викликає `next()`.

### 4.3. Авторизація (adminOnlyMiddleware)

Ще один middleware:

- перевіряє, що `req.user.role === 'admin'`;
- якщо ні – повертає `403 Forbidden` з повідомленням:
  `Access denied. Admin role required.`;
- якщо так – пускає далі.

---

## 5. Middleware для логування

Middleware `loggingMiddleware` реєструє кожен запит:

- поточний час (`new Date().toISOString()`),
- HTTP-метод (`req.method`),
- URL (`req.url`).

Приклад рядка у консолі:

    [2025-11-24T11:55:10.123Z] GET /documents

Підключається глобально:

- `app.use(loggingMiddleware);` – **до** оголошення маршрутів, щоб логувати всі запити.

---

## 6. API ендпоінти

### 6.1. Огляд

| Метод | URL                 | Опис                                          | Хедери для доступу                | Тіло запиту (JSON)                               | Можливі статуси                                                  |
|-------|---------------------|-----------------------------------------------|-----------------------------------|--------------------------------------------------|------------------------------------------------------------------|
| GET   | `/documents`        | Отримати список документів                    | `X-Login`, `X-Password`           | –                                                | `200 OK`, `401 Unauthorized`                                     |
| POST  | `/documents`        | Створити новий документ                       | `X-Login`, `X-Password`           | `{ "title": "...", "content": "..." }`           | `201 Created`, `400 Bad Request`, `401 Unauthorized`             |
| DELETE| `/documents/:id`    | Видалити документ за `id`                     | `X-Login`, `X-Password` (admin)   | –                                                | `204 No Content`, `401 Unauthorized`, `404 Not Found`, `403`*    |
| GET   | `/employees`        | Отримати список співробітників (конфіденційно)| `X-Login`, `X-Password` (admin)   | –                                                | `200 OK`, `401 Unauthorized`, `403 Forbidden`                    |
| GET   | `/non-existent`     | Будь-який неіснуючий маршрут                  | (необов’язково)                   | –                                                | `404 Not Found`                                                  |

\* Якщо до `DELETE /documents/:id` звертається користувач без прав admin, він теж отримає `403 Forbidden`, якщо це перевіряється додатково (опційно).

### 6.2. Приклади запитів

#### Отримання документів як звичайний користувач

- Метод: `GET`
- URL: `http://localhost:3000/documents`
- Headers:
  - `X-Login: user1`
  - `X-Password: password123`
- Очікуваний статус: `200 OK`.

#### Отримання співробітників як звичайний користувач (заборонено)

- Метод: `GET`
- URL: `http://localhost:3000/employees`
- Headers:
  - `X-Login: user1`
  - `X-Password: password123`
- Очікуваний статус: `403 Forbidden`.

#### Отримання співробітників як admin

- Метод: `GET`
- URL: `http://localhost:3000/employees`
- Headers:
  - `X-Login: admin1`
  - `X-Password: password123`
- Очікуваний статус: `200 OK`.

#### Створення документа (успіх)

- Метод: `POST`
- URL: `http://localhost:3000/documents`
- Headers:
  - `X-Login: user1`
  - `X-Password: password123`
  - `Content-Type: application/json`
- Body (JSON):

      {
        "title": "Test Doc",
        "content": "Demo content for the new document."
      }

- Очікуваний статус: `201 Created`.

#### Створення документа (помилка валідації)

- Body (JSON):

      {
        "content": "Only content, no title"
      }

- Очікуваний статус: `400 Bad Request`.

#### Видалення документа

- Метод: `DELETE`
- URL: `http://localhost:3000/documents/1`
- Headers:
  - `X-Login: admin1`
  - `X-Password: password123`
- Очікуваний статус: `204 No Content` (якщо документ існував) або `404 Not Found` (якщо вже видалений).

---

## 7. Тестування

### 7.1. Через браузер

1. Запустіть сервер:

       npm start

2. Відкрийте `http://localhost:3000/documents` у браузері.  
   Оскільки заголовки не передаються, очікуємо `401 Unauthorized` з повідомленням про аутентифікацію.

### 7.2. Через Postman

Рекомендується створити колекцію з такими запитами:

- `GET /documents` без заголовків → `401 Unauthorized`;
- `GET /documents` з `user1/password123` → `200 OK`;
- `GET /employees` з `user1/password123` → `403 Forbidden`;
- `GET /employees` з `admin1/password123` → `200 OK`;
- `POST /documents` (валідне тіло) з `user1` → `201 Created`;
- `POST /documents` (без `title`) → `400 Bad Request`;
- `DELETE /documents/1` з `admin1` → `204 No Content`;
- `GET /non-existent` → `404 Not Found`.

Ці ж сценарії описані у методичці як обов’язкові для демонстрації роботи API.

### 7.3. Автотестування через Node.js-скрипт

Файл `test-client.js` виконує кілька типових сценаріїв:

- `GET /documents` від імені `user1` (очікуємо `200`);
- `GET /employees` від імені `user1` (очікуємо `403`);
- `GET /employees` від імені `admin1` (очікуємо `200`).

Запуск скрипта (сервер повинен уже працювати):

    npm test

Очікуваний вивід у консолі `test-client.js`:

- заголовок `--- Running API Tests ---`;
- для кожного тесту – статус відповіді та отримані дані.

---

## 8. Скриншоти
 /screenshots/
