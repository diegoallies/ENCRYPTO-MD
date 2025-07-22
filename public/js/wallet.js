document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // DOM Elements
    const walletAmount = document.getElementById('wallet-amount');
    const claimTimer = document.getElementById('claim-timer');
    const claimCoinsBtn = document.getElementById('claim-coins-btn');
    const redeemVoucherBtn = document.getElementById('redeem-voucher');
    const voucherCodeInput = document.getElementById('voucher-code');
    const sendCoinsBtn = document.getElementById('send-coins-btn');
    const recipientInput = document.getElementById('recipient');
    const amountInput = document.getElementById('amount');
    const transactionsList = document.getElementById('transactions-list');

    // Load wallet data
    async function loadWalletData() {
        try {
            const [userRes, transactionsRes] = await Promise.all([
                fetch('/api/user', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }),
                fetch('/api/wallet/transactions', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
            ]);

            const user = await userRes.json();
            const transactions = await transactionsRes.json();

            walletAmount.textContent = user.coins;
            updateClaimTimer(user.lastClaim);
            renderTransactions(transactions);
        } catch (error) {
            console.error('Error loading wallet data:', error);
            showError('Failed to load wallet data');
        }
    }

    // Update claim timer
    function updateClaimTimer(lastClaim) {
        if (!lastClaim) {
            claimTimer.style.display = 'none';
            return;
        }

        const now = new Date();
        const lastClaimDate = new Date(lastClaim);
        const nextClaim = new Date(lastClaimDate.getTime() + 24 * 60 * 60 * 1000);
        
        if (now >= nextClaim) {
            claimTimer.style.display = 'none';
            return;
        }

        const diff = nextClaim - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        claimTimer.innerHTML = `
            <i class="fas fa-clock"></i> Next claim in: 
            ${hours}h ${minutes}m ${seconds}s
        `;
        claimTimer.style.display = 'flex';

        // Update timer every second
        setTimeout(updateClaimTimer, 1000, lastClaim);
    }

    // Render transactions
    function renderTransactions(transactions) {
        if (transactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exchange-alt"></i>
                    <p>No transactions yet</p>
                </div>
            `;
            return;
        }

        transactionsList.innerHTML = transactions.map(tx => `
            <div class="transaction-item ${tx.type}">
                <div class="transaction-icon">
                    ${tx.type === 'credit' ? 
                        '<i class="fas fa-plus-circle"></i>' : 
                        '<i class="fas fa-minus-circle"></i>'}
                </div>
                <div class="transaction-details">
                    <h4>${tx.description}</h4>
                    <p>${new Date(tx.createdAt).toLocaleString()}</p>
                </div>
                <div class="transaction-amount">
                    ${tx.type === 'credit' ? '+' : '-'}${tx.amount} coins
                </div>
            </div>
        `).join('');
    }

    // Event listeners
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

            walletAmount.textContent = data.coins;
            claimTimer.style.display = 'none';
            showDialog('Success', 'You claimed 10 coins!', 'success');
            loadWalletData(); // Refresh transactions
        } catch (error) {
            showDialog('Error', error.message, 'error');
        }
    });

    redeemVoucherBtn.addEventListener('click', async () => {
        const code = voucherCodeInput.value.trim();
        if (!code) {
            showDialog('Error', 'Please enter a voucher code', 'error');
            return;
        }

        try {
            const response = await fetch('/api/wallet/redeem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ voucherCode: code })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Invalid voucher');

            walletAmount.textContent = data.newBalance;
            voucherCodeInput.value = '';
            showDialog('Success', `Redeemed ${data.coinsAdded} coins!`, 'success');
            loadWalletData(); // Refresh transactions
        } catch (error) {
            showDialog('Error', error.message, 'error');
        }
    });

    sendCoinsBtn.addEventListener('click', async () => {
        const recipient = recipientInput.value.trim();
        const amount = parseInt(amountInput.value);

        if (!recipient || !amount || amount <= 0) {
            showDialog('Error', 'Please enter valid recipient and amount', 'error');
            return;
        }

        try {
            const response = await fetch('/api/wallet/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ recipient, amount })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to send coins');

            walletAmount.textContent = data.coins;
            recipientInput.value = '';
            amountInput.value = '';
            showDialog('Success', `Sent ${amount} coins to ${data.recipient}`, 'success');
            loadWalletData(); // Refresh transactions
        } catch (error) {
            showDialog('Error', error.message, 'error');
        }
    });

    // Initialize
    loadWalletData();
});
