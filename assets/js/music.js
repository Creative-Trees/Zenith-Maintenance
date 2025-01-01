  // Play background music
  document.addEventListener('DOMContentLoaded', function() {
    const music = document.getElementById('background-music');
    music.play().catch(error => {
        console.error('Failed to play music:', error);
    });
});