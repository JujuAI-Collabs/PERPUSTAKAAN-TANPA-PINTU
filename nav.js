/* PTP bottom navigation V1.2
 * Scoped to an explicitly marked bottom navigation only.
 * Fallback: if data.json fails or this page is not found, leave original HTML intact.
 */
(function () {
  'use strict';

  if (document.getElementById('ptp-bottom-nav')) {
    console.log('[nav.js] navigasi baru sudah ada; tidak membuat duplikat');
    return;
  }

  const oldNav = document.querySelector('#ptp-old-bottom-nav');
  if (!oldNav) {
    console.warn('[nav.js] penanda #ptp-old-bottom-nav tidak ditemukan; navigasi lama dipertahankan');
    return;
  }

  const fileName = window.location.pathname.split('/').pop() || '';
  const currentSlug = fileName.replace(/\.html?$/i, '');

  fetch('./data.json?v=' + Date.now(), { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('data.json HTTP ' + response.status);
      return response.json();
    })
    .then(function (data) {
      if (!data || !Array.isArray(data.seasons)) throw new Error('struktur data.json tidak valid');

      let season = null;
      let currentIndex = -1;

      for (const item of data.seasons) {
        if (!item || !Array.isArray(item.babs)) continue;
        const idx = item.babs.findIndex(function (bab) {
          return bab && bab.slug === currentSlug;
        });
        if (idx !== -1) {
          season = item;
          currentIndex = idx;
          break;
        }
      }

      if (!season || currentIndex < 0) {
        console.warn('[nav.js] bab tidak ditemukan di data.json; navigasi lama dipertahankan');
        return;
      }

      const chapters = season.babs;
      const previous = currentIndex > 0 ? chapters[currentIndex - 1] : null;
      const next = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

      const newNav = document.createElement('div');
      newNav.className = 'nav';
      newNav.id = 'ptp-bottom-nav';
      newNav.dataset.ptpNav = 'bottom';

      function addLink(href, label, className) {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        if (className) link.className = className;
        newNav.appendChild(link);
      }

      if (previous && previous.slug && previous.status === 'ready') {
        addLink(previous.slug + '.html', '←\u00a0Bab sebelumnya');
      }

      addLink('index.html#season' + season.id, 'Kembali ke Arsip / Daftar Isi');

      if (next && next.slug && next.status === 'ready') {
        addLink(next.slug + '.html', 'Bab berikutnya\u00a0→', 'next');
      }

      oldNav.replaceWith(newNav);

      // Remove only the archive duplicate immediately after the replaced bottom nav.
      const arsipExtra = newNav.nextElementSibling;
      if (
        arsipExtra &&
        arsipExtra.matches('div.arsip') &&
        arsipExtra.textContent.toLowerCase().includes('kembali ke arsip')
      ) {
        arsipExtra.remove();
        console.log('[nav.js] menghapus div.arsip duplikat');
      }

      console.log('[nav.js] OK', {
        slug: currentSlug,
        season: season.id,
        previous: previous && previous.status === 'ready' ? previous.slug : null,
        next: next && next.status === 'ready' ? next.slug : null
      });
    })
    .catch(function (error) {
      console.error('[nav.js] gagal memuat navigasi; navigasi lama dipertahankan:', error);
    });
})();
