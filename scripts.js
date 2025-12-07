// XYZ Pet Adoption Website JavaScript
// Interactive functionality for forms, navigation, and filtering

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN_KEY = 'pet_adoption_token';

// Global variables for dynamic data
let allPets = [];
let allActivities = [];
let currentUser = null;
let adoptionQueue = [];
let authToken = localStorage.getItem(AUTH_TOKEN_KEY);

document.addEventListener('DOMContentLoaded', function() {
    // Initialize authentication first
    initializeAuth();
    
    // Initialize all functionality
    initializeMobileMenu();
    initializeFormValidation();
    initializePetFilters();
    initializeViewToggle();
    initializeLoadMore();
    
    // New dynamic functionality
    initializeDynamicPetLoading();
    initializeDynamicActivities();
    initializeAdoptionButtons();
    initializeUserSession();
    
    // Load initial data
    loadPetsData();
    loadActivitiesData();
    
    // Check adoption button states
    setTimeout(checkAdoptionStatus, 500);
});

// Mobile Menu Toggle
function initializeMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Animate hamburger menu
            const spans = mobileMenuToggle.querySelectorAll('span');
            spans.forEach(span => span.classList.toggle('active'));
        });
    }
}

// Form Validation
function initializeFormValidation() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateLoginForm()) {
                handleUserLogin(this);
            }
        });
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateRegisterForm()) {
                handleAccountCreation(this);
            }
        });
        
        // Real-time password validation
        const passwordInput = document.getElementById('password-register');
        if (passwordInput) {
            passwordInput.addEventListener('input', validatePassword);
        }
    }
}

function validateLoginForm() {
    let isValid = true;
    
    // Email validation
    const email = document.getElementById('email');
    const emailError = document.getElementById('email-error');
    if (!email.value || !isValidEmail(email.value)) {
        showError(emailError, 'Please enter a valid email address');
        isValid = false;
    } else {
        hideError(emailError);
    }
    
    // Password validation
    const password = document.getElementById('password');
    const passwordError = document.getElementById('password-error');
    if (!password.value) {
        showError(passwordError, 'Password is required');
        isValid = false;
    } else {
        hideError(passwordError);
    }
    
    if (isValid) {
        // Use API authentication
        loginUser(email.value, password.value);
    }
    
    return isValid;
}

// API Helper Functions
async function makeApiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        ...options
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Authentication Functions
function initializeAuth() {
    // Check if user is logged in
    if (authToken) {
        getCurrentUser();
    }
    updateAuthUI();
}

async function loginUser(email, password) {
    try {
        showLoadingMessage('Logging in...');
        
        const data = await makeApiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        // Store token and user data
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem(AUTH_TOKEN_KEY, authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showSuccessMessage(`Welcome back, ${currentUser.firstName}!`);
        updateAuthUI();
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        showErrorMessage(error.message || 'Login failed. Please try again.');
    }
}

async function registerUser(userData) {
    try {
        showLoadingMessage('Creating account...');
        
        const data = await makeApiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        // Store token and user data
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem(AUTH_TOKEN_KEY, authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showSuccessMessage(`Welcome ${currentUser.firstName}! Your account is ready.`);
        updateAuthUI();
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        showErrorMessage(error.message || 'Registration failed. Please try again.');
    }
}

async function getCurrentUser() {
    try {
        const data = await makeApiRequest('/auth/me');
        currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } catch (error) {
        // Token might be invalid, clear auth data
        logout();
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('currentUser');
    updateAuthUI();
    
    // Redirect to home page
    if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
        window.location.href = 'index.html';
    }
}

function updateAuthUI() {
    // Update navigation based on auth status
    const authLinks = document.querySelectorAll('.auth-link');
    const userLinks = document.querySelectorAll('.user-link');
    const loginForms = document.querySelectorAll('.login-form');
    
    if (currentUser) {
        authLinks.forEach(link => link.style.display = 'none');
        userLinks.forEach(link => link.style.display = 'block');
        
        // Update user display name
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
        });
    } else {
        authLinks.forEach(link => link.style.display = 'block');
        userLinks.forEach(link => link.style.display = 'none');
    }
}

// Message display functions
function showLoadingMessage(message) {
    const existingMessage = document.querySelector('.loading-message');
    if (existingMessage) existingMessage.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'loading-message';
    messageDiv.innerHTML = `<p>${message}</p>`;
    messageDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #007bff; color: white; padding: 15px; border-radius: 5px; z-index: 1000;';
    document.body.appendChild(messageDiv);
    
    setTimeout(() => messageDiv.remove(), 3000);
}
    
// Message display functions
function showLoadingMessage(message) {
    const existingMessage = document.querySelector('.loading-message');
    if (existingMessage) existingMessage.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'loading-message';
    messageDiv.innerHTML = `<p>${message}</p>`;
    messageDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #007bff; color: white; padding: 15px; border-radius: 5px; z-index: 1000;';
    document.body.appendChild(messageDiv);
    
    setTimeout(() => messageDiv.remove(), 3000);
}

function handleAccountCreation(form) {
    const formData = new FormData(form);
    const userData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        password: formData.get('password'),
        phone: formData.get('phone'),
        address: {
            street: formData.get('address'),
            city: formData.get('city'),
            state: formData.get('state'),
            zip: formData.get('zip')
        },
        userType: formData.get('petType') || 'adopting',
        preferences: {
            newsletter: formData.get('newsletter') === 'on',
            emailNotifications: true
        }
    };
    
    // Clear form
    form.reset();
    
    // Register user via API
    registerUser(userData);
}

function handleUserLogin(form) {
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Get registered users
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const user = users.find(u => u.email === email);
    
    if (!user) {
        showErrorMessage('No account found with this email. Please register first.');
        return;
    }
    
    // In a real app, verify password hash
    // For demo purposes, accept any password for registered users
    
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    showSuccessMessage(`Welcome back, ${user.firstName}!`);
    
    // Clear form
    form.reset();
    
    // Redirect or update UI
    setTimeout(() => {
        if (window.location.pathname.includes('login')) {
            window.location.href = 'index.html';
        } else {
            updateUserInterface();
        }
    }, 1500);
}

