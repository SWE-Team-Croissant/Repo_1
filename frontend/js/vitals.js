// Vitals functionality module

// Load vital history
async function loadVitalHistory() {
    const vitalHistoryType = document.getElementById('vital-history-type').value;
    const vitalsTableBody = document.getElementById('vitals-table-body');
    vitalsTableBody.innerHTML = '<tr><td colspan="4" class="loading">Loading...</td></tr>';
    const userType = localStorage.getItem('user_type');
    const isProvider = userType === 'healthcare_provider';
    try {
        const params = {};
        if (vitalHistoryType) {
            params.type = vitalHistoryType;
        }
        let vitals;
        if (isProvider){
            const patientID = localStorage.getItem('selected_patient_id');
            params.patient_id=patientID;
            vitals = await api.getVitals(params);
        }else{
            vitals = await api.getVitals(params);
        }
        //const vitals = await api.getVitals(params);

        if (vitals.length === 0) {
            vitalsTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No vital records found.</td></tr>';
            return;
        }

        let html = '';
        vitals.forEach(vital => {
            const statusClass = vital.is_normal ? 'status-normal' : 'status-abnormal';
            const displayName = formatVitalTypeName(vital.vital_type);

            html += `
                <tr>
                    <td>${formatTableDate(vital.timestamp)}</td>
                    <td>${displayName}</td>
                    <td>${vital.value} ${vital.unit}</td>
                    <td><span class="status-indicator ${statusClass}"></span>${vital.is_normal ? 'Normal' : 'Abnormal'}</td>
                </tr>
            `;
        });

        vitalsTableBody.innerHTML = html;

    } catch (error) {
        vitalsTableBody.innerHTML = '<tr><td colspan="4" class="text-danger">Failed to load vital data.</td></tr>';
        console.error('Failed to load vital history:', error);
    }
}

// Add event listener for vital history type change
const vitalHistoryType = document.getElementById('vital-history-type');
vitalHistoryType.addEventListener('change', loadVitalHistory);

// Add new vital
const addVitalForm = document.getElementById('add-vital-form');
addVitalForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const vitalType = document.getElementById('vital-type').value;
    const vitalValue = document.getElementById('vital-value').value;

    if (!vitalType || !vitalValue) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        const vitalData = {
            vital_type: vitalType,
            value: parseFloat(vitalValue)
        };

        const response = await api.addVital(vitalData);

        if (response.error) {
            showToast(response.error, 'error');
            return;
        }

        showToast('Vital record added successfully', 'success');
        addVitalForm.reset();
        loadVitalHistory();

    } catch (error) {
        showToast('Failed to add vital record', 'error');
        console.error('Failed to add vital record:', error);
    }
});

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
