const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://darexmucheri:cMd7EoTwGglJGXwR@cluster0.uwf6z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected');
        
        // Create admin user if not exists
        await createAdminUser();
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const createAdminUser = async () => {
    const User = require('../models/User');
    const admin = await User.findOne({ username: 'admin' });
    
    if (!admin) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await User.create({
            username: 'admin',
            email: 'admin@suzero.nodes',
            password: hashedPassword,
            role: 'admin',
            coins: 999999
        });
        console.log('Admin user created');
    }
};

module.exports = connectDB;
