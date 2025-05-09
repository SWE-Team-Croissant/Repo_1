document.addEventListener('DOMContentLoaded', () => {
    // Authentication-related DOM elements
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const signupPassword = document.getElementById('signup-password');
    
    // Add password helper text
    const passwordField = document.getElementById('signup-password');
    const passwordHelperText = document.createElement('span');
    passwordHelperText.className = 'helper-text';
    passwordHelperText.textContent = 'Password must be at least 6 characters long';
    passwordHelperText.style.fontSize = '0.8rem';
    passwordHelperText.style.color = 'var(--text-muted-color)';
    passwordHelperText.style.display = 'block';
    passwordHelperText.style.marginTop = '5px';
    
    // Insert helper text after the password field
    passwordField.parentNode.insertBefore(passwordHelperText, passwordField.nextSibling);
    
    // Add input validation for password field
    passwordField.addEventListener('input', function() {
        if (this.value.length < 6) {
            passwordHelperText.style.color = 'var(--danger-color)';
        } else {
            passwordHelperText.style.color = 'var(--success-color)';
        }
    });
    
    // Check if user is already logged in
    if (localStorage.getItem('token')) {
        showApp();
        initializeApp();
    } else {
        showAuth();
    }
    
    // Tab switching
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    });
    
    signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    });
    
    // Login form submission
    loginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        if (!username || !password) {
            showToast('Please enter both username and password', 'error');
            return;
        }
        
        try {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Logging in...';
            
            const response = await api.login({ username, password });
            
            if (response.error) {
                showToast(response.error, 'error');
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login';
                return;
            }
            
            // Save tokens and user info
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
            localStorage.setItem('user_id', response.user_id);
            localStorage.setItem('username', response.username);
            localStorage.setItem('user_type', response.user_type);
            
            // Show main app
            showApp();
            initializeApp();
            
            // Reset form
            document.getElementById('login-username').value = '';
            document.getElementById('login-password').value = '';
            
        } catch (error) {
            showToast('An error occurred while logging in', 'error');
            console.error(error);
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });
    
    // Signup form submission
    signupBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const firstName = document.getElementById('signup-first-name').value;
        const lastName = document.getElementById('signup-last-name').value;
        const userType = document.getElementById('user-type').value;
        
        if (!username || !email || !password) {
            showToast('Please fill in the required fields', 'error');
            return;
        }
        
        // Add password length validation - adding some words to test faisal's commit issue
        if (password.length < 6) {
            showToast('Password must be at least 6 characters long', 'error');
            return;
        }
        
        try {
            signupBtn.disabled = true;
            signupBtn.textContent = 'Signing up...';
            
            const userData = {
                username,
                email,
                password,
                first_name: firstName,
                last_name: lastName,
                user_type: userType
            };
            
            const response = await api.register(userData);
            
            if (response.error) {
                showToast(response.error, 'error');
                signupBtn.disabled = false;
                signupBtn.textContent = 'Sign Up';
                return;
            }
            
            showToast('Registration successful! Please log in.', 'success');
            
            // Switch to login tab
            loginTab.click();
            
            // Reset form
            document.getElementById('signup-username').value = '';
            document.getElementById('signup-email').value = '';
            document.getElementById('signup-password').value = '';
            document.getElementById('signup-first-name').value = '';
            document.getElementById('signup-last-name').value = '';
            
        } catch (error) {
            showToast('An error occurred during registration', 'error');
            console.error(error);
        } finally {
            signupBtn.disabled = false;
            signupBtn.textContent = 'Sign Up';
        }
    });
    
    // Logout button
    logoutBtn.addEventListener('click', () => {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
        localStorage.removeItem('user_type');
        
        // Show auth container
        //showAuth();
        localStorage.clear(); // Clear all auth/user data
        showAuth();           // Show login/signup screen
        location.reload(); 
    });
    
    // Helper functions
    function showAuth() {
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
    
    function showApp() {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        
        // Update user info
        const username = localStorage.getItem('username');
        const userType = localStorage.getItem("user-type")
        if (username) {
            document.getElementById('username').textContent = username;
        }
        
        // Initialize app components
        initializeDashboard();
    }
});

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('alert-toast');
    const alertMessage = document.getElementById('alert-message');
    const closeBtn = document.getElementById('close-alert');
    
    alertMessage.textContent = message;
    
    // Set toast color based on type
    if (type === 'error') {
        toast.style.backgroundColor = 'var(--danger-color)';
    } else if (type === 'success') {
        toast.style.backgroundColor = 'var(--success-color)';
    } else {
        toast.style.backgroundColor = 'var(--info-color)';
    }
    
    // Show toast
    toast.classList.remove('hidden');
    
    // Close after 5 seconds
    const timeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 5000);
    
    // Close button
    closeBtn.onclick = () => {
        clearTimeout(timeout);
        toast.classList.add('hidden');
    };
}
