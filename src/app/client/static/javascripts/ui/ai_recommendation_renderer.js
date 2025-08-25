export class AIRecommendationRenderer {
  constructor() {
    this.currentAnimations = new Map();
  }

  async renderRecommendation(containerId, period, recommendationData, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const {
      showLoading = true,
      animationType = 'typewriter',
      animationId = period
    } = options;

    // Cancel any existing animation for this period
    this.cancelAnimation(animationId);
    
    // Show loading if requested
    if (showLoading) {
      container.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Loading insight...';
    }
    
    // Clear any existing toggle buttons
    const existingToggleBtn = container.parentNode.querySelector('.toggle-recommendation-btn');
    if (existingToggleBtn) {
      existingToggleBtn.remove();
    }
    
    // Get the recommendation text for this period
    const recommendationKey = period + "_reco";
    const recommendationText = recommendationData[recommendationKey];
    
    if (recommendationText) {
      if (animationType === 'typewriter') {
        await this.renderWithTypewriter(container, recommendationText, animationId);
      } else {
        // Simple render without animation
        container.innerHTML = `<div class="text-sm text-accent2">${recommendationText}</div>`;
      }
    } else {
      container.innerHTML = `
        <div class="text-yellow-400">
          <i class="fas fa-info-circle mr-2"></i>
          No specific recommendations available for ${period} period
        </div>
      `;
    }
  }

  async renderWithTypewriter(container, text, animationId) {
    // Import cancellation function dynamically
    try {
      const { renderAIRecommendation } = await import('../utils/type_writer_util.js');
      await renderAIRecommendation(container, text, animationId);
    } catch (error) {
      console.error('Typewriter animation failed, falling back to simple render:', error);
      container.innerHTML = `<div class="text-sm text-accent2">${text}</div>`;
    }
  }

  async cancelAnimation(animationId) {
    try {
      const { cancelTypewriterAnimation } = await import('../utils/type_writer_util.js');
      cancelTypewriterAnimation(animationId);
    } catch (error) {
      // Silently handle if cancellation utility is not available
    }
  }

  renderError(containerId, message = 'Failed to load recommendations') {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="text-red-400">
          <i class="fas fa-exclamation-circle mr-2"></i>
          ${message}
        </div>
      `;
    }
  }
}