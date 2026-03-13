import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { auth } from './config.ts';

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * SIGNUP - Create a new user account
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User's full name
 * @returns {Promise<User>} Firebase user object
 */
export const signup = async (email: string, password: string, displayName: string): Promise<User> => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with display name
    await updateProfile(user, {
      displayName: displayName
    });

    console.log('✅ Signup successful:', user.email);
    return user;
  } catch (error: any) {
    console.error('❌ Signup error:', error.message);
    throw error; // Re-throw to handle in component
  }
};

/**
 * LOGIN - Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<User>} Firebase user object
 */
export const login = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Login successful:', userCredential.user.email);
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Login error:', error.message);
    throw error; // Re-throw to handle in component
  }
};

/**
 * LOGOUT - Sign out current user
 * @returns {Promise<void>}
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
    console.log('✅ Logout successful');
  } catch (error: any) {
    console.error('❌ Logout error:', error.message);
    throw error;
  }
};

/**
 * AUTH STATE OBSERVER
 * Listens for authentication state changes
 * @param {function} callback - Function to call when auth state changes
 * @returns {function} Unsubscribe function
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      console.log('✅ User authenticated:', user.email);
      callback(user);
    } else {
      console.log('❌ User logged out');
      callback(null);
    }
  });
};

/**
 * GET CURRENT USER
 * @returns {User | null} Current logged-in user or null
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * GOOGLE LOGIN - Sign in with Google
 * @returns {Promise<User>} Firebase user object
 */
export const loginWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    console.log('✅ Google login successful:', userCredential.user.email);
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Google login error:', error.message);
    throw error;
  }
};

/**
 * PHONE LOGIN - Sign in with phone number
 * @param {string} phoneNumber - User's phone number with country code (e.g., +91)
 * @param {string} containerId - HTML element ID for reCAPTCHA
 * @returns {Promise<ConfirmationResult>} Confirmation result for OTP verification
 */
// Keep a single reCAPTCHA instance to avoid "already rendered" errors
let recaptchaVerifierInstance: RecaptchaVerifier | null = null;

export const clearRecaptcha = () => {
  if (recaptchaVerifierInstance) {
    try { recaptchaVerifierInstance.clear(); } catch {}
    recaptchaVerifierInstance = null;
  }
  // Also clear the DOM container so Firebase can re-render it
  const el = document.getElementById('recaptcha-container');
  if (el) el.innerHTML = '';
};

export const loginWithPhone = async (phoneNumber: string, containerId: string): Promise<any> => {
  try {
    // Clear any existing reCAPTCHA before creating a new one
    clearRecaptcha();

    recaptchaVerifierInstance = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => { clearRecaptcha(); }
    });

    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierInstance);
    console.log('✅ Verification code sent to:', phoneNumber);
    return confirmationResult;
  } catch (error: any) {
    clearRecaptcha();
    console.error('❌ Phone login error:', error.message);
    throw error;
  }
};

/**
 * VERIFY OTP - Verify OTP from phone login
 * @param {any} confirmationResult - Confirmation result from loginWithPhone
 * @param {string} otp - OTP received on phone
 * @returns {Promise<User>} Firebase user object
 */
export const verifyOTP = async (confirmationResult: any, otp: string): Promise<User> => {
  try {
    const userCredential = await confirmationResult.confirm(otp);
    console.log('✅ Phone verification successful:', userCredential.user.phoneNumber);
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ OTP verification error:', error.message);
    throw error;
  }
};
