# TheGreatHike

Трекер визитов в туалет: записи, статистика по периодам, сравнения с предметами (бананы, слоны и т.п.).

<p align="center">
  <img src="docs/readme-banner.png" alt="TheGreatHike" width="640">
</p>

## Возможности

- Отметка визита: количество за подход и объём (5 уровней)
- Статистика: день, неделя, месяц, год
- Сравнения с реальными предметами
- Экспорт CSV
- Регистрация, вход, восстановление пароля по ключевой фразе

## Запуск

Нужны [Docker](https://www.docker.com/) и Docker Compose.

```bash
git clone https://github.com/IAMBloodSUCKER/TheGreatHike.git
cd TheGreatHike
docker compose up --build -d
```

Сайт: **http://localhost:3000**

PostgreSQL снаружи: `localhost:5433`, БД `thegreathike`, пользователь и пароль `thegreathike`.

Остановка:

```bash
docker compose down
```

## Шкала объёма

| Уровень   | ~грамм |
|-----------|--------|
| Крошка    | 50     |
| Малютка   | 100    |
| Стандарт  | 200    |
| Богатырь  | 350    |
| Верзила   | 500    |

Значения условные, для визуализации.

## Дисклеймер

Не медицинский продукт. При проблемах со здоровьем — к врачу.

## Разработка

См. [`docs/`](docs/).

## Лицензия

MIT
