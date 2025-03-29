document.addEventListener('DOMContentLoaded', () => {
    const music = document.getElementById('background-music');

    if (music) {
        const playMusic = () => {
            music.play().then(() => {
                console.log("Music autoplay started successfully.");
            }).catch(error => {
                console.warn('Autoplay blocked, waiting for user interaction.', error);
                showAutoplayNotice();
            });

            // Hapus event listener setelah musik berhasil dimainkan
            document.removeEventListener('click', playMusic);
        };

        // Tambahkan listener click sebagai fallback jika autoplay diblokir
        document.addEventListener('click', playMusic);

        // Coba mainkan musik saat halaman dimuat
        playMusic();
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