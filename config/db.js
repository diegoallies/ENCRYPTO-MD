const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'encrypto_md',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'masepoes',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
    console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL connection error:', err);
});

// Initialize database tables
const initDB = async () => {
    try {
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                profile_pic VARCHAR(500) DEFAULT 'https://i.imgur.com/JRqk1W1.png',
                github_username VARCHAR(255),
                whatsapp_number VARCHAR(255),
                coins INTEGER DEFAULT 100,
                last_claim TIMESTAMP,
                referred_by VARCHAR(255),
                role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
                is_banned BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create referrals table (many-to-many relationship)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS referrals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                referred_username VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create deployments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS deployments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                app_name VARCHAR(255) NOT NULL,
                url VARCHAR(500),
                status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('active', 'suspended', 'pending')),
                type VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_renewed TIMESTAMP
            )
        `);

        // Create messages table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                subject VARCHAR(255),
                message TEXT,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create transactions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL CHECK (type IN ('credit', 'debit')),
                amount INTEGER NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create admin_settings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admin_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) UNIQUE NOT NULL,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create redeemed_vouchers table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS redeemed_vouchers (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                voucher_code VARCHAR(255) NOT NULL,
                redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Database tables initialized');

        // Create admin user if not exists
        const adminCheck = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
        if (adminCheck.rows.length === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                'INSERT INTO users (username, email, password, role, coins) VALUES ($1, $2, $3, $4, $5)',
                ['admin', 'admin@suzero.nodes', hashedPassword, 'admin', 999999]
            );
            console.log('✅ Admin user created (username: admin, password: admin123)');
        }
    } catch (err) {
        console.error('❌ Database initialization error:', err);
        throw err;
    }
};

// Connect and initialize
const connectDB = async () => {
    try {
        await pool.query('SELECT NOW()');
        await initDB();
    } catch (err) {
        console.error('❌ Database connection error:', err);
        process.exit(1);
    }
};

module.exports = { pool, connectDB };
