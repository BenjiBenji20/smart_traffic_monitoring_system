
/**
 * Livestream Integration Module
 * Handles video streaming and vehicle detection for the traffic monitoring dashboard
 */

class LivestreamManager {
    constructor() {
        // DOM elements from the main frontend
        this.videoStream = document.getElementById('videoStream');
        this.overlay = document.getElementById('overlay');
        this.ctx = this.overlay?.getContext('2d');
        
        // Vehicle count elements
        this.countElements = {
            car: document.getElementById('count_car'),
            truck: document.getElementById('count_truck'),
            bicycle: document.getElementById('count_bicycle'),
            motorbike: document.getElementById('count_motorbike'),
            total: document.getElementById('count_total')
        };
        
        // Control buttons (if they exist in your main frontend)
        this.startBtn = document.querySelector('button:has(i.fa-play)') || this.createControlButton('start');
        this.stopBtn = document.querySelector('button:has(i.fa-stop)') || this.createControlButton('stop');
        
        // Stream mode controls
        this.streamModeSelect = null; // Will be created
        this.piAddressSelect = null; // Will be created
        this.testConnectionBtn = null; // Will be created
        
        // State management
        this.isStreaming = false;
        this.currentStreamMode = 'raw'; // Default to raw mode to avoid AI processing
        this.detectionInterval = null;
        this.statsInterval = null;
        this.statusInterval = null;
        this.availablePiAddresses = [];
        
        // Scale factors for coordinate conversion (backend: 480x270, display: varies)
        this.scaleFactors = { x: 1, y: 1 };
        
        // Backend API base URL
        this.apiBaseUrl = 'http://localhost:8000/api/dashboard/livestream';
        
        this.init();
    }
    