function updateUserInterface() {
    // Update navigation for logged-in user
    const loginLinks = document.querySelectorAll('a[href="login.html"]');
    const registerLinks = document.querySelectorAll('a[href="register.html"]');
    
    if (currentUser) {
        // Show user menu instead of login/register
        loginLinks.forEach(link => {
            link.textContent = currentUser.firstName;
            link.href = '#';
            link.onclick = (e) => {
                e.preventDefault();
                showUserMenu();
            };
        });
        
        registerLinks.forEach(link => {
            link.style.display = 'none';
        });
        
        // Show welcome message on homepage
        showWelcomeMessage();
    }
}

function showUserMenu() {
    const menu = createModal(`
        <div class="user-menu">
            <h2>Hi, ${currentUser.firstName}! 👋</h2>
            <div class="user-stats">
                <p><strong>Email:</strong> ${currentUser.email}</p>
                <p><strong>Member since:</strong> ${new Date(currentUser.createdAt).toLocaleDateString()}</p>
                <p><strong>Favorite pets:</strong> ${currentUser.favorites?.length || 0}</p>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="viewMyApplications()">My Applications</button>
                <button class="btn" onclick="viewMyFavorites()">My Favorites</button>
                <button class="btn btn-outline" onclick="logout(); closeModal();">Logout</button>
                <button class="btn btn-outline" onclick="closeModal()">Close</button>
            </div>
        </div>
    `);
    
    document.body.appendChild(menu);
}

function showWelcomeMessage() {
    const welcomeContainer = document.querySelector('.hero-content, .main-content');
    if (welcomeContainer && !document.querySelector('.welcome-message')) {
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'welcome-message';
        welcomeMsg.innerHTML = `
            <p>Welcome back, ${currentUser.firstName}! Ready to find your perfect pet companion?</p>
        `;
        welcomeContainer.insertBefore(welcomeMsg, welcomeContainer.firstChild);
    }
}

function validateRegisterForm() {
    let isValid = true;
    
    // First name validation
    const firstName = document.getElementById('firstName');
    const firstNameError = document.getElementById('firstName-error');
    if (!firstName.value.trim()) {
        showError(firstNameError, 'First name is required');
        isValid = false;
    } else {
        hideError(firstNameError);
    }
    
    // Last name validation
    const lastName = document.getElementById('lastName');
    const lastNameError = document.getElementById('lastName-error');
    if (!lastName.value.trim()) {
        showError(lastNameError, 'Last name is required');
        isValid = false;
    } else {
        hideError(lastNameError);
    }
    
    // Email validation
    const email = document.getElementById('email-register');
    const emailError = document.getElementById('email-register-error');
    if (!email.value || !isValidEmail(email.value)) {
        showError(emailError, 'Please enter a valid email address');
        isValid = false;
    } else {
        hideError(emailError);
    }
    
    // Password validation
    const password = document.getElementById('password-register');
    const passwordError = document.getElementById('password-register-error');
    const passwordValidation = validatePasswordStrength(password.value);
    if (!passwordValidation.isValid) {
        showError(passwordError, passwordValidation.message);
        isValid = false;
    } else {
        hideError(passwordError);
    }
    
    // Confirm password validation
    const confirmPassword = document.getElementById('confirmPassword');
    const confirmPasswordError = document.getElementById('confirmPassword-error');
    if (password.value !== confirmPassword.value) {
        showError(confirmPasswordError, 'Passwords do not match');
        isValid = false;
    } else {
        hideError(confirmPasswordError);
    }
    
    // User type validation
    const userType = document.getElementById('userType');
    const userTypeError = document.getElementById('userType-error');
    if (!userType.value) {
        showError(userTypeError, 'Please select your primary interest');
        isValid = false;
    } else {
        hideError(userTypeError);
    }
    
    // Terms agreement validation
    const terms = document.getElementById('terms');
    if (!terms.checked) {
        alert('Please agree to the Terms of Service and Privacy Policy');
        isValid = false;
    }
    
    if (isValid) {
        // Create user account
        createUserAccount({
            firstName: firstName.value.trim(),
            lastName: lastName.value.trim(),
            email: email.value.trim(),
            phone: document.getElementById('phone').value.trim(),
            userType: userType.value,
            newsletter: document.getElementById('newsletter').checked
        });
    }
    
    return isValid;
}

