// =====================================
// FIXED VERSION - History Dashboard Renderer
// File: render_dashboard_history_ui.js
// =====================================

import { downloadReport2 } from "./download_button_ui.js";
import { 
  getHistoryData, 
  updateVersionName, 
  fetchOneHistoryRecord
} from "../api/dashboard_history_api.js";

// Import the modular components
import { ChartRecommendationManager, HistoryListRenderer, EditableTitleRenderer } from "./chart_modules.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Get the main view containers
  const dashboardMainView = document.getElementById("dashboard-main-view");
  const dashboardHistoryView = document.getElementById("dashboard-history-view");
  const mainView = document.getElementById("main-view");

  // Current state variables
  let currentHistoryId = null;
  let currentHistoryData = null;

  // Initialize modular components
  const chartManager = new ChartRecommendationManager({
    canvasId: 'historyTrafficChart',
    recommendationId: 'historyChartInsight'
  });

  const historyListRenderer = new HistoryListRenderer({
    onItemClick: onHistoryItemClick,
    onOptionsClick: showOptionsMenu,
    containerSelector: '.space-y-2'
  });

  const editableTitleRenderer = new EditableTitleRenderer({
    onSave: updateVersionName
  });

  // Function to toggle visibility
  function toggleView(activeViewId) {
    dashboardMainView.classList.remove("active");
    dashboardHistoryView.classList.remove("active");
    dashboardMainView.style.display = "none";
    dashboardHistoryView.style.display = "none";

    const activeView = document.getElementById(activeViewId);
    activeView.style.display = "block";
    activeView.classList.add("active");
  }

  // Event delegation for download functionality
  mainView.addEventListener("click", async (e) => {
    const downloadBtn = e.target.closest(".download-btn");
    const closeModalBtn = e.target.closest(".close-modal");
    const downloadOption = e.target.closest(".download-option");
    
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
    await renderHistoryList();
    await renderHistoryPreview();
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
    try {
      const historyData = await getHistoryData();
      
      if (!historyData || historyData.length === 0) {
        const container = document.querySelector("#dashboard-history-view aside .space-y-2");
        if (container) {
          container.innerHTML = '<div class="text-gray-400 p-3">No history data available</div>';
        }
        return;
      }

      // Use the modular history list renderer
      historyListRenderer.render('dashboard-history-view', historyData, { selectedIndex: 0 });

    } catch (error) {
      console.error("Error rendering history list:", error);
      const container = document.querySelector("#dashboard-history-view aside .space-y-2");
      if (container) {
        container.innerHTML = '<div class="text-red-400 p-3">Error loading history data</div>';
      }
    }
  }

  // Function to render history preview
  async function renderHistoryPreview() {
    const previewTitle = document.querySelector("#dashboard-history-view .flex-1 h2");
    if (!previewTitle) {
      console.error("Preview title element not found");
      return;
    }

    try {
      const historyData = await getHistoryData();
      
      if (historyData && historyData.length > 0) {
        const firstItem = historyData[0];
        await loadHistoryPreview(firstItem.id, firstItem.version_name, previewTitle);
      } else {
        previewTitle.textContent = "History Preview - No Data";
        previewTitle.removeAttribute("data-history-id");
      }
    } catch (error) {
      console.error("Error rendering preview:", error);
      previewTitle.textContent = "Error loading preview";
    }
  }

  // Load specific history preview
  async function loadHistoryPreview(historyId, versionName, titleElement) {
    try {
      // Update title
      titleElement.textContent = versionName;
      titleElement.setAttribute("data-history-id", historyId);
      currentHistoryId = historyId;

      // Setup editable title using modular component
      editableTitleRenderer.setupDoubleClick(titleElement, historyId);

      // Load full history data
      currentHistoryData = await fetchOneHistoryRecord(historyId);

      // Render everything
      await renderHistoryContent();

    } catch (error) {
      console.error("Error loading history preview:", error);
      titleElement.textContent = `Error loading: ${versionName}`;
    }
  }

  // Render all history content (summary, charts, recommendations)
  async function renderHistoryContent() {
    if (!currentHistoryData) {
      console.error("No current history data available");
      return;
    }

    try {
      const { prediction_summary, prediction_detail, ai_recommendation } = currentHistoryData;

      // Update request date display with proper formatting
      const requestDateDisplay = document.getElementById('history-request-date-display');
      if (requestDateDisplay && currentHistoryData.created_at) {
        const formattedDate = formatDisplayDate(currentHistoryData.created_at);
        requestDateDisplay.textContent = `Request Date: ${formattedDate}`;
      }

      // Render prediction summary (numbers)
      renderPredictionSummary(prediction_summary);
      // Render AI recommendation summary
      renderRecommendationSummary(ai_recommendation);

      // Check if prediction_detail exists and has data
      if (!prediction_detail || Object.keys(prediction_detail).length === 0) {
        console.error("No prediction detail data available");
        displayNoChartData();
        return;
      }

      // Check if Chart.js is available globally
      if (typeof Chart === 'undefined') {
        console.error("Chart.js is not loaded. Make sure the script tag is included.");
        displayChartJsError();
        return;
      }

      // Render chart and recommendation with default period (hourly)
      await chartManager.renderBoth('hourly', 'line', prediction_detail, ai_recommendation);

      // Setup chart controls
      setupHistoryChartControls();

    } catch (error) {
      console.error("Error rendering history content:", error);
      displayError();
    }
  }

  // Render prediction summary (numerical values)
  function renderPredictionSummary(summaryData) {
    if (!summaryData) {
      console.warn("No prediction summary data available");
      return;
    }

    // Update the summary cards with proper number formatting and analytics
    const todayElement = document.getElementById('historyTodayPrediction');
    const weekElement = document.getElementById('historyWeekPrediction');
    const monthElement = document.getElementById('historyMonthPrediction');

    // Update Today card
    if (todayElement) {
      const todayValue = summaryData.vhcl_today_sum || 0;
      todayElement.textContent = todayValue.toLocaleString();
      
      // Update peak time if available
      const peakTimeElement = todayElement.parentElement.querySelector('.text-accent2\\/80');
      if (peakTimeElement && summaryData.today_analytics?.peak?.time) {
        const peakTime = formatTime(summaryData.today_analytics.peak.time);
        peakTimeElement.textContent = `Peak at ${peakTime}`;
      }
    }

    // Update Week card
    if (weekElement) {
      const weekValue = summaryData.vhcl_current_week_sum || 0;
      weekElement.textContent = weekValue.toLocaleString();
      
      // Update peak day if available
      const peakDayElement = weekElement.parentElement.querySelector('.text-accent2\\/80');
      if (peakDayElement && summaryData.weekly_analytics?.peak?.date) {
        const peakDate = new Date(summaryData.weekly_analytics.peak.date);
        const dayName = peakDate.toLocaleDateString('en-US', { weekday: 'long' });
        peakDayElement.textContent = `Peak on ${dayName}`;
      }
    }

    // Update 3 Months card
    if (monthElement) {
      const monthValue = summaryData.vhcl_three_months_sum || 0;
      monthElement.textContent = monthValue.toLocaleString();
      
      // Update average info
      const avgElement = monthElement.parentElement.querySelector('.text-accent2\\/80');
      if (avgElement && summaryData.three_months_analytics?.avg) {
        const avgValue = summaryData.three_months_analytics.avg;
        avgElement.textContent = `Avg ${avgValue.toLocaleString()} vehicles/month`;
      }
    }
  }

  // Helper function to format time from various formats
  function formatTime(timeString) {
    if (!timeString) return 'Unknown';
    
    try {
      // Handle different time formats
      let time;
      if (timeString.includes('T')) {
        // ISO format: "2025-08-23T07:00:00"
        time = new Date(timeString);
      } else if (timeString.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
        // Time only format: "07:00" or "07:00:00"
        time = new Date(`2000-01-01T${timeString}`);
      } else {
        // Try parsing as is
        time = new Date(timeString);
      }
      
      if (isNaN(time.getTime())) {
        return timeString; // Return original if parsing failed
      }
      
      // Format to local time string
      return time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  }

  // Render recommendation summary
  function renderRecommendationSummary(recommendationData) {
    const summaryContainer = document.getElementById('historyAiRecommendation');
    if (!summaryContainer) return;

    const summaryText = recommendationData?.summary_reco;
    if (summaryText) {
      // Format the text with proper line breaks and structure
      const formattedText = formatAIRecommendation(summaryText);
      summaryContainer.innerHTML = `<div class="text-sm text-accent2">${formattedText}</div>`;
    } else {
      summaryContainer.innerHTML = `
        <div class="text-yellow-400">
          <i class="fas fa-info-circle mr-2"></i>
          No summary recommendation available
        </div>
      `;
    }
  }

  // Format AI recommendation text for better readability
  function formatAIRecommendation(text) {
    if (!text) return '';
    
    // Split by periods followed by numbers (like "1. ", "2. ", etc.) to identify numbered lists
    let formatted = text
      .replace(/(\d+\.\s)/g, '<br><strong>$1</strong>')  // Add line breaks before numbered items and bold them
      .replace(/([A-Z][^.!?]*[.!?])/g, '$1<br>')        // Add line breaks after sentences
      .replace(/\s*<br>\s*<br>\s*/g, '<br>')            // Remove duplicate line breaks
      .replace(/^\s*<br>/, '')                          // Remove line break at the start
      .replace(/<br>\s*$/, '')                          // Remove line break at the end
      .trim();
    
    // Clean up and improve formatting
    formatted = formatted
      .replace(/Peak Period \((.*?)\):/g, '<br><strong>Peak Period ($1):</strong>')
      .replace(/Lowest Traffic Volume \((.*?)\):/g, '<br><strong>Lowest Traffic Volume ($1):</strong>')
      .replace(/Average Traffic Volume \((.*?)\):/g, '<br><strong>Average Traffic Volume ($1):</strong>')
      .replace(/^\s*<br>/, ''); // Remove initial line break
    
    return formatted;
  }

  // Display no chart data message
  function displayNoChartData() {
    const canvas = document.getElementById('historyTrafficChart');
    const container = document.getElementById('historyChartInsight');
    
    if (canvas && canvas.parentElement) {
      canvas.parentElement.innerHTML = `
        <div class="flex items-center justify-center h-full text-gray-400">
          <i class="fas fa-chart-line mr-2"></i>
          No chart data available
        </div>
      `;
    }
    
    if (container) {
      container.innerHTML = `
        <div class="text-yellow-400">
          <i class="fas fa-info-circle mr-2"></i>
          No detailed recommendations available
        </div>
      `;
    }
  }

  // Display Chart.js error message
  function displayChartJsError() {
    const canvas = document.getElementById('historyTrafficChart');
    if (canvas && canvas.parentElement) {
      canvas.parentElement.innerHTML = `
        <div class="flex items-center justify-center h-full text-red-400">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          Chart.js not loaded. Please check the script tag.
        </div>
      `;
    }
  }

  // Display error message
  function displayError() {
    const canvas = document.getElementById('historyTrafficChart');
    const container = document.getElementById('historyChartInsight');
    
    if (canvas && canvas.parentElement) {
      canvas.parentElement.innerHTML = `
        <div class="flex items-center justify-center h-full text-red-400">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          Error loading chart data
        </div>
      `;
    }
    
    if (container) {
      container.innerHTML = `
        <div class="text-red-400">
          <i class="fas fa-exclamation-circle mr-2"></i>
          Error loading recommendations
        </div>
      `;
    }
  }

  // Setup chart controls for history view
  function setupHistoryChartControls() {
    // Remove existing event listeners first to avoid duplicates
    document.querySelectorAll('.history-chart-type').forEach(button => {
      button.replaceWith(button.cloneNode(true));
    });

    document.querySelectorAll('.history-time-tab').forEach(tab => {
      tab.replaceWith(tab.cloneNode(true));
    });

    // Chart type controls
    document.querySelectorAll('.history-chart-type').forEach(button => {
      button.addEventListener('click', async (e) => {
        const chartType = e.target.dataset.type;
        
        // Update active styling
        chartManager.updateActiveTab(e.target, 'history-chart-type');
        
        // Re-render chart with new type
        if (currentHistoryData && currentHistoryData.prediction_detail) {
          await chartManager.switchChartType(chartType);
        }
      });
    });

    // Period controls
    document.querySelectorAll('.history-time-tab').forEach(tab => {
      tab.addEventListener('click', async (e) => {
        const period = e.target.dataset.period;
        
        // Update active styling
        chartManager.updateActiveTab(e.target, 'history-time-tab');
        
        // Re-render chart and recommendation
        if (currentHistoryData) {
          await chartManager.switchPeriod(period);
        }
      });
    });
  }

  // Handle history item clicks
  async function onHistoryItemClick(item, itemElement) {
    // Update selected styling
    document.querySelectorAll('[data-metadata-id]').forEach(el => {
      el.className = el.className.replace(/bg-white\/\d+|border-l-\d+|border-cyan-\d+|glow-on-hover/g, '').trim();
      el.classList.add('hover:bg-white/5', 'animate-[fadeUp_0.3s_ease-out]');
    });

    itemElement.classList.add('bg-white/5', 'hover:bg-white/10', 'glow-on-hover', 'border-l-4', 'border-cyan-400');

    // Load this history item's preview
    const previewTitle = document.querySelector("#dashboard-history-view .flex-1 h2");
    if (previewTitle) {
      await loadHistoryPreview(item.id, item.version_name, previewTitle);
    }
  }

  // Show options menu
  function showOptionsMenu(id, historyItem) {
    const menu = document.createElement("div");
    menu.className = "absolute bg-gray-800 border border-gray-700 rounded shadow-lg p-2 z-10";
    
    const optionsDot = historyItem.querySelector(".options-dot");
    const dotRect = optionsDot.getBoundingClientRect();
    
    menu.style.top = `${dotRect.bottom + window.scrollY}px`;
    menu.style.right = `${window.innerWidth - dotRect.right}px`;
    
    menu.innerHTML = `
      <button class="menu-update-btn w-full text-left text-white hover:bg-gray-700 p-1 rounded" 
              data-id="${id}">
        Update Version Name
      </button>
    `;
    
    document.body.appendChild(menu);

    const closeMenu = (e) => {
      if (!menu.contains(e.target) && e.target !== optionsDot) {
        document.body.removeChild(menu);
        document.removeEventListener("click", closeMenu);
      }
    };
    
    setTimeout(() => {
      document.addEventListener("click", closeMenu);
    }, 100);

    // Handle menu button click
    menu.querySelector('.menu-update-btn').addEventListener('click', () => {
      const titleElement = document.querySelector("#dashboard-history-view .flex-1 h2");
      if (titleElement) {
        editableTitleRenderer.makeEditable(titleElement, id);
      }
      document.body.removeChild(menu);
      document.removeEventListener("click", closeMenu);
    });
  }

  // Helper function for week number
  function getWeekNumber(date) {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    return Math.ceil((((date - firstDay) / 86400000) + firstDay.getDay() + 1) / 7);
  }

  // Helper function to format display dates
  function formatDisplayDate(dateString) {
    if (!dateString) return 'Unknown Date';
    
    try {
      // Handle different date formats
      let date;
      if (dateString.includes('T')) {
        // ISO format: "2025-08-25T00:00:00" or similar
        date = new Date(dateString);
      } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Simple format: "2025-08-25"
        date = new Date(dateString + 'T00:00:00');
      } else {
        // Try parsing as is
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original if parsing failed
      }
      
      // Format to local date string
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'local'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original if error occurred
    }
  }

  // Update list item name when title is changed
  editableTitleRenderer.onSave = async (id, newName) => {
    try {
      const response = await updateVersionName(id, newName);
      const finalText = response?.version_name || newName;
      
      // Update the list item
      historyListRenderer.updateItemName(id, finalText);
      
      return response;
    } catch (error) {
      console.error("Error updating version name:", error);
      throw error;
    }
  };

  // Initial render when the page loads
  await renderHistoryList();
  await renderHistoryPreview();

  // Add CSS for height increase and history-specific elements
  const style = document.createElement("style");
  style.textContent = `
    #dashboard-history-view aside {
      height: calc(100vh - 64px);
    }
    .chart-container {
      position: relative;
      height: 300px;
    }
    .history-chart-container {
      position: relative;
      height: 300px;
    }
  `;
  document.head.appendChild(style);
});