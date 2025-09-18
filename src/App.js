import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

// Firebase and Local Imports
import { auth, db } from "./firebase";
import { loginWithGoogle } from "./auth";

// Components & Pages
import EnhancedHeader from "./components/EnhancedHeader";
import EnhancedFooter from "./components/EnhancedFooter";
import EnhancedPostForm from "./components/EnhancedPostForm";
import ProfileForm from "./components/ProfileForm";
import JobOpportunities from "./components/JobOpportunities";
import ArticlesPage from "./pages/ArticlesPage";
import ArticlePage from "./pages/ArticlePage";
import MyArticlesPage from "./pages/MyArticlesPage";
import UserProfilePage from "./pages/UserProfilePage";

// Styles
import "./styles.css";
import "./components/Modal.css";
import "./MembershipPage.css"; // <-- Import the new CSS for the membership page

// --- Reusable component to prompt users to log in ---
const AuthPrompt = ({ action, onLogin }) => (
    <div className="auth-required">
        <div className="auth-card">
            <h2>Login Required</h2>
            <p>Please log in to {action}.</p>
            <button onClick={onLogin} className="login-button">
                Login with Google
            </button>
        </div>
    </div>
);

// --- Enhanced MembershipPage Component ---
function MembershipPage({ user }) {
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            const unsubscribe = onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data());
                }
            });
            return () => unsubscribe();
        }
    }, [user]);

    const handlePayment = async () => {
        alert("Membership feature is coming soon!");
    };

    const isPremiumMember = userProfile?.isPremium || false;

    return (
        <div className="membership-page">
            <header className="membership-header">
                <h1>Unlock Premium Access</h1>
                <p>Supercharge your college journey with exclusive benefits and early access content.</p>
            </header>

            <main>
                {user ? (
                    isPremiumMember ? (
                        <div className="premium-status-card">
                            <span className="icon" role="img" aria-label="party popper">🎉</span>
                            <h2>You're a Premium Member!</h2>
                            <p>Thank you for supporting the community. You have access to all exclusive features.</p>
                        </div>
                    ) : (
                        <div className="membership-card-enhanced">
                            <div className="card-header">
                                <h2>Premium Access</h2>
                                <p className="price">₹99 <span>/ month</span></p>
                            </div>
                            <ul className="feature-list">
                                <li><span className="icon" role="img" aria-label="star">⭐</span> <b>Early access</b> to all job opportunities</li>
                                <li><span className="icon" role="img" aria-label="email">📧</span> <b>Exclusive email notifications</b> for new content</li>
                                <li><span className="icon" role="img" aria-label="badge">✨</span> A <b>"Premium Member"</b> badge on your profile</li>
                                <li><span className="icon" role="img" aria-label="support">💬</span> <b>Priority support</b> for all your queries</li>
                            </ul>
                            <button onClick={handlePayment} className="upgrade-btn-enhanced">
                                Become a Member
                            </button>
                        </div>
                    )
                ) : (
                    <div className="membership-card-enhanced">
                        <p className="login-to-join">Please log in to become a member and unlock these benefits!</p>
                    </div>
                )}
            </main>
        </div>
    );
}


// --- Main App Component ---
function App() {
    const [user, setUser] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Start in loading state
    const [notification, setNotification] = useState({ message: "", type: "" });

    // This useEffect is the most important part for handling authentication.
    useEffect(() => {
        // onAuthStateChanged returns an unsubscribe function.
        // It listens for any change in the user's login status.
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // User is signed in.
                const userRef = doc(db, "users", currentUser.uid);
                const userSnap = await getDoc(userRef);

                // Check if the user has a profile in Firestore. If not, create one.
                if (!userSnap.exists()) {
                    await setDoc(userRef, {
                        uid: currentUser.uid,
                        displayName: currentUser.displayName,
                        email: currentUser.email,
                        photoURL: currentUser.photoURL,
                        createdAt: new Date(),
                        isPremium: false
                    }, { merge: true });
                }

                // Now that we have a user, check their premium status from Firestore.
                // We re-fetch the snapshot in case we just created it.
                const updatedUserSnap = await getDoc(userRef);
                setIsPremium(updatedUserSnap.data()?.isPremium || false);
                showNotification(`Welcome back, ${currentUser.displayName || 'User'}!`, "success");
            } else {
                // User is signed out.
                setIsPremium(false);
            }

            setUser(currentUser); // Set the user object (or null if logged out)
            setIsLoading(false);  // IMPORTANT: We are now done loading.
        });

        // Cleanup: Unsubscribe from the listener when the App component unmounts.
        return () => unsubscribe();
    }, []);

    // --- Helper Functions ---
    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: "", type: "" }), 5000);
    };

    const handleLogin = async () => {
        try {
            await loginWithGoogle();
            // The onAuthStateChanged listener will handle the welcome message.
        } catch (error) {
            console.error("Login failed:", error);
            showNotification("Login failed. Please try again.", "error");
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            showNotification("You have been logged out successfully.", "info");
        } catch (error) {
            console.error("Logout failed:", error);
            showNotification("Logout failed. Please try again.", "error");
        }
    };

    // --- Loading Screen ---
    if (isLoading) {
        return (
            <div className="app-loading">
                <div className="spinner"></div>
                <p>Loading College Forum...</p>
            </div>
        );
    }

    // --- Main App Render ---
    return (
        <Router>
            <div className="app">
                {notification.message && (
                    <div className={`notification ${notification.type}`}>
                        {notification.message}
                        <button onClick={() => setNotification({ message: "", type: "" })} className="notification-close">&times;</button>
                    </div>
                )}

                <EnhancedHeader user={user} login={handleLogin} logout={handleLogout} isPremium={isPremium} />

                <main className="main-content">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Navigate to="/articles" replace />} />
                        <Route path="/articles" element={<ArticlesPage user={user} />} />
                        <Route path="/article/:articleId" element={<ArticlePage user={user} />} />
                        <Route path="/profile/:userId" element={<UserProfilePage user={user} />} />
                        <Route path="/jobs" element={<JobOpportunities user={user} />} />
                        <Route path="/membership" element={<MembershipPage user={user} />} />
                        <Route path="/about" element={ <div className="about-container"> {/* ... About Page Content ... */} </div> } />

                        {/* Protected Routes (require login) */}
                        <Route path="/my-articles" element={user ? <MyArticlesPage user={user} /> : <AuthPrompt action="view your articles" onLogin={handleLogin} />} />
                        <Route path="/write" element={user ? <EnhancedPostForm user={user} onPostSuccess={() => showNotification("Article published!", "success")} /> : <AuthPrompt action="write an article" onLogin={handleLogin} />} />
                        <Route path="/profile" element={user ? <ProfileForm user={user} onSaveSuccess={() => showNotification("Profile updated!", "success")} onError={(err) => showNotification(err, "error")} /> : <AuthPrompt action="manage your profile" onLogin={handleLogin} />} />

                        {/* Fallback Route */}
                        <Route path="*" element={<Navigate to="/articles" replace />} />
                    </Routes>
                </main>

                <EnhancedFooter />
            </div>
        </Router>
    );
}

export default App;