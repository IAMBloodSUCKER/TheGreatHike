# Архитектура TheGreatHike

## Обзор

TheGreatHike — микросервисное веб-приложение из трёх backend-сервисов, единой точки входа (API Gateway), SPA-фронтенда и PostgreSQL.

```mermaid
flowchart TB
    subgraph Client["Браузер пользователя"]
        UI[React SPA<br/>Nginx :3000]
    end

    subgraph Gateway["API Gateway :8080"]
        GW[Spring Cloud Gateway<br/>маршрутизация + CORS]
    end

    subgraph Services["Микросервисы"]
        AUTH[auth-service :8081<br/>логин, регистрация, капча, JWT]
        TRACK[tracking-service :8082<br/>походы, статистика, экспорт]
    end

    subgraph Data["Данные"]
        PG[(PostgreSQL<br/>схемы auth + tracking)]
    end

    UI -->|/api/*| GW
    GW -->|/api/auth/**| AUTH
    GW -->|/api/tracking/**| TRACK
    AUTH --> PG
    TRACK --> PG
```

## Поток запросов

### Регистрация / вход

```mermaid
sequenceDiagram
    participant U as Пользователь
    participant F as Frontend
    participant G as API Gateway
    participant A as auth-service
    participant DB as PostgreSQL

    U->>F: Заполняет форму + капча
    F->>G: GET /api/auth/captcha
    G->>A: captcha
    A->>DB: сохранить challenge
    A-->>F: captchaId + PNG base64
    F->>G: POST /api/auth/register
    G->>A: register
    A->>DB: users (bcrypt hash)
    A-->>F: JWT token
    F->>F: localStorage token
```

### Отметка похода

```mermaid
sequenceDiagram
    participant F as Frontend
    participant G as API Gateway
    participant T as tracking-service
    participant DB as PostgreSQL

    F->>G: POST /api/tracking/visits<br/>Authorization: Bearer JWT
    G->>T: proxy
    T->>T: JwtAuthFilter → userId
    T->>T: count × gramsPerTier
    T->>DB: INSERT visit
    T-->>F: VisitResponse
```

## Сервисы

| Сервис | Порт | Ответственность |
|--------|------|-----------------|
| **frontend** | 3000 (80 в контейнере) | UI, прокси `/api` → gateway |
| **api-gateway** | 8080 | Единая точка API, CORS |
| **auth-service** | 8081 | Регистрация, вход, капча, JWT, пользовательское соглашение |
| **tracking-service** | 8082 | CRUD походов, агрегация статистики, fun facts, CSV-экспорт |
| **postgres** | 5432 | Хранение данных |

## Схема БД

```mermaid
erDiagram
  users {
    uuid id PK
    string username UK
    string password_hash
    boolean terms_accepted
    timestamp created_at
  }

  captcha_challenges {
    uuid id PK
    string answer_hash
    timestamp expires_at
    boolean used
  }

  visits {
    uuid id PK
    uuid user_id
    int count
    string consistency
    int total_grams
    string note
    timestamp visited_at
  }

  users ||--o{ visits : "логически по user_id"
```

Схемы PostgreSQL разделены: `auth.*` и `tracking.*`.

## Безопасность

- Пароли — **BCrypt**, в БД только хэш
- API tracking защищён **JWT** (тот же секрет, что в auth-service)
- Капча одноразовая, TTL 5 минут
- Данные не уходят во внешние сервисы

## Масштабирование

Каждый микросервис — отдельный Docker-образ. Можно горизонтально масштабировать `auth-service` и `tracking-service` за балансировщиком, gateway маршрутизирует по `AUTH_SERVICE_URL` / `TRACKING_SERVICE_URL`.

## Стек

- Java 21, Spring Boot 3.3, Spring Cloud Gateway
- React 18, Vite, Recharts
- PostgreSQL 16
- Docker Compose
