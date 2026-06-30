# Документация разработчика TheGreatHike

Полное руководство: что зачем, куда и как запустить.

## Идея проекта

TheGreatHike — веб-приложение для учёта туалетных визитов в игровой форме. Пользователь после каждого «похода» указывает:

1. **Количество раз** за один подход (1–20)
2. **Объём/консистенцию** по шкале из 5 уровней

Каждому уровню соответствуют условные граммы и SVG-иконка. Приложение считает сумму за день/неделю/месяц/год и показывает сравнения («15 бананов», «3 тонны = N бегемотов»).

### Зачем это нужно

| Сценарий | Описание |
|----------|----------|
| Игра | Соревнование с друзьями (в будущем — лидерборды) |
| Здоровье | Личный дневник + экспорт CSV для врача |
| Мем | «За год я произвёл 3 тонны» |

**Важно:** приложение не является медицинским изделием.

---

## Структура репозитория

```
TheGreatHike/
├── docker-compose.yml      # Полный стек одной командой
├── deploy/init-db.sql      # Схемы PostgreSQL
├── docs/                   # Архитектура и эта документация
├── frontend/               # React SPA
├── services/
│   ├── api-gateway/        # Spring Cloud Gateway
│   ├── auth-service/       # Авторизация, капча, соглашение
│   └── tracking-service/   # Походы и статистика
└── README.md               # Для пользователей
```

---

## API

Базовый URL в Docker: `http://localhost:3000/api` (через nginx) или `http://localhost:8080/api` (напрямую gateway).

### Auth (`/api/auth`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/captcha` | Новая капча (id + base64 PNG) |
| GET | `/terms` | Текст пользовательского соглашения |
| POST | `/register` | Регистрация |
| POST | `/login` | Вход |

Тело регистрации:

```json
{
  "username": "hiker",
  "password": "secret12",
  "captchaId": "uuid",
  "captchaAnswer": "AB3XY",
  "termsAccepted": true
}
```

Ответ: `{ "token": "...", "username": "hiker" }`

### Tracking (`/api/tracking`, требуется `Authorization: Bearer <token>`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/dashboard` | Статистика + недавние походы + уровни |
| POST | `/visits` | Создать запись |
| DELETE | `/visits/{id}` | Удалить запись |
| GET | `/visits?from=&to=` | История |
| GET | `/export` | CSV-файл |

Тело создания похода:

```json
{
  "count": 2,
  "consistency": "MEDIUM",
  "visitDate": "2026-06-28",
  "note": "после кофе"
}
```

`visitDate` — дата похода в формате `YYYY-MM-DD` (сегодня или до года назад, не в будущем).

Уровни `consistency`: `TINY`, `SMALL`, `MEDIUM`, `LARGE`, `GIANT`.

---

## Локальная разработка без Docker

### Требования

- JDK 21
- Maven 3.9+
- Node.js 20+
- PostgreSQL 16

### База данных

```sql
CREATE DATABASE thegreathike;
CREATE USER thegreathike WITH PASSWORD 'thegreathike';
GRANT ALL ON DATABASE thegreathike TO thegreathike;
\c thegreathike
CREATE SCHEMA auth;
CREATE SCHEMA tracking;
```

### Backend

```bash
# Терминал 1
cd services/auth-service && mvn spring-boot:run

# Терминал 2
cd services/tracking-service && mvn spring-boot:run

# Терминал 3
cd services/api-gateway && mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Откройте http://localhost:5173 (прокси на gateway :8080).

### Тесты

```bash
mvn test -pl services/tracking-service
```

---

## Развёртывание (Docker)

### Продакшен

1. Скопируйте `.env.example` → `.env`
2. Задайте надёжный `JWT_SECRET` (минимум 32 символа)
3. Запустите:

```bash
docker compose up --build -d
```

4. Проверка:

```bash
docker compose ps
curl http://localhost:8080/actuator/health
```

5. UI: http://localhost:3000

### Остановка и очистка

```bash
docker compose down          # остановить
docker compose down -v       # + удалить volume PostgreSQL
```

### Переменные окружения

| Переменная | Сервис | Описание |
|------------|--------|----------|
| `JWT_SECRET` | auth, tracking | Общий секрет подписи JWT |
| `DB_*` | auth, tracking | Подключение к PostgreSQL |

---

## Пользовательское соглашение

Текст хранится в `TermsService` (auth-service) и отдаётся API `/api/auth/terms`. При регистрации пользователь обязан принять условия (`termsAccepted: true`).

Ключевые пункты:

- Оператор — физлицо-разработчик, без раскрытия персональных данных
- Данные не передаются третьим лицам
- Приложение не заменяет врача
- Право на удаление аккаунта через Issues репозитория

---

## Fun facts (сравнения)

Логика в `FunFactService`:

| Объект | Масса для сравнения |
|--------|---------------------|
| Банан | 120 г |
| Яблоко | 180 г |
| Слонёнок | 90 кг |
| Бегемот | 1,5 т |
| Легковое авто | 1,4 т |
| Штанга | 20 кг |

Выбирается наиболее подходящее сравнение для текущей массы.

---

## Дальнейшее развитие

- Лидерборды и «соревнования с друзьями»
- Напоминания
- Мобильное PWA
- Удаление аккаунта через UI

---

## Контакты

Вопросы и запросы на удаление данных — через Issues в репозитории проекта.
