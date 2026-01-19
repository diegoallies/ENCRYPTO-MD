const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const Deployment = require('../models/Deployment');
const Transaction = require('../models/Transaction');
const AdminSettings = require('../models/AdminSettings');
const axios = require('axios');

// Deploy new bot
router.post('/', authenticate, async (req, res) => {
    try {
        const { appName, envVars } = req.body;
        
        if (req.user.coins < 10) {
            return res.status(400).json({ error: 'Not enough coins (10 coins required)' });
        }

        // Get available Heroku API key from admin settings
        const adminSettings = await AdminSettings.getAllSettings();
        const herokuApiKey = adminSettings.herokuApiKeys?.[adminSettings.activeHerokuKeyIndex];
        
        if (!herokuApiKey) {
            return res.status(500).json({ error: 'Heroku API key not configured' });
        }

        // Create Heroku app
        const herokuHeaders = {
            'Authorization': `Bearer ${herokuApiKey}`,
            'Accept': 'application/vnd.heroku+json; version=3',
            'Content-Type': 'application/json'
        };

        const createAppRes = await axios.post('https://api.heroku.com/apps', { name: appName }, { headers: herokuHeaders });
        
        // Set config vars
        if (envVars) {
            await axios.patch(
                `https://api.heroku.com/apps/${appName}/config-vars`,
                envVars,
                { headers: herokuHeaders }
            );
        }

        // Trigger build
        await axios.post(
            `https://api.heroku.com/apps/${appName}/builds`,
            { 
                source_blob: { 
                    url: adminSettings.githubRepo || 'https://github.com/mrfrankofcc/SUBZERO-MD/tarball/main' 
                } 
            },
            { headers: herokuHeaders }
        );

        // Create deployment record
        const deployment = await Deployment.create({
            userId: req.user.id,
            appName,
            url: `https://${appName}.herokuapp.com`,
            type: 'SUBZERO-MD',
            status: 'active',
            lastRenewed: new Date()
        });

        // Deduct coins
        await User.update(req.user.id, { coins: req.user.coins - 10 });

        // Record transaction
        await Transaction.create({
            userId: req.user.id,
            type: 'debit',
            amount: 10,
            description: 'SUBZERO-MD deployment'
        });

        res.json({ 
            url: deployment.url,
            dashboardUrl: `https://dashboard.heroku.com/apps/${appName}`
        });
    } catch (error) {
        console.error('Deployment error:', error);
        res.status(500).json({ 
            error: 'Heroku deployment failed',
            details: error.response?.data || error.message
        });
    }
});

// Get user deployments
router.get('/', authenticate, async (req, res) => {
    try {
        const deployments = await Deployment.find({ userId: req.user.id });
        res.json(deployments);
    } catch (error) {
        console.error('Get deployments error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Get deployment logs
router.get('/:id/logs', authenticate, async (req, res) => {
    try {
        const deployment = await Deployment.findOne({ 
            id: req.params.id, 
            userId: req.user.id 
        });
        
        if (!deployment) {
            return res.status(404).json({ error: 'Deployment not found' });
        }

        res.json([]); // Logs not stored in DB for now
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Renew deployment
router.post('/:id/renew', authenticate, async (req, res) => {
    try {
        const deployment = await Deployment.findOne({ 
            id: req.params.id, 
            userId: req.user.id 
        });
        
        if (!deployment) {
            return res.status(404).json({ error: 'Deployment not found' });
        }

        if (req.user.coins < 10) {
            return res.status(400).json({ error: 'Not enough coins (10 coins required)' });
        }

        // Deduct coins
        await User.update(req.user.id, { coins: req.user.coins - 10 });

        // Update deployment
        await Deployment.update(deployment.id, {
            lastRenewed: new Date(),
            status: 'active'
        });

        // Record transaction
        await Transaction.create({
            userId: req.user.id,
            type: 'debit',
            amount: 10,
            description: 'Deployment renewal'
        });

        res.json({ message: 'Deployment renewed successfully' });
    } catch (error) {
        console.error('Renew deployment error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;