function createUserAccount(userData) {
    // Generate unique user ID
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const newUser = {
        id: userId,
        ...userData,
        createdAt: new Date(),
        isActive: true,
        preferences: {
            emailNotifications: true,
            smsNotifications: false,
            petTypes: [],
            agePreferences: 'all'
        },
        adoptionHistory: [],
        volunteerHours: 0
    };
    
    // Save user to localStorage (in real app, this would be an API call)
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    // Show success and redirect
    showSuccessMessage(`Welcome ${userData.firstName}! Account created successfully!`);
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

// Enhanced Login Handler
function handleUserLogin(form) {
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Clear form
    form.reset();
    
    // Login user via API
    loginUser(email, password);
}

// Enhanced User Interface Updates
function updateUserInterface() {
    // Update navigation for logged-in user
    const loginLinks = document.querySelectorAll('a[href="login.html"]');
    const registerLinks = document.querySelectorAll('a[href="register.html"]');
    
    if (currentUser) {
        // Show user menu instead of login/register
        loginLinks.forEach(link => {
            link.textContent = currentUser.firstName;
            link.href = '#';
            link.onclick = (e) => {
                e.preventDefault();
                showUserMenu();
            };
        });
        
        registerLinks.forEach(link => {
            link.style.display = 'none';
        });
        
        // Show welcome message on homepage
        showWelcomeMessage();
    }
}

function showUserMenu() {
    const menu = createModal(`
        <div class="user-menu">
            <h2>Hi, ${currentUser.firstName}! 👋</h2>
            <div class="user-stats">
                <p><strong>Email:</strong> ${currentUser.email}</p>
                <p><strong>Member since:</strong> ${new Date(currentUser.createdAt).toLocaleDateString()}</p>
                <p><strong>Favorite pets:</strong> ${currentUser.favorites?.length || 0}</p>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="viewMyApplications()">My Applications</button>
                <button class="btn" onclick="viewMyFavorites()">My Favorites</button>
                <button class="btn btn-outline" onclick="logout(); closeModal();">Logout</button>
                <button class="btn btn-outline" onclick="closeModal()">Close</button>
            </div>
        </div>
    `);
    
    document.body.appendChild(menu);
}

function showWelcomeMessage() {
    const welcomeContainer = document.querySelector('.hero-content, .main-content');
    if (welcomeContainer && !document.querySelector('.welcome-message')) {
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'welcome-message';
        welcomeMsg.innerHTML = `
            <p>Welcome back, ${currentUser.firstName}! Ready to find your perfect pet companion?</p>
        `;
        welcomeContainer.insertBefore(welcomeMsg, welcomeContainer.firstChild);
    }
}

function validatePassword() {
    const password = document.getElementById('password-register');
    const passwordError = document.getElementById('password-register-error');
    const validation = validatePasswordStrength(password.value);
    
    if (password.value && !validation.isValid) {
        showError(passwordError, validation.message);
    } else {
        hideError(passwordError);
    }
}

function validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?\":{}|<>]/.test(password);
    
    if (password.length < minLength) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!hasUpperCase) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!hasLowerCase) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!hasNumbers) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }
    if (!hasSpecialChar) {
        return { isValid: false, message: 'Password must contain at least one special character' };
    }
    
    return { isValid: true, message: 'Password is strong' };
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showError(errorElement, message) {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function hideError(errorElement) {
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}

function showSuccessMessage(message) {
    // Create and show success notification
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 500;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Password visibility toggle
function togglePasswordVisibility(inputId) {
    const passwordInput = document.getElementById(inputId);
    const toggleButton = passwordInput.nextElementSibling;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleButton.textContent = '👁️';
    }
}

// Pet Filtering
function initializePetFilters() {
    const petTypeFilter = document.getElementById('pet-type');
    const ageRangeFilter = document.getElementById('age-range');
    const sizeFilter = document.getElementById('size');
    
    if (petTypeFilter) {
        petTypeFilter.addEventListener('change', filterPets);
    }
    if (ageRangeFilter) {
        ageRangeFilter.addEventListener('change', filterPets);
    }
    if (sizeFilter) {
        sizeFilter.addEventListener('change', filterPets);
    }
}

function filterPets() {
    const petType = document.getElementById('pet-type')?.value || 'all';
    const ageRange = document.getElementById('age-range')?.value || 'all';
    const size = document.getElementById('size')?.value || 'all';
    
    const petCards = document.querySelectorAll('.pet-card');
    let visibleCount = 0;
    
    petCards.forEach(card => {
        let show = true;
        
        // Filter by pet type
        if (petType !== 'all' && !card.dataset.type.includes(petType)) {
            show = false;
        }
        
        // Filter by age range
        if (ageRange !== 'all') {
            const cardAge = card.dataset.age;
            if (ageRange === 'young' && cardAge !== 'young') show = false;
            if (ageRange === 'adult' && cardAge !== 'adult') show = false;
            if (ageRange === 'senior' && cardAge !== 'senior') show = false;
        }
        
        // Filter by size
        if (size !== 'all' && card.dataset.size !== size) {
            show = false;
        }
        
        // Show/hide card
        if (show) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Update results info
    const resultsInfo = document.querySelector('.results-info');
    if (resultsInfo) {
        resultsInfo.textContent = `Showing ${visibleCount} pets`;
    }
}

function applyFilters() {
    filterPets();
}

function clearFilters() {
    const filters = ['pet-type', 'age-range', 'size'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) filter.value = 'all';
    });
    filterPets();
}

// View Toggle
function initializeViewToggle() {
    const viewButtons = document.querySelectorAll('.view-btn');
    const petsContainer = document.getElementById('pets-container');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update container class
            const view = this.dataset.view;
            if (petsContainer) {
                petsContainer.className = view === 'list' ? 'pets-list' : 'pets-grid';
            }
        });
    });
}

// Load More Functionality
function initializeLoadMore() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            // Simulate loading more pets
            this.textContent = 'Loading...';
            this.disabled = true;
            
            setTimeout(() => {
                // In a real application, you would fetch more data here
                this.textContent = 'Load More Pets';
                this.disabled = false;
                
                // Update results info
                const resultsInfo = document.querySelector('.results-info');
                if (resultsInfo) {
                    resultsInfo.textContent = 'All pets loaded';
                    this.style.display = 'none';
                }
            }, 1500);
        });
    }
}

