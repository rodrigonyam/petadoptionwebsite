# 🐾 Pet Adoption Website

A comprehensive full-stack web application for pet adoption built with modern technologies. This project demonstrates a complete MEAN-like stack with Node.js, Express, MongoDB, and vanilla JavaScript frontend.

## 🌟 Features

### 🔐 User Management
- **User Registration & Authentication** with JWT tokens
- **Role-based Access Control** (User, Shelter Admin, System Admin)
- **Profile Management** with preferences and settings
- **Secure Password Hashing** using bcrypt

### 🐕 Pet Management
- **Comprehensive Pet Profiles** with detailed information
- **Advanced Search & Filtering** by type, breed, size, age, location
- **Image Gallery** support for multiple pet photos
- **Adoption Status Tracking** (Available, Pending, Adopted)
- **Favorites System** for users to save pets

### 🏠 Shelter Operations
- **Shelter Registration & Verification** system
- **Pet Management** for shelter administrators
- **Activity & Event Management** (adoption events, training workshops)
- **Adoption Application Processing**

### 📱 Adoption Process
- **Online Adoption Applications** with detailed questionnaires
- **Application Status Tracking** (Pending, Approved, Rejected)
- **Communication System** between adopters and shelters
- **Adoption History & Records**

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt, helmet, CORS, rate limiting
- **Validation**: express-validator

### Frontend
- **Languages**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Modern CSS with Flexbox/Grid
- **API Integration**: Fetch API with JWT authentication
- **Responsive Design**: Mobile-first approach

### Development Tools
- **Environment Management**: dotenv
- **Database Seeding**: Custom seed scripts
- **API Documentation**: Comprehensive markdown docs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rodrigonyam/petadoptionwebsite.git
   cd petadoptionwebsite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit .env with your configuration
   MONGODB_URI=mongodb://localhost:27017/pet_adoption
   JWT_SECRET=your-secure-jwt-secret-key
   JWT_EXPIRE=30d
   NODE_ENV=development
   PORT=5000
   ```

4. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod
   
   # Or use MongoDB Atlas (update MONGODB_URI in .env)
   ```

5. **Seed the database with sample data**
   ```bash
   npm run seed
   # or
   node simpleSeed.js
   ```

6. **Start the development server**
   ```bash
   npm start
   # or
   npm run dev  # for development with nodemon
   ```

7. **Open your browser**
   - Frontend: `http://localhost:5000`
   - API Base: `http://localhost:5000/api`

## 📁 Project Structure

```
petadoptionwebsite/
├── 📄 Frontend Files
│   ├── index.html              # Main homepage
│   ├── pets.html              # Pet listings page
│   ├── shelters.html          # Shelter directory
│   ├── activities.html        # Events and activities
│   ├── auth.html              # Login/Register page
│   ├── styles.css             # Main stylesheet
│   └── scripts.js             # Frontend JavaScript
│
├── 🚀 Backend Files
│   ├── server.js              # Express server entry point
│   ├── config/
│   │   └── database.js         # MongoDB connection
│   ├── models/                # Mongoose schemas
│   │   ├── User.js            # User model
│   │   ├── Pet.js             # Pet model
│   │   ├── Shelter.js         # Shelter model
│   │   ├── Activity.js        # Activity model
│   │   └── Adoption.js        # Adoption model
│   ├── routes/                # Express routes
│   │   ├── auth.js            # Authentication routes
│   │   ├── pets.js            # Pet CRUD routes
│   │   ├── shelters.js        # Shelter routes
│   │   ├── activities.js      # Activity routes
│   │   ├── adoptions.js       # Adoption routes
│   │   └── users.js           # User management routes
│   ├── middleware/            # Custom middleware
│   │   ├── auth.js            # JWT authentication
│   │   ├── errorHandler.js    # Error handling
│   │   └── validation.js      # Input validation
│   └── utils/                 # Utility functions
│       └── generateToken.js   # JWT token generation
│
├── 📊 Data & Documentation
│   ├── simpleSeed.js          # Database seeding script
│   ├── API_DOCUMENTATION.md   # Complete API reference
│   ├── BACKEND_DEMO.md        # Backend overview
│   └── package.json           # Dependencies and scripts
│
└── 📝 Configuration
    ├── .env                   # Environment variables
    ├── .gitignore             # Git ignore rules
    └── README.md              # This file
```

## 🔑 Test Accounts

After running the seed script, you can use these test accounts:

