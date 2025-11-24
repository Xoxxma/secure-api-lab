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
  const { title, content } = req.body;

  // Перевірка, чи передані всі необхідні поля
  if (!title || !content) {
    return res.status(400).json({
      message: 'Bad Request. Fields "title" and "content" are required.',
    });
  }

  const newDocument = {
    id: Date.now(),
    title,
    content,
  };

  documents.push(newDocument);
  res.status(201).json(newDocument);
});


// Новий маршрут для видалення документа за id
app.delete('/documents/:id', authMiddleware, (req, res) => {
  // Отримуємо id з параметрів маршруту
  const documentId = parseInt(req.params.id, 10);

  const documentIndex = documents.findIndex(
    (doc) => doc.id === documentId,
  );

  // Якщо документ з таким id не знайдено
  if (documentIndex === -1) {
    return res.status(404).json({ message: 'Document not found' });
  }

  // Видаляємо документ з масиву
  documents.splice(documentIndex, 1);

  // 204 No Content — успішне видалення, без тіла відповіді
  res.status(204).send();
});


// Співробітники: тільки для адміністраторів
app.get('/employees', authMiddleware, adminOnlyMiddleware, (req, res) => {
  res.status(200).json(employees);
});

// ================== START SERVER ==================

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