// Smooth scrolling for anchor links
document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Dynamic Pet Loading System
function initializeDynamicPetLoading() {
    // Set up intersection observer for lazy loading
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Load pets data from API
async function loadPetsData() {
    try {
        const data = await makeApiRequest('/pets');
        allPets = data.pets || [];
        displayPets(allPets);
    } catch (error) {
        console.error('Failed to load pets:', error);
        // Fallback to demo data
        loadDemoPetsData();
    }
}

function loadDemoPetsData() {
    // Fallback demo data for development
    const petsData = [
        {
            id: 1,
            name: "Buddy",
            type: "dogs",
            breed: "Golden Retriever",
            age: "3 years",
            ageCategory: "adult",
            size: "large",
            weight: "70 lbs",
            personality: "Friendly and energetic",
            description: "Buddy is a loyal companion who loves fetch, swimming, and making new friends. Great with kids and other dogs!",
            image: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop",
            adoptionFee: 200,
            vaccinated: true,
            spayedNeutered: true,
            microchipped: true,
            availableDate: new Date('2024-12-01')
        },
        {
            id: 2,
            name: "Whiskers",
            type: "cats",
            breed: "Orange Tabby",
            age: "2 years",
            ageCategory: "adult",
            size: "small",
            weight: "12 lbs",
            personality: "Playful and affectionate",
            description: "Whiskers loves to chase toy mice and curl up in sunny spots. He's great with children and other cats!",
            image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop",
            adoptionFee: 100,
            vaccinated: true,
            spayedNeutered: true,
            microchipped: true,
            availableDate: new Date('2024-11-15')
        },
        {
            id: 3,
            name: "Luna",
            type: "cats",
            breed: "Tuxedo Cat",
            age: "3 years",
            ageCategory: "adult",
            size: "small",
            weight: "10 lbs",
            personality: "Calm and gentle",
            description: "Luna is a sophisticated lady who enjoys quiet evenings and gentle pets. Perfect for a peaceful home!",
            image: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=300&fit=crop",
            adoptionFee: 100,
            vaccinated: true,
            spayedNeutered: true,
            microchipped: true,
            availableDate: new Date('2024-12-03')
        },
        {
            id: 4,
            name: "Cocoa",
            type: "rabbits",
            breed: "Holland Lop",
            age: "2 years",
            ageCategory: "adult",
            size: "small",
            weight: "4 lbs",
            personality: "Gentle and social",
            description: "Cocoa is a gentle rabbit who loves fresh vegetables and hop-around time. Perfect for families!",
            image: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop",
            adoptionFee: 75,
            vaccinated: true,
            spayedNeutered: true,
            microchipped: false,
            availableDate: new Date('2024-11-28')
        },
        {
            id: 5,
            name: "Sunny",
            type: "birds",
            breed: "Cockatiel",
            age: "3 years",
            ageCategory: "adult",
            size: "small",
            weight: "0.5 lbs",
            personality: "Cheerful and vocal",
            description: "Sunny loves to whistle and sing along to music. A cheerful companion for bird lovers!",
            image: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&h=300&fit=crop",
            adoptionFee: 150,
            vaccinated: true,
            spayedNeutered: false,
            microchipped: false,
            availableDate: new Date('2024-12-05')
        }
    ];

    allPets = petsData;
    renderPets(allPets);
    updatePetStats();
}

function renderPets(pets, container = null) {
    const petsContainer = container || document.getElementById('pets-container');
    if (!petsContainer) return;

    petsContainer.innerHTML = '';

    pets.forEach(pet => {
        const petCard = createPetCard(pet);
        petsContainer.appendChild(petCard);
    });

    // Initialize adoption buttons for newly created cards
    initializeAdoptionButtons();
}

function createPetCard(pet) {
    const card = document.createElement('article');
    card.className = 'pet-card';
    card.setAttribute('data-type', pet.type);
    card.setAttribute('data-age', pet.ageCategory);
    card.setAttribute('data-size', pet.size);
    card.setAttribute('data-pet-id', pet.id);

    const statusBadge = pet.availableDate > new Date() ? 
        '<span class="status-badge coming-soon">Coming Soon</span>' : 
        '<span class="status-badge available">Available Now</span>';

    card.innerHTML = `
        <div class="pet-image-container">
            <img src="${pet.image}" alt="${pet.name} - ${pet.breed}" loading="lazy">
            ${statusBadge}
            <button class="favorite-btn" aria-label="Add to favorites" onclick="toggleFavorite(${pet.id})">
                <span class="heart-icon">♡</span>
            </button>
        </div>
        <div class="pet-info">
            <div class="pet-header">
                <h3>${pet.name}</h3>
                <span class="pet-type">${getPetTypeIcon(pet.type)} ${capitalizeFirst(pet.type.slice(0, -1))}</span>
            </div>
            <div class="pet-details">
                <p><strong>Breed:</strong> ${pet.breed}</p>
                <p><strong>Age:</strong> ${pet.age}</p>
                ${pet.weight ? `<p><strong>Weight:</strong> ${pet.weight}</p>` : ''}
                <p><strong>Personality:</strong> ${pet.personality}</p>
            </div>
            <p class="pet-description">${pet.description}</p>
            <div class="pet-features">
                ${pet.vaccinated ? '<span class="feature-badge">✅ Vaccinated</span>' : ''}
                ${pet.spayedNeutered ? '<span class="feature-badge">✅ Spayed/Neutered</span>' : ''}
                ${pet.microchipped ? '<span class="feature-badge">✅ Microchipped</span>' : ''}
            </div>
            <div class="adoption-info">
                <span class="adoption-fee">Adoption Fee: $${pet.adoptionFee}</span>
                <button class="btn adopt-btn" onclick="initiateAdoption(${pet.id})">
                    ${pet.availableDate > new Date() ? 'Reserve Now' : 'Adopt Me!'}
                </button>
            </div>
        </div>
    `;

    return card;
}

function getPetTypeIcon(type) {
    const icons = {
        'dogs': '🐶',
        'cats': '🐱',
        'rabbits': '🐰',
        'birds': '🦜'
    };
    return icons[type] || '🐾';
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Dynamic Activities Loading
function initializeDynamicActivities() {
    const activitiesContainer = document.querySelector('.events-grid');
    if (activitiesContainer) {
        loadActivitiesData();
        initializeActivityFilters();
        initializeActivitySearch();
    }
}

function initializeActivityFilters() {
    // Add filter buttons if they exist
    const filterButtons = document.querySelectorAll('[data-activity-filter]');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-activity-filter');
            filterActivities(filter);
            
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function initializeActivitySearch() {
    const searchInput = document.querySelector('#activity-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filteredActivities = allActivities.filter(activity => 
                activity.title.toLowerCase().includes(searchTerm) ||
                activity.description.toLowerCase().includes(searchTerm) ||
                activity.location.toLowerCase().includes(searchTerm)
            );
            renderActivities(filteredActivities);
        });
    }
}

function filterActivities(filter) {
    let filteredActivities;
    
    switch(filter) {
        case 'all':
            filteredActivities = allActivities;
            break;
        case 'upcoming':
            filteredActivities = allActivities.filter(activity => 
                activity.date >= new Date()
            );
            break;
        case 'adoption-events':
            filteredActivities = allActivities.filter(activity => 
                activity.category === 'adoption-event'
            );
            break;
        case 'volunteer':
            filteredActivities = allActivities.filter(activity => 
                activity.category === 'volunteer'
            );
            break;
        case 'education':
            filteredActivities = allActivities.filter(activity => 
                activity.category === 'education'
            );
            break;
        case 'available':
            filteredActivities = allActivities.filter(activity => 
                activity.registered < activity.capacity
            );
            break;
        default:
            filteredActivities = allActivities;
    }
    
    renderActivities(filteredActivities);
}

// Load activities data from API
async function loadActivitiesData() {
    try {
        const data = await makeApiRequest('/activities?upcoming=true');
        allActivities = data.activities || [];
        renderActivities(allActivities);
    } catch (error) {
        console.error('Failed to load activities:', error);
        // Fallback to demo data
        loadDemoActivitiesData();
    }
}

