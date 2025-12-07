const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const Pet = require('./models/Pet');
const Shelter = require('./models/Shelter');
const Activity = require('./models/Activity');
const Adoption = require('./models/Adoption');

async function seedDatabase() {
    try {
        console.log('🚀 Starting simplified database seeding...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pet_adoption');
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Pet.deleteMany({}),
            Shelter.deleteMany({}),
            Activity.deleteMany({}),
            Adoption.deleteMany({})
        ]);
        console.log('📦 Cleared existing data');

        // Create shelters with minimal required fields
        const shelters = await Shelter.create([
            {
                name: "Happy Paws Animal Shelter",
                description: "A no-kill shelter dedicated to finding loving homes for abandoned pets.",
                type: "shelter",
                contact: {
                    email: "info@happypaws.org",
                    phone: "(555) 123-4567"
                },
                address: {
                    street: "123 Pet Street",
                    city: "Pet City",
                    state: "CA",
                    zipCode: "90210"
                }
            },
            {
                name: "Furry Friends Rescue",
                description: "Specializing in rescued cats and small animals.",
                type: "rescue",
                contact: {
                    email: "rescue@furryfriends.com",
                    phone: "(555) 987-6543"
                },
                address: {
                    street: "456 Animal Avenue",
                    city: "Pet Town",
                    state: "CA",
                    zipCode: "90211"
                }
            }
        ]);
        console.log(`✅ Created ${shelters.length} shelters`);

        // Create users with minimal required fields
        const users = await User.create([
            {
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                password: await bcrypt.hash("password123", 10),
                phone: "(555) 111-1111"
            },
            {
                firstName: "Sarah",
                lastName: "Wilson",
                email: "sarah@example.com",
                password: await bcrypt.hash("password123", 10),
                phone: "(555) 222-2222",
                role: "shelter"
            },
            {
                firstName: "Admin",
                lastName: "User",
                email: "admin@petadoption.com",
                password: await bcrypt.hash("admin123", 10),
                phone: "(555) 000-0000",
                role: "admin"
            }
        ]);
        console.log(`✅ Created ${users.length} users`);

        // Create pets with all required fields
        const pets = await Pet.create([
            {
                name: "Buddy",
                type: "dog",
                breed: "Golden Retriever",
                age: {
                    years: 3,
                    months: 6,
                    ageGroup: "adult"
                },
                gender: "male",
                size: "large",
                weight: 65,
                color: {
                    primary: "golden",
                    secondary: "cream",
                    pattern: "solid"
                },
                description: "Friendly and energetic dog looking for an active family. Loves playing fetch and swimming.",
                personality: {
                    traits: ["friendly", "energetic", "playful", "loyal"],
                    goodWith: {
                        children: true,
                        cats: false,
                        dogs: true,
                        strangers: true
                    },
                    activityLevel: "high"
                },
                health: {
                    vaccinations: {
                        rabies: true,
                        distemper: true,
                        bordetella: true
                    },
                    spayedNeutered: true,
                    microchipped: true
                },
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop",
                        caption: "Buddy playing in the yard",
                        isPrimary: true
                    }
                ],
                adoption: {
                    fee: 200,
                    status: "available"
                },
                shelter: shelters[0]._id,
                location: {
                    city: "Pet City",
                    state: "CA",
                    zipCode: "90210"
                }
            },
            {
                name: "Whiskers",
                type: "cat",
                breed: "Domestic Shorthair",
                age: {
                    years: 2,
                    months: 0,
                    ageGroup: "adult"
                },
                gender: "female",
                size: "medium",
                weight: 8,
                color: {
                    primary: "black",
                    secondary: "white",
                    pattern: "mixed"
                },
                description: "Sweet and gentle cat who loves to cuddle. Perfect lap cat for a quiet home.",
                personality: {
                    traits: ["gentle", "calm", "cuddly", "quiet"],
                    goodWith: {
                        children: true,
                        cats: true,
                        dogs: false,
                        strangers: false
                    },
                    activityLevel: "low"
                },
                health: {
                    vaccinations: {
                        rabies: true,
                        distemper: true
                    },
                    spayedNeutered: true,
                    microchipped: false
                },
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop",
                        caption: "Whiskers taking a nap",
                        isPrimary: true
                    }
                ],
                adoption: {
                    fee: 75,
                    status: "available"
                },
                shelter: shelters[1]._id,
                location: {
                    city: "Pet Town",
                    state: "CA",
                    zipCode: "90211"
                }
            },
            {
                name: "Max",
                type: "dog",
                breed: "Labrador Mix",
                age: {
                    years: 1,
                    months: 8,
                    ageGroup: "young"
                },
                gender: "male",
                size: "large",
                weight: 55,
                color: {
                    primary: "chocolate",
                    pattern: "solid"
                },
                description: "Energetic young lab mix who needs an active family. Great with kids and loves to play.",
                personality: {
                    traits: ["energetic", "playful", "friendly", "trainable"],
                    goodWith: {
                        children: true,
                        cats: false,
                        dogs: true,
                        strangers: true
                    },
                    activityLevel: "very-high"
                },
                health: {
                    vaccinations: {
                        rabies: true,
                        distemper: true,
                        bordetella: true,
                        heartworm: true
                    },
                    spayedNeutered: false,
                    microchipped: true
                },
                images: [
                    {
                        url: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=300&fit=crop",
                        caption: "Max running in the park",
                        isPrimary: true
                    }
                ],
                adoption: {
                    fee: 175,
                    status: "available"
                },
                shelter: shelters[0]._id,
                location: {
                    city: "Pet City",
                    state: "CA",
                    zipCode: "90210"
                }
            }
        ]);
        console.log(`✅ Created ${pets.length} pets`);

        // Skip activities for now - complex schema
        const activities = [];
        console.log('⏭️ Skipped activities (complex schema)');

        // Skip adoptions for now - complex schema  
        const adoptions = [];
        console.log('⏭️ Skipped adoption applications (complex schema)');

        console.log('🎉 Database seeding completed successfully!');
        console.log(`
📊 Summary:
- Shelters: ${shelters.length}
- Users: ${users.length} 
- Pets: ${pets.length}
- Activities: ${activities.length} (skipped)
- Adoption Applications: ${adoptions.length} (skipped)

🔑 Test Login Credentials:
- Regular User: john@example.com / password123
- Shelter Admin: sarah@example.com / password123  
- System Admin: admin@petadoption.com / admin123

🚀 You can now start the server with: npm start
        `);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seeder
seedDatabase();