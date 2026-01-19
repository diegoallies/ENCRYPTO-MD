const { pool } = require('../config/db');

class Message {
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
            `SELECT * FROM messages ${whereClause} LIMIT 1`,
            params
        );
        
        return result.rows.length > 0 ? this.mapRowToMessage(result.rows[0]) : null;
    }

    static async find(query = {}) {
        let whereClause = '';
        let params = [];
        
        if (query.user_id) {
            whereClause = 'WHERE user_id = $1';
            params.push(query.user_id);
        }

        const result = await pool.query(
            `SELECT * FROM messages ${whereClause} ORDER BY created_at DESC`,
            params
        );
        
        return result.rows.map(row => this.mapRowToMessage(row));
    }

    static async create(messageData) {
        const result = await pool.query(
            `INSERT INTO messages (user_id, subject, message, is_read)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                messageData.user_id || messageData.userId,
                messageData.subject || null,
                messageData.message || messageData.content || '',
                messageData.isRead || false
            ]
        );
        
        return this.mapRowToMessage(result.rows[0]);
    }

    static async update(id, updates) {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(updates).forEach(key => {
            const dbKey = this.camelToSnake(key);
            fields.push(`${dbKey} = $${paramIndex}`);
            values.push(updates[key]);
            paramIndex++;
        });

        values.push(id);
        const result = await pool.query(
            `UPDATE messages SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        return result.rows.length > 0 ? this.mapRowToMessage(result.rows[0]) : null;
    }

    static mapRowToMessage(row) {
        if (!row) return null;
        
        return {
            _id: row.id,
            id: row.id,
            userId: row.user_id,
            user_id: row.user_id,
            subject: row.subject,
            message: row.message,
            content: row.message,
            isRead: row.is_read,
            is_read: row.is_read,
            createdAt: row.created_at
        };
    }

    static camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
}

module.exports = Message;
