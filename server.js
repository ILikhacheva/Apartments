// Загрузка переменных окружения из .env
// Loading environment variables from .env
require("dotenv").config();

// Импортируем необходимые модули
// Import required modules
const express = require("express");
const bcrypt = require("bcrypt"); // Для хеширования паролей / For password hashing
const cors = require("cors"); // Для кросс-доменных запросов / For cross-origin requests
const { Pool } = require("pg"); // PostgreSQL клиент / PostgreSQL client
const multer = require("multer"); // Для загрузки файлов
const path = require("path");
const app = express(); // Экземпляр приложения Express / Express app instance

// Настраиваем CORS для разрешения кросс-доменных запросов
// Configure CORS to allow cross-origin requests
app.use(
  cors({
    origin: "*", // Разрешаем запросы с любого домена / Allow requests from any domain
  })
);

// Подключаем обслуживание статических файлов из текущей директории
// Serve static files from current directory
app.use(express.static(__dirname));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Подключаем middleware для парсинга JSON в запросах
// Attach middleware for parsing JSON in requests
app.use(express.json());

// Создаем пул подключений к PostgreSQL базе данных
// Create a connection pool to PostgreSQL database
// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    // Сохраняем оригинальное имя файла
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage });
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "Asuntolat",
  user: process.env.DB_USER || "Asuntolat",
  password: process.env.DB_PASSWORD || "12345",
});

// Запускаем сервер на порту 3000
// Start server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Вход пользователя (POST /login)
// User login (POST /login)
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required." });
    }
    // Найти пользователя по email
    // Find user by email
    const userResult = await pool.query(
      "SELECT user_id, user_password FROM users WHERE user_login = $1",
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    const user = userResult.rows[0];
    // Проверить пароль
    // Check password
    const match = await bcrypt.compare(password, user.user_password);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    // Можно добавить генерацию токена, но пока просто успех
    // You can add token generation, but for now just success
    res.json({ success: true, userName: user.user_login });
  } catch (err) {
    console.error("DB ERROR /login:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// Добавить квартиру
// Add apart (POST /add-apart-full)
app.post("/add-apart-full", upload.single("AddFile"), async (req, res) => {
  const { AddApart } = req.body;
  const file = req.file;
  if (!file || !AddApart) {
    return res.status(400).json({ error: "Invalid data" });
  }
  const fileName = file.filename;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Вставляем квартиру
    const insQ = await client.query(
      "INSERT INTO apartments (apart_address, apart_name) VALUES ($1, $2) RETURNING apart_id",
      [AddApart, fileName]
    );
    await client.query("COMMIT");
    res.json({ success: true, apartId: insQ.rows[0].apart_id });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DB ERROR /add-apart-full:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    client.release();
  }
});

app.get("/apartments", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT apart_id, apart_address, apart_name FROM apartments"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

// Добавить сотрудника
// Add employee (POST /add-em-full)
app.post("/add-em-full", upload.single("AddEmFile"), async (req, res) => {
  const { person_name, person_discr, phone } = req.body;
  const file = req.file;
  if (!file || !person_name || !person_discr || !phone) {
    return res.status(400).json({ error: "Invalid data" });
  }
  const fileName = file.filename;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Вставляем работника
    const insQ = await client.query(
      "INSERT INTO about(person_name, person_discr, phone, photo_name) VALUES ($1, $2, $3, $4) RETURNING person_id",
      [person_name, person_discr, phone, fileName]
    );
    await client.query("COMMIT");
    res.json({ success: true, personId: insQ.rows[0].person_id });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DB ERROR /add-em-full:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    client.release();
  }
});

app.get("/about", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT person_id, person_name, person_discr, phone, photo_name FROM about"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});
