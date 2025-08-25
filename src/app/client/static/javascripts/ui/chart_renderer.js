export class ChartRenderer {
  constructor() {
    this.chart = null;
    this.currentPeriod = 'hourly';
    this.currentChartType = 'line';
  }

  // Prepare data for ChartJS
  prepareChartData(period, trafficData) {
    const periodData = trafficData[period];
    
    return {
      labels: periodData.map(item => {
        if (period === 'hourly') return new Date(item.time).getHours() + ':00';
        if (period === 'daily') return new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' });
        if (period === 'weekly') return `Week ${this.getWeekNumber(new Date(item.week_start))}`;
        if (period === 'monthly') return new Date(item.month).toLocaleDateString('en-US', { month: 'short' });
      }),
      values: periodData.map(item => item.value)
    };
  }

  // Get ChartJS configuration
  getChartConfig(period, chartType, data) {
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

  // Create or update chart with animation
  async renderChart(canvasId, period, chartType, trafficData, onComplete = null) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const data = this.prepareChartData(period, trafficData);
    
    // Destroy previous chart if exists
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Add fade-out/fade-in animation
    const container = document.querySelector('.chart-container') || 
                     document.querySelector(`#${canvasId}`).parentElement;
    container.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    
    setTimeout(() => {
      this.chart = new Chart(ctx, this.getChartConfig(period, chartType, data));
      container.classList.remove('opacity-0');
      this.currentPeriod = period;
      this.currentChartType = chartType;
      
      // Call completion callback if provided
      if (onComplete) {
        onComplete(period, chartType);
      }
    }, 300);
  }

  // Update active tab styling
  updateActiveTab(activeElement, className) {
    document.querySelectorAll(`.${className}`).forEach(el => {
      el.classList.remove('bg-highlight', 'text-primary');
      el.classList.add('bg-accent1', 'text-accent2');
    });
    activeElement.classList.remove('bg-accent1', 'text-accent2');
    activeElement.classList.add('bg-highlight', 'text-primary');
  }

  // Helper function to get week number
  getWeekNumber(date) {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    return Math.ceil((((date - firstDay) / 86400000) + firstDay.getDay() + 1) / 7);
  }

  // Destroy chart
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}