const { pool } = require('../config/db');

class Deployment {
    static async findOne(query) {
        let whereClause = '';
        let params = [];
        
        if (query.userId) {
            whereClause = 'WHERE user_id = $1';
            params.push(query.userId);
        } else if (query.appName) {
            whereClause = 'WHERE app_name = $1';
            params.push(query.appName);
        } else if (query.id || query._id) {
            whereClause = 'WHERE id = $1';
            params.push(query.id || query._id);
        }

        const result = await pool.query(
            `SELECT * FROM deployments ${whereClause} LIMIT 1`,
            params
        );
        
        return result.rows.length > 0 ? this.mapRowToDeployment(result.rows[0]) : null;
    }

    static async find(query = {}) {
        let whereClause = '';
        let params = [];
        
        if (query.userId) {
            whereClause = 'WHERE user_id = $1';
            params.push(query.userId);
        }

        const result = await pool.query(
            `SELECT * FROM deployments ${whereClause} ORDER BY created_at DESC`,
            params
        );
        
        return result.rows.map(row => this.mapRowToDeployment(row));
    }

    static async create(deploymentData) {
        const result = await pool.query(
            `INSERT INTO deployments (user_id, app_name, url, status, type, last_renewed)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                deploymentData.userId,
                deploymentData.appName,
                deploymentData.url || null,
                deploymentData.status || 'pending',
                deploymentData.type || null,
                deploymentData.lastRenewed || null
            ]
        );
        
        return this.mapRowToDeployment(result.rows[0]);
    }

    static async update(id, updates) {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(updates).forEach(key => {
            const dbKey = this.camelToSnake(key);
            if (key === 'userId') {
                fields.push(`user_id = $${paramIndex}`);
            } else {
                fields.push(`${dbKey} = $${paramIndex}`);
            }
            values.push(updates[key]);
            paramIndex++;
        });

        values.push(id);
        const result = await pool.query(
            `UPDATE deployments SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        return result.rows.length > 0 ? this.mapRowToDeployment(result.rows[0]) : null;
    }

    static async deleteOne(query) {
        let whereClause = '';
        let params = [];
        
        if (query.id || query._id) {
            whereClause = 'WHERE id = $1';
            params.push(query.id || query._id);
        } else if (query.appName) {
            whereClause = 'WHERE app_name = $1';
            params.push(query.appName);
        }

        await pool.query(`DELETE FROM deployments ${whereClause}`, params);
    }

    static mapRowToDeployment(row) {
        if (!row) return null;
        
        const deployment = {
            _id: row.id,
            id: row.id,
            userId: row.user_id,
            appName: row.app_name,
            url: row.url,
            status: row.status,
            type: row.type,
            lastRenewed: row.last_renewed,
            createdAt: row.created_at
        };

        deployment.save = async function() {
            return await Deployment.update(this.id, this);
        };

        return deployment;
    }

    static camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
}

module.exports = Deployment;
