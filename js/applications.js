let applications = [];
let currentFilter = '';
let currentStatusFilter = '';

document.addEventListener('DOMContentLoaded', () => {
    loadApplications();
    setupEventListeners();
});

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilter = e.target.value.toLowerCase();
            displayApplications();
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            currentStatusFilter = e.target.value;
            displayApplications();
        });
    }
    
    const applicationForm = document.getElementById('applicationForm');
    if (applicationForm) {
        applicationForm.addEventListener('submit', saveApplication);
    }
}

async function loadApplications() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const snapshot = await db.collection('applications')
            .where('userId', '==', user.uid)
            .orderBy('deadline', 'asc')
            .get();
        
        applications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        displayApplications();
    } catch (error) {
        console.error('Error loading applications:', error);
        alert('Error loading applications: ' + error.message);
    }
}

function displayApplications() {
    const tbody = document.getElementById('applicationsBody');
    if (!tbody) return;
    
    let filteredApps = applications;
    
    // Apply search filter
    if (currentFilter) {
        filteredApps = filteredApps.filter(app => 
            (app.university || '').toLowerCase().includes(currentFilter) ||
            (app.program || '').toLowerCase().includes(currentFilter)
        );
    }
    
    // Apply status filter
    if (currentStatusFilter) {
        filteredApps = filteredApps.filter(app => app.status === currentStatusFilter);
    }
    
    tbody.innerHTML = filteredApps.map(app => `
        <tr>
            <td>${app.university || 'N/A'}</td>
            <td>${app.program || 'N/A'}</td>
            <td>${app.deadline ? new Date(app.deadline).toLocaleDateString() : 'N/A'}</td>
            <td>
                <span class="status-badge status-${app.status || 'draft'}">
                    ${(app.status || 'draft').charAt(0).toUpperCase() + (app.status || 'draft').slice(1)}
                </span>
            </td>
            <td>
                ${app.documents ? app.documents.map(doc => 
                    `<span class="document-tag">${doc}</span>`
                ).join('') : 'None'}
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="editApplication('${app.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteApplication('${app.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openAddApplicationModal() {
    document.getElementById('modalTitle').textContent = 'Add New Application';
    document.getElementById('applicationForm').reset();
    document.getElementById('appId').value = '';
    document.getElementById('applicationModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('applicationModal').style.display = 'none';
}

async function saveApplication(e) {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
        alert('Please login first');
        return;
    }
    
    // Get form data
    const appId = document.getElementById('appId').value;
    const documents = [];
    document.querySelectorAll('.checkbox-group input:checked').forEach(cb => {
        documents.push(cb.value);
    });
    
    const applicationData = {
        university: document.getElementById('university').value,
        program: document.getElementById('program').value,
        department: document.getElementById('department').value,
        deadline: document.getElementById('deadline').value,
        status: document.getElementById('status').value,
        notes: document.getElementById('notes').value,
        documents: documents,
        userId: user.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (appId) {
            // Update existing application
            await db.collection('applications').doc(appId).update(applicationData);
            alert('Application updated successfully!');
        } else {
            // Add new application
            applicationData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('applications').add(applicationData);
            alert('Application added successfully!');
        }
        
        closeModal();
        loadApplications();
    } catch (error) {
        console.error('Error saving application:', error);
        alert('Error saving application: ' + error.message);
    }
}

async function editApplication(id) {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Application';
    document.getElementById('appId').value = app.id;
    document.getElementById('university').value = app.university || '';
    document.getElementById('program').value = app.program || '';
    document.getElementById('department').value = app.department || '';
   
