// applications.js - COMPLETE WORKING VERSION

let applications = [];
let currentFilter = '';
let currentStatusFilter = '';

// Wait for auth to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('User logged in:', user.email);
            loadApplications();
            setupEventListeners();
        } else {
            console.log('No user logged in, redirecting...');
            window.location.href = 'index.html';
        }
    });
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
    if (!user) {
        console.log('No user found');
        return;
    }
    
    try {
        console.log('Loading applications for user:', user.uid);
        
        const snapshot = await db.collection('applications')
            .where('userId', '==', user.uid)
            .orderBy('deadline', 'asc')
            .get();
        
        applications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('Applications loaded:', applications.length);
        displayApplications();
    } catch (error) {
        console.error('Error loading applications:', error);
        
        // Check if error is due to missing index
        if (error.message.includes('index')) {
            const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
            if (indexUrl) {
                console.log('Create index here:', indexUrl[0]);
                alert('Database index needed. Click OK to create it, then wait 2 minutes and refresh.');
                window.open(indexUrl[0], '_blank');
            }
        } else {
            alert('Error loading applications: ' + error.message);
        }
    }
}

function displayApplications() {
    const tbody = document.getElementById('applicationsBody');
    if (!tbody) {
        console.log('Applications body not found');
        return;
    }
    
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
    
    if (filteredApps.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    No applications found. Click "Add Application" to get started!
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredApps.map(app => {
        // Format documents nicely
        const documents = app.documents || [];
        const docsHtml = documents.map(doc => {
            const docNames = {
                'transcript': '📄 Transcript',
                'sop': '📝 SOP',
                'lor': '✉️ LOR',
                'resume': '📋 Resume',
                'testScores': '📊 Test Scores'
            };
            return `<span class="document-tag" style="background: #e9ecef; padding: 2px 8px; border-radius: 12px; margin: 2px; display: inline-block; font-size: 0.85rem;">${docNames[doc] || doc}</span>`;
        }).join(' ');
        
        return `
        <tr>
            <td>${app.university || 'N/A'}</td>
            <td>${app.program || 'N/A'}</td>
            <td>${app.deadline ? new Date(app.deadline).toLocaleDateString() : 'N/A'}</td>
            <td>
                <span class="status-badge status-${app.status || 'draft'}">
                    ${(app.status || 'draft').charAt(0).toUpperCase() + (app.status || 'draft').slice(1)}
                </span>
            </td>
            <td>${docsHtml || 'None'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editApplication('${app.id}')" style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-right: 5px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteApplication('${app.id}')" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('');
}

// Make functions globally available for onclick handlers
window.openAddApplicationModal = function() {
    console.log('Opening add application modal');
    document.getElementById('modalTitle').textContent = 'Add New Application';
    document.getElementById('applicationForm').reset();
    document.getElementById('appId').value = '';
    
    // Uncheck all checkboxes
    document.querySelectorAll('.checkbox-group input').forEach(cb => {
        cb.checked = false;
    });
    
    document.getElementById('applicationModal').style.display = 'block';
}

window.closeModal = function() {
    document.getElementById('applicationModal').style.display = 'none';
}

async function saveApplication(e) {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
        alert('Please login first');
        return;
    }
    
    console.log('Saving application for user:', user.uid);
    
    // Get form data
    const appId = document.getElementById('appId').value;
    
    // Get checked documents
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
    
    // Validate required fields
    if (!applicationData.university || !applicationData.program || !applicationData.deadline) {
        alert('Please fill in all required fields');
        return;
    }
    
    console.log('Application data:', applicationData);
    
    try {
        if (appId) {
            // Update existing application
            await db.collection('applications').doc(appId).update(applicationData);
            console.log('Application updated');
            alert('Application updated successfully!');
        } else {
            // Add new application
            applicationData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            const docRef = await db.collection('applications').add(applicationData);
            console.log('Application added with ID:', docRef.id);
            alert('Application added successfully!');
        }
        
        closeModal();
        await loadApplications(); // Reload the list
    } catch (error) {
        console.error('Error saving application:', error);
        
        // Check for specific errors
        if (error.code === 'permission-denied') {
            alert('Permission denied. Please check Firestore security rules.');
        } else if (error.code === 'unavailable') {
            alert('Network error. Please check your connection.');
        } else {
            alert('Error saving application: ' + error.message);
        }
    }
}

// Make edit function globally available
window.editApplication = async function(id) {
    console.log('Editing application:', id);
    const app = applications.find(a => a.id === id);
    if (!app) {
        console.log('Application not found');
        return;
    }
    
    document.getElementById('modalTitle').textContent = 'Edit Application';
    document.getElementById('appId').value = app.id;
    document.getElementById('university').value = app.university || '';
    document.getElementById('program').value = app.program || '';
    document.getElementById('department').value = app.department || '';
    document.getElementById('deadline').value = app.deadline || '';
    document.getElementById('status').value = app.status || 'draft';
    document.getElementById('notes').value = app.notes || '';
    
    // Check checkboxes
    document.querySelectorAll('.checkbox-group input').forEach(cb => {
        cb.checked = app.documents && app.documents.includes(cb.value);
    });
    
    document.getElementById('applicationModal').style.display = 'block';
}

// Make delete function globally available
window.deleteApplication = async function(id) {
    if (!confirm('Are you sure you want to delete this application?')) {
        return;
    }
    
    try {
        console.log('Deleting application:', id);
        await db.collection('applications').doc(id).delete();
        console.log('Application deleted');
        await loadApplications(); // Reload the list
        alert('Application deleted successfully!');
    } catch (error) {
        console.error('Error deleting application:', error);
        alert('Error deleting application: ' + error.message);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('applicationModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Add some CSS for document tags if not in your main CSS
const style = document.createElement('style');
style.textContent = `
    .document-tag {
        background: #e9ecef;
        padding: 2px 8px;
        border-radius: 12px;
        margin: 2px;
        display: inline-block;
        font-size: 0.85rem;
    }
`;
document.head.appendChild(style);
