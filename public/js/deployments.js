document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // DOM Elements
    const deploymentsList = document.getElementById('deployments-list');
    const newDeploymentBtn = document.getElementById('new-deployment-btn');
    const deploymentModal = document.getElementById('deployment-modal');
    const modalClose = document.querySelector('.modal-close');
    const deploymentForm = document.getElementById('deployment-form');

    // Load deployments
    async function loadDeployments() {
        try {
            const response = await fetch('/api/deployments', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const deployments = await response.json();
            renderDeployments(deployments);
        } catch (error) {
            console.error('Error loading deployments:', error);
            showError('Failed to load deployments');
        }
    }

    // Render deployments
    function renderDeployments(deployments) {
        if (deployments.length === 0) {
            deploymentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-server"></i>
                    <p>No deployments yet</p>
                </div>
            `;
            return;
        }

        deploymentsList.innerHTML = deployments.map(deployment => `
            <div class="deployment-card">
                <div class="deployment-header">
                    <h3>${deployment.appName}</h3>
                    <span class="status-badge ${deployment.status}">${deployment.status}</span>
                </div>
                <div class="deployment-details">
                    <p><i class="fas fa-link"></i> <a href="${deployment.url}" target="_blank">${deployment.url}</a></p>
                    <p><i class="fas fa-calendar"></i> Created: ${new Date(deployment.createdAt).toLocaleString()}</p>
                    ${deployment.nextRenewal ? `
                        <p><i class="fas fa-clock"></i> Renewal: ${new Date(deployment.nextRenewal).toLocaleString()}</p>
                    ` : ''}
                </div>
                <div class="deployment-actions">
                    <button class="btn btn-primary btn-sm btn-view" data-url="${deployment.url}">
                        <i class="fas fa-external-link-alt"></i> View
                    </button>
                    <button class="btn btn-primary btn-sm btn-logs" data-id="${deployment._id}">
                        <i class="fas fa-terminal"></i> Logs
                    </button>
                    <button class="btn btn-danger btn-sm btn-delete" data-id="${deployment._id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Event listeners
    newDeploymentBtn.addEventListener('click', () => {
        deploymentModal.style.display = 'flex';
    });

    modalClose.addEventListener('click', () => {
        deploymentModal.style.display = 'none';
    });

    deploymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const appName = document.getElementById('app-name').value;
        const sessionId = document.getElementById('session-id').value;
        const prefix = document.getElementById('prefix').value;

        try {
            const response = await fetch('/api/deployments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    appName,
                    envVars: {
                        SESSION_ID: sessionId,
                        PREFIX: prefix,
                        MODE: 'public'
                    }
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Deployment failed');

            deploymentModal.style.display = 'none';
            loadDeployments();
            showDialog('Success', 'Deployment started successfully!', 'success');
        } catch (error) {
            showDialog('Error', error.message, 'error');
        }
    });

    // Initialize
    loadDeployments();
});
