// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const tableBody = document.getElementById('tableBody');
const jdInput = document.getElementById('jdInput');
const resumeInput = document.getElementById('resumeInput');

// Check Auth State on Load
if (localStorage.getItem('cognito_id_token')) {
    showDashboard();
}

// 1. Auth Flow
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
    
    // Call API Login
    await API.login(document.getElementById('username').value, document.getElementById('password').value);
    showDashboard();
});

document.getElementById('bypassLoginBtn').addEventListener('click', showDashboard);

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('cognito_id_token');
    loginScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
    document.body.classList.replace('items-start', 'items-center');
});

function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    document.body.classList.replace('items-center', 'items-start');
    loadData();
}

// 2. Upload Listeners (Fixed to loop through multiple files)
document.getElementById('uploadJdBtn').addEventListener('click', async (e) => {
    const file = jdInput.files[0];
    if (!file) return alert("Select a JD file.");
    e.target.innerHTML = 'Uploading...';
    const success = await API.uploadFile('upload-jd', file);
    e.target.innerHTML = 'Upload JD';
    if (success) { alert("JD set successfully!"); jdInput.value = ''; }
});

document.getElementById('uploadResumeBtn').addEventListener('click', async (e) => {
    const files = resumeInput.files;
    if (files.length === 0) return alert("Select at least one Resume file.");
    
    e.target.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Uploading ${files.length} file(s)...`;
    e.target.disabled = true;

    // Loop through all selected files sequentially to avoid rate-limiting the API
    let successCount = 0;
    for (let file of files) {
        const success = await API.uploadFile('upload-resume', file);
        if (success) successCount++;
    }
    
    e.target.innerHTML = 'Upload Resumes';
    e.target.disabled = false;
    
    alert(`Successfully uploaded ${successCount} out of ${files.length} resumes.`);
    resumeInput.value = '';
    setTimeout(loadData, 2000); // Give backend time to process, then refresh
});

// Dashboard Actions
document.getElementById('refreshBtn').addEventListener('click', loadData);
document.getElementById('exportBtn').addEventListener('click', API.exportCSV);
document.getElementById('demoBtn').addEventListener('click', loadMockData);

// 3. Render Logic (Added 70% Threshold Line)
async function loadData() {
    tableBody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-500">Loading pipeline...</td></tr>';
    const candidates = await API.fetchCandidates();
    if (candidates && candidates.length > 0) renderTable(candidates);
    else tableBody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-400">Database empty.</td></tr>';
}

function renderTable(data) {
    data.sort((a, b) => b.score - a.score);
    tableBody.innerHTML = '';

    data.forEach(c => {
        const skillTags = c.skills.map(s => `<span class="inline-block bg-slate-100 border border-slate-200 text-slate-700 text-xs px-2 py-1 rounded mb-1 mr-1">${s}</span>`).join('');
        
        // Threshold Logic (70% and above is green/shortlisted)
        const isPassed = c.score >= 70;
        const barColor = isPassed ? 'bg-green-500' : 'bg-red-500';
        const textColor = isPassed ? 'text-green-600' : 'text-red-600';

        tableBody.innerHTML += `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                <td class="p-4 align-top">
                    <p class="font-bold text-slate-900">${c.name}</p>
                    <p class="text-xs text-slate-500 mt-1">${c.experience || 'Unlisted'}</p>
                </td>
                <td class="p-4 align-top">
                    <div class="flex flex-wrap">${skillTags}</div>
                </td>
                <td class="p-4 align-top">
                    <div class="flex justify-between text-sm mb-1">
                        <span class="font-bold ${textColor}">${c.score}% Match</span>
                    </div>
                    <div class="w-full bg-slate-200 h-2 rounded relative mt-2">
                        <div class="${barColor} h-2 rounded" style="width: ${c.score}%"></div>
                        <div class="absolute top-[-4px] bottom-[-4px] left-[70%] w-0.5 bg-slate-900 z-10" title="70% Passing Threshold"></div>
                    </div>
                    <p class="text-[10px] text-slate-400 mt-1 text-right">Threshold: 70%</p>
                </td>
                <td class="p-4 align-top text-right space-x-2">
                    <button onclick="handleAction('${c.id}', 'shortlisted')" class="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded text-sm font-bold transition"><i class="fas fa-check"></i> Accept</button>
                    <button onclick="handleAction('${c.id}', 'rejected')" class="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm font-bold transition"><i class="fas fa-times"></i> Reject</button>
                </td>
            </tr>
        `;
    });
}

window.handleAction = async (id, status) => {
    const success = await API.updateCandidateStatus(id, status);
    if(success) loadData();
    else alert(`API not connected. Simulating Action: ${status}`);
};

function loadMockData() {
    renderTable([
        { id: '1', name: 'Alice Smith', experience: '5 Yrs Cloud', skills: ['Python', 'AWS', 'DynamoDB'], score: 92 },
        { id: '2', name: 'David Lee', experience: '3 Yrs Backend', skills: ['Node.js', 'AWS', 'SQL'], score: 71 }, // Just above threshold
        { id: '3', name: 'Bob Jones', experience: '2 Yrs Java', skills: ['Java', 'Git'], score: 65 }, // Below threshold
        { id: '4', name: 'Charlie Brown', experience: 'Intern', skills: ['HTML', 'CSS'], score: 30 }
    ]);
}
