export function downloadNotification(type, message) {
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
