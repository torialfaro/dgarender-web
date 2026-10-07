/* ==========================================================
   DGARENDER - script.js
   - Carrusel infinito (de la última imagen se pasa a la primera)
   - Texto lateral sincronizado con la imagen activa
   - Fallback visual cuando falta una imagen
   ========================================================== */

(function () {
  'use strict';

  /* ---------- Carrusel infinito ---------- */
  const carousel = document.querySelector('[data-carousel]');

  if (carousel) {
    const track = carousel.querySelector('.carousel-track');
    const originals = Array.from(track.children);
    const total = originals.length;
    const prevBtn = carousel.querySelector('.prev');
    const nextBtn = carousel.querySelector('.next');
    const dotsWrap = carousel.querySelector('.carousel-dots');
    const texts = document.querySelectorAll('.work-text');

    let index = 1;          // posición real dentro del track (con clones)
    let animating = false;
    let timer = null;

    // Clones en los extremos: [última] [1] [2] [3] [primera]
    const firstClone = originals[0].cloneNode(true);
    const lastClone = originals[total - 1].cloneNode(true);
    firstClone.setAttribute('aria-hidden', 'true');
    lastClone.setAttribute('aria-hidden', 'true');
    track.appendChild(firstClone);
    track.insertBefore(lastClone, originals[0]);

    // Puntos de navegación
    const dots = originals.map(function (_, i) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Ir a la imagen ' + (i + 1));
      dot.addEventListener('click', function () { move(i + 1); });
      dotsWrap.appendChild(dot);
      return dot;
    });

    function setPosition(animate) {
      track.style.transition = animate ? '' : 'none';
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      if (!animate) {
        void track.offsetWidth;          // fuerza el reflow
        track.style.transition = '';
      }
    }

    function updateUI() {
      const real = (index - 1 + total) % total;
      dots.forEach(function (dot, i) {
        dot.setAttribute('aria-current', i === real ? 'true' : 'false');
      });
      texts.forEach(function (text, i) {
        text.hidden = i !== real;
      });
    }

    // Al terminar la animación en un clon, salta sin animación al slide real
    function finishMove() {
      if (!animating) return;
      if (index === 0) index = total;
      else if (index === total + 1) index = 1;
      setPosition(false);
      animating = false;
    }

    // Al cambiar de slide se pausan los videos (incluidas las copias del bucle)
    function pauseVideos() {
      track.querySelectorAll('video').forEach(function (v) { v.pause(); });
    }

    function move(newIndex) {
      if (animating) return;
      pauseVideos();
      animating = true;
      index = newIndex;
      setPosition(true);
      updateUI();
      clearTimeout(timer);
      timer = setTimeout(finishMove, 550);   // por si no se dispara transitionend
    }

    track.addEventListener('transitionend', function (e) {
      if (e.target !== track) return;
      clearTimeout(timer);
      finishMove();
    });

    prevBtn.addEventListener('click', function () { move(index - 1); });
    nextBtn.addEventListener('click', function () { move(index + 1); });

    // Teclado
    carousel.addEventListener('keydown', function (e) {
      // Con el foco en un video, las flechas son para adelantar/retroceder el video
      if (e.target.closest('video')) return;
      if (e.key === 'ArrowLeft') move(index - 1);
      if (e.key === 'ArrowRight') move(index + 1);
    });

    // Swipe en pantallas táctiles
    let startX = 0;
    let ignoreSwipe = false;
    carousel.addEventListener('touchstart', function (e) {
      // Un gesto sobre la barra de controles de un video no cambia de slide
      const video = e.target.closest('video');
      ignoreSwipe = false;
      if (video) {
        ignoreSwipe = e.touches[0].clientY > video.getBoundingClientRect().bottom - 64;
      }
      startX = e.touches[0].clientX;
    }, { passive: true });
    carousel.addEventListener('touchend', function (e) {
      if (ignoreSwipe) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) move(dx < 0 ? index + 1 : index - 1);
    }, { passive: true });

    setPosition(false);
    updateUI();
  }

  /* ---------- Fallback si falta una imagen ---------- */
  document.querySelectorAll('img[data-fallback]').forEach(function (img) {
    function hide() { img.classList.add('is-missing'); }
    img.addEventListener('error', hide);
    if (img.complete && img.naturalWidth === 0) hide();
  });

  /* ---------- Fallback si un video no se puede reproducir (p. ej. .avi) ---------- */
  document.querySelectorAll('video[data-fallback]').forEach(function (video) {
    function hide() { video.classList.add('is-missing'); }
    // NETWORK_NO_SOURCE (3) sin datos: el navegador descartó todas las <source>
    function check() {
      if (video.networkState === 3 && video.readyState === 0) hide();
    }
    video.addEventListener('error', hide);
    const sources = video.querySelectorAll('source');
    // El error de la última <source> significa que ninguna opción funcionó
    if (sources.length) sources[sources.length - 1].addEventListener('error', hide);
    // El error puede haber ocurrido antes de que cargue este script: se revisa también al terminar de cargar
    check();
    window.addEventListener('load', function () { setTimeout(check, 300); });
  });

  /* ---------- Año del footer ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();