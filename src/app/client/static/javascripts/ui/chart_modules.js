import { AIRecommendationRenderer } from './ai_recommendation_renderer.js';
import { ChartRenderer } from './chart_renderer.js';

export class ChartRecommendationManager {
  constructor(options = {}) {
    this.chartRenderer = new ChartRenderer();
    this.recommendationRenderer = new AIRecommendationRenderer();
    this.canvasId = options.canvasId || 'trafficChart';
    this.recommendationId = options.recommendationId || 'chartInsight';
    this.currentData = null;
  }

  async renderBoth(period, chartType, trafficData, recommendationData) {
    this.currentData = { trafficData, recommendationData };
    
    // Start both processes simultaneously
    const chartPromise = this.chartRenderer.renderChart(
      this.canvasId, 
      period, 
      chartType, 
      trafficData
    );

    const recommendationPromise = this.recommendationRenderer.renderRecommendation(
      this.recommendationId,
      period,
      recommendationData,
      { animationId: period }
    );

    // Wait for both to complete, but don't let one block the other
    await Promise.allSettled([chartPromise, recommendationPromise]);
  }

  updateActiveTab(activeElement, className) {
    this.chartRenderer.updateActiveTab(activeElement, className);
  }

  destroy() {
    this.chartRenderer.destroy();
  }

  // Re-render with current data but different period/type
  async switchPeriod(period, chartType = null) {
    if (this.currentData) {
      const type = chartType || this.chartRenderer.currentChartType;
      await this.renderBoth(
        period, 
        type, 
        this.currentData.trafficData, 
        this.currentData.recommendationData
      );
    }
  }

  async switchChartType(chartType) {
    if (this.currentData) {
      await this.renderBoth(
        this.chartRenderer.currentPeriod,
        chartType,
        this.currentData.trafficData,
        this.currentData.recommendationData
      );
    }
  }
}


export class HistoryListRenderer {
  constructor(options = {}) {
    this.onItemClick = options.onItemClick || null;
    this.onOptionsClick = options.onOptionsClick || null;
    this.containerSelector = options.containerSelector || '.space-y-2';
  }

  render(containerId, historyData, options = {}) {
    const container = document.querySelector(`#${containerId} ${this.containerSelector}`);
    if (!container) return;

    const { selectedIndex = 0 } = options;
    
    container.innerHTML = ""; // Clear existing items

    historyData.forEach((item, index) => {
      const historyItem = this.createHistoryItem(item, index, selectedIndex);
      container.appendChild(historyItem);
    });
  }

  createHistoryItem(item, index, selectedIndex) {
    const historyItem = document.createElement("div");
    const isSelected = index === selectedIndex;
    
    historyItem.className = `rounded-lg px-3 py-2 cursor-pointer transition ${
      isSelected 
        ? "bg-white/5 hover:bg-white/10 glow-on-hover border-l-4 border-cyan-400 animate-[fadeUp_0.3s_ease-out]" 
        : "hover:bg-white/5 animate-[fadeUp_0.3s_ease-out]"
    }`;
    
    historyItem.setAttribute("data-metadata-id", item.id);
    historyItem.innerHTML = `
      <div class="flex items-center justify-between w-full">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-white truncate">${item.version_name}</p>
          <p class="text-xs font-semibold text-gray-400 mt-2">${item.created_at}</p>
        </div>
        <span class="options-dot ml-2 text-gray-400 hover:text-white cursor-pointer flex-shrink-0">⋮</span>
      </div>
    `;

    // Add event listeners
    historyItem.addEventListener('click', (e) => {
      if (!e.target.classList.contains('options-dot')) {
        if (this.onItemClick) {
          this.onItemClick(item, historyItem);
        }
      }
    });

    historyItem.querySelector(".options-dot").addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.onOptionsClick) {
        this.onOptionsClick(item.id, historyItem);
      }
    });

    return historyItem;
  }

  updateItemName(id, newName) {
    const listItem = document.querySelector(`[data-metadata-id="${id}"]`);
    if (listItem) {
      const titleElement = listItem.querySelector(".text-white");
      if (titleElement) {
        titleElement.textContent = newName;
      }
    }
  }
}


export class EditableTitleRenderer {
  constructor(options = {}) {
    this.onSave = options.onSave || null;
    this.inputClassName = options.inputClassName || 
      "bg-gray-800 text-white border border-cyan-400 rounded p-1 focus:outline-none";
  }

  makeEditable(titleElement, id, currentText = null) {
    const text = currentText || titleElement.textContent;
    const input = document.createElement("input");
    
    input.type = "text";
    input.value = text;
    input.className = this.inputClassName;
    
    titleElement.innerHTML = "";
    titleElement.appendChild(input);

    input.focus();
    
    const saveHandler = () => this.save(id, input.value, titleElement, text);
    
    input.addEventListener("blur", saveHandler);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") saveHandler();
    });
  }

  async save(id, newText, titleElement, originalText) {
    try {
      if (this.onSave) {
        const result = await this.onSave(id, newText);
        
        // Update with server response or fallback to user input
        const finalText = result?.version_name || newText;
        this.restoreTitle(titleElement, finalText, id);
        
        return result;
      } else {
        // No save callback, just update with user input
        this.restoreTitle(titleElement, newText, id);
        return { version_name: newText };
      }
    } catch (error) {
      console.error("Error saving title:", error);
      // Revert to user input on error
      this.restoreTitle(titleElement, newText, id);
      throw error;
    }
  }

  restoreTitle(titleElement, text, id) {
    titleElement.textContent = text;
    
    // Re-add the double click listener
    const doubleClickHandler = () => this.makeEditable(titleElement, id);
    titleElement.addEventListener("dblclick", doubleClickHandler);
  }

  setupDoubleClick(titleElement, id) {
    const doubleClickHandler = () => this.makeEditable(titleElement, id);
    titleElement.addEventListener("dblclick", doubleClickHandler);
  }
}
