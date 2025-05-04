// Dashboard initialization
function initializeDashboard() {
    refreshDashboard();
}

// Refresh dashboard data
async function refreshDashboard() {
    const userType = localStorage.getItem('user_type');
    console.log(userType, "dashboard");
    const isProvider = userType === 'healthcare_provider';
    
    // If provider, ensure patient selector is present
    if (isProvider && !document.querySelector('.patient-selector')) {
        addPatientSelector();
    }
    
    // Get selected patient ID for provider view
    let patientId = null;
    if (isProvider) {
        patientId = localStorage.getItem('selected_patient_id');
        
        // If no patient is selected, just show the selector and empty dashboard
        if (!patientId) {
            document.getElementById('dashboard-page').querySelector('h1').textContent = 'Provider Dashboard';
            document.querySelectorAll('.dashboard-cards .card-body').forEach(el => {
                el.innerHTML = '<p class="text-center">Please select a patient to view their data</p>';
            });
            return;
        }
    }
    
    // Update dashboard title based on user role
    document.getElementById('dashboard-page').querySelector('h1').textContent = 
        isProvider ? 'Patient Dashboard' : 'My Dashboard';
    
    // Load data with appropriate parameters
    loadLatestVitals(patientId);
    loadRecentSymptoms(patientId);
    loadRecentAlerts(patientId);
    loadVitalTrend(patientId);
    loadClinicalNotes();
    
    // Set up trend type change listener
    document.getElementById('trend-vital-type').addEventListener('change', () => loadVitalTrend(patientId));
    
    // Provider-specific enhancements for dashboard
    if (isProvider) {
        // Add clinical notes section
        addClinicalNotesSection();
    }
    loadPatientsForSelector();
}

// Load latest vitals
async function loadLatestVitals(patientId = null) {
    const latestVitalsContainer = document.getElementById('latest-vitals');
    latestVitalsContainer.innerHTML = '<div class="loading-spinner"></div>';
    const userType = localStorage.getItem('user_type');
    const isProvider = userType === 'healthcare_provider';

    try {
        let vitals;
        if (isProvider){
            const patientID = localStorage.getItem('selected_patient_id');
            vitals = await api.getVitals({patient_id: patientID, limit:10});
        }else{
            vitals = await api.getVitals({limit:10});
        }
        const latestByType = {};
        vitals.forEach(vital => {
            if (!latestByType[vital.vital_type] || 
                new Date(vital.timestamp) > new Date(latestByType[vital.vital_type].timestamp)) {
                latestByType[vital.vital_type] = vital;
            }
        });
        
        console.log(latestByType, " grouped vitals");
        // Create HTML for each vital
        let html = '';
        Object.values(latestByType).forEach(vital => {
            const statusClass = vital.is_normal ? 'status-normal' : 'status-abnormal';
            const displayName = formatVitalTypeName(vital.vital_type);
            
            html += `
                <div class="vital-item">
                    <span class="vital-name">${displayName}</span>
                    <span class="vital-value">
                        <span class="status-indicator ${statusClass}"></span>
                        ${vital.value} ${vital.unit}
                    </span>
                </div>
            `;
        });
        
        latestVitalsContainer.innerHTML = html;
        
    } catch (error) {
        latestVitalsContainer.innerHTML = '<p class="text-center text-danger">Failed to load vital data.</p>';
        console.error('Failed to load latest vitals:', error);
    }
}

// Load recent symptoms
async function loadRecentSymptoms() {
    const recentSymptomsContainer = document.getElementById('recent-symptoms');
    recentSymptomsContainer.innerHTML = '<div class="loading-spinner"></div>';
    const userType = localStorage.getItem('user_type');
    const isProvider = userType === 'healthcare_provider';
    try {
        let symptoms;
        if (isProvider){
            const patientID = localStorage.getItem('selected_patient_id');
            symptoms = await api.getSymptoms({patient_id: patientID, limit:10 });
        }else{
            symptoms = await api.getSymptoms({ limit: 10 });
        }
        
        console.log(symptoms, "symptoms in dashboard");
        
        if (symptoms.length === 0) {
            recentSymptomsContainer.innerHTML = '<p class="text-center">No symptom records found.</p>';
            return;
        }
        
        // Create HTML for each symptom
        let html = '';
        symptoms.slice(0, 10).forEach(symptom => {
            const displayName = formatSymptomName(symptom.symptom_name);
            
            html += `
                <div class="vital-item">
                    <span class="vital-name">${displayName}</span>
                    <span class="vital-value">
                        Severity: ${symptom.severity}/10
                    </span>
                </div>
            `;
        });
        
        recentSymptomsContainer.innerHTML = html;
        
    } catch (error) {
        recentSymptomsContainer.innerHTML = '<p class="text-center text-danger">Failed to load symptom data.</p>';
        console.error('Failed to load recent symptoms:', error);
    }
}