    init() {
        console.log('Initializing Livestream Manager...');
        // this.fetchStats()

        // Start date/time updates
        this.startDateTimeUpdates();
        
        // Create additional controls
        this.createStreamControls();
        
        // Set up control buttons
        this.setupControlButtons();
        
        // Calculate scale factors
        this.calculateScaleFactors();
        
        // Load Pi addresses
        this.loadPiAddresses();
        
        // Start status checking
        this.startStatusChecking();
        
        // Check initial livestream status
        this.checkLivestreamStatus();
        
        // Set up resize observer to recalculate scale factors
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => {
                this.calculateScaleFactors();
            });
            if (this.videoStream) {
                resizeObserver.observe(this.videoStream);
            }
        }
    }
    updateDateTime() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    
    const dateTimeString = now.toLocaleString('en-US', options);
    
    // Update header datetime
    const currentDateTime = document.getElementById('currentDateTime');
        if (currentDateTime) {
            currentDateTime.textContent = dateTimeString;
        }
        
        // Update livestream overlay datetime
        const liveDatetime = document.getElementById('live_datetime');
        if (liveDatetime) {
            liveDatetime.textContent = dateTimeString;
        }
    }

    startDateTimeUpdates() {
        // Update immediately
        this.updateDateTime();
        
        // Update every second
        this.dateTimeInterval = setInterval(() => {
            this.updateDateTime();
        }, 1000);
    }
    
    createStreamControls() {
        // Find the button container
        const controlContainer = this.startBtn?.parentElement?.parentElement;
        if (!controlContainer) return;
        
        // Create left controls container
        const leftControls = controlContainer.querySelector('div:first-child') || document.createElement('div');
        leftControls.className = 'flex items-center gap-2 flex-wrap';
        
        // Create center controls container  
        const centerControls = controlContainer.querySelector('div:nth-child(2)') || document.createElement('div');
        centerControls.className = 'flex items-center gap-2';
        
        // Pi Address Select
        this.piAddressSelect = document.createElement('select');
        this.piAddressSelect.className = 'bg-secondary border border-accent1  rounded-lg px-2 py-2 text-xs min-w-[100px]';
        this.piAddressSelect.innerHTML = '<option value="">Detect Pi</option>';
        
        // Test Connection Button
        this.testConnectionBtn = document.createElement('button');
        this.testConnectionBtn.className = 'bg-secondary border border-accent1 text-accent2 px-2 py-2 rounded-lg hover:bg-accent1 transition-colors text-xs';
        this.testConnectionBtn.innerHTML = '<i class="fas fa-wifi mr-2"></i>Test';
        this.testConnectionBtn.addEventListener('click', () => this.testConnection());
        
        // Stream Mode Buttons
        this.rawModeBtn = document.createElement('button');
        this.rawModeBtn.className = 'bg-highlight text-primary px-2 py-1 rounded-lg text-sm';
        this.rawModeBtn.innerHTML = '<i class="fas fa-eye mr-2"></i>Raw (No AI)';
        this.rawModeBtn.addEventListener('click', () => this.switchStreamMode('raw'));
        
        this.processedModeBtn = document.createElement('button');
        this.processedModeBtn.className = 'bg-accent1 text-accent2 px-2 py-1 rounded-lg text-sm';
        this.processedModeBtn.innerHTML = '<i class="fas fa-robot mr-2"></i>AI Processing';
        this.processedModeBtn.addEventListener('click', () => this.switchStreamMode('processed'));
        
        // Append to containers
        leftControls.appendChild(this.piAddressSelect);
        leftControls.appendChild(this.testConnectionBtn);
        
        centerControls.appendChild(this.rawModeBtn);
        centerControls.appendChild(this.processedModeBtn);
        
        // Insert containers if they don't exist
        if (!controlContainer.querySelector('div:first-child')) {
            controlContainer.insertBefore(leftControls, controlContainer.firstChild);
        }
        if (!controlContainer.querySelector('div:nth-child(2)')) {
            controlContainer.insertBefore(centerControls, controlContainer.lastElementChild);
        }
    }
    
    createControlButton(type) {
        // If buttons don't exist, return null - they should be handled by existing UI
        return null;
    }
    
    setupControlButtons() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.startLivestream());
        }
        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', () => this.stopLivestream());
        }
    }
    
    calculateScaleFactors() {
        if (!this.videoStream || !this.overlay) return;
        
        const displayWidth = this.videoStream.clientWidth;
        const displayHeight = this.videoStream.clientHeight;
        
        // Backend detection resolution
        const detectionWidth = 480;
        const detectionHeight = 270;
        
        this.scaleFactors.x = displayWidth / detectionWidth;
        this.scaleFactors.y = displayHeight / detectionHeight;
        
        // Update canvas size to match video display
        this.overlay.width = displayWidth;
        this.overlay.height = displayHeight;
        
        console.log(`Scale factors updated: x=${this.scaleFactors.x}, y=${this.scaleFactors.y}`);
    }
    
    async loadPiAddresses() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/livestream-status`);
            const data = await response.json();
            
            this.availablePiAddresses = data.available_sources || [];
            
            if (this.piAddressSelect) {
                // Update select options
                this.piAddressSelect.innerHTML = '<option value="">Auto-detect Pi</option>';
                this.availablePiAddresses.forEach((address, index) => {
                    const option = document.createElement("option");
                    option.value = address;
                    option.textContent = `Pi Address ${index + 1}`;
                    this.piAddressSelect.appendChild(option);
                });
            }
            
            console.log('Available Pi addresses loaded:', this.availablePiAddresses);
            
        } catch (error) {
            console.error("Error loading Pi addresses:", error);
        }
    }
    
    async testConnection() {
        if (!this.testConnectionBtn) return;
        
        try {
            this.testConnectionBtn.disabled = true;
            this.testConnectionBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Testing...';
            
            const selectedIndex = this.piAddressSelect?.selectedIndex - 1; // -1 because first option is "Auto-detect"
            
            let result = "";
            
            if (selectedIndex < 0) {
                // Test all addresses
                let anyConnected = false;
                
                for (let i = 0; i < this.availablePiAddresses.length; i++) {
                    const response = await fetch(`${this.apiBaseUrl}/test-pi-connection?address_index=${i}`);
                    const data = await response.json();
                    
                    if (data.connected) {
                        anyConnected = true;
                        result = `✓ ${data.address} - Connected`;
                        break;
                    }
                }
                
                if (!anyConnected) {
                    result = "✗ No Pi cameras found";
                }
            } else {
                // Test specific address
                const response = await fetch(`${this.apiBaseUrl}/test-pi-connection?address_index=${selectedIndex}`);
                const data = await response.json();
                
                if (data.connected) {
                    result = `✓ ${data.address} - Connected`;
                } else {
                    result = `✗ ${data.address} - Failed`;
                }
            }
            
            // Show result (you can customize this notification)
            this.showNotification(result.includes('✓') ? 'success' : 'error', result);
            console.log('Connection test result:', result);
            
        } catch (error) {
            console.error("Error testing connection:", error);
            this.showNotification('error', 'Connection test failed');
        } finally {
            this.testConnectionBtn.disabled = false;
            this.testConnectionBtn.innerHTML = '<i class="fas fa-wifi text-xs"></i> Test';
        }
    }
    
    switchStreamMode(mode) {
        this.currentStreamMode = mode;
        console.log(`Switching to ${mode} mode`);
        
        // Update button styles
        if (this.rawModeBtn && this.processedModeBtn) {
            if (mode === 'raw') {
                this.rawModeBtn.className = 'bg-highlight text-primary px-2 py-1 rounded-lg glow-on-hover text-sm';
                this.processedModeBtn.className = 'bg-accent1 text-accent2 px-2 py-1 rounded-lg glow-on-hover text-sm';
            } else {
                this.rawModeBtn.className = 'bg-accent1 text-accent2 px-2 py-1 rounded-lg glow-on-hover text-sm';
                this.processedModeBtn.className = 'bg-highlight text-primary px-2 py-1 rounded-lg glow-on-hover text-sm';
            }
        }


        // Send mode switch request to backend
        if (this.isStreaming) {
            this.sendModeChangeToBackend(mode);
        }
        
        // Update stream source only if livestream is running
        if (this.isStreaming) {
            this.updateVideoFeed();
        }
    }

    async sendModeChangeToBackend(mode) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/switch-detection-mode`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mode: mode })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log(`Backend switched to ${mode} mode`);
                
                // Show notification based on mode
                if (mode === 'raw') {
                    this.showNotification('success', '🔴 Raw mode: AI processing disabled, no Firebase updates');
                } else {
                    this.showNotification('success', '🤖 AI mode: Vehicle counting and Firebase updates enabled');
                }
            } else {
                console.error('Failed to switch mode:', data.message);
                this.showNotification('error', 'Failed to switch detection mode');
            }
            
        } catch (error) {
            console.error('Error switching mode:', error);
            this.showNotification('error', 'Connection error while switching mode');
        }
    }
    
    async startLivestream() {
        try {
            console.log('Starting livestream...');
            
            if (this.startBtn) {
                this.startBtn.disabled = true;
                const icon = this.startBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-spinner fa-spin mr-2';
            }
            
            const selectedSource = this.piAddressSelect?.value || null;
            
            const response = await fetch(`${this.apiBaseUrl}/start-livestream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    camera_source: selectedSource,
                    detection_mode: 'raw'  // Always start in raw mode to prevent Firebase updates
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.isStreaming = true;
                console.log('Livestream started successfully');
                
                // Start video feed with current mode
                this.updateVideoFeed();
                
                // Start polling for detection data (only for raw mode)
                this.startPolling();
                
                // Update button states
                this.updateButtonStates();
                
                this.showNotification('success', `Livestream started: ${data.camera_source}`);
                
            } else {
                console.error('Failed to start livestream:', data.message);
                this.showNotification('error', 'Failed to start livestream: ' + data.message);
            }
            
        } catch (error) {
            console.error('Error starting livestream:', error);
            this.showNotification('error', 'Connection error. Please check if the backend is running.');
        } finally {
            if (this.startBtn) {
                this.startBtn.disabled = false;
                const icon = this.startBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-play mr-2';
            }
        }
    }
    
    async stopLivestream() {
        try {
            console.log('Stopping livestream...');
            
            if (this.stopBtn) {
                this.stopBtn.disabled = true;
                const icon = this.stopBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-spinner fa-spin mr-2';
            }
            
            const response = await fetch(`${this.apiBaseUrl}/stop-livestream`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.isStreaming = false;
                console.log('Livestream stopped successfully');
                
                // Stop video feed
                this.stopVideoFeed();
                
                // Stop polling
                this.stopPolling();
                
                // Update button states
                this.updateButtonStates();
                
                // Clear canvas
                if (this.ctx) {
                    this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
                }
                
                this.showNotification('success', 'Livestream stopped');
                
            } else {
                console.error('Failed to stop livestream:', data.message);
                this.showNotification('error', 'Failed to stop livestream: ' + data.message);
            }
            
        } catch (error) {
            console.error('Error stopping livestream:', error);
            this.showNotification('error', 'Connection error while stopping livestream.');
        } finally {
            if (this.stopBtn) {
                this.stopBtn.disabled = false;
                const icon = this.stopBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-stop mr-2';
            }
        }
    }
    
    updateVideoFeed() {
        if (!this.videoStream) return;
        
        // Send mode change to backend first
        if (this.isStreaming) {
            this.sendModeChangeToBackend(this.currentStreamMode);
        }

        if (this.currentStreamMode === 'raw') {
            // Raw mode with overlay for detections
            this.videoStream.src = `${this.apiBaseUrl}/video-feed/raw?t=${Date.now()}`;
            if (this.overlay) {
                this.overlay.style.display = 'block';
            }
        } else {
            // Processed mode (AI processed video)
            this.videoStream.src = `${this.apiBaseUrl}/video-feed/processed?t=${Date.now()}`;
            if (this.overlay) {
                this.overlay.style.display = 'none';
                this.ctx?.clearRect(0, 0, this.overlay.width, this.overlay.height);
            }
        }
        
        this.videoStream.onload = () => {
            console.log('Video feed loaded');
            this.calculateScaleFactors();
        };
        
        this.videoStream.onerror = () => {
            console.error('Video feed error');
            this.showNotification('error', 'Video feed connection lost');
        };
    }
    
    stopVideoFeed() {
        if (this.videoStream) {
            this.videoStream.src = 'https://via.placeholder.com/480x270';
        }
    }
    
    async fetchDetectionData() {
        if (!this.isStreaming || this.currentStreamMode !== 'raw') return;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/detection-data`);
            const data = await response.json();
            
            // Draw detections on overlay
            this.drawDetections(data.objects || []);
            
        } catch (error) {
            // Silently fail to avoid console spam
            if (this.isStreaming) {
                console.error('Error fetching detection data:', error);
            }
        }
    }
    
    async fetchStats() {
        if (!this.isStreaming) return;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/stats`);
            const data = await response.json();
            
            // Update vehicle counts
            this.updateVehicleCounts(data);
            
        } catch (error) {
            if (this.isStreaming) {
                console.error('Error fetching stats:', error);
            }
        }
    }
    
    drawDetections(objects) {
        if (!this.ctx || !objects.length) {
            if (this.ctx) {
                this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
            }
            return;
        }
        
        // Clear previous drawings
        this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        
        // Set drawing style
        this.ctx.strokeStyle = '#00ff00'; // Bright green
        this.ctx.lineWidth = 2;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#00ff00';
        
        objects.forEach(obj => {
            if (obj.bbox && obj.bbox.length === 4) {
                const [x1, y1, x2, y2] = obj.bbox;
                
                // Scale coordinates
                const scaledX = x1 * this.scaleFactors.x;
                const scaledY = y1 * this.scaleFactors.y;
                const scaledW = (x2 - x1) * this.scaleFactors.x;
                const scaledH = (y2 - y1) * this.scaleFactors.y;
                
                // Draw bounding box
                this.ctx.strokeRect(scaledX, scaledY, scaledW, scaledH);
                
                // Draw label with background
                const label = `${obj.label} ${Math.round(obj.confidence * 100)}%`;
                const textMetrics = this.ctx.measureText(label);
                const textWidth = textMetrics.width;
                
                // Draw label background
                this.ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
                this.ctx.fillRect(scaledX, scaledY - 16, textWidth + 8, 14);
                
                // Draw label text
                this.ctx.fillStyle = '#000000';
                this.ctx.fillText(label, scaledX + 4, scaledY - 4);
                
                // Reset fill style
                this.ctx.fillStyle = '#00ff00';
            }
        });
    }
    
    updateVehicleCounts(data) {
        const vehicleCounts = data.vehicle_counts || {};
        const totalCount = data.total_count || 0;
        
        // Update individual vehicle counts
        if (this.countElements.car) {
            this.countElements.car.textContent = vehicleCounts.car || 0;
        }
        if (this.countElements.truck) {
            this.countElements.truck.textContent = vehicleCounts.truck || 0;
        }
        if (this.countElements.bicycle) {
            this.countElements.bicycle.textContent = vehicleCounts.bicycle || 0;
        }
        if (this.countElements.motorbike) {
            this.countElements.motorbike.textContent = vehicleCounts.motorbike || 0;
        }
        if (this.countElements.total) {
            this.countElements.total.textContent = totalCount;
        }
    }
    
    async checkLivestreamStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/livestream-status`);
            const data = await response.json();
            
            const wasStreaming = this.isStreaming;
            this.isStreaming = data.running;
            
            // If status changed, update accordingly
            if (wasStreaming !== this.isStreaming) {
                if (this.isStreaming) {
                    // Backend says streaming is active
                    this.updateVideoFeed();
                    this.startPolling();
                } else {
                    // Backend says streaming is stopped
                    this.stopVideoFeed();
                    this.stopPolling();
                    if (this.ctx) {
                        this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
                    }
                }
                
                this.updateButtonStates();
                console.log(`Livestream status synced: ${this.isStreaming ? 'active' : 'stopped'}`);
            }
            
        } catch (error) {
            console.error('Error checking livestream status:', error);
        }
    }
    
    updateButtonStates() {
        if (this.startBtn) {
            this.startBtn.disabled = this.isStreaming;
        }
        if (this.stopBtn) {
            this.stopBtn.disabled = !this.isStreaming;
        }
    }
    
    startPolling() {
        // Only poll detection data in raw mode to avoid unnecessary requests
        if (this.currentStreamMode === 'raw') {
            if (!this.detectionInterval) {
                this.detectionInterval = setInterval(() => {
                    this.fetchDetectionData();
                }, 200);
            }
        } else {
            // Stop detection polling in processed mode (AI handles everything)
            if (this.detectionInterval) {
                clearInterval(this.detectionInterval);
                this.detectionInterval = null;
            }
        }
        
        // Always poll stats
        if (!this.statsInterval) {
            this.statsInterval = setInterval(() => {
                this.fetchStats();
            }, 2000);
        }
    }
    
    stopPolling() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }
    }
    
    startStatusChecking() {
        // Check status every 5 seconds to sync with backend
        if (!this.statusInterval) {
            this.statusInterval = setInterval(() => {
                this.checkLivestreamStatus();
            }, 5000);
        }
    }
    
    showNotification(type, message) {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${
            type === 'success' ? 'bg-green-600 text-white' : 
            type === 'error' ? 'bg-red-600 text-white' : 
            'bg-blue-600 text-white'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
    
    // Cleanup method
    destroy() {
        this.stopPolling();
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }

        if (this.dateTimeInterval) {
            clearInterval(this.dateTimeInterval);
            this.dateTimeInterval = null;
        }
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to initialize
    setTimeout(() => {
        window.livestreamManager = new LivestreamManager();
    }, 100);
});

// Global functions for external access if needed
window.startLivestream = () => {
    if (window.livestreamManager) {
        window.livestreamManager.startLivestream();
    }
};

window.stopLivestream = () => {
    if (window.livestreamManager) {
        window.livestreamManager.stopLivestream();
    }
};

export default LivestreamManager;