function loadDemoActivitiesData() {
    // Fallback demo data for development
    const activitiesData = [
        {
            id: 1,
            title: "Holiday Pet Adoption Fair",
            date: new Date('2025-12-14'),
            time: "10:00 AM - 4:00 PM",
            location: "City Park Main Pavilion",
            description: "Join us for our annual holiday adoption event! Meet dozens of pets looking for forever homes, enjoy hot cocoa, and take photos with Santa and your new furry friend.",
            category: "adoption-event",
            capacity: 100,
            registered: 23,
            featured: true
        },
        {
            id: 2,
            title: "Pet Training Workshop",
            date: new Date('2025-12-21'),
            time: "2:00 PM - 4:00 PM",
            location: "XYZ Pet Adoption Center",
            description: "Learn basic training techniques for dogs and cats. Perfect for new pet owners or those looking to improve their pet's behavior. All skill levels welcome!",
            category: "education",
            capacity: 20,
            registered: 8,
            featured: true
        },
        {
            id: 3,
            title: "New Year Pet Walk",
            date: new Date('2026-01-04'),
            time: "9:00 AM - 11:00 AM",
            location: "Riverside Trail",
            description: "Start the new year with a healthy walk alongside adoptable dogs! Help socialize our shelter dogs while getting some exercise and fresh air.",
            category: "volunteer",
            capacity: 30,
            registered: 12,
            featured: true
        },
        {
            id: 4,
            title: "Cat Socialization Session",
            date: new Date('2025-12-08'),
            time: "11:00 AM - 1:00 PM",
            location: "XYZ Pet Adoption Center",
            description: "Spend quality time with our cats to help them become more comfortable around people.",
            category: "volunteer",
            capacity: 8,
            registered: 5,
            featured: false
        }
    ];

    allActivities = activitiesData;
    renderActivities(allActivities.filter(activity => activity.featured));
}

// Enhanced Activity Filtering Functions
function initializeActivityFilters() {
    // Add filter buttons if they exist
    const filterButtons = document.querySelectorAll('[data-activity-filter]');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-activity-filter');
            filterActivities(filter);
            
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function initializeActivitySearch() {
    const searchInput = document.querySelector('#activity-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filteredActivities = allActivities.filter(activity => 
                activity.title.toLowerCase().includes(searchTerm) ||
                activity.description.toLowerCase().includes(searchTerm) ||
                activity.location.toLowerCase().includes(searchTerm)
            );
            renderActivities(filteredActivities);
        });
    }
}

function filterActivities(filter) {
    let filteredActivities;
    
    switch(filter) {
        case 'all':
            filteredActivities = allActivities;
            break;
        case 'upcoming':
            filteredActivities = allActivities.filter(activity => 
                activity.date >= new Date()
            );
            break;
        case 'adoption-events':
            filteredActivities = allActivities.filter(activity => 
                activity.category === 'adoption-event'
            );
            break;
        case 'volunteer':
            filteredActivities = allActivities.filter(activity => 
                activity.category === 'volunteer'
            );
            break;
        case 'education':
            filteredActivities = allActivities.filter(activity => 
                activity.category === 'education'
            );
            break;
        case 'available':
            filteredActivities = allActivities.filter(activity => 
                activity.registered < activity.capacity
            );
            break;
        default:
            filteredActivities = allActivities;
    }
    
    renderActivities(filteredActivities);
}

function renderActivities(activities) {
    const activitiesContainer = document.querySelector('.events-grid');
    if (!activitiesContainer) return;

    activitiesContainer.innerHTML = '';

    activities.forEach(activity => {
        const activityCard = createActivityCard(activity);
        activitiesContainer.appendChild(activityCard);
    });
}

function createActivityCard(activity) {
    const card = document.createElement('article');
    card.className = 'event-card';
    card.setAttribute('data-activity-id', activity.id);

    const month = activity.date.toLocaleDateString('en-US', { month: 'short' });
    const day = activity.date.getDate();
    const spotsLeft = activity.capacity - activity.registered;

    card.innerHTML = `
        <div class="event-date">
            <span class="month">${month}</span>
            <span class="day">${day}</span>
        </div>
        <div class="event-info">
            <h3>${activity.title}</h3>
            <p class="event-time">📅 ${activity.date.toLocaleDateString()} • ${activity.time}</p>
            <p class="event-location">📍 ${activity.location}</p>
            <p class="event-description">${activity.description}</p>
            <div class="event-capacity">
                <span class="spots-info">${spotsLeft} spots remaining</span>
                <div class="capacity-bar">
                    <div class="capacity-fill" style="width: ${(activity.registered / activity.capacity) * 100}%"></div>
                </div>
            </div>
            <button class="btn ${spotsLeft > 0 ? '' : 'btn-disabled'}" 
                    onclick="registerForActivity(${activity.id})"
                    ${spotsLeft <= 0 ? 'disabled' : ''}>
                ${spotsLeft > 0 ? 'Register Now' : 'Full'}
            </button>
        </div>
    `;

    return card;
}

// Enhanced Account Creation System
function initializeUserSession() {
    // Check for existing session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
    }

    // Check for saved favorites
    const savedFavorites = localStorage.getItem('favoritePets');
    if (savedFavorites) {
        const favorites = JSON.parse(savedFavorites);
        updateFavoriteButtons(favorites);
    }
}

function updateUIForLoggedInUser() {
    if (!currentUser) return;

    // Update navigation
    const accountDropdown = document.querySelector('.dropdown a[href="auth.html"]');
    if (accountDropdown) {
        accountDropdown.textContent = currentUser.firstName;
        
        // Add logout option to dropdown
        const dropdownMenu = accountDropdown.nextElementSibling;
        if (dropdownMenu) {
            dropdownMenu.innerHTML = `
                <li><a href="#" onclick="showUserProfile()">My Profile</a></li>
                <li><a href="#" onclick="showAdoptionApplications()">My Applications</a></li>
                <li><a href="#" onclick="showFavorites()">Favorites</a></li>
                <li><a href="#" onclick="logout()">Logout</a></li>
            `;
        }
    }

    // Show personalized content
    showPersonalizedContent();
}

function showPersonalizedContent() {
    // Add welcome message
    const hero = document.querySelector('.hero');
    if (hero && currentUser) {
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'welcome-message';
        welcomeMsg.innerHTML = `<p>Welcome back, ${currentUser.firstName}! 👋</p>`;
        hero.insertBefore(welcomeMsg, hero.firstChild);
    }
}

