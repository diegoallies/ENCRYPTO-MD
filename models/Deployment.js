const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appName: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'pending' },
    envVars: Object,
    herokuAppId: String,
    logs: [String],
    lastRenewed: Date,
    nextRenewal: Date,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Deployment', deploymentSchema);
