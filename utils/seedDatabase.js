const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Pet = require('../models/Pet');
const Activity = require('../models/Activity');
const Shelter = require('../models/Shelter');
const Adoption = require('../models/Adoption');

// Sample data for seeding the database
const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Pet.deleteMany({}),
            Activity.deleteMany({}),
            Shelter.deleteMany({}),
            Adoption.deleteMany({})
        ]);
        console.log('📦 Cleared existing data');

        // Create sample shelters first
        const shelters = await Shelter.create([
            {
                name: "Happy Paws Animal Shelter",
                description: "A no-kill shelter dedicated to finding loving homes for abandoned pets. We've been serving the community for over 20 years.",
                type: "shelter",
                contact: {
                    email: "info@happypaws.org",
                    phone: "(555) 123-4567",
                    website: "https://happypaws.org",
                    socialMedia: {
                        facebook: "happypaws.shelter",
                        instagram: "happy_paws_shelter"
                    }
                },
                address: {
                    street: "123 Pet Street",
                    city: "Pet City",
                    state: "CA",
                    zipCode: "90210"
                },
                verification: {
                    status: "verified",
                    verifiedAt: new Date()
                }
            },
            {
                name: "Furry Friends Rescue",
                description: "Specializing in rescued cats and small animals. We provide medical care and rehabilitation for pets in need.",
                type: "rescue",
                contact: {
                    email: "rescue@furryfriends.com",
                    phone: "(555) 987-6543",
                    website: "https://furryfriends.com"
                },
                address: {
                    street: "456 Animal Avenue",
                    city: "Pet Town",
                    state: "CA", 
                    zipCode: "90211"
                },
                verification: {
                    status: "verified",
                    verifiedAt: new Date()
                }
            },
            {
                name: "Golden Years Pet Sanctuary",
                description: "Dedicated to senior pets and those with special needs. Every pet deserves love, regardless of age or health.",
                type: "sanctuary",
                contact: {
                    email: "care@goldenyears.org",
                    phone: "(555) 555-0123"
                },
                address: {
                    street: "789 Senior Street",
                    city: "Elder City",
                    state: "CA",
                    zipCode: "90212"
                },
                verification: {
                    status: "verified",
                    verifiedAt: new Date()
                }
            }
        ]);

        console.log(`✅ Created ${shelters.length} shelters`);

        // Create sample users with different roles
        const users = await User.create([
            {
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                password: await bcrypt.hash("password123", 10),
                phone: "(555) 111-1111",
                address: {
                    street: "123 Main St",
                    city: "Anytown",
                    state: "CA",
                    zipCode: "90210"
                },
                role: "user",
                userType: "adopting",
                preferences: {
                    newsletter: true,
                    emailNotifications: true,
                    petTypes: ["dogs", "cats"],
                    agePreference: "adult"
                },
                profile: {
                    bio: "Animal lover looking for a furry companion",
                    experience: "Had pets all my life",
                    livingSpace: "house_large_yard",
                    hasChildren: false,
                    hasOtherPets: false
                }
            },
            {
                firstName: "Sarah",
                lastName: "Wilson",
                email: "sarah@example.com", 
                password: await bcrypt.hash("password123", 10),
                phone: "(555) 222-2222",
                role: "shelter",
                userType: "volunteering",
                preferences: {
                    newsletter: true,
                    emailNotifications: true
                }
            },
            {
                firstName: "Admin",
                lastName: "User",
                email: "admin@petadoption.com",
                password: await bcrypt.hash("admin123", 10),
                phone: "(555) 000-0000",
                role: "admin",
                userType: "both",
                preferences: {
                    newsletter: true,
                    emailNotifications: true
                }
            },
            {
                firstName: "Maria",
                lastName: "Garcia",
                email: "maria@example.com",
                password: await bcrypt.hash("password123", 10),
                phone: "(555) 333-3333",
                role: "user",
                userType: "both",
                preferences: {
                    newsletter: true,
                    emailNotifications: true,
                    petTypes: ["cats", "rabbits"],
                    agePreference: "young"
                }
            }
        ]);

        console.log(`✅ Created ${users.length} users`);

        // Create sample pets
        const pets = await Pet.create([
            {
                name: "Buddy",
                type: "dog",
                breed: "Golden Retriever",
                age: "adult",
                size: "large",
                gender: "male",
                description: "Buddy is a friendly and energetic Golden Retriever who loves playing fetch and swimming. He's great with children and other dogs. Buddy is house-trained and knows basic commands. He would thrive in an active family environment.",
                images: [
                    "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop"
                ],
                shelter: shelters[0]._id,
                addedBy: users[1]._id,
                medicalInfo: {
                    vaccinated: true,
                    spayedNeutered: true,
                    microchipped: true,
                    healthConditions: []
                },
                personality: {
                    energyLevel: "high",
                    friendliness: "very_friendly",
                    trainability: "high"
                },
                goodWith: {
                    children: true,
                    dogs: true,
                    cats: false
                },
                adoption: {
                    fee: 200,
                    status: "available"
                },
                specialNeeds: false
            },
            {
                name: "Whiskers",
                type: "cat",
                breed: "Orange Tabby",
                age: "adult",
                size: "medium",
                gender: "male",
                description: "Whiskers is a calm and affectionate orange tabby who loves sunny windowsills and gentle pets. He's perfect for a quiet household and gets along well with other cats.",
                images: [
                    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop"
                ],
                shelter: shelters[1]._id,
                addedBy: users[1]._id,
                medicalInfo: {
                    vaccinated: true,
                    spayedNeutered: true,
                    microchipped: true,
                    healthConditions: []
                },
                personality: {
                    energyLevel: "low",
                    friendliness: "friendly",
                    trainability: "medium"
                },
                goodWith: {
                    children: true,
                    dogs: false,
                    cats: true
                },
                adoption: {
                    fee: 100,
                    status: "available"
                },
                specialNeeds: false
            },
            {
                name: "Luna",
                type: "cat",
                breed: "Tuxedo Cat",
                age: "senior",
                size: "small",
                gender: "female",
                description: "Luna is a distinguished senior cat looking for a peaceful retirement home. She's gentle, quiet, and would be perfect for someone seeking a calm companion.",
                images: [
                    "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=300&fit=crop"
                ],
                shelter: shelters[2]._id,
                addedBy: users[1]._id,
                medicalInfo: {
                    vaccinated: true,
                    spayedNeutered: true,
                    microchipped: true,
                    healthConditions: ["arthritis"]
                },
                personality: {
                    energyLevel: "low",
                    friendliness: "friendly",
                    trainability: "low"
                },
                goodWith: {
                    children: false,
                    dogs: false,
                    cats: true
                },
                adoption: {
                    fee: 50,
                    status: "available"
                },
                specialNeeds: true
            },
            {
                name: "Max",
                type: "dog",
                breed: "Labrador Mix",
                age: "young",
                size: "large",
                gender: "male",
                description: "Max is an energetic young lab mix who loves adventures and learning new tricks. He needs an active family who can keep up with his playful nature.",
                images: [
                    "https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=300&fit=crop"
                ],
                shelter: shelters[0]._id,
                addedBy: users[1]._id,
                medicalInfo: {
                    vaccinated: true,
                    spayedNeutered: false,
                    microchipped: true,
                    healthConditions: []
                },
                personality: {
                    energyLevel: "very_high",
                    friendliness: "very_friendly",
                    trainability: "high"
                },
                goodWith: {
                    children: true,
                    dogs: true,
                    cats: false
                },
                adoption: {
                    fee: 175,
                    status: "available"
                },
                specialNeeds: false
            },
            {
                name: "Bella",
                type: "rabbit",
                breed: "Holland Lop",
                age: "adult",
                size: "small",
                gender: "female",
                description: "Bella is a sweet Holland Lop rabbit who loves hopping around and eating fresh vegetables. She's litter trained and very social.",
                images: [
                    "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop"
                ],
                shelter: shelters[1]._id,
                addedBy: users[1]._id,
                medicalInfo: {
                    vaccinated: true,
                    spayedNeutered: true,
                    microchipped: false,
                    healthConditions: []
                },
                personality: {
                    energyLevel: "medium",
                    friendliness: "friendly",
                    trainability: "medium"
                },
                goodWith: {
                    children: true,
                    dogs: false,
                    cats: false
                },
                adoption: {
                    fee: 75,
                    status: "pending"
                },
                specialNeeds: false
            }
        ]);

        console.log(`✅ Created ${pets.length} pets`);

        // Create sample activities
        const activities = await Activity.create([
            {
                title: "Holiday Pet Adoption Fair",
                description: "Join us for our annual holiday adoption event! Meet dozens of pets looking for forever homes, enjoy hot cocoa, and take photos with Santa and your new furry friend.",
                type: "adoption_event",
                startDate: new Date('2025-12-14T10:00:00'),
                endDate: new Date('2025-12-14T16:00:00'),
                location: "City Park Main Pavilion, 123 Park Ave",
                shelter: shelters[0]._id,
                organizer: users[1]._id,
                capacity: 100,
                fee: 0,
                requirements: [],
                registrations: [
                    {
                        user: users[0]._id,
                        registeredAt: new Date(),
                        status: "confirmed"
                    },
                    {
                        user: users[3]._id,
                        registeredAt: new Date(),
                        status: "confirmed"
                    }
                ]
            },
            {
                title: "Pet Training Workshop: Basic Commands",
                description: "Learn essential training techniques for dogs and cats. Perfect for new pet owners or those looking to improve their pet's behavior. All skill levels welcome!",
                type: "educational",
                startDate: new Date('2025-12-21T14:00:00'),
                endDate: new Date('2025-12-21T16:00:00'),
                location: "Happy Paws Training Room",
                shelter: shelters[0]._id,
                organizer: users[1]._id,
                capacity: 20,
                fee: 25,
                requirements: ["Bring your pet if you have one"],
                registrations: [
                    {
                        user: users[0]._id,
                        registeredAt: new Date(),
                        status: "confirmed"
                    }
                ]
            },
            {
                title: "New Year Pet Walk & Socialization",
                description: "Start the new year with a healthy walk alongside adoptable dogs! Help socialize our shelter dogs while getting some exercise and fresh air.",
                type: "volunteer",
                startDate: new Date('2026-01-04T09:00:00'),
                endDate: new Date('2026-01-04T11:00:00'),
                location: "Riverside Trail, Trail Head Parking",
                shelter: shelters[0]._id,
                organizer: users[1]._id,
                capacity: 30,
                fee: 0,
                requirements: ["Must be comfortable with dogs", "Wear appropriate walking shoes"],
                registrations: []
            },
            {
                title: "Cat Cafe Fundraiser",
                description: "Enjoy coffee and pastries while spending time with our adoptable cats. All proceeds support our feline care program.",
                type: "fundraiser",
                startDate: new Date('2025-12-28T11:00:00'),
                endDate: new Date('2025-12-28T15:00:00'),
                location: "Furry Friends Cat Room",
                shelter: shelters[1]._id,
                organizer: users[1]._id,
                capacity: 25,
                fee: 15,
                requirements: [],
                registrations: [
                    {
                        user: users[3]._id,
                        registeredAt: new Date(),
                        status: "confirmed"
                    }
                ]
            }
        ]);

        console.log(`✅ Created ${activities.length} activities`);

        // Create sample adoption applications
        const adoptions = await Adoption.create([
            {
                pet: pets[0]._id, // Buddy
                adopter: users[0]._id, // John Doe
                shelter: shelters[0]._id,
                status: "pending",
                adoptionDetails: {
                    message: "I'm very interested in adopting Buddy. I have a large backyard and experience with large dogs.",
                    experience: "I've owned Golden Retrievers for over 10 years and understand their exercise needs.",
                    livingSpace: "house_large_yard",
                    hasOtherPets: false,
                    hasChildren: false
                },
                scheduledMeetingDate: new Date('2025-12-10T14:00:00')
            },
            {
                pet: pets[4]._id, // Bella (rabbit)
                adopter: users[3]._id, // Maria Garcia
                shelter: shelters[1]._id,
                status: "approved",
                approvedDate: new Date('2025-12-05T10:00:00'),
                adoptionDetails: {
                    message: "I'd love to adopt Bella. I have experience with rabbits and a proper setup ready.",
                    experience: "I've had pet rabbits before and understand their dietary and housing needs.",
                    livingSpace: "apartment",
                    hasOtherPets: false,
                    hasChildren: false
                },
                scheduledMeetingDate: new Date('2025-12-08T15:00:00')
            }
        ]);

        console.log(`✅ Created ${adoptions.length} adoption applications`);

        // Add some favorites for users
        await User.findByIdAndUpdate(users[0]._id, {
            $push: { favorites: { $each: [pets[0]._id, pets[1]._id] } }
        });

        await User.findByIdAndUpdate(users[3]._id, {
            $push: { favorites: { $each: [pets[2]._id, pets[4]._id] } }
        });

        console.log('✅ Added user favorites');

        console.log(`
🎉 Database seeding completed successfully!

📊 Summary:
   • ${shelters.length} shelters created
   • ${users.length} users created (including admin accounts)
   • ${pets.length} pets available for adoption
   • ${activities.length} upcoming activities
   • ${adoptions.length} adoption applications in progress
   
🔑 Test Accounts Created:
   • Regular User: john@example.com / password123
   • Shelter Admin: sarah@example.com / password123  
   • System Admin: admin@petadoption.com / admin123
   • Another User: maria@example.com / password123

🌐 You can now test the full application with realistic data!
        `);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
};

module.exports = { seedDatabase };