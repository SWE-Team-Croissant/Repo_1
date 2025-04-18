// Healthcare Provider specific functionality

// Load patients list
async function loadPatientsList() {
    const patientsListContainer = document.getElementById('patients-list');
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/health/patients`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        const patients = await response.json();
        console.log(patients, ": patients from loadpeitentslist")
        if (patients.length === 0) {
            patientsListContainer.innerHTML = '<p class="text-center">No patients assigned to you.</p>';
            return;
        }
        
        let html = '<div class="table-container"><table class="data-table">';
        html += '<thead><tr><th>Name</th><th>Last Activity</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
        
        patients.forEach(patient => {
            // Mock data for demonstration
            const lastActivity = new Date(patient.last_activity || new Date()).toLocaleDateString();
            const hasAlerts = patient.alerts_count > 0;
            
            html += `
                <tr>
                    <td>${patient.first_name} ${patient.last_name}</td>
                    <td>${lastActivity}</td>
                    <td>
                        <span class="status-indicator ${hasAlerts ? 'status-abnormal' : 'status-normal'}"></span>
                        ${hasAlerts ? 'Needs Attention' : 'Normal'}
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline view-patient-btn" data-id="${patient.id}">
                            View Details
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        patientsListContainer.innerHTML = html;
        
        // Add event listeners to view patient buttons
        document.querySelectorAll('.view-patient-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const patientId = e.target.getAttribute('data-id');
                viewPatientDetails(patientId);
            });
        });
        
    } catch (error) {
        patientsListContainer.innerHTML = '<p class="text-danger">Failed to load patients list.</p>';
        console.error('Failed to load patients:', error);
    }
}

// View patient details
function viewPatientDetails(patientId) {
    // Store selected patient ID
    localStorage.setItem('selected_patient_id', patientId);
    
    // Navigate to dashboard
    document.querySelector('.nav-item[data-page="dashboard"]').click();
    
    // Call modified dashboard loading function
    refreshDashboard(true);
}

// Add patient selection dropdown for provider view
function addPatientSelector() {
    const dashboardPage = document.getElementById('dashboard-page');
    const heading = dashboardPage.querySelector('h1');
    
    // Create patient selector
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'patient-selector provider-only';
    selectorContainer.innerHTML = `
        <div class="form-group inline">
            <label for="patient-select">Viewing data for:</label>
            <select id="patient-select">
                <option value="">Loading patients...</option>
            </select>
        </div>
    `;
    
    // Insert after heading
    heading.parentNode.insertBefore(selectorContainer, heading.nextSibling);
    
    // Load patients into selector
    loadPatientsForSelector();
    
    // Add change event
    document.getElementById('patient-select').addEventListener('change', function() {
        localStorage.setItem('selected_patient_id', this.value);
        refreshDashboard(true);
    });
}

// Load patients for selector
async function loadPatientsForSelector() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/health/patients`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        const patients = await response.json();
        const selector = document.getElementById('patient-select');
        
        if (patients.length === 0) {
            selector.innerHTML = '<option value="">No patients assigned</option>';
            return;
        }
        
        let options = '';
        patients.forEach(patient => {
            options += `<option value="${patient.id}">${patient.first_name} ${patient.last_name}</option>`;
        });
        
        selector.innerHTML = options;
        
        // Set to currently selected patient if any
        const selectedPatientId = localStorage.getItem('selected_patient_id');
        if (selectedPatientId) {
            selector.value = selectedPatientId;
        }
        
    } catch (error) {
        console.error('Failed to load patients for selector:', error);
    }
}
