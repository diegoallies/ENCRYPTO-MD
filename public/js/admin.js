document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // DOM Elements
    const totalUsersElement = document.getElementById('total-users');
    const activeDeploymentsElement = document.getElementById('active-deployments');
    const activeUsersElement = document.getElementById('active-users');
    const activityList = document.getElementById('activity-list');
    const usersList = document.getElementById('users-list');
    const userSearch = document.getElementById('user-search');
    const adminDeploymentsList = document.getElementById('admin-deployments-list');
    const deploymentFilter = document.getElementById('deployment-filter');
    const herokuApiKeyInput = document.getElementById('heroku-api-key');
    const herokuApiKey2Input = document.getElementById('heroku-api-key-2');
    const repoUrlInput = document.getElementById('repo-url');
    const maintenanceMode = document.getElementById('maintenance-mode');
    const maintenanceMessage = document.getElementById('maintenance-message');
    const saveHerokuKeysBtn = document.getElementById('save-heroku-keys');
    const saveRepoSettingsBtn = document.getElementById('save-repo-settings');
    const saveSystemSettingsBtn = document.getElementById('save-system-settings');

    // Load admin data
    async function loadAdminData() {
        try {
            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            updateDashboard(data);
        } catch (error) {
            console.error('Error loading admin data:', error);
            showError('Failed to load admin data');
        }
    }

    // Update dashboard with stats
    function updateDashboard(data) {
        totalUsersElement.textContent = data.totalUsers;
        activeDeploymentsElement.textContent = data.activeDeployments;
        activeUsersElement.textContent = data.activeUsers;

        // Load settings
        if (data.settings) {
            herokuApiKeyInput.value = data.settings.herokuApiKey || '';
            repoUrlInput.value = data.settings.repoUrl || '';
            maintenanceMode.checked = data.settings.maintenance || false;
            maintenanceMessage.value = data.settings.maintenanceMessage || '';
        }
    }

    // Load users
    async function loadUsers(search = '') {
        try {
            const url = search ? 
                `/api/admin/users?search=${encodeURIComponent(search)}` : 
                '/api/admin/users';
                
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const users = await response.json();
            renderUsers(users);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    // Render users table
    function renderUsers(users) {
        if (users.length === 0) {
            usersList.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>No users found</p>
                    </td>
                </tr>
            `;
            return;
        }

        usersList.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div class="user-avatar">
                        <img src="${user.profilePic}" alt="${user.username}">
                        ${user.username}
                    </div>
                </td>
                <td>${user.email}</td>
                <td>${user.coins}</td>
                <td>
                    <span class="status-badge ${user.isBanned ? 'banned' : 'active'}">
                        ${user.isBanned ? 'Banned' : 'Active'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-view" data-user-id="${user._id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm ${user.isBanned ? 'btn-unban' : 'btn-ban'}" 
                            data-user-id="${user._id}">
                            ${user.isBanned ? '<i class="fas fa-unlock"></i>' : '<i class="fas fa-ban"></i>'}
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Add event listeners to action buttons
        document.querySelectorAll('.btn-ban').forEach(btn => {
            btn.addEventListener('click', () => banUser(btn.dataset.userId));
        });

        document.querySelectorAll('.btn-unban').forEach(btn => {
            btn.addEventListener('click', () => banUser(btn.dataset.userId));
        });
    }

    // Ban/unban user
    async function banUser(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/ban`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const user = await response.json();
            loadUsers(userSearch.value); // Refresh users list
        } catch (error) {
            showDialog('Error', error.message, 'error');
        }
    }

    // Load deployments
    async function loadDeployments(filter = 'all') {
        try {
            const response = await fetch(`/api/admin/deployments?filter=${filter}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const deployments = await response.json();
            renderDeployments(deployments);
        } catch (error) {
            console.error('Error loading deployments:', error);
        }
    }

    // Render deployments
    function renderDeployments(deployments) {
        if (deployments.length === 0) {
            adminDeploymentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-server"></i>
                    <p>No deployments found</p>
                </div>
            `;
            return;
        }

        adminDeploymentsList.innerHTML = deployments.map(deployment => `
            <div class="deployment-card">
                <div class="deployment-header">
                    <h3>${deployment.appName}</h3>
                    <span class="status-badge ${deployment.status}">${deployment.status}</span>
                </div>
                <div class="deployment-details">
                    <p><i class="fas fa-user"></i> ${deployment.userId.username}</p>
                    <p><i class="fas fa-link"></i> <a href="${deployment.url}" target="_blank">${deployment.url}</a></p>
                    <p><i class="fas fa-calendar"></i> Created: ${new Date(deployment.createdAt).toLocaleString()}</p>
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

    // Save Heroku API keys
    saveHerokuKeysBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    herokuApiKey: herokuApiKeyInput.value,
                    herokuApiKey2: herokuApiKey2Input.value
                })
            });

            const settings = await response.json();
            if (!response.ok) throw new Error('Failed to save settings');

            showDialog('Success', 'Heroku API keys saved successfully!', 'success');
        } catch (error) {
            showDialog('Error', error.message, 'error');
        }
    });

    // Save repository settings
    saveRepoSettingsBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    repoUrl: repoUrlInput.value
                })
            });

            const settings = await response.json();
            if (!response.ok) throw new Error('Failed to save settings');

            showDialog('Success', 'Repository settings saved successfully!', 'success');
        } catch (error) {
            showDialog('Error', error.message, 'error');
        }
    });

    // Save system settings
    saveSystemSettingsBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    maintenance: maintenanceMode.checked,
                    maintenanceMessage: maintenanceMessage.value
                })
            });

            const settings = await response.json();
            if (!response.ok) throw new Error('Failed to save settings');

            showDialog('Success', 'System settings saved successfully!', 'success');
        } catch (error) {
            showDialog('Error', error.message, 'error');
        }
    });

    // Event listeners
    userSearch.addEventListener('input', (e) => {
        loadUsers(e.target.value);
    });

    deploymentFilter.addEventListener('change', (e) => {
        loadDeployments(e.target.value);
    });

    // Navigation
    document.querySelectorAll('.sidebar-nav li').forEach(link => {
        link.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            if (section) {
                document.querySelectorAll('.content-section').forEach(s => {
                    s.classList.remove('active');
                });
                document.getElementById(`${section}-section`).classList.add('active');
                document.querySelector('.page-title').textContent = 
                    this.textContent.trim();
            }
        });
    });

    // Initialize
    loadAdminData();
    loadUsers();
    loadDeployments();
});
