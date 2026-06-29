// ==========================================
// PERSON 2: PASTE THE ACTUAL API GATEWAY URL HERE
const API_BASE_URL = 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod';
// ==========================================

const API = {
    // Helper to get Auth Headers
    getHeaders() {
        const token = localStorage.getItem('cognito_id_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },

    // Simulate Cognito Login (If P2 didn't setup Hosted UI)
    async login(username, password) {
        // In a real app, this hits the Cognito Identity Provider.
        // For this hackathon, we simulate a successful auth if backend isn't ready.
        console.log("Authenticating...", username);
        return new Promise((resolve) => {
            setTimeout(() => {
                localStorage.setItem('cognito_id_token', 'mock_jwt_token_for_demo');
                resolve(true);
            }, 800);
        });
    },

    async fetchCandidates() {
        try {
            const res = await fetch(`${API_BASE_URL}/candidates`, {
                headers: this.getHeaders()
            });
            if (!res.ok) throw new Error('API failed');
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            return null; 
        }
    },

    async uploadFile(endpoint, file) {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(), // Must send auth token with uploads
                body: formData
            });
            return res.ok;
        } catch (error) {
            console.error(`Upload Error (${endpoint}):`, error);
            return false;
        }
    },

    async updateCandidateStatus(id, status) {
        try {
            const res = await fetch(`${API_BASE_URL}/candidates/${id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    ...this.getHeaders() 
                },
                body: JSON.stringify({ status })
            });
            return res.ok;
        } catch (error) {
            console.error("Update Error:", error);
            return false;
        }
    },

    async exportCSV() {
        try {
            const res = await fetch(`${API_BASE_URL}/export/csv`, {
                headers: this.getHeaders()
            });
            if (!res.ok) throw new Error("Export Failed");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'shortlist.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            alert("Export failed. Ensure backend API is active.");
        }
    }
};
