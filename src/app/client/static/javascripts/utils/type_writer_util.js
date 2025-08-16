export async function typewriterEffect(element, text, speed = 20) {
  element.innerHTML = '';
  let i = 0;
  
  return new Promise((resolve) => {
    const typing = setInterval(() => {
      if (i < text.length) {
        element.innerHTML += text.charAt(i);
        i++;
        element.scrollTop = element.scrollHeight; // Auto-scroll
      } else {
        clearInterval(typing);
        resolve();
      }
    }, speed);
  });
}