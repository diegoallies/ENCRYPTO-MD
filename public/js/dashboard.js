document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // DOM Elements
    const sidebarLinks = document.querySelectorAll('.sidebar-nav li');
    const contentSections = document.querySelectorAll('.content-section');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const logoutBtn = document.getElementById('logout-btn');
    const profilePicPreview = document.getElementById('profile-pic-preview');
    const usernameElement = document.querySelector('.username');
    const userEmailElement = document.querySelector('.user-email');
    const coinCountElement = document.getElementById('coin-count');
    const activeBotsElement = document.getElementById('active-bots');
    const availableCoinsElement = document.getElementById('available-coins');
    const referralEarningsElement = document.getElementById('referral-earnings');
    const referralLinkElement = document.getElementById('referral-link');
    const copyReferralBtn = document.getElementById('copy-referral');
    const recentDeploymentsList = document.getElementById('recent-deployments');
    const deployNewBtn = document.getElementById('deploy-new-btn');
    const claimCoinsBtn = document.getElementById('claim-coins-btn');

    // Load user data
    async function loadUserData() {
        try {
            const response = await fetch('/api/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load user data');
            
            const data = await response.json();
            updateUI(data);
        } catch (error) {
            console.error('Error loading user data:', error);
            window.location.href = '/login';
        }
    }

    // Update UI with user data
    function updateUI(data) {
        const { user, stats, recentDeployments } = data;
        
        // User info
        profilePicPreview.src = user.profilePic;
        usernameElement.textContent = user.username;
        userEmailElement.textContent = user.email;
        coinCountElement.textContent = user.coins;
        
                // Stats
        activeBotsElement.textContent = stats.activeDeployments;
        availableCoinsElement.textContent = user.coins;
        referralEarningsElement.textContent = stats.referralEarnings;
        referralLinkElement.value = `${window.location.origin}/signup?ref=${user.username}`;

        // Recent deployments
        if (recentDeployments.length === 0) {
            recentDeploymentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-server"></i>
                    <p>No deployments yet</p>
                </div>
            `;
        } else {
            recentDeploymentsList.innerHTML = recentDeployments.map(deployment => `
                <div class="deployment-item">
                    <div class="deployment-info">
                        <h4>${deployment.appName}</h4>
                        <p>Status: <span class="status-badge ${deployment.status}">${deployment.status}</span></p>
                        <p>Created: ${new Date(deployment.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="deployment-actions">
                        <button class="btn-view" data-url="${deployment.url}">
                            <i class="fas fa-external-link-alt"></i> View
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    // Event listeners
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    });

    copyReferralBtn.addEventListener('click', () => {
        referralLinkElement.select();
        document.execCommand('copy');
        
        const originalText = copyReferralBtn.innerHTML;
        copyReferralBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyReferralBtn.innerHTML = originalText;
        }, 2000);
    });

    deployNewBtn.addEventListener('click', () => {
        window.location.href = '/deployments';
    });

    claimCoinsBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/wallet/claim', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to claim coins');
            
            coinCountElement.textContent = data.coins;
            showDialog('Success', 'You claimed 10 coins!', 'success');
        } catch (error) {
            showDialog('Error', error.message, 'error');
        }
    });

    // Navigation
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            if (section) {
                window.location.href = `/${section}`;
            }
        });
    });

    // Helper function to show dialog
    function showDialog(title, message, type = '') {
        // Implement dialog functionality here
        alert(`${title}: ${message}`); // Replace with proper modal implementation
    }

    // Initialize
    loadUserData();
});
