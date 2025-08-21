import { fetchJSONFile, fetchExcelFile } from "../api/download_file_api.js";
import { downloadNotification } from "../utils/notification_util.js"

const modal = document.getElementById('downloadModal');


async function downloadJSON() {
  try {
    const response = await fetchJSONFile()

    if (!response.success) {
      modal.classList.remove('show');
      downloadNotification("error", "Failed to download JSON file");
    }

    modal.classList.remove('show');
    downloadNotification(response.success, response.message);
  } catch (error) {
    modal.classList.remove('show');
    downloadNotification("error", "An unexpected error occured while downloading the JSON File");
    console.error("Error downloading JSON file:", error);
    throw error;
  }
}


async function downloadExcel() {
  try {
    const response = await fetchExcelFile()

    if (!response.success) {
      modal.classList.remove('show');
      downloadNotification("error", "Failed to download Excel file");
    }

    modal.classList.remove('show');
    downloadNotification(response.success, response.message);
  } catch (error) {
    modal.classList.remove('show');
    downloadNotification("error", "An unexpected error occured while downloading the Excel File");
    console.error("Error downloading Excel file:", error);
    throw error;
  }
}


function downloadPDF() {
  // Your PDF download logic
  downloadNotification('Creating PDF report...', 'success');
}


function downloadAll() {
  // Your package download logic
  downloadNotification('Packaging all formats...', 'success');
}


function downloadReport(format) {
  // Add your download logic here
  console.log(`Downloading ${format} report...`);
  
  // Example download functions (implement based on your backend)
  switch(format) {
    case 'json':
      downloadJSON();
      break;
    case 'excel':
      downloadExcel();
      break;
    case 'pdf':
      downloadPDF();
      break;
    case 'all':
      downloadAll();
      break;
  }
}


document.addEventListener('DOMContentLoaded', async () => {
  const downloadBtn = document.getElementById('downloadBtn');
  const modal = document.getElementById('downloadModal');
  const closeBtn = document.querySelector('.close-modal');
  
  // Open modal
  downloadBtn.addEventListener('click', function() {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  });
  
  // Close modal
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
  });
  
  // Handle download options
  document.querySelectorAll('.download-option').forEach(option => {
    option.addEventListener('click', function() {
      const format = this.dataset.format;
      downloadReport(format);
      closeModal();
    });
  });
  
  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
  });

  function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
});