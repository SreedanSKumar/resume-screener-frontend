// app.js

// DOM Elements
const tableBody = document.getElementById('tableBody');
const jdInput = document.getElementById('jdInput');
const resumeInput = document.getElementById('resumeInput');

// Event Listeners
document.getElementById('refreshBtn').addEventListener('click', loadData);
document.getElementById('exportBtn').addEventListener('click', API.exportCSV);
document.getElementById('demoBtn').addEventListener('click', loadMockData);

document.getElementById('uploadJdBtn').addEventListener('click', async (e) => {
    const file = jdInput.files[0];
    if (!file) return alert("Select a JD file first.");
    
    e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    const success = await API.uploadFile('upload-jd', file);
    e.target.innerHTML = 'Upload JD';
    
    if (success) {
        alert("JD uploaded to S3 successfully!");
        jdInput.value = '';
    } else {
        alert("Upload failed. Backend might not be ready. Check console.");
    }
});

document.getElementById('uploadResumeBtn').addEventListener('click', async (e) => {
    const files = resumeInput.files;
    if (files.length === 0) return alert("Select at least one Resume file.");
    
    e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    
    // In a real scenario, you'd loop through multiple files. Keeping it simple for MVP.
    const success = await API.uploadFile('upload-resume', files[0]); 
    e.target.innerHTML = 'Upload Resumes';
    
    if (success) {
        alert("Resume(s) queued for NLP processing!");
        resumeInput.value = '';
        setTimeout(loadData, 2000); // Wait for backend to process, then refresh
    } else {
        alert("Upload failed. Backend might not be ready.");
    }
});

// UI Rendering Functions
async function loadData() {
    tableBody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-500"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching from DynamoDB...</td></tr>';
    
    const candidates = await API.fetchCandidates();
    
    if (candidates && candidates.length > 0) {
        renderTable(candidates);
    } else {
        tableBody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-400">No candidates found in database. Upload resumes to trigger NLP pipeline.</td></tr>';
    }
}

function renderTable(data) {
    // Sort by score descending
    data.sort((a, b) => b.score - a.score);
    tableBody.innerHTML = '';

    data.forEach(c => {
        // Tag rendering
        const skillTags = c.skills.map(s => 
            `<span class="inline-block bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2 py-1 rounded-md mb-1 mr-1 status-tag">${s}</span>`
        ).join('');

        // Score bar math
        const scoreColor = c.score >= 75 ? 'bg-green-500' : (c.score >= 50 ? 'bg-yellow-400' : 'bg-red-500');
        const textColor = c.score >= 75 ? 'text-green-600' : (c.score >= 50 ? 'text-yellow-600' : 'text-red-600');

        tableBody.innerHTML += `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4">
                    <p class="font-bold text-slate-900">${c.name}</p>
                    <p class="text-xs text-slate-500 mt-1">${c.experience || 'Experience unlisted'}</p>
                </td>
                <td class="p-4">
                    <div class="flex flex-wrap">${skillTags}</div>
                </td>
                <td class="p-4 text-center">
                    <div class="font-bold text-xl ${textColor} mb-1">${c.score}%</div>
                    <div class="w-full bg-slate-200 rounded-full h-1.5">
                        <div class="${scoreColor} h-1.5 rounded-full" style="width: ${c.score}%"></div>
                    </div>
                </td>
                <td class="p-4 text-right space-x-2">
                    <button onclick="handleAction('${c.id}', 'shortlisted')" class="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded text-sm font-semibold transition"><i class="fas fa-check"></i></button>
                    <button onclick="handleAction('${c.id}', 'rejected')" class="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded text-sm font-semibold transition"><i class="fas fa-times"></i></button>
                </td>
            </tr>
        `;
    });
}

// Attach action to window so inline onclick works
window.handleAction = async (id, status) => {
    const success = await API.updateCandidateStatus(id, status);
    if(success) {
        alert(`Candidate status updated to: ${status}`);
        loadData();
    } else {
        // Fallback UI update if API isn't connected
        alert(`Action recorded: ${status}. (API not connected)`);
    }
};

// Emergency Mock Data for Demo Video
function loadMockData() {
    const mockData = [
        { id: '1', name: 'Alice Smith', experience: '5 Yrs Cloud Architect', skills: ['Python', 'AWS', 'DynamoDB', 'Docker', 'Kubernetes'], score: 92 },
        { id: '2', name: 'Bob Jones', experience: '2 Yrs Backend Dev', skills: ['Java', 'SQL', 'Git', 'REST APIs'], score: 65 },
        { id: '3', name: 'Charlie Brown', experience: 'Recent Grad', skills: ['HTML', 'CSS', 'JavaScript'], score: 30 }
    ];
    renderTable(mockData);
}

// Initial state
tableBody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-400">System idle. Ready to parse.</td></tr>';