// Initialize dashboard
let applications = [];
let statusChart, timelineChart;

document.addEventListener('DOMContentLoaded', async () => {
    await loadApplications();
    updateDashboard();
    
    // Real-time updates
    auth.onAuthStateChanged((user) => {
        if (user) {
            db.collection('applications')
                .where('userId', '==', user.uid)
                .onSnapshot((snapshot) => {
                    applications = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    updateDashboard();
                });
        }
    });
});

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
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

function updateDashboard() {
    updateStats();
    updateStatusChart();
    updateTimelineChart();
    updateRecentApplications();
}

function updateStats() {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;
    
    const total = applications.length;
    const submitted = applications.filter(app => app.status === 'submitted').length;
    const accepted = applications.filter(app => app.status === 'accepted').length;
    const pending = applications.filter(app => 
        ['draft', 'submitted', 'under-review'].includes(app.status)
    ).length;
    
    statsGrid.innerHTML = `
        <div class="stat-card">
            <i class="fas fa-university"></i>
            <h3>Total Applications</h3>
            <div class="stat-number">${total}</div>
        </div>
        <div class="stat-card">
            <i class="fas fa-paper-plane"></i>
            <h3>Submitted</h3>
            <div class="stat-number">${submitted}</div>
        </div>
        <div class="stat-card">
            <i class="fas fa-check-circle"></i>
            <h3>Accepted</h3>
            <div class="stat-number">${accepted}</div>
        </div>
        <div class="stat-card">
            <i class="fas fa-clock"></i>
            <h3>Pending</h3>
            <div class="stat-number">${pending}</div>
        </div>
    `;
}

function updateStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    const statusCounts = {
        'draft': 0,
        'submitted': 0,
        'under-review': 0,
        'accepted': 0,
        'rejected': 0,
        'waitlisted': 0
    };
    
    applications.forEach(app => {
        if (statusCounts.hasOwnProperty(app.status)) {
            statusCounts[app.status]++;
        }
    });
    
    if (statusChart) {
        statusChart.destroy();
    }
    
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts).map(key => 
                key.charAt(0).toUpperCase() + key.slice(1)
            ),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    '#e9ecef',
                    '#cce5ff',
                    '#fff3cd',
                    '#d4edda',
                    '#f8d7da',
                    '#e2d5f1'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateTimelineChart() {
    const ctx = document.getElementById('timelineChart');
    if (!ctx) return;
    
    // Group deadlines by month
    const deadlinesByMonth = {};
    const today = new Date();
    
    applications.forEach(app => {
        if (app.deadline) {
            const deadline = new Date(app.deadline);
            if (deadline >= today) {
                const monthYear = deadline.toLocaleString('default', { month: 'short', year: 'numeric' });
                deadlinesByMonth[monthYear] = (deadlinesByMonth[monthYear] || 0) + 1;
            }
        }
    });
    
    const sortedMonths = Object.keys(deadlinesByMonth).sort((a, b) => {
        return new Date(a) - new Date(b);
    });
    
    if (timelineChart) {
        timelineChart.destroy();
    }
    
    timelineChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedMonths,
            datasets: [{
                label: 'Applications Due',
                data: sortedMonths.map(month => deadlinesByMonth[month]),
                backgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    stepSize: 1
                }
            }
        }
    });
}

function updateRecentApplications() {
    const tbody = document.getElementById('recentAppsBody');
    if (!tbody) return;
    
    const recentApps = applications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    tbody.innerHTML = recentApps.map(app => `
        <tr>
            <td>${app.university || 'N/A'}</td>
            <td>${app.program || 'N/A'}</td>
            <td>
                <span class="status-badge status-${app.status || 'draft'}">
                    ${(app.status || 'draft').charAt(0).toUpperCase() + (app.status || 'draft').slice(1)}
                </span>
            </td>
            <td>${app.deadline ? new Date(app.deadline).toLocaleDateString() : 'N/A'}</td>
        </tr>
    `).join('');
}
