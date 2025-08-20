tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#0D1B2A',
                secondary: '#1B263B',
                accent1: '#415A77',
                accent2: '#E0E1DD',
                highlight: '#00C2FF',
            },
            backgroundImage: {
                'nav-gradient': 'linear-gradient(135deg, #0D1B2A 0%, #1B263B 100%)',
            }
        }
    }
}

document.querySelector('button-selector-for-start').addEventListener('click', () => {
    window.startLivestream();
});

document.querySelector('button-selector-for-stop').addEventListener('click', () => {
    window.stopLivestream();
});

const dashboardToggle = document.getElementById("dashboardToggle");
const dashboardSubmenu = document.getElementById("dashboardSubmenu");
const dashboardIcon = dashboardToggle.querySelector("i.fas.fa-chevron-down");

dashboardToggle.addEventListener("click", () => {
    const isOpen = dashboardSubmenu.classList.contains("max-h-0");
    if (isOpen) {
        dashboardSubmenu.classList.remove("max-h-0");
        dashboardSubmenu.classList.add("max-h-40"); // adjust based on submenu size
        dashboardIcon.classList.add("rotate-180");
    } else {
        dashboardSubmenu.classList.remove("max-h-40");
        dashboardSubmenu.classList.add("max-h-0");
        dashboardIcon.classList.remove("rotate-180");
    }
});

// Smooth scroll
document.querySelectorAll(".smooth-scroll").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute("href"));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 70,
                behavior: "smooth"
            });
        }
    });
});   


// Update current date and time
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('currentDateTime').textContent = now.toLocaleDateString('en-US', options);
}

// Initialize with current time and update every minute
updateDateTime();
setInterval(updateDateTime, 60000);

// Simulate vehicle count updates
function updateVehicleCounts() {
    const counts = {
        car: Math.floor(Math.random() * 100) + 50,
        truck: Math.floor(Math.random() * 30) + 10,
        bicycle: Math.floor(Math.random() * 40) + 5,
        motorbike: Math.floor(Math.random() * 80) + 20
    };
    
    document.getElementById('carCount').textContent = counts.car;
    document.getElementById('truckCount').textContent = counts.truck;
    document.getElementById('bicycleCount').textContent = counts.bicycle;
    document.getElementById('motorbikeCount').textContent = counts.motorbike;
    document.getElementById('totalCount').textContent = counts.car + counts.truck + counts.bicycle + counts.motorbike;
    
    // Update predictions based on counts
    document.getElementById('todayPrediction').textContent = Math.min(100, Math.floor(counts.total / 2)) + '%';
    document.getElementById('weekPrediction').textContent = Math.min(100, Math.floor(counts.total / 1.8)) + '%';
    document.getElementById('monthPrediction').textContent = Math.min(100, Math.floor(counts.total / 1.5)) + '%';
}

// Initial update and then every 5 seconds
updateVehicleCounts();
setInterval(updateVehicleCounts, 5000);

// AI Recommendation typing animation
function updateAIRecommendation() {
    const recommendations = [
        "Current traffic flow is smooth with moderate vehicle density. No immediate interventions needed.",
        "Detected increasing congestion in the northbound lane. Consider adjusting traffic light timing.",
        "School zone active - recommend reducing speed limits during peak hours for safety.",
        "Accident reported 500m ahead. Dispatching traffic enforcers and notifying emergency services.",
        "Rain detected - advising reduced speed limits and increased following distances."
    ];
    
    const element = document.getElementById('aiRecommendation');
    element.classList.remove('typing-animation');
    void element.offsetWidth; // Trigger reflow
    element.textContent = recommendations[Math.floor(Math.random() * recommendations.length)];
    element.classList.add('typing-animation');
}

// Initial update and then every 30 seconds
updateAIRecommendation();
setInterval(updateAIRecommendation, 30000);

