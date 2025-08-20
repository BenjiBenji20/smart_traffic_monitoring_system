document.addEventListener('DOMContentLoaded', function() {
    // Show signup card with animation
    document.getElementById('signup-card').style.animation = 'fadeIn 0.5s ease-out forwards';
    
    // Toggle between signup and signin forms
    document.getElementById('show-signin').addEventListener('click', function() {
        document.getElementById('signup-card').classList.add('hidden');
        document.getElementById('signin-card').classList.remove('hidden');
        document.getElementById('signin-card').style.animation = 'fadeIn 0.5s ease-out forwards';
    });
    
    document.getElementById('show-signup').addEventListener('click', function() {
        document.getElementById('signin-card').classList.add('hidden');
        document.getElementById('signup-card').classList.remove('hidden');
        document.getElementById('signup-card').style.animation = 'fadeIn 0.5s ease-out forwards';
    });
    
    // Add focus effects to input fields
    const inputFields = document.querySelectorAll('.input-field');
    inputFields.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.boxShadow = '0 0 0 2px rgba(0, 194, 255, 0.5)';
        });
        
        input.addEventListener('blur', function() {
            this.style.boxShadow = 'none';
        });
    });
});

// Notification function
export function showNotification(message, type = 'success') {
    const toastContainer = document.getElementById('notification-toast');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                ${type === 'success' ? 
                    '<svg class="h-5 w-5 text-[#00C2FF]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>' : 
                    '<svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>'}
            </div>
            <div class="ml-3">
                <p class="text-sm">${message}</p>
            </div>
        </div>
    `;
    
    toastContainer.appendChild(notification);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}