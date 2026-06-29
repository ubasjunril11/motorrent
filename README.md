# MotorRent - Motorcycle Rental Application

A full-stack motorcycle rental platform with a React Native (Expo) mobile app, Node.js/Express REST API, MySQL database, JWT authentication, and Gemini AI assistant.

## Features

### Customer (Guest & Authenticated)
- Browse homepage and motorcycle listings without login
- View motorcycle details without login
- Register / login (single login page, role auto-detected)
- Create rental bookings (login required)
- View and cancel booking history
- Manage profile
- Gemini AI assistant for motorcycle recommendations

### Admin (Pre-created accounts)
- Administrative dashboard with stats
- Add, edit, delete motorcycle listings (with image upload)
- Monitor and approve/reject booking requests
- Manage customer accounts (activate/deactivate/delete)

### AI Assistant
- Recommends motorcycles based on budget, purpose, capacity, and price
- Does **not** perform bookings or modify data
- Redirects users to the booking flow when they try to reserve via chat

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Mobile   | React Native, Expo, Expo Router     |
| Backend  | Node.js, Express                    |
| Database | MySQL                               |
| Auth     | JWT (jsonwebtoken + bcryptjs)       |
| AI       | Google Gemini API                   |
| Uploads  | Multer (local file storage)         |

## Project Structure

```
motor-rent/
├── backend/           # Express REST API
│   └── src/
│       ├── config/    # Database connection
│       ├── controllers/
│       ├── middleware/ # Auth, upload, errors
│       ├── routes/
│       └── utils/     # Seed script
├── mobile/            # Expo React Native app
│   ├── app/           # Expo Router screens
│   ├── components/
│   ├── context/
│   ├── services/
│   └── constants/
└── database/
    └── schema.sql     # MySQL schema
```

## Prerequisites

- Node.js 18+
- MySQL 8+
- Expo Go app (for mobile testing) or Android/iOS emulator
- Google Gemini API key (for AI assistant)

## Setup Instructions

### 1. Database

```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials, JWT secret, and Gemini API key
npm install
npm run seed    # Creates admin account + sample motorcycles
npm run dev     # Starts API on http://localhost:5000
```

**Default Admin Account:**
- Email: `admin@motorrent.com`
- Password: `Admin@123`

### 3. Mobile App

```bash
cd mobile
npm install
npx expo start
```

**API URL Configuration:** Edit `mobile/constants/theme.ts` if your backend runs on a different host. For physical devices, replace `localhost` with your computer's local IP address.

## API Endpoints

### Public
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/health                 | Health check             |
| GET    | /api/motorcycles            | List motorcycles         |
| GET    | /api/motorcycles/featured   | Featured motorcycles     |
| GET    | /api/motorcycles/:id        | Motorcycle details       |
| POST   | /api/auth/register          | Customer registration    |
| POST   | /api/auth/login             | Login (auto role detect) |
| POST   | /api/ai/chat                | AI assistant chat        |
| GET    | /api/ai/recommendations     | Filtered recommendations |

### Customer (JWT required)
| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| GET    | /api/auth/profile     | Get profile        |
| PUT    | /api/auth/profile     | Update profile     |
| POST   | /api/bookings         | Create booking     |
| GET    | /api/bookings/my      | My bookings        |
| PATCH  | /api/bookings/:id/cancel | Cancel booking  |

### Admin (JWT + admin role)
| Method | Endpoint                         | Description           |
|--------|----------------------------------|-----------------------|
| POST   | /api/motorcycles                 | Add motorcycle        |
| PUT    | /api/motorcycles/:id             | Update motorcycle     |
| DELETE | /api/motorcycles/:id             | Delete motorcycle     |
| GET    | /api/bookings                    | All bookings          |
| PATCH  | /api/bookings/:id/status         | Approve/reject        |
| GET    | /api/bookings/stats              | Dashboard stats       |
| GET    | /api/admin/customers             | List customers        |
| PATCH  | /api/admin/customers/:id/toggle-status | Toggle account |
| DELETE | /api/admin/customers/:id         | Delete customer       |

## Environment Variables

### Backend (.env)
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=motor_rent
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key
```

## Future Enhancements

The codebase is structured to support:
- Online payment integration (Stripe/PayMongo)
- Push notifications (Expo Notifications)
- GPS tracking for rented motorcycles
- Real-time booking updates (WebSockets)

## License

MIT