// Chart functionality
function createChart(type) {
    const ctx = document.getElementById('trafficChart').getContext('2d');
    
    // Destroy previous chart if exists
    if (window.trafficChart) {
        window.trafficChart.destroy();
    }
    
    let labels, data;
    
    switch(type) {
        case 'hourly':
            labels = Array.from({length: 24}, (_, i) => `${i}:00`);
            data = Array.from({length: 24}, () => Math.floor(Math.random() * 100) + 20);
            break;
        case 'daily':
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            data = labels.map(() => Math.floor(Math.random() * 800) + 200);
            break;
        case 'weekly':
            labels = Array.from({length: 4}, (_, i) => `Week ${i+1}`);
            data = labels.map(() => Math.floor(Math.random() * 4000) + 1000);
            break;
        case 'monthly':
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            data = labels.map(() => Math.floor(Math.random() * 15000) + 5000);
            break;
    }
    
    // Update chart insight based on selected tab
    const insights = {
        hourly: "Peak traffic hours are between 7-9AM and 5-7PM. Consider adjusting traffic light cycles during these periods.",
        daily: "Friday typically has the highest traffic volume. Recommend additional traffic management resources on this day.",
        weekly: "First week of the month shows increased commercial vehicle activity. Plan accordingly for logistics operations.",
        monthly: "December has the highest annual traffic due to holiday shopping. Implement special traffic management plans."
    };
    
    document.getElementById('chartInsight').textContent = insights[type];
    
    window.trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vehicle Count',
                data: data,
                borderColor: '#00C2FF',
                backgroundColor: 'rgba(0, 194, 255, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(224, 225, 221, 0.1)'
                    },
                    ticks: {
                        color: '#E0E1DD'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(224, 225, 221, 0.1)'
                    },
                    ticks: {
                        color: '#E0E1DD'
                    }
                }
            }
        }
    });
}

// Initialize with hourly chart
createChart('hourly');

// Chart tab switching
document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        // Update active tab styling
        document.querySelectorAll('.chart-tab').forEach(t => {
            t.classList.remove('bg-highlight', 'text-primary');
            t.classList.add('bg-accent1', 'text-accent2');
        });
        
        this.classList.remove('bg-accent1', 'text-accent2');
        this.classList.add('bg-highlight', 'text-primary');
        
        // Create new chart
        createChart(this.dataset.tab);
    });
});

// Navigation toggle functionality
document.getElementById('navToggle').addEventListener('click', function() {
    const nav = document.getElementById('leftNav');
    nav.classList.toggle('nav-collapsed');
    nav.classList.toggle('nav-expanded');
    
    // Adjust main content margin
    const main = document.querySelector('main');
    if (nav.classList.contains('nav-collapsed')) {
        main.classList.add('md:ml-[80px]');
        main.classList.remove('md:ml-[250px]');
        this.innerHTML = '<i class="fas fa-chevron-right"></i>';
    } else {
        main.classList.remove('md:ml-[80px]');
        main.classList.add('md:ml-[250px]');
        this.innerHTML = '<i class="fas fa-chevron-left"></i>';
    }
});

// Mobile menu toggle
document.getElementById('mobileMenuBtn').addEventListener('click', function() {
    const nav = document.getElementById('leftNav');
    const isOpen = nav.classList.contains('w-full');
    
    if (isOpen) {
        nav.classList.remove('w-full');
        nav.classList.add('w-0');
    } else {
        nav.classList.remove('w-0');
        nav.classList.add('w-full');
    }
});

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
    const nav = document.getElementById('leftNav');
    const menuBtn = document.getElementById('mobileMenuBtn');
    
    if (!nav.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
        if (window.innerWidth < 768) {
            nav.classList.remove('w-full');
            nav.classList.add('w-0');
        }
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    const nav = document.getElementById('leftNav');
    if (window.innerWidth >= 768) {
        nav.classList.remove('w-0', 'w-full');
        nav.classList.add('md:w-[80px]', 'lg:w-[240px]');
    } else {
        nav.classList.remove('md:w-[80px]', 'lg:w-[240px]');
        if (!nav.classList.contains('w-full')) {
            nav.classList.add('w-0');
        }
    }
});

