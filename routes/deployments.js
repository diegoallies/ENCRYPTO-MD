const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const Deployment = require('../models/Deployment');
const Transaction = require('../models/Transaction');
const axios = require('axios');

// Deploy new bot
router.post('/', authenticate, async (req, res) => {
    try {
        const { appName, envVars } = req.body;
        
        if (req.user.coins < 10) {
            return res.status(400).json({ error: 'Not enough coins (10 coins required)' });
        }

        // Get available Heroku API key from admin settings
        const adminSettings = await AdminSettings.findOne();
        if (!adminSettings?.herokuApiKey) {
            return res.status(500).json({ error: 'Heroku API key not configured' });
        }

        // Create Heroku app
        const herokuHeaders = {
            'Authorization': `Bearer ${adminSettings.herokuApiKey}`,
            'Accept': 'application/vnd.heroku+json; version=3',
            'Content-Type': 'application/json'
        };

        const createAppRes = await axios.post('https://api.heroku.com/apps', { name: appName }, { headers: herokuHeaders });
        
        // Set config vars
        await axios.patch(
            `https://api.heroku.com/apps/${appName}/config-vars`,
            envVars,
            { headers: herokuHeaders }
        );

        // Trigger build
        await axios.post(
            `https://api.heroku.com/apps/${appName}/builds`,
            { 
                source_blob: { 
                    url: adminSettings.repoUrl || 'https://github.com/mrfrankofcc/SUBZERO-MD/tarball/main' 
                } 
            },
            { headers: herokuHeaders }
        );

        // Create deployment record
        const deployment = new Deployment({
            userId: req.user._id,
            appName,
            url: `https://${appName}.herokuapp.com`,
            type: 'SUBZERO-MD',
            envVars,
            herokuAppId: createAppRes.data.id,
            status: 'active',
            lastRenewed: new Date(),
            nextRenewal: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        await deployment.save();

        // Deduct coins
        req.user.coins -= 10;
        await req.user.save();

        // Record transaction
        const transaction = new Transaction({
            userId: req.user._id,
            type: 'debit',
            amount: 10,
            description: 'SUBZERO-MD deployment',
            relatedDeployment: deployment._id
        });
        await transaction.save();

        res.json({ 
            url: deployment.url,
            dashboardUrl: `https://dashboard.heroku.com/apps/${appName}`
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Heroku deployment failed',
            details: error.response?.data || error.message
        });
    }
});

// Get user deployments
router.get('/', authenticate, async (req, res) => {
    try {
        const deployments = await Deployment.find({ userId: req.user._id });
        res.json(deployments);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get deployment logs
router.get('/:id/logs', authenticate, async (req, res) => {
    try {
        const deployment = await Deployment.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });
        
        if (!deployment) {
            return res.status(404).json({ error: 'Deployment not found' });
        }

        res.json(deployment.logs);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Renew deployment
router.post('/:id/renew', authenticate, async (req, res) => {
    try {
        const deployment = await Deployment.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });
        
        if (!deployment) {
            return res.status(404).json({ error: 'Deployment not found' });
        }

        if (req.user.coins < 10) {
            return res.status(400).json({ error: 'Not enough coins (10 coins required)' });
        }

        // Deduct coins
        req.user.coins -= 10;
        await req.user.save();

        // Update deployment
        deployment.lastRenewed = new Date();
        deployment.nextRenewal = new Date(Date.now() + 24 * 60 * 60 * 1000);
        deployment.status = 'active';
        await deployment.save();

        // Record transaction
        const transaction = new Transaction({
            userId: req.user._id,
            type: 'debit',
            amount: 10,
            description: 'Deployment renewal',
            relatedDeployment: deployment._id
        });
        await transaction.save();

        res.json({ message: 'Deployment renewed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
