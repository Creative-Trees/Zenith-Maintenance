  // Play background music
  document.addEventListener('DOMContentLoaded', () => {
      const music = document.getElementById('background-music');
      if (music) {
          music.play().catch(error => {
              console.error('Failed to play music:', error);
              showAutoplayNotice();
          });
      } else {
          console.error('Background music element not found');
      }
  });
  
  // Show autoplay notice if music playback fails
  function showAutoplayNotice() {
      const autoplayNotice = document.getElementById('autoplay-notice');
      if (autoplayNotice) {
          autoplayNotice.classList.add('show');
          setTimeout(() => {
              autoplayNotice.classList.remove('show');
          }, 5000); // Hide after 5 seconds
      } else {
          console.error('Autoplay notice element not found');
      }
  }