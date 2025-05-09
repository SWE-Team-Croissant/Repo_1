// Vitals functionality module

// Define validation rules and hints for each vital type
const vitalValidationRules = {
    heart_rate: {
        min: 30,
        max: 220,
        step: 1,
        unit: 'bpm',
        placeholder: "Enter heart rate (30-220 bpm)",
        validationMessage: "Heart rate should be between 30 and 220 bpm",
        normalRange: '60-100 bpm for adults at rest',
        description: 'Measures how many times your heart beats per minute'
    },
    blood_pressure_systolic: {
        min: 70,
        max: 230,
        step: 1,
        unit: 'mmHg',
        placeholder: "Enter systolic BP (70-230 mmHg)",
        validationMessage: "Systolic BP should be between 70 and 230 mmHg",
        normalRange: '90-120 mmHg for adults',
        description: 'The top number in blood pressure reading, measures pressure when heart beats'
    },
    blood_pressure_diastolic: {
        min: 40,
        max: 130,
        step: 1,
        unit: 'mmHg',
        placeholder: "Enter diastolic BP (40-130 mmHg)",
        validationMessage: "Diastolic BP should be between 40 and 130 mmHg",
        normalRange: '60-80 mmHg for adults',
        description: 'The bottom number in blood pressure reading, measures pressure when heart rests'
    },
    temperature: {
        min: 34,
        max: 42,
        step: 0.1,
        unit: '°C',
        placeholder: "Enter temperature (34-42 °C)",
        validationMessage: "Temperature should be between 34 and 42 °C",
        normalRange: '36.5-37.5 °C for adults',
        description: 'Body temperature, can vary slightly throughout the day'
    },
    oxygen_saturation: {
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
        placeholder: "Enter oxygen saturation (0-100%)",
        validationMessage: "Oxygen saturation should be between 0 and 100%",
        normalRange: '95-100% for healthy individuals',
        description: 'Percentage of oxygen-saturated hemoglobin relative to total hemoglobin'
    }
};

// Function to set up form validation
function setupVitalFormValidation() {
    const vitalTypeSelect = document.getElementById('vital-type');
    const vitalValueInput = document.getElementById('vital-value');
    const vitalMinValue = document.getElementById('vital-min-value');
    const vitalMaxValue = document.getElementById('vital-max-value');
    const vitalHint = document.getElementById('vital-hint');
    
    // Function to update input attributes based on selected vital type
    function updateVitalInputAttributes() {
        const selectedVitalType = vitalTypeSelect.value;
        const validationRule = vitalValidationRules[selectedVitalType];
        
        if (validationRule) {
            // Update input attributes
            vitalValueInput.min = validationRule.min;
            vitalValueInput.max = validationRule.max;
            vitalValueInput.step = validationRule.step;
            vitalValueInput.placeholder = validationRule.placeholder;
            vitalValueInput.title = validationRule.validationMessage;
            
            // Update min/max display
            if (vitalMinValue && vitalMaxValue) {
                vitalMinValue.textContent = `Min: ${validationRule.min} ${validationRule.unit}`;
                vitalMaxValue.textContent = `Max: ${validationRule.max} ${validationRule.unit}`;
            }
            
            // Update hint text
            if (vitalHint) {
                vitalHint.innerHTML = `
                    <strong>Normal range:</strong> ${validationRule.normalRange}<br>
                    <small>${validationRule.description}</small>
                `;
            }
            
            // Clear any previous value to avoid validation errors when switching types
            vitalValueInput.value = '';
        }
    }
    
    // Initialize validation on page load
    if (vitalTypeSelect && vitalValueInput) {
        updateVitalInputAttributes();
        
        // Update validation when vital type changes
        vitalTypeSelect.addEventListener('change', updateVitalInputAttributes);
        
        // Real-time validation as user types
        vitalValueInput.addEventListener('input', function() {
            const selectedVitalType = vitalTypeSelect.value;
            const validationRule = vitalValidationRules[selectedVitalType];
            const vitalValue = parseFloat(vitalValueInput.value);
            
            if (isNaN(vitalValue) || vitalValue < validationRule.min || vitalValue > validationRule.max) {
                vitalValueInput.setCustomValidity(validationRule.validationMessage);
            } else {
                vitalValueInput.setCustomValidity('');
            }
        });
    }
}

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
            params.patient_id = patientID;
            vitals = await api.getVitals(params);
        } else {
            vitals = await api.getVitals(params);
        }

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

// Add new vital
function setupVitalForm() {
    const addVitalForm = document.getElementById('add-vital-form');
    if (!addVitalForm) return;
    
    addVitalForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const vitalType = document.getElementById('vital-type').value;
        const vitalValue = document.getElementById('vital-value').value;
        const vitalNotes = document.getElementById('vital-notes')?.value || '';

        if (!vitalType || !vitalValue) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        // Validate the input based on the vital type
        const validationRule = vitalValidationRules[vitalType];
        const parsedValue = parseFloat(vitalValue);
        
        if (isNaN(parsedValue) || parsedValue < validationRule.min || parsedValue > validationRule.max) {
            showToast(validationRule.validationMessage, 'error');
            return;
        }

        try {
            const vitalData = {
                vital_type: vitalType,
                value: parsedValue,
                notes: vitalNotes
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

// Initialize the vital page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listener for vital history type change
    const vitalHistoryType = document.getElementById('vital-history-type');
    if (vitalHistoryType) {
        vitalHistoryType.addEventListener('change', loadVitalHistory);
    }
    
    // Set up the vital form validation
    setupVitalFormValidation();
    
    // Set up the vital form submission
    setupVitalForm();
    
    // Load initial vital history
    loadVitalHistory();
});