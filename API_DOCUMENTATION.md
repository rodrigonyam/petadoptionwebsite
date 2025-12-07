# Pet Adoption Website API Documentation

## 🚀 Overview
This is a comprehensive REST API for a pet adoption platform built with Node.js, Express, and MongoDB. The API supports user authentication, pet management, shelter operations, activity registration, and adoption workflows.

## 🔧 Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** bcrypt password hashing, helmet, CORS, rate limiting
- **Validation:** express-validator

## 🌐 Base URL
```
http://localhost:5000/api
```

## 🔐 Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting a Token
1. Register a new user or login with existing credentials
2. The API returns a JWT token in the response
3. Use this token for subsequent authenticated requests

## 📚 API Endpoints

### 🔑 Authentication (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john@example.com",
  "password": "password123",
  "phone": "(555) 123-4567",
  "userType": "adopting",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zip": "90210"
  },
  "preferences": {
    "newsletter": true,
    "emailNotifications": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "user",
    "userType": "adopting"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Johnny",
  "phone": "(555) 999-8888"
}
```

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

### 🐾 Pets (`/api/pets`)

#### Get All Pets
```http
GET /api/pets?page=1&limit=12&type=dog&age=adult&size=large
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)
- `type` - Pet type: `dog`, `cat`, `rabbit`, `bird`, `other`
- `breed` - Breed filter (partial match)
- `age` - Age category: `young`, `adult`, `senior`
- `size` - Size: `small`, `medium`, `large`, `extra-large`
- `gender` - Gender: `male`, `female`, `unknown`
- `shelter` - Shelter ID
- `search` - Search in name, breed, description
- `minFee` / `maxFee` - Adoption fee range
- `specialNeeds` - `true` / `false`

**Response:**
```json
{
  "success": true,
  "count": 12,
  "total": 45,
  "totalPages": 4,
  "currentPage": 1,
  "pets": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Buddy",
      "type": "dog",
      "breed": "Golden Retriever",
      "age": "adult",
      "size": "large",
      "description": "Friendly and energetic...",
      "images": ["image1.jpg", "image2.jpg"],
      "adoption": {
        "fee": 200,
        "status": "available"
      },
      "shelter": {
        "name": "Happy Paws Shelter",
        "contact": {...}
      }
    }
  ]
}
```

#### Get Single Pet
```http
GET /api/pets/:id
```

#### Create Pet (Shelter Admin only)
```http
POST /api/pets
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Max",
  "type": "dog",
  "breed": "Labrador Mix",
  "age": "young",
  "size": "large",
  "gender": "male",
  "description": "Energetic young lab mix...",
  "shelter": "507f1f77bcf86cd799439012",
  "adoption": {
    "fee": 175
  },
  "medicalInfo": {
    "vaccinated": true,
    "spayedNeutered": false,
    "microchipped": true
  }
}
```

#### Update Pet (Shelter Admin only)
```http
PUT /api/pets/:id
Authorization: Bearer <token>
```

#### Add/Remove Favorite
```http
POST /api/pets/:id/favorite
Authorization: Bearer <token>
```

#### Submit Adoption Request
```http
POST /api/pets/:id/adoption-request
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "I'm interested in adopting this pet",
  "experience": "I've had dogs for 10 years",
  "livingSpace": "house_large_yard",
  "hasOtherPets": false,
  "hasChildren": true
}
```

---

### 🏠 Shelters (`/api/shelters`)

#### Get All Shelters
```http
GET /api/shelters?page=1&limit=12&city=PetCity&verified=true
```

#### Get Single Shelter
```http
GET /api/shelters/:id
```

#### Get Shelter's Pets
```http
GET /api/shelters/:id/pets?status=available&type=dog
```

#### Get Shelter's Activities
```http
GET /api/shelters/:id/activities?upcoming=true
```

#### Create Shelter (Admin only)
```http
POST /api/shelters
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Pet Shelter",
  "description": "A loving shelter for all pets",
  "contact": {
    "email": "info@newshelter.com",
    "phone": "(555) 123-4567"
  },
  "address": {
    "street": "456 Pet Avenue",
    "city": "Pet City",
    "state": "CA",
    "zip": "90210"
  }
}
```

---

### 🎉 Activities (`/api/activities`)

#### Get All Activities
```http
GET /api/activities?upcoming=true&type=adoption_event&shelter=507f1f77bcf86cd799439012
```

