import { downloadReport2 } from "./download_button_ui.js";
import { getHistoryData, updateVersionName } from "../api/dashboard_history_api.js"

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

  
  // Function to render history list dynamically
  async function renderHistoryList() {
    const historyListContainer = document.querySelector("#dashboard-history-view aside .space-y-2");
    if (!historyListContainer) return;

    const historyData = await getHistoryData();
    historyListContainer.innerHTML = ""; // Clear existing items

    historyData.forEach((item, index) => {
      const historyItem = document.createElement("div");
      historyItem.className = `rounded-lg px-3 py-2 cursor-pointer transition ${
        index === 0 ? "bg-white/5 hover:bg-white/10 glow-on-hover border-l-4 border-cyan-400 animate-[fadeUp_0.3s_ease-out]" : "hover:bg-white/5 animate-[fadeUp_0.3s_ease-out]"
      }`;
      historyItem.setAttribute("data-metadata-id", item.id); // Attach metadata-id
     historyItem.innerHTML = `
        <div class="flex items-center justify-between w-full">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-white truncate">${item.version_name}</p>
            <p class="text-xs font-semibold text-gray-400 mt-2">${item.created_at}</p>
          </div>
          <span class="options-dot ml-2 text-gray-400 hover:text-white cursor-pointer flex-shrink-0">⋮</span>
        </div>
      `;

      historyItem.querySelector(".options-dot").addEventListener("click", (e) => {
        e.stopPropagation();
        showOptionsMenu(item.id, historyItem);
      });
      historyListContainer.appendChild(historyItem);
    });
  }

  // Function to render history preview
  async function renderHistoryPreview() {
    const previewTitle = document.querySelector("#dashboard-history-view .flex-1 h2");
    if (!previewTitle) return;

    try {
      const historyData = await getHistoryData();
      
      if (historyData && historyData.length > 0) {
        const firstItem = historyData[0];
        previewTitle.textContent = firstItem.version_name;
        previewTitle.setAttribute("data-history-id", firstItem.id);
        
        // Clean up and re-add event listener
        const newTitle = previewTitle.cloneNode(true);
        previewTitle.parentNode.replaceChild(newTitle, previewTitle);
        newTitle.addEventListener("dblclick", handleTitleDoubleClick);
      } else {
        previewTitle.textContent = "History Preview - No Data";
        previewTitle.removeAttribute("data-history-id");
      }
    } catch (error) {
      console.error("Error rendering preview:", error);
      previewTitle.textContent = "Error loading preview";
    }
  }

  // Separate function for double click handling
  function handleTitleDoubleClick() {
    const id = this.getAttribute("data-history-id");
    if (id) {
      makePreviewTitleEditable(this, id);
    }
  }

  // Function to make preview title editable
  function makePreviewTitleEditable(previewTitle, id) {
    const currentText = previewTitle.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentText;
    input.className = "bg-gray-800 text-white border border-cyan-400 rounded p-1 focus:outline-none";
    previewTitle.innerHTML = "";
    previewTitle.appendChild(input);

    input.focus();
    input.addEventListener("blur", () => saveVersionName(id, input.value, previewTitle));
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") saveVersionName(id, input.value, previewTitle);
    });
  }

  // Function to save updated version name
  async function saveVersionName(id, newVersionName, previewTitle) {
    try {
      const response = await updateVersionName(id, newVersionName);
      if (response && response.version_name) {
        // Update the text content without removing the element
        previewTitle.textContent = response.version_name;
        
        // Re-add the double click listener
        previewTitle.addEventListener("dblclick", () => {
          makePreviewTitleEditable(previewTitle, id);
        });
        
        // Also update the corresponding item in the list
        updateHistoryListItem(id, response.version_name);
      }
    } catch (error) {
      console.error("Error updating version name:", error);
      // Revert to the new name (what user typed)
      previewTitle.textContent = newVersionName;
      previewTitle.addEventListener("dblclick", () => {
        makePreviewTitleEditable(previewTitle, id);
      });
    }
  }

  // Helper function to update list item
  function updateHistoryListItem(id, newName) {
    const listItem = document.querySelector(`[data-metadata-id="${id}"]`);
    if (listItem) {
      const titleElement = listItem.querySelector(".text-white");
      if (titleElement) {
        titleElement.textContent = newName;
      }
    }
  }

  // Function to show options menu
  function showOptionsMenu(id, historyItem) {
    const menu = document.createElement("div");
    menu.className = "absolute bg-gray-800 border border-gray-700 rounded shadow-lg p-2 z-10";
    
    // Get the position of the options dot
    const optionsDot = historyItem.querySelector(".options-dot");
    const dotRect = optionsDot.getBoundingClientRect();
    
    // Position the menu relative to the options dot
    menu.style.top = `${dotRect.bottom + window.scrollY}px`;
    menu.style.right = `${window.innerWidth - dotRect.right}px`; // Position from right edge
    
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("menu-update-btn")) {
        const id = e.target.getAttribute("data-id");
        updateVersionFromMenu(id);
      }
    });

    // Update the menu creation to use event delegation
    menu.innerHTML = `
      <button class="menu-update-btn w-full text-left text-white hover:bg-gray-700 p-1 rounded" 
              data-id="${id}">
        Update Version Name
      </button>
    `;
    
    document.body.appendChild(menu);

    // Remove menu when clicking outside
    const closeMenu = (e) => {
      if (!menu.contains(e.target) && e.target !== optionsDot) {
        document.body.removeChild(menu);
        document.removeEventListener("click", closeMenu);
      }
    };
    
    // Add a small delay to prevent immediate closing
    setTimeout(() => {
      document.addEventListener("click", closeMenu);
    }, 100);
  }

  // Global function for menu action
  window.updateVersionFromMenu = async (id) => {
    const previewTitle = document.querySelector("#dashboard-history-view .flex-1 h2");
    if (previewTitle) {
      makePreviewTitleEditable(previewTitle, id);
    }
  };

  // Initial render on page load
  await renderHistoryList();
  await renderHistoryPreview();

  // Event listener for History view (trigger re-render)
  document.getElementById("view-history").addEventListener("click", async () => {
    toggleView("dashboard-history-view");
    await renderHistoryList(); // Re-render list on view switch
    await renderHistoryPreview(); // Re-render preview on view switch
  });

  // Add CSS for slight height increase
  const style = document.createElement("style");
  style.textContent = `
    #dashboard-history-view aside {
      height: calc(100vh - 64px); /* Slight increase from top-16 (64px) */
    }
  `;
  document.head.appendChild(style);
});