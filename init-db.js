require('dotenv').config();
const { pool, connectDB } = require('./config/db');

(async () => {
    try {
        await connectDB();
        console.log('✅ Database initialized successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database initialization failed:', err);
        process.exit(1);
    }
})();
