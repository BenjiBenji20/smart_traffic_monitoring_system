import { showNotification } from "../ui/sign_in_sign_up_ui.js";
import { setTokens } from "./token_manager_api.js";

document.addEventListener("DOMContentLoaded", () => {
  const signUpForm = document.getElementById("sign-up-form");
  if (!signUpForm) return;

  // SIGN UP FETCH
  signUpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get the submit button and disable it during submission
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = `
      <span class="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      Processing...
    `;

    try {
      // Get fresh form data
      const formData = {
        username: document.getElementById("username").value.trim(),
        password: document.getElementById("password").value.trim(),
        role: document.getElementById("role").value.trim(),
        complete_name: document.getElementById("complete_name").value.trim(),
        complete_address: document.getElementById("complete_address").value.trim(),
        age: document.getElementById("age").value || 0
      };

      const response = await fetch("http://localhost:8000/api/user/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle structured FastAPI error response
        const errorMessage = data?.error?.detail || (typeof data === 'string' ? data : 'Unknown error');
        const errorCode = data?.error?.error_code || 'UNKNOWN_ERROR';

        showNotification(
          typeof errorNotifFn === 'function' 
            ? errorNotifFn({ message: errorMessage, code: errorCode, data })
            : `${errorNotifFn} (Code: ${errorCode})`,
          'error'
        );
        setTimeout(() => {
          window.location.href = "sign_up_sign_in_page.html";
        }, 2000);

        return
      }

      // Success case
      showNotification(
        `${data.complete_name}, you are successfully registered as ${data.role}`,
        'success'
      );

      setTimeout(() => {
        window.location.href = "sign_up_sign_in_page.html";
      }, 2000);

    } catch (error) {
      console.error("Error sending request", error);
      showNotification(
        `Connection problem: ${error.message || 'Please check your network'}`,
        'error'
      );
    }
  });

  // SIGN IN FETCH
  const signInForm = document.getElementById("sign-in-form");
  if (!signInForm) return;

  signInForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = `
      <span class="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Signing in...`;

    try {
      const formData = new URLSearchParams();
      formData.append('username', document.getElementById("signin-username").value.trim());
      formData.append('password', document.getElementById("signin-password").value.trim());

      const response = await fetch("http://localhost:8000/api/user/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include", 
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.error?.detail || 'Invalid credentials';
        const errorCode = data?.error?.error_code || 'AUTH_FAILED';
        
        showNotification(
          `Sign-in failed: ${errorMessage} (${errorCode})`,
          'error'
        );
        setTimeout(() => {
          window.location.href = "sign_up_sign_in_page.html";
        }, 2000);

        return
      }

      showNotification("Sign-in successful. Redirecting...", 'success');
      
      // validate token
      if (!data.access_token || !data.refresh_token) {
        throw new Error("Authentication failed - no tokens received");
      }

      // store access and refresh token in memory
      setTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token
      });

      setTimeout(() => {
        window.location.href = "admin_dashboard_page.html";  
      }, 1500);

    } catch (error) {
        console.error("Sign-in error:", error);
        showNotification(
          `Connection problem: ${error.message || 'Please check your network'}`,
          'error'
        );
      }
  });
});

