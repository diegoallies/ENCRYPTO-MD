<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up | Suzero Nodes</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/css/style.css">
    <style>
        .auth-container {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle at 20% 30%, rgba(37, 99, 235, 0.1) 0%, transparent 40%),
                        radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 40%),
                        var(--darker);
        }
        
        .auth-card {
            width: 100%;
            max-width: 420px;
            padding: 2.5rem;
            position: relative;
            overflow: hidden;
        }
        
        .auth-card::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
                to bottom right,
                rgba(255, 255, 255, 0.05) 0%,
                rgba(255, 255, 255, 0.01) 50%,
                rgba(255, 255, 255, 0.05) 100%
            );
            transform: rotate(30deg);
            z-index: -1;
        }
        
        .auth-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .auth-logo {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: var(--primary);
        }
        
        .auth-title {
            font-size: 1.75rem;
            margin-bottom: 0.5rem;
            font-family: 'Space Grotesk', sans-serif;
        }
        
        .auth-subtitle {
            color: var(--text-secondary);
            margin-bottom: 2rem;
        }
        
        .auth-footer {
            text-align: center;
            margin-top: 1.5rem;
            color: var(--text-secondary);
        }
        
        .auth-footer a {
            color: var(--primary);
            text-decoration: none;
            transition: var(--transition);
        }
        
        .auth-footer a:hover {
            text-decoration: underline;
        }
        
        .password-toggle {
            position: relative;
        }
        
        .password-toggle .toggle-eye {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: var(--text-secondary);
        }
        
        .referral-section {
            margin-top: 1rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: var(--border-radius);
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-card glass">
            <div class="auth-header">
                <div class="auth-logo">
                    <i class="fas fa-robot"></i>
                </div>
                <h1 class="auth-title">Create Account</h1>
                <p class="auth-subtitle">Join Suzero Nodes today</p>
            </div>
            
            <form id="signup-form">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" placeholder="Choose a username" required>
                </div>
                
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" placeholder="Enter your email" required>
                </div>
                
                <div class="form-group password-toggle">
                    <label for="password">Password</label>
                    <input type="password" id="password" placeholder="Create a password" required>
                    <i class="fas fa-eye toggle-eye" id="toggle-password"></i>
                </div>
                
                <div class="form-group password-toggle">
                    <label for="confirm-password">Confirm Password</label>
                    <input type="password" id="confirm-password" placeholder="Confirm your password" required>
                    <i class="fas fa-eye toggle-eye" id="toggle-confirm-password"></i>
                </div>
                
                <div class="referral-section">
                    <div class="form-group">
                        <label for="referral-code">Referral Code (optional)</label>
                        <input type="text" id="referral-code" placeholder="Enter referral code if any">
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 1rem;">
                    <input type="checkbox" id="terms" required>
                    <label for="terms">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 1rem;">
                    <i class="fas fa-user-plus"></i> Create Account
                </button>
                
                <div class="auth-footer">
                    Already have an account? <a href="/login">Log in</a>
                </div>
            </form>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const signupForm = document.getElementById('signup-form');
            const togglePassword = document.getElementById('toggle-password');
            const passwordInput = document.getElementById('password');
            const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
            const confirmPasswordInput = document.getElementById('confirm-password');
            
            // Toggle password visibility
            togglePassword.addEventListener('click', function() {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    togglePassword.classList.remove('fa-eye');
                    togglePassword.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    togglePassword.classList.remove('fa-eye-slash');
                    togglePassword.classList.add('fa-eye');
                }
            });
            
            toggleConfirmPassword.addEventListener('click', function() {
                if (confirmPasswordInput.type === 'password') {
                    confirmPasswordInput.type = 'text';
                    toggleConfirmPassword.classList.remove('fa-eye');
                    toggleConfirmPassword.classList.add('fa-eye-slash');
                } else {
                    confirmPasswordInput.type = 'password';
                    toggleConfirmPassword.classList.remove('fa-eye-slash');
                    toggleConfirmPassword.classList.add('fa-eye');
                }
            });
            
            // Handle form submission
            signupForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const username = document.getElementById('username').value;
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirm-password').value;
                const referralCode = document.getElementById('referral-code').value;
                
                if (password !== confirmPassword) {
                    alert('Passwords do not match');
                    return;
                }
                
                const submitBtn = signupForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
                submitBtn.disabled = true;
                
                try {
                    const response = await fetch('/api/auth/signup', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            username,
                            email,
                            password,
                            referralCode
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.error || 'Signup failed');
                    }
                    
                    // Store token and redirect
                    localStorage.setItem('token', data.token);
                    window.location.href = '/dashboard';
                } catch (error) {
                    alert(error.message);
                } finally {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        });
    </script>
</body>
</html>
