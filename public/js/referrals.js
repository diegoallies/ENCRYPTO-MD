document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // DOM Elements
    const totalReferrals = document.getElementById('total-referrals');
    const earnedCoins = document.getElementById('earned-coins');
    const referralLink = document.getElementById('referral-link');
    const copyReferralBtn = document.getElementById('copy-referral');
    const referralsContainer = document.getElementById('referrals-container');

    // Load referral data
    async function loadReferralData() {
        try {
            const response = await fetch('/api/referrals', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            renderReferralData(data);
        } catch (error) {
            console.error('Error loading referral data:', error);
            showError('Failed to load referral data');
        }
    }

    // Render referral data
    function renderReferralData(data) {
        totalReferrals.textContent = data.totalReferrals;
        earnedCoins.textContent = data.earnedCoins;
        referralLink.value = data.referralLink;

        if (data.referrals.length === 0) {
            referralsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-friends"></i>
                    <p>No referrals yet</p>
                </div>
            `;
            return;
        }

        referralsContainer.innerHTML = data.referrals.map(ref => `
            <div class="referral-item">
                <div class="referral-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="referral-details">
                    <h4>${ref.referredUser.username}</h4>
                    <p>Joined on ${new Date(ref.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="referral-earning">
                    +5 coins
                </div>
            </div>
        `).join('');
    }

    // Event listeners
    copyReferralBtn.addEventListener('click', () => {
        referralLink.select();
        document.execCommand('copy');
        
        const originalText = copyReferralBtn.innerHTML;
        copyReferralBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyReferralBtn.innerHTML = originalText;
        }, 2000);
    });

    // Initialize
    loadReferralData();
});
