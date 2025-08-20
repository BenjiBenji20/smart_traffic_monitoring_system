// Scroll animation
document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('.section');
  
  const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              entry.target.classList.add('visible');
          }
      });
  }, {
      threshold: 0.1
  });
  
  sections.forEach(section => {
      observer.observe(section);
  });
  
  // Create traffic flow animation lines
  function createTrafficLines() {
      const container = document.body;
      const lineCount = 8;
      
      for (let i = 0; i < lineCount; i++) {
          const line = document.createElement('div');
          line.className = 'traffic-line';
          
          // Random properties
          const width = Math.floor(Math.random() * 100) + 50;
          const top = Math.floor(Math.random() * 100);
          const delay = Math.floor(Math.random() * 8);
          const opacity = Math.random() * 0.3 + 0.2;
          
          line.style.width = `${width}px`;
          line.style.top = `${top}%`;
          line.style.animationDelay = `${delay}s`;
          line.style.opacity = opacity;
          
          container.appendChild(line);
      }
  }
  
  createTrafficLines();
  
  // Floating shapes animation
  function createFloatingShapes() {
      const container = document.body;
      const shapeCount = 4;
      
      for (let i = 0; i < shapeCount; i++) {
          const shape = document.createElement('div');
          shape.className = 'floating-shape';
          
          // Random properties
          const size = Math.floor(Math.random() * 200) + 100;
          const left = Math.floor(Math.random() * 100);
          const top = Math.floor(Math.random() * 100);
          const duration = Math.floor(Math.random() * 20) + 10;
          const delay = Math.floor(Math.random() * 10);
          
          shape.style.width = `${size}px`;
          shape.style.height = `${size}px`;
          shape.style.left = `${left}%`;
          shape.style.top = `${top}%`;
          shape.style.animationDuration = `${duration}s`;
          shape.style.animationDelay = `${delay}s`;
          
          container.appendChild(shape);
      }
  }
  
  createFloatingShapes();
});