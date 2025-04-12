document.addEventListener('DOMContentLoaded', () => {
    // Page navigation
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const userType = localStorage.getItem('user_type');
    
    // Check user type and adjust UI accordingly
    if (userType) {
        configureUIForUserType(userType);
    }
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.getAttribute('data-page');
            
            // Update active nav item
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Show target page
            pages.forEach(page => {
                if (page.id === `${targetPage}-page`) {
                    page.classList.add('active');
                } else {
                    page.classList.remove('active');
                }
            });
            
            // Handle specific page initialization
            if (targetPage === 'dashboard') {
                refreshDashboard();
            } else if (targetPage === 'vitals') {
                loadVitalHistory();
            } else if (targetPage === 'symptoms') {
                loadSymptomHistory();
            } else if (targetPage === 'health-summary') {
                generateHealthSummary();
            } else if (targetPage === 'alerts') {
                loadAlerts();
            }
        });
    });
    
    // Check for unread alerts periodically
    checkForUnreadAlerts();
    setInterval(checkForUnreadAlerts, 60000); // Check every minute
    
    // Helper functions
    async function checkForUnreadAlerts() {
        try {
            const alertsBadge = document.getElementById('alert-badge');
            const alerts = await api.getAlerts({ is_read: false });
            
            if (alerts.length > 0) {
                alertsBadge.textContent = alerts.length;
                alertsBadge.classList.remove('hidden');
            } else {
                alertsBadge.classList.add('hidden');
            }
        } catch (error) {
            console.error('Failed to check for unread alerts:', error);
        }
    }
});

// Format date function
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Format date for tables
function formatTableDate(dateString) {
    const options = { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}
// Function to configure UI based on user type
function configureUIForUserType(userType) {
    if (userType === 'healthcare_provider') {
        // Show provider-specific elements
        document.querySelectorAll('.provider-only').forEach(el => el.classList.remove('hidden'));
        document.querySelectorAll('.patient-only').forEach(el => el.classList.add('hidden'));
        
        // Update sidebar with provider features
        const sidebar = document.querySelector('.sidebar');
        const providerNavItem = document.createElement('li');
        providerNavItem.className = 'nav-item';
        providerNavItem.setAttribute('data-page', 'patients');
        providerNavItem.innerHTML = '<i class="fas fa-users"></i> My Patients';
        
        const dashboardItem = sidebar.querySelector('[data-page="dashboard"]');
        sidebar.querySelector('.nav-links').insertBefore(providerNavItem, dashboardItem.nextSibling);
        
        // Add provider-specific page
        const mainContent = document.querySelector('.main-content');
        const patientsPage = document.createElement('div');
        patientsPage.id = 'patients-page';
        patientsPage.className = 'page';
        patientsPage.innerHTML = `
            <h1>My Patients</h1>
            <div class="card">
                <div class="card-header">
                    <h3>Patient List</h3>
                </div>
                <div class="card-body">
                    <div id="patients-list">
                        <div class="loading-spinner"></div>
                    </div>
                </div>
            </div>
        `;
        mainContent.appendChild(patientsPage);
        
        // Update navigation handler for new page
        providerNavItem.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            providerNavItem.classList.add('active');
            
            document.querySelectorAll('.page').forEach(page => {
                if (page.id === 'patients-page') {
                    page.classList.add('active');
                } else {
                    page.classList.remove('active');
                }
            });
            
            loadPatientsList();
        });
    } else {
        // Patient view (default)
        document.querySelectorAll('.provider-only').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.patient-only').forEach(el => el.classList.remove('hidden'));
    }
    
    // Update page title to reflect user type
    document.querySelector('.sidebar-header h2').textContent = 
        userType === 'healthcare_provider' ? 'Provider Portal' : 'DysMonitor';
}