**Activity Types:**
- `adoption_event` - Adoption fairs and events
- `fundraiser` - Fundraising activities
- `training` - Pet training workshops
- `volunteer` - Volunteer opportunities
- `educational` - Educational programs
- `social` - Social gatherings

#### Get Single Activity
```http
GET /api/activities/:id
```

#### Create Activity (Shelter Admin only)
```http
POST /api/activities
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Pet Training Workshop",
  "description": "Learn basic pet training techniques",
  "type": "training",
  "startDate": "2025-12-21T14:00:00Z",
  "endDate": "2025-12-21T16:00:00Z",
  "location": "Shelter Training Room",
  "capacity": 20,
  "fee": 25,
  "shelter": "507f1f77bcf86cd799439012"
}
```

#### Register for Activity
```http
POST /api/activities/:id/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Looking forward to learning!",
  "emergencyContact": "Jane Doe - (555) 987-6543"
}
```

#### Unregister from Activity
```http
DELETE /api/activities/:id/register
Authorization: Bearer <token>
```

---

### 📋 Adoptions (`/api/adoptions`)

#### Get Adoption Requests
```http
GET /api/adoptions?status=pending&page=1&limit=10
Authorization: Bearer <token>
```

**Adoption Statuses:**
- `pending` - Awaiting review
- `approved` - Approved, awaiting completion
- `rejected` - Application rejected
- `completed` - Adoption finalized
- `cancelled` - Application cancelled

#### Get Single Adoption
```http
GET /api/adoptions/:id
Authorization: Bearer <token>
```

#### Update Adoption Status (Shelter Admin only)
```http
PUT /api/adoptions/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved",
  "notes": "Great application! Approved for meet & greet.",
  "scheduledMeetingDate": "2025-12-10T14:00:00Z"
}
```

#### Cancel Adoption Request
```http
DELETE /api/adoptions/:id
Authorization: Bearer <token>
```

---

### 👥 Users (`/api/users`)

#### Get All Users (Admin only)
```http
GET /api/users?page=1&role=user&search=john
Authorization: Bearer <admin-token>
```

#### Get User Profile
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Update User Role (Admin only)
```http
PUT /api/users/:id/role
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "shelter_admin"
}
```

#### Get User's Favorites
```http
GET /api/users/:id/favorites
Authorization: Bearer <token>
```

#### Get User's Adoptions
```http
GET /api/users/:id/adoptions
Authorization: Bearer <token>
```

---

## 🔒 User Roles & Permissions

### User (`user`)
- Browse pets and shelters
- Register for activities
- Submit adoption applications
- Manage their own profile and favorites

### Shelter Admin (`shelter_admin`)
- All user permissions
- Create and manage pets
- Create and manage activities
- Review adoption applications
- Manage shelter information

### System Admin (`admin`)
- All permissions
- Manage all users and shelters
- Access system-wide statistics
- Verify shelters

---

## 🛡️ Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Rate limiting on sensitive endpoints

### Input Validation
- Request validation using express-validator
- SQL injection protection
- XSS protection with helmet

### Security Headers
- CORS configuration
- Helmet security middleware
- Rate limiting for API abuse prevention

---

## 📊 Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    }
  ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 🧪 Testing the API

### Sample Data
Run the database seeder to populate with sample data:

```bash
npm run seed
```

### Test Accounts
- **Regular User:** `john@example.com` / `password123`
- **Shelter Admin:** `sarah@example.com` / `password123`
- **System Admin:** `admin@petadoption.com` / `admin123`

### Example Workflow
1. **Register/Login** to get authentication token
2. **Browse pets** with various filters
3. **Submit adoption request** for a pet you like
4. **Register for activities** to meet pets
5. **Check adoption status** and timeline

---

## 🚀 Development Setup

### Prerequisites
- Node.js 14+ 
- MongoDB 4+
- npm or yarn

### Installation
```bash
# Clone repository
git clone <repo-url>
cd petadoptionwebsite

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start MongoDB service
# (varies by system)

# Seed database with sample data
npm run seed

# Start development server
npm run dev
```

### Environment Variables
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pet_adoption
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=30d
```

---

## 🎯 Next Steps
- Add image upload functionality
- Implement email notifications
- Add real-time chat between adopters and shelters
- Create mobile app using this API
- Add payment processing for adoption fees
- Implement advanced search with geolocation