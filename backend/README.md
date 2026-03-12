# Farmer Marketplace Backend

Local SQLite backend for the Farmer Marketplace website.

## Setup Instructions

### 1. Install Dependencies
Open PowerShell in this folder and run:
```powershell
npm install
```

### 2. Initialize Database
Generate Prisma client and create database:
```powershell
npm run db:generate
npm run db:push
```

### 3. Start Server
Development mode (auto-reload):
```powershell
npm run dev
```

Or production mode:
```powershell
npm start
```

Server will run on: **http://localhost:3000**

### 4. View Database (Optional)
Open Prisma Studio to view/edit database:
```powershell
npm run db:studio
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Products (Public)
- `GET /api/products` - Get all products (with filters)
  - Query params: `search`, `category`, `minPrice`, `maxPrice`, `location`, `sort`
- `GET /api/products/:id` - Get single product

### Products (Protected - requires token)
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/my-products` - Get seller's products

### Orders (Protected)
- `POST /api/orders` - Place order
- `GET /api/my-orders` - Get user's orders

### Health
- `GET /api/health` - Check API status

## Database Schema

### Users
- id, name, email, password (hashed), phone, role, address

### Products
- id, sellerId, productName, category, price, location, description
- harvestDate, bestBefore, image, available
- Relations: seller (User)

### Orders
- id, buyerId, productId, quantity, totalPrice
- buyerName, buyerPhone, buyerAddress, status
- Relations: buyer (User), product (Product)

## File Structure
```
Farmer-backend/
├── prisma/
│   └── schema.prisma    # Database schema
├── server.js            # Express API server
├── package.json         # Dependencies
├── .env                 # Environment variables
├── dev.db              # SQLite database (created after db:push)
└── README.md           # This file
```

## Environment Variables
Edit `.env` file:
- `DATABASE_URL` - SQLite database path
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret for JWT tokens

## Testing

Use the frontend pages or test with curl/Postman:

```powershell
# Health check
curl http://localhost:3000/api/health

# Get products
curl http://localhost:3000/api/products

# Register user
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test Farmer\",\"email\":\"farmer@test.com\",\"password\":\"test123\",\"role\":\"farmer\"}'
```

## Notes
- Database file `dev.db` is created in the backend folder
- Images are stored as base64 strings in the database
- JWT tokens expire after 7 days
- CORS is enabled for all origins (restrict in production)
