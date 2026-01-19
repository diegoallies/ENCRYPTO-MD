const { pool } = require('../config/db');

class Referral {
    static async findOne(query) {
        let whereClause = '';
        let params = [];
        
        if (query.id || query._id) {
            whereClause = 'WHERE id = $1';
            params.push(query.id || query._id);
        } else if (query.user_id) {
            whereClause = 'WHERE user_id = $1';
            params.push(query.user_id);
        }

        const result = await pool.query(
            `SELECT * FROM referrals ${whereClause} LIMIT 1`,
            params
        );
        
        return result.rows.length > 0 ? this.mapRowToReferral(result.rows[0]) : null;
    }

    static async find(query = {}) {
        let whereClause = '';
        let params = [];
        
        if (query.user_id) {
            whereClause = 'WHERE user_id = $1';
            params.push(query.user_id);
        }

        const result = await pool.query(
            `SELECT * FROM referrals ${whereClause} ORDER BY created_at DESC`,
            params
        );
        
        return result.rows.map(row => this.mapRowToReferral(row));
    }

    static async create(referralData) {
        const result = await pool.query(
            `INSERT INTO referrals (user_id, referred_username)
             VALUES ($1, $2)
             RETURNING *`,
            [
                referralData.user_id || referralData.userId,
                referralData.referred_username || referralData.referredUser
            ]
        );
        
        return this.mapRowToReferral(result.rows[0]);
    }

    static mapRowToReferral(row) {
        if (!row) return null;
        
        return {
            _id: row.id,
            id: row.id,
            userId: row.user_id,
            user_id: row.user_id,
            referredUsername: row.referred_username,
            referred_username: row.referred_username,
            createdAt: row.created_at
        };
    }
}

module.exports = Referral;
