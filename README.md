# Iceberg

Iceberg — это приложение, состоящее из двух основных частей: сервера и мобильного приложения.

## Описание

**Iceberg** включает в себя серверную часть, написанную на Node.js с использованием Express, Prisma и других популярных библиотек, а также мобильное приложение, использующее Expo и React Native. Это приложение предназначено для предоставления функционала для взаимодействия с пользователем, обработки данных и обеспечения высокой производительности.

## Структура проекта

### 1. **Сервер**

Серверная часть проекта расположена в каталоге `server/` и включает следующие компоненты:

- **Основной файл**: `index.js`
- **Зависимости**: включает такие библиотеки, как Express, Prisma, bcryptjs, nodemailer и другие для работы с базой данных, авторизацией и отправкой сообщений.

#### Основные команды для сервера:
- `npm start` — запуск сервера.
- `npm run dev` — запуск сервера в режиме разработки с использованием `nodemon`.
- `npm run prisma:generate` — генерация Prisma клиента.
- `npm run prisma:migrate` — выполнение миграций базы данных.

### 2. **Мобильное приложение**

Мобильное приложение находится в каталоге `mobile/` и построено с использованием Expo и React Native.

#### Основные команды для мобильного приложения:
- `npm start` — запуск приложения.
- `npm run android` — запуск на Android устройстве.
- `npm run ios` — запуск на iOS устройстве.
- `npm run web` — запуск веб-версии приложения.

### Зависимости

#### Сервер:
- Express
- Prisma
- bcryptjs
- nodemailer
- и другие.

#### Мобильное приложение:
- Expo
- React Navigation
- Redux Toolkit
- axios
- и другие.

## Установка

Для того чтобы запустить проект локально, выполните следующие шаги:

### Сервер:
1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/abukar-mutaliev/iceberg.git
   
2. Перейдите в директорию с сервером:
    ```bash
   cd server
   
3. Установите зависимости:
    ```bash
   npm install

### Мобильное приложение:
1. Перейдите в директорию с мобильным приложением:
    ```bash
   cd mobile

2. Установите зависимости:
     ```bash
   npm install
