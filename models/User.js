const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    static async findOne(query) {
        let whereClause = '';
        let params = [];
        
        if (query.$or) {
            // Handle $or queries (username or email)
            const conditions = query.$or.map((condition, index) => {
                const key = Object.keys(condition)[0];
                const value = condition[key];
                params.push(value);
                return `${key} = $${params.length}`;
            });
            whereClause = `WHERE ${conditions.join(' OR ')}`;
        } else if (query.username) {
            whereClause = 'WHERE username = $1';
            params.push(query.username);
        } else if (query.email) {
            whereClause = 'WHERE email = $1';
            params.push(query.email);
        } else if (query.id) {
            whereClause = 'WHERE id = $1';
            params.push(query.id);
        }

        const result = await pool.query(
            `SELECT * FROM users ${whereClause} LIMIT 1`,
            params
        );
        
        if (result.rows.length === 0) return null;
        return this.mapRowToUser(result.rows[0]);
    }

    static async findById(id) {
        return await this.findOne({ id });
    }

    static async create(userData) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const result = await pool.query(
            `INSERT INTO users (username, email, password, profile_pic, github_username, whatsapp_number, coins, referred_by, role)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                userData.username,
                userData.email,
                hashedPassword,
                userData.profilePic || 'https://i.imgur.com/JRqk1W1.png',
                userData.githubUsername || null,
                userData.whatsappNumber || null,
                userData.coins || 100,
                userData.referredBy || null,
                userData.role || 'user'
            ]
        );
        
        return this.mapRowToUser(result.rows[0]);
    }

    static async update(id, updates) {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(updates).forEach(key => {
            if (key === 'password') {
                // Hash password if updating
                return; // Handle separately
            }
            const dbKey = this.camelToSnake(key);
            fields.push(`${dbKey} = $${paramIndex}`);
            values.push(updates[key]);
            paramIndex++;
        });

        if (updates.password) {
            const hashedPassword = await bcrypt.hash(updates.password, 10);
            fields.push(`password = $${paramIndex}`);
            values.push(hashedPassword);
            paramIndex++;
        }

        values.push(id);
        const result = await pool.query(
            `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
    }

    static async save(user) {
        if (user.id) {
            return await this.update(user.id, user);
        } else {
            return await this.create(user);
        }
    }

    static mapRowToUser(row) {
        if (!row) return null;
        
        const user = {
            _id: row.id,
            id: row.id,
            username: row.username,
            email: row.email,
            password: row.password,
            profilePic: row.profile_pic,
            githubUsername: row.github_username,
            whatsappNumber: row.whatsapp_number,
            coins: row.coins,
            lastClaim: row.last_claim,
            referredBy: row.referred_by,
            role: row.role,
            isBanned: row.is_banned,
            createdAt: row.created_at
        };

        // Add comparePassword method
        user.comparePassword = async function(candidatePassword) {
            return await bcrypt.compare(candidatePassword, this.password);
        };

        // Add save method
        user.save = async function() {
            return await User.update(this.id, this);
        };

        return user;
    }

    static camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
}

module.exports = User;
