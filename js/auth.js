// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'index.html' || currentPage === '') {
            window.location.href = 'dashboard.html';
        }
        loadUserData(user);
    } else {
        // User is signed out
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage !== 'index.html' && currentPage !== '') {
            window.location.href = 'index.html';
        }
    }
});

// Login form handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            // Basic validation
            if (!email || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                console.log('Login successful:', userCredential.user.email);
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Login error:', error.code, error.message);
                
                // User-friendly error messages
                let message = 'Login failed: ';
                switch(error.code) {
                    case 'auth/user-not-found':
                        message += 'No account found with this email';
                        break;
                    case 'auth/wrong-password':
                        message += 'Incorrect password';
                        break;
                    case 'auth/too-many-requests':
                        message += 'Too many failed attempts. Try again later';
                        break;
                    default:
                        message += error.message;
                }
                alert(message);
            }
        });
    }
    
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            
            // Validation
            if (!name || !email || !password) {
                alert('Please fill in all fields');
                return;
            }
            if (password.length < 6) {
                alert('Password must be at least 6 characters');
                return;
            }
            
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                
                // Update profile
                await userCredential.user.updateProfile({
                    displayName: name
                });
                
                // Create user document in Firestore
                await db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log('Signup successful');
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Signup error:', error);
                
                let message = 'Signup failed: ';
                switch(error.code) {
                    case 'auth/email-already-in-use':
                        message += 'Email already registered';
                        break;
                    case 'auth/invalid-email':
                        message += 'Invalid email address';
                        break;
                    case 'auth/weak-password':
                        message += 'Password is too weak';
                        break;
                    default:
                        message += error.message;
                }
                alert(message);
            }
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                alert('Logout failed: ' + error.message);
            }
        });
    }
});

// Load user data
async function loadUserData(user) {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = user.displayName || user.email;
    }
}

// Toggle between login and signup forms
function showSignup() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('signupForm').classList.add('active');
}

function showLogin() {
    document.getElementById('signupForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
}