// Mini charts functionality
function createMiniCharts(period) {
    const periods = {
        hourly: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            traffic: Array.from({length: 24}, () => Math.floor(Math.random() * 100) + 20),
            speed: Array.from({length: 24}, () => Math.floor(Math.random() * 30) + 20),
            congestion: Array.from({length: 24}, () => Math.floor(Math.random() * 100))
        },
        daily: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            traffic: Array.from({length: 7}, () => Math.floor(Math.random() * 300) + 100),
            speed: Array.from({length: 7}, () => Math.floor(Math.random() * 20) + 20),
            congestion: Array.from({length: 7}, () => Math.floor(Math.random() * 100))
        },
        weekly: {
            labels: Array.from({length: 4}, (_, i) => `Week ${i+1}`),
            traffic: Array.from({length: 4}, () => Math.floor(Math.random() * 1000) + 500),
            speed: Array.from({length: 4}, () => Math.floor(Math.random() * 15) + 20),
            congestion: Array.from({length: 4}, () => Math.floor(Math.random() * 100))
        },
        monthly: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            traffic: Array.from({length: 12}, () => Math.floor(Math.random() * 2000) + 1000),
            speed: Array.from({length: 12}, () => Math.floor(Math.random() * 10) + 25),
            congestion: Array.from({length: 12}, () => Math.floor(Math.random() * 100))
        }
    };

    const data = periods[period];
    
    // Traffic Volume Chart
    const trafficCtx = document.getElementById('miniTrafficChart').getContext('2d');
    if (window.miniTrafficChart) window.miniTrafficChart.destroy();
    window.miniTrafficChart = new Chart(trafficCtx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.traffic,
                backgroundColor: 'rgba(0, 194, 255, 0.7)',
                borderColor: '#00C2FF',
                borderWidth: 1
            }]
        },
        options: miniChartOptions('Vehicles')
    });

    // Speed Chart
    const speedCtx = document.getElementById('miniSpeedChart').getContext('2d');
    if (window.miniSpeedChart) window.miniSpeedChart.destroy();
    window.miniSpeedChart = new Chart(speedCtx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.speed,
                borderColor: '#00C2FF',
                backgroundColor: 'rgba(0, 194, 255, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: miniChartOptions('km/h')
    });

    // Congestion Chart
    const congestionCtx = document.getElementById('miniCongestionChart').getContext('2d');
    if (window.miniCongestionChart) window.miniCongestionChart.destroy();
    window.miniCongestionChart = new Chart(congestionCtx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.congestion,
                borderColor: '#00C2FF',
                backgroundColor: 'rgba(0, 194, 255, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: miniChartOptions('%')
    });
}

function miniChartOptions(unit) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.parsed.y} ${unit}`;
                    }
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
                grid: { display: false },
                ticks: { color: '#E0E1DD' }
            }
        }
    };
}

// Initialize with hourly charts
createMiniCharts('hourly');

// Time period tab switching
document.querySelectorAll('.time-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.time-tab').forEach(t => {
            t.classList.remove('bg-highlight', 'text-primary');
            t.classList.add('bg-accent1', 'text-accent2');
        });
        
        this.classList.remove('bg-accent1', 'text-accent2');
        this.classList.add('bg-highlight', 'text-primary');
        
        createMiniCharts(this.dataset.period);
    });
});

// Simulate canvas overlay for detections
function updateDetectionOverlay() {
    const canvas = document.getElementById('detectionCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    const videoContainer = canvas.parentElement;
    canvas.width = videoContainer.offsetWidth;
    canvas.height = videoContainer.offsetHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw random bounding boxes to simulate detections
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * canvas.width * 0.8;
        const y = Math.random() * canvas.height * 0.8;
        const width = Math.random() * 100 + 50;
        const height = Math.random() * 60 + 40;
        
        ctx.strokeStyle = '#00C2FF';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Add label
        const labels = ['Car', 'Truck', 'Bike', 'Motorcycle', 'Bus'];
        const label = labels[Math.floor(Math.random() * labels.length)];
        
        ctx.fillStyle = '#00C2FF';
        ctx.font = '12px Arial';
        ctx.fillText(label, x, y - 5);
    }
}

// Initial overlay and update every second
updateDetectionOverlay();
setInterval(updateDetectionOverlay, 1000);

// Add fade-in effect to all sections on load
document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('.fade-in');
    sections.forEach((section, index) => {
        section.style.animationDelay = `${index * 0.1}s`;
    });
});