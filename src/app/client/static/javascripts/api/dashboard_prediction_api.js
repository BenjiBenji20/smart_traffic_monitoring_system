import { secureFetch, auto_logout } from "./token_manager_api.js";
import { showNotification } from "../ui/sign_in_sign_up_ui.js"

const USER_BASE_URL = "http://localhost:8000/api/dashboard/user";
const SERVER_ERROR = "Unexpected Error Occurred";

export async function getUserProfile() {
  try {
    const response = await secureFetch(`${USER_BASE_URL}/user-profile`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to fetch profile:", errorData);
      throw new Error(errorData.message || "Failed to load user profile");
    }

    return await response.json();
  } catch (error) {
    console.error(SERVER_ERROR, error);
    throw error; // Re-throw to let calling code handle it
  }
}


export async function requestSignOut() {
  try {
    const response = await secureFetch(`http://localhost:8000/api/user/sign-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Logout failed' }));
      throw new Error(error.message);
    }

    const data = await response.json();
    showNotification(data.message || "Signed out successfully", 'success');
    auto_logout();
    
  } catch (error) {
    console.error("Logout error:", error);
    showNotification(error.message || "Failed to sign out", 'error');
    // Still force logout even if API fails
    setTimeout(auto_logout, 1500);
  }
}


export async function getPredictionSummary() {
  try {
    const response = await secureFetch(`${USER_BASE_URL}/prediction-summary`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to fetch predictions:", errorData);
      throw new Error(errorData.message || "Failed to load prediction data");
    }

    return await response.json();
  } catch (error) {
    console.error(SERVER_ERROR, error);
    throw error;
  }
}


export async function getPredictionDetail() {
  try {
    const response = await secureFetch(`${USER_BASE_URL}/prediction-detail`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to fetch predictions:", errorData);
      throw new Error(errorData.message || "Failed to load prediction data");
    }

    return await response.json();
  } catch (error) {
    console.error(SERVER_ERROR, error);
    throw error;
  }
}

const DASHBOARD_BASE_URL = "http://localhost:8000/api/dashboard/user";
export async function getTrafficRecommendation() {
    try {
    const response = await secureFetch(`${DASHBOARD_BASE_URL}/admin-traffic-recommendations`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to fetch AI generated recommendation:", errorData);
      throw new Error(errorData.message || "Failed to fetch generated recommendation");
    }

    return await response.json();
  } catch (error) {
    console.error(SERVER_ERROR, error);
    throw error; // Re-throw to let calling code handle it
  }
}