// Advanced Adoption Button System
function initializeAdoptionButtons() {
    // Add click handlers to all adoption buttons
    document.querySelectorAll('.adopt-btn').forEach(button => {
        if (!button.onclick) {
            const petCard = button.closest('.pet-card');
            if (petCard) {
                const petId = parseInt(petCard.getAttribute('data-pet-id'));
                button.onclick = () => initiateAdoption(petId);
            }
        }
    });

    // Add favorite button handlers
    document.querySelectorAll('.favorite-btn').forEach(button => {
        if (!button.onclick) {
            const petCard = button.closest('.pet-card');
            if (petCard) {
                const petId = parseInt(petCard.getAttribute('data-pet-id'));
                button.onclick = () => toggleFavorite(petId);
            }
        }
    });
}

async function initiateAdoption(petId) {
    const pet = allPets.find(p => p.id === petId);
    if (!pet) return;

    if (!currentUser) {
        showLoginPrompt('Please log in to start the adoption process.');
        return;
    }

    // Check if pet is available
    if (pet.adoption?.status !== 'available') {
        showErrorMessage('This pet is no longer available for adoption.');
        return;
    }

    showAdoptionModal(pet);
}

function showAdoptionModal(pet) {
    const modal = createModal(`
        <div class="adoption-modal">
            <h2>Adopt ${pet.name}! 🐾</h2>
            <div class="pet-summary">
                <img src="${pet.image}" alt="${pet.name}" class="modal-pet-image">
                <div class="pet-quick-info">
                    <h3>${pet.name}</h3>
                    <p>${pet.breed} • ${pet.age}</p>
                    <p class="adoption-fee-large">Adoption Fee: $${pet.adoptionFee}</p>
                </div>
            </div>
            <div class="adoption-steps">
                <h3>Next Steps:</h3>
                <ol>
                    <li>Complete adoption application</li>
                    <li>Schedule a meet & greet</li>
                    <li>Home visit (if required)</li>
                    <li>Finalize adoption</li>
                </ol>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="startAdoptionApplication(${pet.id})">Start Application</button>
                <button class="btn btn-outline" onclick="scheduleVisit(${pet.id})">Schedule Visit First</button>
                <button class="btn btn-outline" onclick="closeModal()">Maybe Later</button>
            </div>
        </div>
    `);
    
    document.body.appendChild(modal);
}

async function startAdoptionApplication(petId) {
    const pet = allPets.find(p => p.id === petId);
    
    try {
        showLoadingMessage('Submitting adoption application...');
        
        const adoptionDetails = {
            message: `I would like to adopt ${pet.name}.`,
            experience: '',
            livingSpace: 'house_small_yard',
            hasOtherPets: false,
            hasChildren: false
        };
        
        const data = await makeApiRequest(`/pets/${petId}/adoption-request`, {
            method: 'POST',
            body: JSON.stringify({ adoptionDetails })
        });
        
        closeModal();
        showSuccessMessage(`Adoption application submitted for ${pet.name}! The shelter will contact you soon.`);
        
        // Update button state
        updateAdoptionButtonState(petId, 'application-pending');
        
    } catch (error) {
        showErrorMessage(error.message || 'Failed to submit adoption application. Please try again.');
    }
}

function scheduleVisit(petId) {
    const pet = allPets.find(p => p.id === petId);
    closeModal();
    
    const visitModal = createModal(`
        <div class="visit-scheduler">
            <h2>Schedule a Visit with ${pet.name}</h2>
            <form class="visit-form" onsubmit="confirmVisit(event, ${petId})">
                <div class="form-group">
                    <label for="visit-date">Preferred Date:</label>
                    <input type="date" id="visit-date" required min="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label for="visit-time">Preferred Time:</label>
                    <select id="visit-time" required>
                        <option value="">Select a time</option>
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="visit-notes">Special Requests (Optional):</label>
                    <textarea id="visit-notes" placeholder="Any questions or special requests for your visit..."></textarea>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn">Schedule Visit</button>
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                </div>
            </form>
        </div>
    `);
    
    document.body.appendChild(visitModal);
}

function confirmVisit(event, petId) {
    event.preventDefault();
    
    const pet = allPets.find(p => p.id === petId);
    const date = document.getElementById('visit-date').value;
    const time = document.getElementById('visit-time').value;
    const notes = document.getElementById('visit-notes').value;
    
    // Save visit request
    const visitRequest = {
        petId: petId,
        petName: pet.name,
        userId: currentUser.id,
        date: date,
        time: time,
        notes: notes,
        status: 'scheduled',
        createdAt: new Date()
    };
    
    let visits = JSON.parse(localStorage.getItem('scheduledVisits') || '[]');
    visits.push(visitRequest);
    localStorage.setItem('scheduledVisits', JSON.stringify(visits));
    
    closeModal();
    showSuccessMessage(`Visit scheduled with ${pet.name} on ${new Date(date).toLocaleDateString()} at ${formatTime(time)}!`);
}

function toggleFavorite(petId) {
    if (!currentUser) {
        showLoginPrompt('Please log in to save favorites.');
        return;
    }

    let favorites = JSON.parse(localStorage.getItem('favoritePets') || '[]');
    const favoriteIndex = favorites.indexOf(petId);
    
    if (favoriteIndex > -1) {
        favorites.splice(favoriteIndex, 1);
        showSuccessMessage('Removed from favorites');
    } else {
        favorites.push(petId);
        showSuccessMessage('Added to favorites');
    }
    
    localStorage.setItem('favoritePets', JSON.stringify(favorites));
    updateFavoriteButtons(favorites);
}

function updateFavoriteButtons(favorites) {
    document.querySelectorAll('.favorite-btn').forEach(button => {
        const petCard = button.closest('.pet-card');
        const petId = parseInt(petCard.getAttribute('data-pet-id'));
        const heartIcon = button.querySelector('.heart-icon');
        
        if (favorites.includes(petId)) {
            heartIcon.textContent = '♥';
            heartIcon.style.color = '#dc3545';
        } else {
            heartIcon.textContent = '♡';
            heartIcon.style.color = '#666';
        }
    });
}

