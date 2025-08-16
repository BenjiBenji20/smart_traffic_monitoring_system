import { showNotification } from "../ui/sign_in_sign_up_ui.js";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("sign-up-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get the submit button and disable it during submission
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = `<span class="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Processing...`;

    // collects form data
    const formData = {
      username: document.getElementById("username").value.trim(),
      password: document.getElementById("password").value.trim(),
      role: document.getElementById("role").value.trim(),
      complete_name: document.getElementById("complete_name").value.trim(),
      complete_address: document.getElementById("complete_address").value.trim(),
      age: document.getElementById("age").value || 0
    };

    try {
      const response = await fetch("http://localhost:8000/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.status !== 200) {
        showNotification(`Cannot register the user: ${data.message || data}`, 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
      }

      showNotification(`${data.complete_name}, you are successfully registered as ${data.role}`, 'success');
      setTimeout(() => {
        window.location.href = "sign_up_sign_in_page.html";
      }, 2000);
    } catch (error) {
      console.error("Error sending request", error);
      showNotification('Network error. Please try again.', 'error');
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
});
