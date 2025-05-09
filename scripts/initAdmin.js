require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../components/admin/models/Admin');

const initializeAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const admin = new Admin({
            name: 'CodeKarwalo Admin',
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
            role: 'super_admin',
            status: 'active'
        });

        await admin.save();
        console.log('Admin user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing admin:', error);
        process.exit(1);
    }
};

initializeAdmin(); 