| Role | Email | Password | Description |
|------|-------|----------|--------------|
| **User** | `john@example.com` | `password123` | Regular adopter account |
| **Shelter Admin** | `sarah@example.com` | `password123` | Shelter management account |
| **System Admin** | `admin@petadoption.com` | `admin123` | Full system access |

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Pets
- `GET /api/pets` - Get all pets (with filtering)
- `GET /api/pets/:id` - Get single pet
- `POST /api/pets` - Create pet (Shelter Admin only)
- `PUT /api/pets/:id` - Update pet (Shelter Admin only)
- `POST /api/pets/:id/favorite` - Add/Remove favorite
- `POST /api/pets/:id/adoption-request` - Submit adoption application

### Shelters
- `GET /api/shelters` - Get all shelters
- `GET /api/shelters/:id` - Get single shelter
- `GET /api/shelters/:id/pets` - Get shelter's pets
- `POST /api/shelters` - Create shelter (Admin only)

### Activities
- `GET /api/activities` - Get all activities
- `GET /api/activities/:id` - Get single activity
- `POST /api/activities` - Create activity (Shelter Admin only)
- `POST /api/activities/:id/register` - Register for activity

### Adoptions
- `GET /api/adoptions` - Get adoption applications
- `GET /api/adoptions/:id` - Get single adoption
- `PUT /api/adoptions/:id/status` - Update adoption status

For complete API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 🧪 Testing

### Manual Testing
1. **Start the server**: `npm start`
2. **Open frontend**: `http://localhost:5000`
3. **Test user flows**:
   - Register new account
   - Login with test accounts
   - Browse and search pets
   - Submit adoption applications
   - Test shelter admin features

### API Testing with curl
```bash
# Get all pets
curl "http://localhost:5000/api/pets"

# Login to get JWT token
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}'

# Use token for authenticated requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:5000/api/auth/me"
```

## 🔒 Security Features

- **JWT Authentication** - Stateless, secure token system
- **Password Hashing** - bcrypt with salt rounds
- **Role-Based Authorization** - Different permissions per role
- **Input Validation** - Server-side validation for all inputs
- **Rate Limiting** - Prevent API abuse and brute force attacks
- **CORS Configuration** - Secure cross-origin resource sharing
- **Security Headers** - Helmet.js for various security headers
- **MongoDB Injection Protection** - Mongoose built-in sanitization

## 📱 Frontend Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern UI/UX** - Clean, intuitive interface
- **Real-time Updates** - Dynamic content loading
- **Form Validation** - Client-side and server-side validation
- **Search & Filtering** - Advanced pet search capabilities
- **Image Galleries** - Multiple photo support for pets
- **User Authentication** - Login/logout with session management

## 🎯 Database Schema

### Key Collections
- **Users** - User accounts with roles and preferences
- **Pets** - Comprehensive pet profiles with adoption info
- **Shelters** - Animal shelters and rescue organizations
- **Activities** - Events, workshops, and volunteer opportunities
- **Adoptions** - Adoption applications and status tracking

### Relationships
- Users can favorite multiple Pets
- Pets belong to Shelters
- Adoptions connect Users, Pets, and Shelters
- Activities are organized by Shelters

## 📈 Scalability Features

- **Modular Architecture** - Separated routes, models, and middleware
- **Database Indexing** - Optimized queries for search and filtering
- **Error Handling** - Comprehensive error management
- **Environment Configuration** - Easy deployment configuration
- **API Versioning Ready** - Structured for future API versions

## 🚀 Deployment

### Local Development
```bash
npm run dev  # Start with nodemon for auto-restart
```

### Production Deployment
1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Use MongoDB Atlas or production MongoDB
   - Set strong `JWT_SECRET`
   - Configure proper `MONGODB_URI`

2. **Platform Options**
   - **Heroku**: `git push heroku main`
   - **Vercel**: Deploy with vercel CLI
   - **AWS/Azure**: Use PM2 for process management
   - **DigitalOcean**: Deploy to droplet with nginx

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Pet images from [Unsplash](https://unsplash.com)
- Icons and UI inspiration from modern web design patterns
- MongoDB and Mongoose documentation
- Express.js and Node.js communities

## 📞 Support

For questions, issues, or contributions:
- 📧 Email: contact@petadoption.com
- 🐛 Issues: [GitHub Issues](https://github.com/rodrigonyam/petadoptionwebsite/issues)
- 📖 Documentation: [API Documentation](API_DOCUMENTATION.md)

---

**Made with ❤️ for pets and their future families**