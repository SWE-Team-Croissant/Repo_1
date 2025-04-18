// Symptoms functionality module

// Load symptom history
async function loadSymptomHistory() {
    const symptomsTableBody = document.getElementById('symptoms-table-body');
    symptomsTableBody.innerHTML = '<tr><td colspan="4" class="loading">Loading...</td></tr>';
    const userType = localStorage.getItem('user_type');
    const isProvider = userType === 'healthcare_provider';

    try {
        let symptoms;
        if (isProvider){
            const patientID = localStorage.getItem('selected_patient_id');
            symptoms = await api.getSymptoms({patient_id: patientID});
        }else{
            symptoms = await api.getSymptoms();
        }
        
        if (symptoms.length === 0) {
            symptomsTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No symptom records found.</td></tr>';
            return;
        }

        let html = '';
        symptoms.forEach(symptom => {
            html += `
                <tr>
                    <td>${formatTableDate(symptom.timestamp)}</td>
                    <td>${formatSymptomName(symptom.symptom_name)}</td>
                    <td>${symptom.severity}/10</td>
                    <td>${symptom.notes || 'N/A'}</td>
                </tr>
            `;
        });

        symptomsTableBody.innerHTML = html;

    } catch (error) {
        symptomsTableBody.innerHTML = '<tr><td colspan="4" class="text-danger">Failed to load symptom data.</td></tr>';
        console.error('Failed to load symptom history:', error);
    }
}

// Custom symptom handling
document.getElementById('symptom-name').addEventListener('change', function() {
    const customSymptomGroup = document.getElementById('custom-symptom-group');
    if (this.value === 'custom') {
        customSymptomGroup.classList.remove('hidden');
    } else {
        customSymptomGroup.classList.add('hidden');
    }
});

// Severity slider value display
document.getElementById('symptom-severity').addEventListener('input', function() {
    document.getElementById('severity-value').textContent = this.value;
});

// Add new symptom
const addSymptomForm = document.getElementById('add-symptom-form');
addSymptomForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let symptomName = document.getElementById('symptom-name').value;
    if (symptomName === 'custom') {
        symptomName = document.getElementById('custom-symptom').value;
        if (!symptomName.trim()) {
            showToast('Please enter a custom symptom name', 'error');
            return;
        }
    }
    
    const symptomSeverity = document.getElementById('symptom-severity').value;
    const symptomNotes = document.getElementById('symptom-notes').value;

    if (!symptomName || !symptomSeverity) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        const symptomData = {
            symptom_name: symptomName.toLowerCase().replace(/\s+/g, '_'),
            severity: parseInt(symptomSeverity),
            notes: symptomNotes
        };

        const response = await api.addSymptom(symptomData);
        // here the symptom call is sent to api 

        if (response.error) {
            showToast(response.error, 'error');
            return;
        }

        showToast('Symptom record added successfully', 'success');
        addSymptomForm.reset();
        document.getElementById('severity-value').textContent = '5'; // Reset severity display
        document.getElementById('custom-symptom-group').classList.add('hidden');
        loadSymptomHistory();

    } catch (error) {
        showToast('Failed to add symptom record', 'error');
        console.error('Failed to add symptom record:', error);
    }
});

// Helper function to format symptom names
function formatSymptomName(symptomName) {
    return symptomName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
