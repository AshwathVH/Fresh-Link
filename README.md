# Green Trade Network - Farmer Marketplace

A local marketplace platform connecting farmers directly with buyers.

## Project Structure

```
Fresh-Link/
├── frontend/          # HTML frontend files
│   ├── landing.html       # Public landing page (start here)
│   ├── auth.html          # Login/Register page
│   ├── index.html         # Farmer dashboard
│   ├── Home_pageF.html    # Farmer profile page
│   ├── AddPrdct.html      # Add product page
│   ├── Listed_files.html  # View listings page
│   └── buyer_page.html    # Buyer marketplace page
│
└── backend/           # Node.js + Express + Prisma backend
    ├── server.js
    ├── package.json
    ├── prisma/
    │   └── schema.prisma
    └── README.md
```

## Getting Started

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:push
   npm run db:generate
   ```

4. Start the server:
   ```bash
   npm start
   ```
   or for development with auto-reload:
   ```bash
   npm run dev
   ```

### Frontend

1. Open the landing page:
   ```bash
   start frontend/landing.html
   ```
   or use a local development server:
   ```bash
   cd frontend
   npx http-server -p 8000
   ```
   Then visit: `http://localhost:8000/landing.html`

2. From the landing page, you can:
   - Click "Get Started" to register/login
   - Browse features and information about the platform

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT, bcrypt

## License

ISC
