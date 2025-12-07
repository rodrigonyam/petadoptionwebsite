# Backend Demo - Pet Adoption API

## 🎉 Success! Your comprehensive Node.js + Express backend is now running!

### ✅ What We've Built

**Complete MEAN Stack Backend:**
- **Node.js & Express.js** server with REST API
- **MongoDB** database with **Mongoose ODM**
- **JWT Authentication** system with role-based access
- **Complete API endpoints** for all entities
- **Sample data** populated in database
- **Comprehensive validation** and error handling
- **Security features** (bcrypt, CORS, helmet, rate limiting)

### 🗄️ Database Entities Created

**Shelters (2):**
- Happy Paws Animal Shelter (Pet City, CA)
- Furry Friends Rescue (Pet Town, CA)

**Users (3):**
- john@example.com (Regular User) 
- sarah@example.com (Shelter Admin)
- admin@petadoption.com (System Admin)

**Pets (3):**
- **Buddy** - Golden Retriever, Male, Large, $200 adoption fee
- **Whiskers** - Domestic Shorthair Cat, Female, Medium, $75 adoption fee  
- **Max** - Labrador Mix, Male, Large, $175 adoption fee

### 🌐 API Server Running

- **Server**: http://localhost:5000
- **API Base**: http://localhost:5000/api
- **Frontend**: http://localhost:5000

### 🔑 Test the API

#### 1. Get All Pets (No auth required)
```bash
curl "http://localhost:5000/api/pets"
```

#### 2. Login to get JWT token
```bash
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}'
```

#### 3. Get user profile (with token)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:5000/api/auth/me"
```

#### 4. Get shelters
```bash
curl "http://localhost:5000/api/shelters"
```

#### 5. Search pets with filters
```bash
curl "http://localhost:5000/api/pets?type=dog&size=large&maxFee=200"
```

### 💡 How Authentication Works

1. **User Registration/Login** → Receives JWT token
2. **Token Storage** → Frontend stores token (localStorage/cookie)
3. **Authenticated Requests** → Include token in Authorization header
4. **Role-Based Access** → Different permissions for user/shelter/admin
5. **Secure Endpoints** → Password hashing, input validation, rate limiting

### 🔒 Security Features Implemented

- **JWT Authentication** - Stateless, secure token system
- **Password Hashing** - bcrypt with salt rounds
- **Role-Based Authorization** - user, shelter, admin roles
- **Input Validation** - express-validator for all inputs
- **Rate Limiting** - Prevent API abuse
- **CORS Configuration** - Secure cross-origin requests
- **Security Headers** - Helmet.js protection
- **MongoDB Injection Protection** - Mongoose sanitization

### 📁 Backend File Structure

```
petadoptionwebsite/
├── server.js              # Main server entry point
├── config/
│   └── database.js         # MongoDB connection
├── models/                 # Mongoose schemas
│   ├── User.js
│   ├── Pet.js
│   ├── Shelter.js
│   ├── Activity.js
│   └── Adoption.js
├── routes/                 # API route handlers
│   ├── auth.js
│   ├── pets.js
│   ├── shelters.js
│   ├── activities.js
│   ├── adoptions.js
│   └── users.js
├── middleware/             # Custom middleware
│   ├── auth.js             # JWT verification
│   ├── errorHandler.js     # Error handling
│   └── validation.js       # Input validation
├── utils/                  # Utility functions
│   └── generateToken.js    # JWT token generation
├── simpleSeed.js           # Database seeding script
└── API_DOCUMENTATION.md    # Complete API docs
```

### 🚀 Next Steps

**Frontend Integration:**
- Your `scripts.js` is already set up to use these APIs
- JWT tokens are handled automatically  
- User authentication flows are implemented
- Pet loading uses the `/api/pets` endpoint

**Test the Full Stack:**
1. Open `index.html` in your browser
2. Try logging in with: `john@example.com` / `password123`
3. Browse the pets loaded from your database
4. Submit adoption applications
5. Register new users

**Add More Features:**
- Image upload for pets
- Real-time notifications
- Email integration
- Payment processing
- Advanced search filters
- Mobile app using same API

### 📊 Database Schema Examples

**Pet Document:**
```javascript
{
  "_id": "ObjectId",
  "name": "Buddy",
  "type": "dog",
  "breed": "Golden Retriever", 
  "age": { "years": 3, "months": 6, "ageGroup": "adult" },
  "gender": "male",
  "size": "large",
  "color": { "primary": "golden", "pattern": "solid" },
  "personality": {
    "traits": ["friendly", "energetic"],
    "activityLevel": "high",
    "goodWith": { "children": true, "dogs": true }
  },
  "health": {
    "vaccinations": { "rabies": true, "distemper": true },
    "spayedNeutered": true,
    "microchipped": true
  },
  "adoption": { "fee": 200, "status": "available" },
  "shelter": "ObjectId",
  "location": { "city": "Pet City", "state": "CA" }
}
```

**User Document:**
```javascript
{
  "_id": "ObjectId",
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john@example.com",
  "password": "$2a$10$hashedPassword...",
  "role": "user",
  "userType": "adopting",
  "favorites": ["petId1", "petId2"],
  "createdAt": "2024-12-04T..."
}
```

### 🎯 This Demonstrates

✅ **Complete REST API** with all CRUD operations  
✅ **MongoDB integration** with complex schemas  
✅ **JWT Authentication** system  
✅ **Role-based authorization** (user/shelter/admin)  
✅ **Input validation** and error handling  
✅ **Security best practices**  
✅ **Database relationships** (users ↔ pets ↔ shelters)  
✅ **Search and filtering** capabilities  
✅ **File structure** for scalable Node.js apps  
✅ **Environment configuration**  
✅ **API documentation**  

You now have a production-ready backend that can handle:
- User registration and authentication
- Pet management and search
- Shelter operations  
- Adoption applications
- Admin functionality
- And much more!

The frontend and backend are fully integrated and ready for development or deployment! 🚀