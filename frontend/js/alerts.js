// Alerts functionality module

// Load alerts
async function loadAlerts() {
    const alertFilter = document.getElementById('alert-filter').value;
    const alertsContainer = document.getElementById('alerts-container');
    alertsContainer.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const params = {};
        if (alertFilter === 'unread') {
            params.is_read = false;
        } else if (alertFilter === 'read') {
            params.is_read = true;
        }

        const alerts = await api.getAlerts(params);

        if (alerts.length === 0) {
            alertsContainer.innerHTML = '<p class="text-center">No alerts found.</p>';
            return;
        }

        let html = '';
        alerts.forEach(alert => {
            html += `
                <div class="alert-item ${alert.is_read ? 'read' : ''}">
                    <div class="alert-content">
                        <p class="alert-message">${alert.message}</p>
                        <small class="alert-time">${formatTableDate(alert.created_at)}</small>
                    </div>
                    <div class="alert-actions">
                        ${!alert.is_read ? `<button class="mark-read-btn" data-id="${alert.id}">Mark as Read</button>` : ''}
                    </div>
                </div>
            `;
        });

        alertsContainer.innerHTML = html;

        // Add event listeners for mark as read buttons
        const markReadButtons = document.querySelectorAll('.mark-read-btn');
        markReadButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const alertId = e.target.getAttribute('data-id');
                try {
                    await api.markAlertRead(alertId);
                    showToast('Alert marked as read', 'success');
                    loadAlerts();
                    // Update alert badge count
                    checkForUnreadAlerts();
                } catch (error) {
                    showToast('Failed to mark alert as read', 'error');
                    console.error('Failed to mark alert as read:', error);
                }
            });
        });

    } catch (error) {
        alertsContainer.innerHTML = '<p class="text-center text-danger">Failed to load alerts.</p>';
        console.error('Failed to load alerts:', error);
    }
}

// Add event listener for alert filter change
const alertFilter = document.getElementById('alert-filter');
alertFilter.addEventListener('change', loadAlerts);

// Mark all alerts as read
function addMarkAllReadButton() {
    const alertsContainer = document.getElementById('alerts-container');
    const unreadAlerts = document.querySelectorAll('.alert-item:not(.read)');
    
    if (unreadAlerts.length > 0) {
        const markAllBtn = document.createElement('button');
        markAllBtn.className = 'btn btn-outline';
        markAllBtn.textContent = 'Mark All as Read';
        markAllBtn.style.marginBottom = '15px';
        
        markAllBtn.addEventListener('click', async () => {
            try {
                for (const alert of unreadAlerts) {
                    const alertId = alert.querySelector('.mark-read-btn').getAttribute('data-id');
                    await api.markAlertRead(alertId);
                }
                showToast('All alerts marked as read', 'success');
                loadAlerts();
                checkForUnreadAlerts();
            } catch (error) {
                showToast('Failed to mark all alerts as read', 'error');
                console.error('Failed to mark all alerts as read:', error);
            }
        });
        
        alertsContainer.prepend(markAllBtn);
    }
}

// Helper function to format table dates
function formatTableDate(dateString) {
    const options = {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}
