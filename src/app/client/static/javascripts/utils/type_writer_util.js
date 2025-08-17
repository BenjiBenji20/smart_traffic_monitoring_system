export async function typewriterEffect(element, text, speed = 20) {
    if (!element) return;
    
    // Clear and set initial styles
    element.innerHTML = '';
    element.classList.add('custom-scrollbar');
    element.style.overflowY = 'auto';
    element.style.maxHeight = '200px';
    element.style.whiteSpace = 'pre-wrap';
    
    let i = 0;
    let isScrolling = false;
    const tempDiv = document.createElement('div');
    tempDiv.style.visibility = 'hidden';
    document.body.appendChild(tempDiv);
    
    return new Promise((resolve) => {
        const typing = setInterval(() => {
            if (i < text.length) {
                const char = text.charAt(i);
                element.innerHTML += char === '\n' ? '<br>' : char;
                i++;
                
                const { scrollTop, scrollHeight, clientHeight } = element;
                if (scrollTop >= scrollHeight - clientHeight - 50 || !isScrolling) {
                    isScrolling = true;
                    element.scrollTop = scrollHeight;
                }
                
                tempDiv.innerHTML = element.innerHTML;
                if (tempDiv.offsetHeight >= 200) isScrolling = false;
            } else {
                clearInterval(typing);
                document.body.removeChild(tempDiv);
                resolve();
            }
        }, speed);
    });
}

export async function renderAIRecommendation(container, recommendation) {
    if (!container) return;

    try {
        // Store original full recommendation
        const fullRecommendation = recommendation;
        
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
            
        await typewriterEffect(container, displayText);
        
        // Add toggle button if text was trimmed
        if (fullRecommendation.length > maxChars) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'toggle-recommendation-btn';
            toggleBtn.innerHTML = `
                <i class="fas fa-chevron-down mr-1"></i>
                Show Full Recommendation
            `;
            
            let isExpanded = false;
            toggleBtn.onclick = () => {
                if (!isExpanded) {
                    container.innerHTML = fullRecommendation.replace(/\n/g, '<br>');
                    container.style.maxHeight = 'none';
                    toggleBtn.innerHTML = `
                        <i class="fas fa-chevron-up mr-1"></i>
                        Show Less
                    `;
                } else {
                    container.innerHTML = displayText.replace(/\n/g, '<br>');
                    container.style.maxHeight = '200px';
                    toggleBtn.innerHTML = `
                        <i class="fas fa-chevron-down mr-1"></i>
                        Show Full Recommendation
                    `;
                }
                isExpanded = !isExpanded;
            };
            
            container.parentNode.insertBefore(toggleBtn, container.nextSibling);
        }
    } catch (error) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle mr-2"></i>
                ${error.message || 'Recommendation unavailable'}
            </div>
        `;
    }
}