// API base URL (change this for production)
const API_BASE_URL = 'http://localhost:5000/api';

// API Service Object
const api = {
    // Authentication
    register: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        return await response.json();
    },
    
    login: async (credentials) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });
        return await response.json();
    },
    
    getUserProfile: async () => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return await response.json();
    },
    
    // Vitals
    addVital: async (vitalData) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/vitals/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(vitalData),
        });
        return await response.json();
    },
    
    getVitals: async (params = {}) => {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/vitals/${queryParams ? `?${queryParams}` : ''}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return await response.json();
    },
    
     // Symptoms  The symptoms from symtoms.js come in here 
    addSymptom: async (symptomData) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/symptoms/`, {  
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(symptomData),
        });
        return await response.json();
    },
    
    getSymptoms: async (params = {}) => {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/symptoms/${queryParams ? `?${queryParams}` : ''}`;
        
        const response = await fetch(url, {// also here is error 
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return await response.json();
    },
    
    // Alerts
    getAlerts: async (params = {}) => {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/alerts/${queryParams ? `?${queryParams}` : ''}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return await response.json();
    },
    
    // markAlertRead: async (alertId) => {
    //     const token = localStorage.getItem('token');
    //     const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/read`, {
    //         method: 'PUT',
    //         headers: {
    //             'Authorization': `Bearer ${token}`,
    //         },
    //     });
    //     return await response.json();
    // },
    markAlertRead: async ({ alertId, patient_id }) => {
        const token = localStorage.getItem('token');
        const query = patient_id ? `?patient_id=${patient_id}` : '';
        const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/read${query}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return await response.json();
    },
    
    // Health Summary
    // getHealthSummary: async (timeframe = 30) => {
    //     const token = localStorage.getItem('token');
    //     const response = await fetch(`${API_BASE_URL}/health/summary?timeframe=${timeframe}`, {
    //         headers: {
    //             'Authorization': `Bearer ${token}`,
    //         },
    //     });
    //     return await response.json();
    // },
    getHealthSummary: async ({ params = {}, patient_id } = {}) => {
        const token = localStorage.getItem('token');
        const query = new URLSearchParams();
    
        // Add timeframe from params (default fallback to 30 if missing)
        query.append('timeframe', params.summaryTimeframe || 30);
    
        // Add patient ID if provided (for providers)
        if (patient_id) {
            query.append('patient_id', patient_id);
        }
        
        const response = await fetch(`${API_BASE_URL}/health/summary?${query.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    
        return await response.json();
    },
    
    
    getHealthTrends: async (params = {}) => {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/health/trends${queryParams ? `?${queryParams}` : ''}`;
        //const url = `${API_BASE_URL}/health/trends${queryParams ? `?${queryParams}` : ''}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return await response.json();
    },


    // set up clinical note api 

    // getNotes: async (params = {}) => {
    //     const token = localStorage.getItem('token');
    //     const queryParams = new URLSearchParams(params).toString();
    //     const url = `${API_BASE_URL}/health/notes${queryParams ? `?${queryParams}` : ''}`;
        
    //     const response = await fetch(url, {
    //         headers: {
    //             'Authorization': `Bearer ${token}`,
    //         },
    //     });
    
    //     return await response.json();
    // },

    // addNotes: async (noteData, params = {}) => {
    //     const token = localStorage.getItem('token');
    //     const queryParams = new URLSearchParams(params).toString();
    //     const url = `${API_BASE_URL}/health/notes${queryParams ? `?${queryParams}` : ''}`;
    
    //     const response = await fetch(url, {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'Authorization': `Bearer ${token}`,
    //         },
    //         body: JSON.stringify(noteData),
    //     });
    
    //     return await response.json();
    // },
    
    
};
