// api.js
// TODO: Replace with your actual API Gateway URL when Person 2 finishes it.
const API_BASE_URL = 'https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod';

const API = {
    async fetchCandidates() {
        try {
            const res = await fetch(`${API_BASE_URL}/candidates`);
            if (!res.ok) throw new Error('Failed to fetch candidates');
            return await res.json();
        } catch (error) {
            console.error("API Error (Fetch):", error);
            return null; // Return null to trigger fallback/mock data if needed
        }
    },

    async uploadFile(endpoint, file) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: 'POST',
                body: formData
            });
            return res.ok;
        } catch (error) {
            console.error(`API Error (Upload ${endpoint}):`, error);
            return false;
        }
    },

    async updateCandidateStatus(id, status) {
        try {
            const res = await fetch(`${API_BASE_URL}/candidates/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            return res.ok;
        } catch (error) {
            console.error("API Error (Update):", error);
            return false;
        }
    },

    async exportCSV() {
        try {
            const res = await fetch(`${API_BASE_URL}/export/csv`);
            if (!res.ok) throw new Error("CSV Export Failed");
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'shortlisted_candidates.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error("API Error (Export):", error);
            alert("Export failed. Ensure backend is running.");
        }
    }
};