function registerForActivity(activityId) {
    const activity = allActivities.find(a => a.id === activityId);
    if (!activity) return;

    if (!currentUser) {
        showLoginPrompt('Please log in to register for activities.');
        return;
    }

    if (activity.registered >= activity.capacity) {
        showErrorMessage('This activity is full. You can join the waitlist.');
        return;
    }

    // Simulate registration
    activity.registered++;
    
    // Save registration
    let registrations = JSON.parse(localStorage.getItem('activityRegistrations') || '[]');
    registrations.push({
        activityId: activityId,
        userId: currentUser.id,
        registeredAt: new Date(),
        status: 'confirmed'
    });
    localStorage.setItem('activityRegistrations', JSON.stringify(registrations));
    
    // Update UI
    const activityCard = document.querySelector(`[data-activity-id="${activityId}"]`);
    if (activityCard) {
        const spotsInfo = activityCard.querySelector('.spots-info');
        const capacityFill = activityCard.querySelector('.capacity-fill');
        const button = activityCard.querySelector('.btn');
        
        const spotsLeft = activity.capacity - activity.registered;
        spotsInfo.textContent = `${spotsLeft} spots remaining`;
        capacityFill.style.width = `${(activity.registered / activity.capacity) * 100}%`;
        
        if (spotsLeft <= 0) {
            button.textContent = 'Full';
            button.disabled = true;
            button.classList.add('btn-disabled');
        }
    }
    
    showSuccessMessage(`Successfully registered for ${activity.title}!`);
}

