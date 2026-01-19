const { pool } = require('../config/db');

class AdminSettings {
    static async findOne() {
        // AdminSettings is a singleton - get all records
        const result = await pool.query('SELECT * FROM admin_settings');
        
        if (result.rows.length === 0) {
            // Create default settings
            return await this.createDefault();
        }
        
        return this.mapRowToSettings(result.rows);
    }

    static async createDefault() {
        const defaultSettings = {
            herokuApiKeys: [],
            activeHerokuKeyIndex: 0,
            mongoUrl: '',
            githubRepo: 'https://github.com/mrfrankofcc/SUBZERO-MD',
            maintenance: false,
            maintenanceMessage: 'We are currently undergoing maintenance. Please check back later.',
            coinSettings: {
                deploymentCost: 10,
                dailyClaim: 10,
                referralBonus: 5,
                voucherAmount: 10
            }
        };

        // Store as JSON in key-value format
        const settings = [
            { key: 'herokuApiKeys', value: JSON.stringify(defaultSettings.herokuApiKeys) },
            { key: 'activeHerokuKeyIndex', value: defaultSettings.activeHerokuKeyIndex.toString() },
            { key: 'mongoUrl', value: defaultSettings.mongoUrl },
            { key: 'githubRepo', value: defaultSettings.githubRepo },
            { key: 'maintenance', value: defaultSettings.maintenance.toString() },
            { key: 'maintenanceMessage', value: defaultSettings.maintenanceMessage },
            { key: 'coinSettings', value: JSON.stringify(defaultSettings.coinSettings) }
        ];

        for (const setting of settings) {
            await pool.query(
                'INSERT INTO admin_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
                [setting.key, setting.value]
            );
        }

        return defaultSettings;
    }

    static async update(updates) {
        for (const [key, value] of Object.entries(updates)) {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : value.toString();
            await pool.query(
                'INSERT INTO admin_settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
                [key, stringValue]
            );
        }
        
        return await this.findOne();
    }

    static mapRowToSettings(rows) {
        // Get all settings
        const settings = {};
        
        // This method should be called with all rows
        if (Array.isArray(rows)) {
            rows.forEach(row => {
                let value = row.value;
                // Try to parse JSON
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    // If not JSON, check if it's a boolean or number
                    if (value === 'true') value = true;
                    else if (value === 'false') value = false;
                    else if (!isNaN(value) && value !== '') value = Number(value);
                }
                settings[row.key] = value;
            });
        } else {
            // Single row
            let value = rows.value;
            try {
                value = JSON.parse(value);
            } catch (e) {
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(value) && value !== '') value = Number(value);
            }
            settings[rows.key] = value;
        }

        // Reconstruct the settings object
        const result = {
            herokuApiKeys: settings.herokuApiKeys || [],
            activeHerokuKeyIndex: settings.activeHerokuKeyIndex || 0,
            mongoUrl: settings.mongoUrl || '',
            githubRepo: settings.githubRepo || 'https://github.com/mrfrankofcc/SUBZERO-MD',
            maintenance: settings.maintenance || false,
            maintenanceMessage: settings.maintenanceMessage || 'We are currently undergoing maintenance. Please check back later.',
            coinSettings: settings.coinSettings || {
                deploymentCost: 10,
                dailyClaim: 10,
                referralBonus: 5,
                voucherAmount: 10
            }
        };

        // Add method to get next Heroku key
        result.getNextHerokuKey = function() {
            if (!this.herokuApiKeys || this.herokuApiKeys.length === 0) return null;
            this.activeHerokuKeyIndex = (this.activeHerokuKeyIndex + 1) % this.herokuApiKeys.length;
            return this.herokuApiKeys[this.activeHerokuKeyIndex];
        };

        return result;
    }

    // Static method to get all settings as an object
    static async getAllSettings() {
        const result = await pool.query('SELECT * FROM admin_settings');
        return this.mapRowToSettings(result.rows);
    }
}

module.exports = AdminSettings;