// Load recent alerts
async function loadRecentAlerts() {
    const recentAlertsContainer = document.getElementById('recent-alerts');
    recentAlertsContainer.innerHTML = '<div class="loading-spinner"></div>';
    const userType = localStorage.getItem('user_type');
    const isProvider = userType === 'healthcare_provider';
    try {
        let alerts;
        if (isProvider){
            const patientID = localStorage.getItem('selected_patient_id');
            alerts = await api.getAlerts({patient_id: patientID, limit:10 });
        }else{
            alerts = await api.getAlerts({ limit: 10 });
        }
        
        if (alerts.length === 0) {
            recentAlertsContainer.innerHTML = '<p class="text-center">No alerts found.</p>';
            return;
        }
        
        // Create HTML for each alert
        let html = '';
        alerts.forEach(alert => {
            html += `
                <div class="vital-item ${alert.is_read ? 'text-muted' : ''}">
                    <span class="vital-name">${alert.message}</span>
                    <small>${formatTableDate(alert.created_at)}</small>
                </div>
            `;
        });
        
        recentAlertsContainer.innerHTML = html;
        
    } catch (error) {
        recentAlertsContainer.innerHTML = '<p class="text-center text-danger">Failed to load alerts.</p>';
        console.error('Failed to load recent alerts:', error);
    }
}

