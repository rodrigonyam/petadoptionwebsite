const { seedDatabase } = require('./utils/seedDatabase');

// Database seeding script
const runSeeder = async () => {
    try {
        console.log('🚀 Starting database seeding process...');
        
        // Connect to MongoDB
        const mongoose = require('mongoose');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pet_adoption');
        console.log('✅ Connected to MongoDB');

        // Run the seeder
        await seedDatabase();
        
        console.log('🎉 Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

// Run if called directly
if (require.main === module) {
    runSeeder();
}

module.exports = { runSeeder };