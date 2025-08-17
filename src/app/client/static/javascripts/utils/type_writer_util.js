// Global variable to track active animations
let activeAnimations = new Map();

export async function typewriterEffect(element, text, speed = 20, animationId = 'default') {
    if (!element) return;
    
    // Cancel any existing animation for this element
    if (activeAnimations.has(animationId)) {
        clearInterval(activeAnimations.get(animationId));
        activeAnimations.delete(animationId);
    }
    
    // Clear and set initial styles
    element.innerHTML = '';
    element.classList.add('custom-scrollbar');
    element.style.overflowY = 'auto';
    element.style.maxHeight = '200px';
    element.style.whiteSpace = 'pre-wrap';
    element.style.lineHeight = '1.5';
    element.style.minHeight = '0';
    
    let i = 0;
    
    return new Promise((resolve, reject) => {
        const typing = setInterval(() => {
            // Check if animation was cancelled
            if (!activeAnimations.has(animationId)) {
                clearInterval(typing);
                reject(new Error('Animation cancelled'));
                return;
            }
            
            if (i < text.length) {
                const char = text.charAt(i);
                element.innerHTML += char === '\n' ? '<br>' : char;
                i++;
                
                // Auto-scroll to bottom
                const { scrollTop, scrollHeight, clientHeight } = element;
                if (scrollHeight > clientHeight) {
                    element.scrollTop = scrollHeight;
                }
            } else {
                clearInterval(typing);
                activeAnimations.delete(animationId);
                element.scrollTop = element.scrollHeight;
                resolve();
            }
        }, speed);
        
        // Store the interval ID
        activeAnimations.set(animationId, typing);
    });
}

// Function to cancel specific animation
export function cancelTypewriterAnimation(animationId) {
    if (activeAnimations.has(animationId)) {
        clearInterval(activeAnimations.get(animationId));
        activeAnimations.delete(animationId);
    }
}

// Added unique identifier parameter to prevent button conflicts
export async function renderAIRecommendation(container, recommendation, identifier = 'default') {
    if (!container) return;

    try {
        // Cancel any ongoing animation for this identifier
        cancelTypewriterAnimation(identifier);
        
        // Store original full recommendation
        const fullRecommendation = recommendation;
        
        // Clear any existing toggle buttons for this specific container/identifier
        const existingToggleBtn = container.parentNode.querySelector(`.toggle-recommendation-btn[data-identifier="${identifier}"]`);
        if (existingToggleBtn) {
            existingToggleBtn.remove();
        }
        
        // Loading state
        container.innerHTML = `
            <div class="loading-placeholder">
                <i class="fas fa-circle-notch fa-spin mr-2"></i> Generating recommendations...
            </div>
        `;
        
        // Trim if needed
        const maxChars = 1500;
        const displayText = fullRecommendation.length > maxChars 
            ? fullRecommendation.substring(0, maxChars) + '...' 
            : fullRecommendation;
            
        try {
            await typewriterEffect(container, displayText, 20, identifier);
        } catch (error) {
            if (error.message === 'Animation cancelled') {
                return; // Don't proceed if animation was cancelled
            }
            throw error;
        }
        
        // Add toggle button if text was trimmed
        if (fullRecommendation.length > maxChars) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'toggle-recommendation-btn';
            toggleBtn.setAttribute('data-identifier', identifier);
            toggleBtn.innerHTML = `
                <i class="fas fa-chevron-down mr-1"></i>
                Show Full Recommendation
            `;
            
            let isExpanded = false;
            
            // Replace the entire toggle button onclick handler with this:
            toggleBtn.onclick = async () => {
                toggleBtn.disabled = true;
                
                if (!isExpanded) {
                    // Expanding: Cancel animation and show full text immediately
                    cancelTypewriterAnimation(identifier);
                    container.innerHTML = fullRecommendation.replace(/\n/g, '<br>');
                    container.style.maxHeight = 'none';
                    toggleBtn.innerHTML = `
                        <i class="fas fa-chevron-up mr-1"></i>
                        Show Less
                    `;
                } else {
                    // Collapsing: Show truncated text WITHOUT animation
                    cancelTypewriterAnimation(identifier);
                    container.innerHTML = displayText.replace(/\n/g, '<br>');
                    container.style.maxHeight = '200px';
                    container.scrollTop = container.scrollHeight; // Scroll to bottom
                    toggleBtn.innerHTML = `
                        <i class="fas fa-chevron-down mr-1"></i>
                        Show Full Recommendation
                    `;
                }
                
                isExpanded = !isExpanded;
                toggleBtn.disabled = false;
            };
            
            if (container.nextSibling) {
                container.parentNode.insertBefore(toggleBtn, container.nextSibling);
            } else {
                container.parentNode.appendChild(toggleBtn);
            }
        }
    } catch (error) {
        console.error('renderAIRecommendation error:', error);
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle mr-2"></i>
                ${error.message || 'Recommendation unavailable'}
            </div>
        `;
    }
}