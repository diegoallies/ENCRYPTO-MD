const { pool } = require('../config/db');

class Transaction {
    static async findOne(query) {
        let whereClause = '';
        let params = [];
        
        if (query.id || query._id) {
            whereClause = 'WHERE id = $1';
            params.push(query.id || query._id);
        } else if (query.userId || query.user_id) {
            whereClause = 'WHERE user_id = $1';
            params.push(query.userId || query.user_id);
        }

        const result = await pool.query(
            `SELECT * FROM transactions ${whereClause} LIMIT 1`,
            params
        );
        
        return result.rows.length > 0 ? this.mapRowToTransaction(result.rows[0]) : null;
    }

    static async find(query = {}) {
        let whereClause = '';
        let params = [];
        
        if (query.userId || query.user_id) {
            whereClause = 'WHERE user_id = $1';
            params.push(query.userId || query.user_id);
        }

        const result = await pool.query(
            `SELECT * FROM transactions ${whereClause} ORDER BY created_at DESC`,
            params
        );
        
        return result.rows.map(row => this.mapRowToTransaction(row));
    }

    static async create(transactionData) {
        const result = await pool.query(
            `INSERT INTO transactions (user_id, type, amount, description)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                transactionData.userId || transactionData.user_id,
                transactionData.type,
                transactionData.amount,
                transactionData.description || ''
            ]
        );
        
        return this.mapRowToTransaction(result.rows[0]);
    }

    static mapRowToTransaction(row) {
        if (!row) return null;
        
        return {
            _id: row.id,
            id: row.id,
            userId: row.user_id,
            user_id: row.user_id,
            type: row.type,
            amount: row.amount,
            description: row.description,
            createdAt: row.created_at
        };
    }
}

module.exports = Transaction;
