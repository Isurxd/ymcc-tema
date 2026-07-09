import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";
import app from "./firebase";

export const auth = app ? getAuth(app) : null;
const googleProvider = new GoogleAuthProvider();

export const resetUserPassword = async (email) => {
  try {
    const response = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send password reset email');
    }
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const registerUser = async (email, password) => {
  if (!auth) return { user: null, error: "Firebase is not configured yet. Please add your API keys to .env.local" };
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  if (!auth) return { user: null, error: "Firebase is not configured yet." };
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const loginWithGoogle = async () => {
  if (!auth) return { user: null, error: "Firebase is not configured yet." };
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const logoutUser = async () => {
  if (!auth) return { success: false, error: "Firebase is not configured yet." };
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const subscribeToAuthChanges = (callback) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export const getFriendlyErrorMessage = (error) => {
  if (!error) return "";
  const message = typeof error === 'string' ? error : error.message || "";
  
  if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password") || message.includes("auth/user-not-found")) {
    return "Email atau password yang Anda masukkan salah. Silakan periksa kembali.";
  }
  if (message.includes("auth/invalid-email")) {
    return "Format email tidak valid. Pastikan email ditulis dengan benar.";
  }
  if (message.includes("auth/email-already-in-use")) {
    return "Email ini sudah terdaftar sebagai akun YMCC. Silakan langsung login atau gunakan email lain.";
  }
  if (message.includes("auth/weak-password")) {
    return "Password terlalu lemah. Gunakan minimal 8 karakter.";
  }
  if (message.includes("auth/popup-closed-by-user")) {
    return "Proses masuk dibatalkan karena jendela popup Google ditutup.";
  }
  if (message.includes("auth/too-many-requests")) {
    return "Terlalu banyak percobaan masuk yang gagal. Akun diblokir sementara demi keamanan. Silakan coba beberapa saat lagi.";
  }
  if (message.includes("auth/network-request-failed")) {
    return "Koneksi jaringan bermasalah. Pastikan perangkat Anda terhubung ke internet.";
  }
  
  return message.replace("Firebase: Error (", "").replace(").", "").trim();
};
