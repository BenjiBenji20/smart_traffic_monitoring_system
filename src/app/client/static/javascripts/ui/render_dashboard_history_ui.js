import { downloadReport2 } from "./download_button_ui.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Get the main view containers
  const dashboardMainView = document.getElementById("dashboard-main-view");
  const dashboardHistoryView = document.getElementById("dashboard-history-view");
  const mainView = document.getElementById("main-view");

  // Function to toggle visibility
  function toggleView(activeViewId) {
    // Remove active class from both views
    dashboardMainView.classList.remove("active");
    dashboardHistoryView.classList.remove("active");

    // Hide both views
    dashboardMainView.style.display = "none";
    dashboardHistoryView.style.display = "none";

    // Show the selected view and add active class
    const activeView = document.getElementById(activeViewId);
    activeView.style.display = "block"; // or "flex" based on your layout
    activeView.classList.add("active");
  }

  // Event delegation on main-view for download functionality
  mainView.addEventListener("click", async (e) => {
     // Look for download buttons in BOTH views
    const downloadBtn = e.target.closest(".download-btn");
    const closeModalBtn = e.target.closest(".close-modal");
    const downloadOption = e.target.closest(".download-option");
    
    // Find the modal in the CURRENT visible view
    const activeView = document.querySelector("#dashboard-main-view.active, #dashboard-history-view.active");
    const modal = activeView ? activeView.querySelector(".download-modal") : null;

    if (downloadBtn) {
      e.preventDefault();
      if (modal) {
        modal.classList.add("show");
        document.body.style.overflow = "hidden";
      }
    } else if (closeModalBtn) {
      closeModal();
    } else if (modal && e.target === modal) {
      closeModal();
    } else if (downloadOption) {
      const format = downloadOption.dataset.format;
      if (downloadReport2) {
        await downloadReport2(format);
        closeModal();
      }
    }
  });

  // Update closeModal function to find modal in active view
  function closeModal() {
    const activeView = document.querySelector("#dashboard-main-view.active, #dashboard-history-view.active");
    const modal = activeView ? activeView.querySelector(".download-modal") : null;
    
    if (modal) {
      modal.classList.remove("show");
      document.body.style.overflow = "";
    }
  }

  // Event listener for History view
  document.getElementById("view-history").addEventListener("click", async () => {
    toggleView("dashboard-history-view");
  });

  // Event listener for Dashboard view
  document.getElementById("dashboardToggle").addEventListener("click", async () => {
    toggleView("dashboard-main-view");
  });

  // Initial state: Show dashboard view by default
  toggleView("dashboard-main-view");

  // Toggle submenu behavior for dashboard
  const dashboardToggle = document.getElementById("dashboardToggle");
  const dashboardSubmenu = document.getElementById("dashboardSubmenu");
  dashboardToggle.addEventListener("click", () => {
    dashboardSubmenu.classList.toggle("max-h-0");
    dashboardSubmenu.classList.toggle("max-h-[200px]");
    const chevron = dashboardToggle.querySelector("i");
    chevron.classList.toggle("rotate-180");
  });
});