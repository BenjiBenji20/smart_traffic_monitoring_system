import { getFactors, getAIAnalysis } from "../api/dashboard_factors_api.js";
import { renderAIRecommendation, cancelTypewriterAnimation } from "../utils/type_writer_util.js";

// Chart configuration
let trafficFactorChart = null;
let trafficFactorData = null;
let currentFactorPeriod = 'hourly';


// Extract traffic data from API
async function extractTrafficData() {
    const data = await getFactors();
    return data;
}

// Update active tab styling
function updateFactorActiveTab(period) {
    document.querySelectorAll('.time-tab-2').forEach(el => {
        if (el.dataset.period === period) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

// Format date based on period
function formatDate(dateString, period) {
    const date = new Date(dateString);

    switch (period) {
        case 'hourly':
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        case 'daily':
            return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        case 'weekly':
            return `Week of ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
        case 'monthly':
            return date.toLocaleDateString([], { year: 'numeric', month: 'long' });
        default:
            return dateString;
    }
}

// Prepare data for ChartJS
async function prepareFactorChartData(period) {
    if (!trafficFactorData) {
        trafficFactorData = await extractTrafficData();
    }

    const periodData = trafficFactorData[period];

    return {
        labels: periodData.map(item => {
            if (period === 'hourly') return formatDate(item.time, period);
            if (period === 'daily') return formatDate(item.date, period);
            if (period === 'weekly') return formatDate(item.week_start, period);
            if (period === 'monthly') return formatDate(item.month + '-01', period);
        }),
        datasets: [
            {
                label: 'Base Traffic',
                data: periodData.map(item => item.base_traffic),
                backgroundColor: 'rgba(0, 194, 255, 0.6)',
                borderColor: 'rgba(0, 194, 255, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Final Prediction',
                data: periodData.map(item => item.final_prediction),
                backgroundColor: 'rgba(255, 153, 0, 0.6)',
                borderColor: 'rgba(255, 153, 0, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }
        ],
        contributingFactors: periodData.map(item => item.contributing_factors)
    };
}

// Create or update chart with animation
async function createFactorChart(period) {
    const ctx = document.getElementById('traffic-factors-chart').getContext('2d');
    const data = await prepareFactorChartData(period);

    // Destroy previous chart if exists
    if (trafficFactorChart) {
        trafficFactorChart.destroy();
    }

    // Add fade-out/fade-in animation
    const container = document.querySelector('.chart-container');
    container.classList.add('opacity-50');

    setTimeout(async () => {
        try {
            trafficFactorChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: data.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#4B5563',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} vehicles`;
                            },
                            afterBody: function (context) {
                                // Get the index of the hovered item
                                const index = context[0].dataIndex;
                                // Get contributing factors for this data point
                                const factors = data.contributingFactors[index];

                                if (!factors || factors.length === 0) return [];

                                // Create factor descriptions for tooltip
                                return [
                                    '',
                                    'Contributing Factors:',
                                    ...factors.map(f => `• ${f.factor}: ${f.impact > 0 ? '+' : ''}${f.impact.toFixed(1)} (${f.reason})`)
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(107, 114, 128, 0.1)'
                        },
                        ticks: {
                            color: '#4B5563',
                            callback: function (value) {
                                return value.toFixed(0);
                            }
                        },
                        title: {
                            display: true,
                            text: 'Vehicles',
                            color: '#4B5563'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(107, 114, 128, 0.1)'
                        },
                        ticks: {
                            color: '#4B5563',
                            maxRotation: 45
                        }
                    }
                }
            }
            });
            container.classList.remove('opacity-50');
            
            // Update the AI insight - this will use the typewriter effect
            await updateFactorsChartInsight(period);
        } catch (error) {
            console.error('Error creating chart:', error);
            container.classList.remove('opacity-50');
            container.innerHTML = '<div class="text-red-500 p-4">Error loading chart data</div>';
        }
    }, 300);
}

// Update AI recommendation text with typewriter effect
async function updateFactorsChartInsight(period) {
    const insightElement = document.getElementById('factorsChartInsight');
    if (!insightElement) return;
    
    try {
        // Cancel any existing animation for the previous period
        cancelTypewriterAnimation(period);
        
        // Show loading immediately
        insightElement.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Loading insight...';
        
        // Clear any existing toggle buttons
        const existingToggleBtn = insightElement.parentNode.querySelector('.toggle-recommendation-btn');
        if (existingToggleBtn) {
            existingToggleBtn.remove();
        }
        
        // Fetch AI analysis data
        const aiAnalysisData = await getAIAnalysis();
        
        // Get the appropriate analysis based on period
        let analysisText = "";
        switch(period) {
            case 'hourly':
                analysisText = aiAnalysisData.hourly_anal || "No hourly analysis available.";
                break;
            case 'daily':
                analysisText = aiAnalysisData.daily_anal || "No daily analysis available.";
                break;
            case 'weekly':
                analysisText = aiAnalysisData.weekly_anal || "No weekly analysis available.";
                break;
            case 'monthly':
                analysisText = aiAnalysisData.monthly_anal || "No monthly analysis available.";
                break;
            default:
                analysisText = "Select a time period to view analysis.";
        }
        
        // Use your existing renderAIRecommendation function
        await renderAIRecommendation(insightElement, analysisText, period);
        
    } catch (error) {
        console.error('Error loading AI analysis:', error);
        insightElement.innerHTML = `
            <div class="text-red-400">
                <i class="fas fa-exclamation-circle mr-2"></i>
                Failed to load analysis: ${error.message}
            </div>
        `;
    }
}


// Initialize the chart
document.addEventListener('DOMContentLoaded', async function () {
    // Set up event listeners for period tabs
    document.querySelectorAll('.time-tab-2').forEach(tab => {
        tab.addEventListener('click', function () {
            const period = this.dataset.period;
            currentFactorPeriod = period;
            updateFactorActiveTab(period);
            createFactorChart(period);
            updateFactorsChartInsight(period);
        });
    });

    // Load initial chart
    await createFactorChart(currentFactorPeriod);
});
