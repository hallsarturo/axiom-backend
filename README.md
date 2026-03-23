# Axiom Backend

> A social network for philosophers and thinkers to share and debate ideas.

**Live API Docs:** [api.axiomlab.space/api/docs](https://api.axiomlab.space/api/docs/)

---

## Table of Contents

- [Description](#description)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
- [Usage](#usage)
- [API Overview](#api-overview)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [Deployment](#deployment)
- [Contact](#contact)

---

## Description

Axiom Backend is the server-side component of the Axiom platform — a social network designed for philosophers, academics, and thinkers. It exposes a RESTful API handling authentication (including Google OAuth and ORCID), user profiles, posts, comments, reactions, real-time chat via WebSockets, notifications, search, and more.

---

## Tech Stack

| Layer           | Technology                                      |
|----------------|-------------------------------------------------|
| Runtime         | Node.js (ESM)                                   |
| Framework       | Express 5                                       |
| Database        | PostgreSQL                                      |
| ORM             | Sequelize 6                                     |
| Authentication  | JWT · Passport.js (Local, Google OAuth, ORCID)  |
| Sessions        | express-session + connect-pg-simple             |
| Real-time       | WebSockets (ws)                                 |
| File Uploads    | Multer                                          |
| Logging         | Winston + Morgan + rotating-file-stream         |
| Error Tracking  | Sentry                                          |
| API Docs        | Swagger UI (swagger-jsdoc)                      |
| Process Manager | PM2                                             |
| Security        | Helmet · bcrypt · express-rate-limit            |

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** or **yarn**
- **PostgreSQL** (running locally or remotely)
- **PM2** (for production deployments): `npm install -g pm2`

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/hallsarturo/axiom-backend.git
   cd axiom-backend
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

### Environment Variables

The app loads environment variables from different files depending on the environment:

| Environment   | File                |
|--------------|---------------------|
| Development  | `.env.development`  |
| Production   | `.env.production`   |

Create the appropriate file and populate it with the following variables:

```env
# App
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=axiom_development
DB_USER=postgres
DB_PASSWORD=your_password

# Auth
JWT_SECRET=your_jwt_secret
JWT_ISSUER=your_issuer
JWT_AUDIENCE=your_audience
SESSION_COOKIE_DOMAIN=localhost

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ORCID_CLIENT_ID=your_orcid_client_id
ORCID_CLIENT_SECRET=your_orcid_client_secret

# Twilio (optional, for SMS)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# Sentry (optional, for error tracking)
SENTRY_DSN=your_sentry_dsn
```

### Database Setup

1. **Ensure PostgreSQL is running** and the databases exist:
   ```sh
   # Development
   createdb axiom_development

   # Production
   createdb axiom_production
   ```

2. **Run migrations:**
   ```sh
   npx sequelize-cli db:migrate
   ```

3. **(Optional) Seed the database:**
   ```sh
   npx sequelize-cli db:seed:all
   ```

---

## Usage

### Development

Starts the server with `nodemon` for hot-reloading:

```sh
npm run dev
```

The API will be available at `http://localhost:4000`.

### Production

```sh
npm start
```

Or using PM2:

```sh
pm2 start ecosystem.config.cjs
pm2 save
```

### API Documentation

Interactive Swagger docs are available at:

```
http://localhost:4000/api/docs
```

Or live at: [api.axiomlab.space/api/docs](https://api.axiomlab.space/api/docs/)

---

## API Overview

| Module          | Base Path                | Description                              |
|----------------|--------------------------|------------------------------------------|
| Health          | `/api/health`            | Server health check                      |
| Auth            | `/api/auth`              | Login, signup, logout, OAuth             |
| User            | `/api/user`              | Profiles, followers, followings          |
| Posts           | `/api/posts`             | Create, read, update, delete posts       |
| Comments        | `/api/comments`          | Post comments and replies                |
| Reactions       | `/api/reactions`         | Reactions to posts and comments          |
| Notifications   | `/api/notifications`     | User notifications                       |
| Chat            | `/api/chat`              | Real-time chat (WebSocket + REST)        |
| Search          | `/api/search`            | Search users, posts, and content         |
| Dashboard       | `/api/dashboard`         | Aggregated feed and dashboard data       |
| Analytics       | `/api/analytics`         | Platform usage analytics                 |

---

## Folder Structure

```
axiom-backend/
├── api/                 # Route handlers grouped by feature
│   ├── analytics/
│   ├── auth/
│   ├── chat/
│   ├── comments/
│   ├── dashboard/
│   ├── health/
│   ├── notifications/
│   ├── posts/
│   ├── search/
│   └── user/
├── certificates/        # SSL/TLS certificates
├── config/              # Sequelize and app configuration
├── data/                # Static data files and DB dumps
├── lib/                 # Utility modules (auth, logging, uploads, etc.)
├── log/                 # Rotating log files
├── migrations/          # Sequelize migration scripts
├── models/              # Sequelize models
├── public/              # Public assets (e.g., user uploads)
├── seeders/             # Database seed scripts
├── ecosystem.config.cjs # PM2 process manager config
├── index.js             # App entry point
├── instrument.js        # Sentry instrumentation
├── swagger.js           # Swagger/OpenAPI spec setup
└── package.json
```

---

## Contributing

1. Fork the repository
2. Create your feature branch:
   ```sh
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```sh
   git commit -am 'feat: add your feature description'
   ```
4. Push to your branch:
   ```sh
   git push origin feature/your-feature-name
   ```
5. Open a pull request against `main`

---

## Deployment

The project uses **PM2** for process management in production. The `ecosystem.config.cjs` file is pre-configured:

```sh
# Start with PM2
pm2 start ecosystem.config.cjs

# Monitor
pm2 monit

# View logs
pm2 logs axiom-backend
```

Ensure `.env.production` is populated before starting in production mode.

---

## Contact

For questions or support, open an [issue on GitHub](https://github.com/hallsarturo/axiom-backend/issues) or contact the maintainers.

---

**Author:** Arturo Proal · **License:** ISC