// Utility Functions
function createModal(content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()" aria-label="Close modal">&times;</button>
            ${content}
        </div>
    `;
    return modal;
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function showLoginPrompt(message) {
    const modal = createModal(`
        <div class="login-prompt">
            <h2>Login Required</h2>
            <p>${message}</p>
            <div class="modal-actions">
                <a href="login.html" class="btn">Login</a>
                <a href="register.html" class="btn btn-outline">Sign Up</a>
                <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            </div>
        </div>
    `);
    document.body.appendChild(modal);
}

function showErrorMessage(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'info' ? '#17a2b8' : '#28a745'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 500;
        max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function updatePetStats() {
    const totalPets = allPets.length;
    const availablePets = allPets.filter(pet => pet.availableDate <= new Date()).length;
    
    // Update any stats displays on the page
    const statsElements = document.querySelectorAll('.pet-stats');
    statsElements.forEach(element => {
        element.innerHTML = `
            <span class="stat-item">Total Pets: ${totalPets}</span>
            <span class="stat-item">Available Now: ${availablePets}</span>
        `;
    });
}

function updateAdoptionButtonState(petId, state) {
    const petCard = document.querySelector(`[data-pet-id="${petId}"]`);
    if (!petCard) return;
    
    const button = petCard.querySelector('.adopt-btn');
    const statusBadge = petCard.querySelector('.status-badge');
    
    // Remove all state classes
    button.classList.remove('btn-pending', 'btn-scheduled', 'btn-disabled');
    button.disabled = false;
    
    switch(state) {
        case 'application-pending':
            button.textContent = 'Application Pending';
            button.disabled = true;
            button.classList.add('btn-pending');
            if (statusBadge) {
                statusBadge.textContent = 'Application Pending';
                statusBadge.className = 'status-badge application-pending';
            }
            break;
        case 'visit-scheduled':
            button.textContent = 'Visit Scheduled';
            button.disabled = true;
            button.classList.add('btn-scheduled');
            if (statusBadge) {
                statusBadge.textContent = 'Visit Scheduled';
                statusBadge.className = 'status-badge visit-scheduled';
            }
            break;
        case 'adopted':
            button.textContent = 'Adopted!';
            button.disabled = true;
            button.classList.add('btn-disabled');
            if (statusBadge) {
                statusBadge.textContent = 'Adopted';
                statusBadge.className = 'status-badge adopted';
            }
            break;
        case 'reserved':
            button.textContent = 'Reserved';
            button.disabled = true;
            button.classList.add('btn-disabled');
            if (statusBadge) {
                statusBadge.textContent = 'Reserved';
                statusBadge.className = 'status-badge reserved';
            }
            break;
        default:
            button.textContent = 'Adopt Me!';
            if (statusBadge) {
                statusBadge.textContent = 'Available';
                statusBadge.className = 'status-badge available';
            }
    }
}

function checkAdoptionStatus() {
    // Check and update adoption button states based on stored data
    const adoptionQueue = JSON.parse(localStorage.getItem('adoptionQueue') || '[]');
    const scheduledVisits = JSON.parse(localStorage.getItem('scheduledVisits') || '[]');
    
    adoptionQueue.forEach(adoption => {
        updateAdoptionButtonState(adoption.petId, adoption.status);
    });
    
    scheduledVisits.forEach(visit => {
        if (visit.status === 'confirmed') {
            updateAdoptionButtonState(visit.petId, 'visit-scheduled');
        }
    });
}

function viewMyApplications() {
    closeModal();
    
    const adoptionQueue = JSON.parse(localStorage.getItem('adoptionQueue') || '[]');
    const userApplications = adoptionQueue.filter(app => app.userId === currentUser.id);
    
    if (userApplications.length === 0) {
        showInfoMessage('You haven\'t started any adoption applications yet. Browse our pets to get started!');
        return;
    }
    
    const applicationsHTML = userApplications.map(app => {
        const pet = allPets.find(p => p.id === app.petId);
        return `
            <div class="application-item">
                <div class="app-pet-info">
                    <img src="${pet?.image || 'images/placeholder.jpg'}" alt="${app.petName}" width="60" height="60" style="border-radius: 8px; object-fit: cover;">
                    <div>
                        <h4>${app.petName}</h4>
                        <p>Status: <strong>${app.status.replace('-', ' ').toUpperCase()}</strong></p>
                        <p>Started: ${new Date(app.startDate).toLocaleDateString()}</p>
                    </div>
                </div>
                <button class="btn btn-small" onclick="continueApplication(${app.petId})">Continue</button>
            </div>
        `;
    }).join('');
    
    const modal = createModal(`
        <div class="applications-modal">
            <h2>My Adoption Applications</h2>
            <div class="applications-list">
                ${applicationsHTML}
            </div>
            <div class="modal-actions">
                <button class="btn btn-outline" onclick="closeModal()">Close</button>
            </div>
        </div>
    `);
    
    document.body.appendChild(modal);
}

function viewMyFavorites() {
    closeModal();
    
    const favorites = JSON.parse(localStorage.getItem('favoritePets') || '[]');
    const favoritePets = allPets.filter(pet => favorites.includes(pet.id));
    
    if (favoritePets.length === 0) {
        showInfoMessage('You haven\'t added any pets to your favorites yet. Click the heart icon on pet cards to add them!');
        return;
    }
    
    const favoritesHTML = favoritePets.map(pet => `
        <div class="favorite-item">
            <img src="${pet.image}" alt="${pet.name}" width="80" height="80" style="border-radius: 8px; object-fit: cover;">
            <div class="favorite-info">
                <h4>${pet.name}</h4>
                <p>${pet.breed} • ${pet.age}</p>
                <p class="adoption-fee">$${pet.adoptionFee}</p>
            </div>
            <div class="favorite-actions">
                <button class="btn btn-small" onclick="initiateAdoption(${pet.id}); closeModal();">Adopt</button>
                <button class="btn btn-outline btn-small" onclick="toggleFavorite(${pet.id}); viewMyFavorites();">Remove</button>
            </div>
        </div>
    `).join('');
    
    const modal = createModal(`
        <div class="favorites-modal">
            <h2>My Favorite Pets ❤️</h2>
            <div class="favorites-list">
                ${favoritesHTML}
            </div>
            <div class="modal-actions">
                <button class="btn btn-outline" onclick="closeModal()">Close</button>
            </div>
        </div>
    `);
    
    document.body.appendChild(modal);
}

function continueApplication(petId) {
    closeModal();
    initiateAdoption(petId);
}

function showInfoMessage(message) {
    showNotification(message, 'info');
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'info' ? '#17a2b8' : '#28a745'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 500;
        max-width: 350px;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Enhanced Adoption Button Management
function checkAdoptionStatus() {
    // Check and update adoption button states based on stored data
    const adoptionQueue = JSON.parse(localStorage.getItem('adoptionQueue') || '[]');
    const scheduledVisits = JSON.parse(localStorage.getItem('scheduledVisits') || '[]');
    
    adoptionQueue.forEach(adoption => {
        updateAdoptionButtonState(adoption.petId, adoption.status);
    });
    
    scheduledVisits.forEach(visit => {
        if (visit.status === 'confirmed') {
            updateAdoptionButtonState(visit.petId, 'visit-scheduled');
        }
    });
}

function viewMyApplications() {
    closeModal();
    
    const adoptionQueue = JSON.parse(localStorage.getItem('adoptionQueue') || '[]');
    const userApplications = adoptionQueue.filter(app => app.userId === currentUser.id);
    
    if (userApplications.length === 0) {
        showInfoMessage('You haven\'t started any adoption applications yet. Browse our pets to get started!');
        return;
    }
    
    const applicationsHTML = userApplications.map(app => {
        const pet = allPets.find(p => p.id === app.petId);
        return `
            <div class="application-item" style="display: flex; align-items: center; gap: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px;">
                <img src="${pet?.image || 'images/placeholder.jpg'}" alt="${app.petName}" width="60" height="60" style="border-radius: 8px; object-fit: cover;">
                <div style="flex-grow: 1;">
                    <h4 style="margin: 0 0 5px 0;">${app.petName}</h4>
                    <p style="margin: 0; color: #666;">Status: <strong>${app.status.replace('-', ' ').toUpperCase()}</strong></p>
                    <p style="margin: 0; color: #666;">Started: ${new Date(app.startDate).toLocaleDateString()}</p>
                </div>
                <button class="btn btn-small" onclick="continueApplication(${app.petId})">Continue</button>
            </div>
        `;
    }).join('');
    
    const modal = createModal(`
        <div class="applications-modal">
            <h2>My Adoption Applications</h2>
            <div class="applications-list">
                ${applicationsHTML}
            </div>
            <div class="modal-actions">
                <button class="btn btn-outline" onclick="closeModal()">Close</button>
            </div>
        </div>
    `);
    
    document.body.appendChild(modal);
}

function viewMyFavorites() {
    closeModal();
    
    const favorites = JSON.parse(localStorage.getItem('favoritePets') || '[]');
    const favoritePets = allPets.filter(pet => favorites.includes(pet.id));
    
    if (favoritePets.length === 0) {
        showInfoMessage('You haven\'t added any pets to your favorites yet. Click the heart icon on pet cards to add them!');
        return;
    }
    
    const favoritesHTML = favoritePets.map(pet => `
        <div class="favorite-item" style="display: flex; align-items: center; gap: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px;">
            <img src="${pet.image}" alt="${pet.name}" width="80" height="80" style="border-radius: 8px; object-fit: cover;">
            <div class="favorite-info" style="flex-grow: 1;">
                <h4 style="margin: 0 0 5px 0;">${pet.name}</h4>
                <p style="margin: 0; color: #666;">${pet.breed} • ${pet.age}</p>
                <p class="adoption-fee" style="margin: 5px 0 0 0; font-weight: bold; color: var(--secondary-color);">$${pet.adoptionFee}</p>
            </div>
            <div class="favorite-actions" style="display: flex; gap: 8px; flex-direction: column;">
                <button class="btn btn-small" onclick="initiateAdoption(${pet.id}); closeModal();">Adopt</button>
                <button class="btn btn-outline btn-small" onclick="toggleFavorite(${pet.id}); viewMyFavorites();">Remove</button>
            </div>
        </div>
    `).join('');
    
    const modal = createModal(`
        <div class="favorites-modal">
            <h2>My Favorite Pets ❤️</h2>
            <div class="favorites-list">
                ${favoritesHTML}
            </div>
            <div class="modal-actions">
                <button class="btn btn-outline" onclick="closeModal()">Close</button>
            </div>
        </div>
    `);
    
    document.body.appendChild(modal);
}

function continueApplication(petId) {
    closeModal();
    initiateAdoption(petId);
}

function showInfoMessage(message) {
    showNotification(message, 'info');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('favoritePets');
    localStorage.removeItem('adoptionQueue');
    localStorage.removeItem('scheduledVisits');
    localStorage.removeItem('activityRegistrations');
    
    showSuccessMessage('Logged out successfully!');
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

// Form submission handlers for social login buttons
document.addEventListener('click', function(e) {
    if (e.target.matches('.google-login') || e.target.closest('.google-login')) {
        e.preventDefault();
        simulateSocialLogin('Google');
    }
    
    if (e.target.matches('.facebook-login') || e.target.closest('.facebook-login')) {
        e.preventDefault();
        simulateSocialLogin('Facebook');
    }
});

function simulateSocialLogin(provider) {
    showSuccessMessage(`${provider} login integration would be implemented here`);
}