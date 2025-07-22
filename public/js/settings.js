document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // DOM Elements
    const profilePicPreview = document.getElementById('profile-pic-preview');
    const profilePicUpload = document.getElementById('profile-pic-upload');
    const profilePicInput = document.getElementById('profile-pic');
    const usernameInput = document.getElementById('username');
    const githubUsernameInput = document.getElementById('github-username');
    const whatsappNumberInput = document.getElementById('whatsapp-number');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const toggleEyes = document.querySelectorAll('.toggle-eye');

    // Load user data
    async function loadUserData() {
        try {
            const response = await fetch('/api/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const user = await response.json();
            populateForm(user);
        } catch (error) {
            console.error('Error loading user data:', error);
            showError('Failed to load user data');
        }
    }

    // Populate form with user data
    function populateForm(user) {
        profilePicPreview.src = user.profilePic;
        profilePicInput.value = user.profilePic;
        usernameInput.value = user.username;
        githubUsernameInput.value = user.githubUsername || '';
        whatsappNumberInput.value = user.whatsappNumber || '';
    }

    // Event listeners
    profilePicUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            profilePicPreview.src = event.target.result;
            profilePicInput.value = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    saveProfileBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const profilePic = profilePicInput.value;
        const githubUsername = githubUsernameInput.value.trim();
        const whatsappNumber = whatsappNumberInput.value.trim();

        if (!username) {
            showDialog('Error', 'Username is required', 'error');
            return;
        }

        try {
            const response = await fetch('/api/settings/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username,
                    profilePic,
                    githubUsername,
                    whatsappNumber
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update profile');

            showDialog('Success', 'Profile updated successfully!', 'success');
        } catch (error) {
            showDialog('Error', error.message, 'error');
        }
    });

    changePasswordBtn.addEventListener('click', async () => {
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            showDialog('Error', 'Please fill all fields', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showDialog('Error', 'New passwords do not match', 'error');
            return;
        }

        try {
            const response = await fetch('/api/settings/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to change password');
            }

            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
            showDialog('Success', 'Password changed successfully!', 'success');
        } catch (error) {
            showDialog('Error', error.message, 'error');
        }
    });

    // Toggle password visibility
    toggleEyes.forEach(eye => {
        eye.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });

    // Initialize
    loadUserData();
});
