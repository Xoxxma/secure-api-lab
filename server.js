const express = require('express');
const { users, documents, employees } = require('./data');

const app = express();
const PORT = 3000;

// Middleware для автоматичного парсингу JSON-тіла запиту
app.use(express.json());
// ================== LOGGING MIDDLEWARE ==================

const loggingMiddleware = (req, res, next) => {
  const { method, url } = req;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] ${method} ${url}`);

  next();
};

// підключаємо логування ДО маршрутів
app.use(loggingMiddleware);

// Middleware для автоматичного парсингу JSON-тіла запиту
app.use(express.json());

// ================== MIDDLEWARE ==================

// Перевірка логіна/пароля з заголовків запиту
const authMiddleware = (req, res, next) => {
  const login = req.headers['x-login'];
  const password = req.headers['x-password'];

  const user = users.find((u) => u.login === login && u.password === password);

  if (!user) {
    return res.status(401).json({
      message:
        'Authentication failed. Please provide valid credentials in headers X-Login and X-Password.',
    });
  }

  req.user = user;
  next();
};

// Перевірка ролі адміністратора
const adminOnlyMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res
      .status(403)
      .json({ message: 'Access denied. Admin role required.' });
  }

  next();
};

// ================== ROUTES ==================

// Документи: доступні всім аутентифікованим користувачам
app.get('/documents', authMiddleware, (req, res) => {
  res.status(200).json(documents);
});

app.post('/documents', authMiddleware, (req, res) => {
  const newDocument = req.body;
  newDocument.id = Date.now();
  documents.push(newDocument);
  res.status(201).json(newDocument);
});

// Співробітники: тільки для адміністраторів
app.get('/employees', authMiddleware, adminOnlyMiddleware, (req, res) => {
  res.status(200).json(employees);
});

// ================== START SERVER ==================

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
