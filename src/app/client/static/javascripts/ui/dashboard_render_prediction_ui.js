import { getPredictionSummary, getUserProfile, 
        requestSignOut, getRecommendation, 
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
    aiRecommendationData = await getRecommendation();
    
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
      aiRecommendationData = await getRecommendation();
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


// TRAFFIC PREDICTION REQUEST
import { requestPrediction, requestPredictionRecommendation } from "../api/dashboard_prediction_api.js";

let predictionChart = null;
let predictionData = null;
let currentPredictionPeriod = 'hourly';
let currentPredictionChartType = 'line';
let predictionRecommendationData = null;

// Extract prediction data from API response
async function extractPredictionData(apiResponse) {
  return {
    hourly: apiResponse.forecast.hourly || [],
    daily: apiResponse.forecast.daily || [],
    weekly: apiResponse.forecast.weekly || [],
    monthly: apiResponse.forecast.monthly || []
  };
}

// NEW: Prepare prediction chart data (different from traffic data)
async function preparePredictionChartData(period) {
  if (!predictionData || !predictionData[period] || predictionData[period].length === 0) {
    return { labels: [], values: [] };
  }

  const periodData = predictionData[period];
  
  return {
    labels: periodData.map(item => {
      if (period === 'hourly') {
        // Assuming hourly data has a 'time' field
        return new Date(item.time).getHours() + ':00';
      }
      if (period === 'daily') {
        // Assuming daily data has a 'date' field
        return new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' });
      }
      if (period === 'weekly') {
        // Assuming weekly data has a 'week_start' field
        return `Week ${getWeekNumber(new Date(item.week_start))}`;
      }
      if (period === 'monthly') {
        // For monthly data, use month_start
        return new Date(item.month_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
    }),
    values: periodData.map(item => item.value)
  };
}

// Update prediction chart buttons based on available data
function updatePredictionTabs() {
  const tabs = document.querySelectorAll('.prediction-time-tab');
  
  tabs.forEach(tab => {
    const period = tab.dataset.period;
    const hasData = predictionData && predictionData[period] && predictionData[period].length > 0;
    
    if (hasData) {
      tab.disabled = false;
      tab.classList.remove('opacity-50', 'cursor-not-allowed');
      tab.classList.add('cursor-pointer');
    } else {
      tab.disabled = true;
      tab.classList.add('opacity-50', 'cursor-not-allowed');
      tab.classList.remove('cursor-pointer', 'bg-highlight', 'text-primary');
      tab.classList.add('bg-accent1', 'text-accent2');
    }
  });
  
  // Set first available period as active
  const availablePeriods = ['hourly', 'daily', 'weekly', 'monthly'];
  for (const period of availablePeriods) {
    if (predictionData && predictionData[period] && predictionData[period].length > 0) {
      currentPredictionPeriod = period;
      const activeTab = document.querySelector(`.prediction-time-tab[data-period="${period}"]`);
      if (activeTab) {
        updateActiveTab(activeTab, 'prediction-time-tab');
      }
      break;
    }
  }
}

// Update prediction recommendation (similar to your updateChartInsight)
async function updatePredictionInsight() {
  const insightElement = document.getElementById('predictionRecommendation');
  
  if (!insightElement) return;
  
  // Import cancellation function
  const { cancelTypewriterAnimation } = await import('../utils/type_writer_util.js');
  
  // Cancel any existing animation
  cancelTypewriterAnimation('prediction');
  
  // Show loading immediately
  insightElement.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Loading recommendations...';
  
  // Clear any existing toggle buttons
  const existingToggleBtn = insightElement.parentNode.querySelector('.toggle-recommendation-btn');
  if (existingToggleBtn) {
    existingToggleBtn.remove();
  }
  
  if (!predictionRecommendationData) {
    try {
      const response = await requestPredictionRecommendation();
      predictionRecommendationData = response; // Assuming the response is the recommendation string
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
  
  if (predictionRecommendationData) {
    const { renderAIRecommendation } = await import('../utils/type_writer_util.js');
    await renderAIRecommendation(insightElement, predictionRecommendationData, 'prediction');
  } else {
    insightElement.innerHTML = `
      <div class="text-yellow-400">
        <i class="fas fa-info-circle mr-2"></i>
        No recommendations available for this prediction
      </div>
    `;
  }
}

// FIXED: Create prediction chart using the correct data preparation function
async function createPredictionChart(period, chartType) {
  const ctx = document.getElementById('predictionChart').getContext('2d');
  const data = await preparePredictionChartData(period); // Use prediction-specific function
  
  // If no data available, show message
  if (data.labels.length === 0) {
    // Clear canvas and show no data message
    if (predictionChart) {
      predictionChart.destroy();
      predictionChart = null;
    }
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = '#E0E1DD';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No data available for this period', ctx.canvas.width / 2, ctx.canvas.height / 2);
    return;
  }
  
  // Destroy previous chart if exists
  if (predictionChart) {
    predictionChart.destroy();
  }
  
  // Add fade-out/fade-in animation
  const container = document.querySelector('.prediction-chart-container');
  if (container) {
    container.classList.add('opacity-0', 'transition-opacity', 'duration-300');
  }
  
  setTimeout(() => {
    Promise.allSettled([
      // Chart creation
      Promise.resolve().then(() => {
        predictionChart = new Chart(ctx, getPredictionChartConfig(period, chartType, data));
        if (container) {
          container.classList.remove('opacity-0');
        }
      }),
      // Recommendation update (parallel)
      updatePredictionInsight()
    ]).then(results => {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const processes = ['Prediction chart creation', 'Prediction recommendation update'];
          console.error(`${processes[index]} failed:`, result.reason);
        }
      });
    });
  }, 300);
}

// NEW: Separate chart config for predictions (to avoid confusion)
function getPredictionChartConfig(period, chartType, data) {
  return {
    type: chartType,
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Predicted Vehicle Count',
        data: data.values,
        backgroundColor: chartType === 'bar' ? 'rgba(255, 153, 0, 0.7)' : 'transparent', // Different color for predictions
        borderColor: '#FF9900', // Orange for predictions
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
            label: (context) => `${context.parsed.y} vehicles (predicted)`
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

// Main prediction request handler
async function handlePredictionRequest() {
  const requestBtn = document.querySelector('.prediction-request-btn');
  const dateInput = document.getElementById('prediction_date');
  
  if (!dateInput.value) {
    alert('Please select a date for prediction');
    return;
  }
  
  // Show loading state
  requestBtn.disabled = true;
  requestBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Requesting Predictions...';
  
  try {
    // Request prediction data
    const response = await requestPrediction();
    predictionData = await extractPredictionData(response);
    
    // Reset recommendation data to fetch new one
    predictionRecommendationData = null;
    
    // Update tabs based on available data
    updatePredictionTabs();

    // update request date
    document.getElementById("request-date-display").innerHTML = `${response.request_date.end}`;
    
    // Create initial chart if we have data
    if (predictionData && Object.values(predictionData).some(arr => arr.length > 0)) {
      await createPredictionChart(currentPredictionPeriod, currentPredictionChartType);
      
      // Show success message
      requestBtn.innerHTML = '<i class="fas fa-check mr-2"></i> Prediction Complete';
      setTimeout(() => {
        requestBtn.innerHTML = '<i class="fas fa-chart-line mr-2"></i> Request Traffic Predictions';
      }, 2000);
    } else {
      requestBtn.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i> No Data Available';
      setTimeout(() => {
        requestBtn.innerHTML = '<i class="fas fa-chart-line mr-2"></i> Request Traffic Predictions';
      }, 2000);
    }
    
  } catch (error) {
    console.error('Prediction request failed:', error);
    requestBtn.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Request Failed';
    setTimeout(() => {
      requestBtn.innerHTML = '<i class="fas fa-chart-line mr-2"></i> Request Traffic Predictions';
    }, 2000);
  } finally {
    requestBtn.disabled = false;
  }
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

  // Prediction request button handler
  document.querySelector('.prediction-request-btn')?.addEventListener('click', handlePredictionRequest);

  // Prediction time period tab handlers
  document.querySelectorAll('.prediction-time-tab').forEach(tab => {
    tab.addEventListener('click', async function() {
      if (this.disabled) return;
      
      // Import cancellation function
      const { cancelTypewriterAnimation } = await import('../utils/type_writer_util.js');
      
      // Cancel current animation immediately
      cancelTypewriterAnimation('prediction');
      
      // Update current period and UI
      currentPredictionPeriod = this.dataset.period;
      updateActiveTab(this, 'prediction-time-tab');
      
      // Create chart
      createPredictionChart(currentPredictionPeriod, currentPredictionChartType);
    });
  });

  // Prediction chart type handlers
  document.querySelectorAll('.prediction-chart-type').forEach(btn => {
    btn.addEventListener('click', function() {
      currentPredictionChartType = this.dataset.type;
      updateActiveTab(this, 'prediction-chart-type');
      if (predictionData) {
        createPredictionChart(currentPredictionPeriod, currentPredictionChartType);
      }
    });
  });
});