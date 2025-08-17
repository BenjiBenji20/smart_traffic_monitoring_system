import { getPredictionSummary, getUserProfile, 
        requestSignOut, getTrafficRecommendation, 
        getPredictionDetail
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


import { renderAIRecommendation } from "../utils/type_writer_util.js";
let aiRecommendationData = null; // recommendation handler

export async function renderSummaryRecommendation() {
  const container = document.getElementById('aiRecommendation');
  if (!container) return;

  try {
    // Show loading state
    container.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Analyzing current traffic patterns...';
    
    // Fetch data
    aiRecommendationData = await getTrafficRecommendation();
    
    // Render with typewriter effect
    await renderAIRecommendation(container, aiRecommendationData.summary_reco, 'summary')
      
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


// RENDER CHARTS
// Chart configuration
let trafficChart = null;
let trafficData = null;
let currentPeriod = 'hourly';
let currentChartType = 'line';

async function extractTrafficData() {
  const data = await getPredictionDetail();

  // Sample data structure
  return {
    hourly: data.hourly, // Your hourly data
    daily: data.daily,  // Your daily data
    weekly: data.weekly, // Your weekly data
    monthly: data.monthly // Your monthly data
  };
}


// Update active tab styling
function updateActiveTab(activeElement, className) {
  document.querySelectorAll(`.${className}`).forEach(el => {
    el.classList.remove('bg-highlight', 'text-primary');
    el.classList.add('bg-accent1', 'text-accent2');
  });
  activeElement.classList.remove('bg-accent1', 'text-accent2');
  activeElement.classList.add('bg-highlight', 'text-primary');
}


// Prepare data for ChartJS
async function prepareChartData(period) {
  if (!trafficData) {
    trafficData = await extractTrafficData();
  }

  const periodData = trafficData[period];
  
  return {
    labels: periodData.map(item => {
      if (period === 'hourly') return new Date(item.time).getHours() + ':00';
      if (period === 'daily') return new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' });
      if (period === 'weekly') return `Week ${getWeekNumber(new Date(item.week_start))}`;
      if (period === 'monthly') return new Date(item.month).toLocaleDateString('en-US', { month: 'short' });
    }),
    values: periodData.map(item => item.value)
  };
}


// Update AI recommendation text
async function updateChartInsight(period) {
  const recommendationKey = period + "_reco";
  const insightElement = document.getElementById('chartInsight');
  
  if (!insightElement) return;
  
  // Import cancellation function
  const { cancelTypewriterAnimation } = await import('../utils/type_writer_util.js');
  
  // Cancel any existing animation for the previous period
  cancelTypewriterAnimation(period);
  
  // Show loading immediately
  insightElement.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Loading insight...';
  
  // Clear any existing toggle buttons
  const existingToggleBtn = insightElement.parentNode.querySelector('.toggle-recommendation-btn');
  if (existingToggleBtn) {
    existingToggleBtn.remove();
  }
  
  if (!aiRecommendationData) {
    try {
      aiRecommendationData = await getTrafficRecommendation();
    } catch (error) {
      insightElement.innerHTML = `
        <div class="text-red-400">
          <i class="fas fa-exclamation-circle mr-2"></i>
          Failed to load recommendations
        </div>
      `;
      return;
    }
  }
  
  // Get the recommendation text for this period
  const recommendationText = aiRecommendationData[recommendationKey];
  
  if (recommendationText) {
    // Render with typewriter effect and unique identifier
    await renderAIRecommendation(insightElement, recommendationText, period);
  } else {
    insightElement.innerHTML = `
      <div class="text-yellow-400">
        <i class="fas fa-info-circle mr-2"></i>
        No specific recommendations available for ${period} period
      </div>
    `;
  }
}


// Create or update chart with animation
async function createChart(period, chartType) {
  const ctx = document.getElementById('trafficChart').getContext('2d');
  const data = await prepareChartData(period);
  
  // Destroy previous chart if exists
  if (trafficChart) {
    trafficChart.destroy();
  }
  
  // Add fade-out/fade-in animation
  const container = document.querySelector('.chart-container');
  container.classList.add('opacity-0', 'transition-opacity', 'duration-300');
  
  // Start both chart creation and recommendation update simultaneously
  setTimeout(() => {
    // Start both processes at the same time
    Promise.allSettled([
      // Chart creation 
      Promise.resolve().then(() => {
        trafficChart = new Chart(ctx, getChartConfig(period, chartType, data));
        container.classList.remove('opacity-0');
      }),
      // render Recommendation 
      updateChartInsight(period)
    ]).then(results => {
      // Log any errors but don't block
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const processes = ['Chart creation', 'Recommendation update'];
          console.error(`${processes[index]} failed:`, result.reason);
        }
      });
    });
  }, 300);
}


// Get ChartJS configuration
function getChartConfig(period, chartType, data) {
  return {
    type: chartType,
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Vehicle Count',
        data: data.values,
        backgroundColor: chartType === 'bar' ? 'rgba(0, 194, 255, 0.7)' : 'transparent',
        borderColor: '#00C2FF',
        borderWidth: 2,
        tension: 0.4,
        fill: chartType === 'line'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y} vehicles`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(224, 225, 221, 0.1)' },
          ticks: { color: '#E0E1DD' }
        },
        x: {
          grid: { color: 'rgba(224, 225, 221, 0.1)' },
          ticks: { color: '#E0E1DD' }
        }
      }
    }
  };
}


// Helper function to get week number
function getWeekNumber(date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date - firstDay) / 86400000) + firstDay.getDay() + 1) / 7);
}


// Call the functions with proper async handling
document.addEventListener("DOMContentLoaded", () => {
  // Start rendering functions that don't depend on each other
  const independentRenders = [
    renderPredictionSummary(),
    renderUserProfile(),
    renderSummaryRecommendation()
  ];
  
  // Start chart initialization independently
  const chartInit = extractTrafficData().then(data => {
    trafficData = data;
    return createChart(currentPeriod, currentChartType);
  });
  
  // Run all in parallel
  Promise.allSettled([...independentRenders, chartInit]).then(results => {
    // Log any errors but don't block the UI
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const functionNames = ['renderPredictionSummary', 'renderUserProfile', 'renderSummaryRecommendation', 'chart initialization'];
        console.error(`${functionNames[index]} failed:`, result.reason);
      }
    });
    
    console.log('Dashboard initialization complete');
  });
  
  // Time period tab handlers
  document.querySelectorAll('.time-tab').forEach(tab => {
    tab.addEventListener('click', async function() {
      // Import cancellation function
      const { cancelTypewriterAnimation } = await import('../utils/type_writer_util.js');
      
      // Cancel current animation immediately
      cancelTypewriterAnimation(currentPeriod);
      
      // Update current period and UI
      currentPeriod = this.dataset.period;
      updateActiveTab(this, 'time-tab');
      
      // Create chart (which now handles recommendation in parallel)
      createChart(currentPeriod, currentChartType);
    });
  });
  
  // Chart type handlers
  document.querySelectorAll('.chart-type').forEach(btn => {
    btn.addEventListener('click', function() {
      currentChartType = this.dataset.type;
      updateActiveTab(this, 'chart-type');
      createChart(currentPeriod, currentChartType);
    });
  });
});