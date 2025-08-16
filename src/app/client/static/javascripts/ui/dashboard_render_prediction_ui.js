import { getPredictionSummary, getUserProfile, 
        requestSignOut, getSummaryRecommendation 
} from "../api/dashboard_prediction_api.js";

// Render user profile
async function renderUserProfile() {
  try {
    const profile = await getUserProfile();
    
    // Update header
    document.getElementById('admin_name').textContent = profile.username;
    document.getElementById('userFullName').textContent = profile.complete_name;
    document.getElementById('userRole').textContent = profile.role.replace('_', ' ');
    
    // Add logout handler
    document.getElementById('logoutBtn').addEventListener('click', async () => {
    // Disable button during processing
    const btn = document.getElementById('logoutBtn');
    btn.disabled = true;
    btn.innerHTML = `
      <span class="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      Signing out...
    `;
    
    await requestSignOut();
    
    // Reset button if logout failed (unlikely since we force auto_logout)
    btn.disabled = false;
    btn.innerHTML = `
      <i class="fas fa-sign-out-alt mr-2"></i> Sign Out
    `;
  });
    
  } catch (error) {
    console.error("Failed to load profile:", error);
    // Fallback display
    document.getElementById('admin_name').textContent = "User";
  }
}


async function renderPredictionSummary() {
  try {
    const data = await getPredictionSummary();
    
    // Format numbers with commas
    const formatNumber = num => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    // Today's data
    document.getElementById('todayPrediction').textContent = formatNumber(data.vhcl_today_sum);
    document.querySelector('#traffic-summary .grid > div:nth-child(1) .text-sm').textContent = 
      `Peak at ${new Date(data.today_analytics.peak.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    // Weekly data
    document.getElementById('weekPrediction').textContent = formatNumber(data.vhcl_current_week_sum);
    document.querySelector('#traffic-summary .grid > div:nth-child(2) .text-sm').textContent = 
      `Peak on ${new Date(data.weekly_analytics.peak.date).toLocaleDateString([], {weekday: 'long'})}`;
    
    // 3 Months data
    document.getElementById('monthPrediction').textContent = formatNumber(data.vhcl_three_months_sum);
    document.querySelector('#traffic-summary .grid > div:nth-child(3) .text-sm').textContent = 
      `Avg ${formatNumber(data.three_months_analytics.avg)} vehicles/month`;
    
    // Add condition-based styling
    const conditionToColor = {
      'congested': 'text-red-500',
      'moderate': 'text-yellow-500',
      'free': 'text-green-500'
    };
    
    // Apply to all cards
    const cards = document.querySelectorAll('#traffic-summary .grid > div');
    cards[0].classList.add(conditionToColor[data.today_analytics.peak.condition]);
    cards[1].classList.add(conditionToColor[data.weekly_analytics.peak.condition]);
    cards[2].classList.add(conditionToColor[data.three_months_analytics.peak.condition]);
    
  } catch (error) {
    console.error("Failed to render predictions:", error);
    // Show error to user
    document.getElementById('traffic-summary').innerHTML = `
      <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p>Failed to load traffic data. ${error.message || 'Please try again later.'}</p>
      </div>
    `;
  }
}

// Toggle dropdown on click
document.getElementById('userMenuBtn')?.addEventListener('click', function(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('userDropdown');
    const chevron = document.getElementById('dropdownChevron');
    
    dropdown.classList.toggle('show');
    chevron.classList.toggle('rotate');
});

// Close dropdown when clicking anywhere else
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('userDropdown');
    const chevron = document.getElementById('dropdownChevron');
    const button = document.getElementById('userMenuBtn');
    
    if (!button.contains(event.target) && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        chevron.classList.remove('rotate');
    }
});

// Logout button handler (keep your existing one)
document.getElementById('logoutBtn')?.addEventListener('click', async function(e) {
    e.stopPropagation();
    const btn = this;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner animate-spin mr-2"></i> Signing Out';
    
    await requestSignOut();
});


import { typewriterEffect } from "../utils/type_writer_util.js";
export async function renderSummaryRecommendation() {
  const container = document.getElementById('aiRecommendation');
  if (!container) return;

  try {
    // Show loading state
    container.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Analyzing current traffic patterns...';
    
    // Fetch data
    const data = await getSummaryRecommendation();
    
    // Render with typewriter effect
    await typewriterEffect(container, data.summary_reco);
      
  } catch (error) {
    console.error("Failed to load recommendations:", error);
    container.innerHTML = `
      <div class="text-red-400">
        <i class="fas fa-exclamation-circle mr-2"></i>
        ${error.message || 'Failed to load recommendations'}
      </div>
    `;
  }
}

// Make it reusable for other recommendation types
export async function renderAIRecommendation(containerId, fetchFunction, propertyName = 'summary_reco') {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    container.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Generating recommendations...';
    const data = await fetchFunction();
    await typewriterEffect(container, data[propertyName]);
  } catch (error) {
    container.innerHTML = `
      <div class="text-red-400">
        <i class="fas fa-exclamation-circle mr-2"></i>
        ${error.message || 'Recommendation unavailable'}
      </div>
    `;
  }
}

// Call the function when the page loads
document.addEventListener("DOMContentLoaded", async () => {
  await renderPredictionSummary();
  await renderUserProfile();
  await renderSummaryRecommendation();
})