// Load vital trend chart
async function loadVitalTrend() {
    const vitalType = document.getElementById('trend-vital-type').value;
    const chartCanvas = document.getElementById('vital-trend-chart');
    
    try {
        const trends = await api.getHealthTrends({ vital_type: vitalType, days: 30 });
        
        if (!trends.vitals || trends.vitals.length < 2) {
            // Not enough data points
            chartCanvas.getContext('2d').clearRect(0, 0, chartCanvas.width, chartCanvas.height);
            const ctx = chartCanvas.getContext('2d');
            ctx.font = '16px Roboto';
            ctx.textAlign = 'center';
            ctx.fillText('Not enough data to display trend chart', chartCanvas.width / 2, chartCanvas.height / 2);
            return;
        }
        
        // Prepare chart data
        const labels = trends.vitals.map(v => formatTableDate(v.timestamp));
        const values = trends.vitals.map(v => v.value);
        
        // Get normal range for this vital type
        const normalRanges = {
            heart_rate: { min: 60, max: 100 },
            blood_pressure_systolic: { min: 90, max: 140 },
            blood_pressure_diastolic: { min: 60, max: 90 },
            temperature: { min: 36.1, max: 37.2 },
            oxygen_saturation: { min: 95, max: 100 }
        };
        
        const range = normalRanges[vitalType] || { min: Math.min(...values), max: Math.max(...values) };
        
        // Create chart
        if (window.vitalChart) {
            window.vitalChart.destroy();
        }
        
        const ctx = chartCanvas.getContext('2d');
        window.vitalChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: formatVitalTypeName(vitalType),
                    data: values,
                    borderColor: 'rgb(58, 134, 255)',
                    backgroundColor: 'rgba(58, 134, 255, 0.1)',
                    fill: true,
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    annotation: {
                        annotations: {
                            min: {
                                type: 'line',
                                yMin: range.min,
                                yMax: range.min,
                                borderColor: 'rgba(255, 0, 0, 0.5)',
                                borderWidth: 1,
                                borderDash: [5, 5],
                                label: {
                                    content: `Min: ${range.min}`,
                                    enabled: true,
                                    position: 'left'
                                }
                            },
                            max: {
                                type: 'line',
                                yMin: range.max,
                                yMax: range.max,
                                borderColor: 'rgba(255, 0, 0, 0.5)',
                                borderWidth: 1,
                                borderDash: [5, 5],
                                label: {
                                    content: `Max: ${range.max}`,
                                    enabled: true,
                                    position: 'right'
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        suggestedMin: range.min - (range.max - range.min) * 0.1,
                        suggestedMax: range.max + (range.max - range.min) * 0.1
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Failed to load vital trend data:', error);
    }
}

// Helper function to format vital type names
function formatVitalTypeName(vitalType) {
    const names = {
        heart_rate: 'Heart Rate',
        blood_pressure_systolic: 'Blood Pressure (Systolic)',
        blood_pressure_diastolic: 'Blood Pressure (Diastolic)',
        temperature: 'Temperature',
        oxygen_saturation: 'Oxygen Saturation'
    };
    
    return names[vitalType] || vitalType.replace(/_/g, ' ');
}

// Helper function to format symptom names
function formatSymptomName(symptomName) {
    return symptomName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Add clinical notes section for provider view
function addClinicalNotesSection() {
    const dashboardPage = document.getElementById('dashboard-page');
    
    // Check if notes section already exists
    if (document.getElementById('clinical-notes-section')) {
        return;
    }
    
    // Create notes section
    const notesSection = document.createElement('div');
    notesSection.id = 'clinical-notes-section';
    notesSection.className = 'card provider-only';
    notesSection.innerHTML = `
        <div class="card-header">
            <h3>Clinical Notes</h3>
        </div>
        <div class="card-body">
            <div id="existing-notes">
                <div class="loading-spinner"></div>
            </div>
            <form id="add-note-form" class="mt-3">
                <div class="form-group">
                    <label for="clinical-note">Add Note</label>
                    <textarea id="clinical-note" rows="3" placeholder="Enter clinical observations or recommendations"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Save Note</button>
            </form>
        </div>
    `;
    
    // Add to dashboard
    dashboardPage.appendChild(notesSection);
    
    // Load existing notes
    loadClinicalNotes();
    
    // Add submit handler
    document.getElementById('add-note-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        saveClinicalNote();
    });
}

// Load clinical notes
async function loadClinicalNotes() {
    const notesContainer = document.getElementById('existing-notes');
    const patientId = localStorage.getItem('selected_patient_id');
    
    if (!patientId) {
        notesContainer.innerHTML = '<p>Please select a patient to view notes</p>';
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/health/notes?patient_id=${patientId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        
        const notes = await response.json();
        
        if (notes.length === 0) {
            notesContainer.innerHTML = '<p>No clinical notes available for this patient.</p>';
            return;
        }
        
        let html = '<div class="notes-list">';
        notes.forEach(note => {
            html += `
                <div class="note-item">
                    <div class="note-meta">
                        <span class="note-date">${formatDate(note.created_at)}</span>
                        <span class="note-author">by Dr. id: ${note.provider_id}</span>
                    </div>
                    <div class="note-content">${note.content}</div>
                </div>
            `;
        });
        html += '</div>';
        
        notesContainer.innerHTML = html;
        
    } catch (error) {
        notesContainer.innerHTML = '<p class="text-danger">Failed to load clinical notes.</p>';
        console.error('Failed to load notes:', error);
    }
}

// Save clinical note
async function saveClinicalNote() {
    const noteText = document.getElementById('clinical-note').value.trim();
    const patientId = localStorage.getItem('selected_patient_id');
    
    if (!noteText) {
        showToast('Please enter a note', 'error');
        return;
    }
    
    if (!patientId) {
        showToast('No patient selected', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/health/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                patient_id: patientId,
                content: noteText
            }),
        });
        
        const result = await response.json();
        
        if (result.error) {
            showToast(result.error, 'error');
            return;
        }
        
        showToast('Clinical note saved successfully', 'success');
        document.getElementById('clinical-note').value = '';
        loadClinicalNotes();
        
    } catch (error) {
        showToast('Failed to save clinical note', 'error');
        console.error('Failed to save note:', error);
    }
}