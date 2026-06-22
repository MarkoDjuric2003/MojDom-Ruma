document.addEventListener('DOMContentLoaded', function () {
  const dropdowns = document.querySelectorAll('.navbar .dropdown');
  dropdowns.forEach(function (dropdown) {
    dropdown.addEventListener('mouseenter', function () {
      if (window.innerWidth >= 992) {
        const toggle = dropdown.querySelector('[data-bs-toggle=\"dropdown\"]');
        bootstrap.Dropdown.getOrCreateInstance(toggle).show();
      }
    });
    dropdown.addEventListener('mouseleave', function () {
      if (window.innerWidth >= 992) {
        const toggle = dropdown.querySelector('[data-bs-toggle=\"dropdown\"]');
        bootstrap.Dropdown.getOrCreateInstance(toggle).hide();
      }
    });
  });
});

// Filter sistem za proizvode: dimenzija/sirina i kolekcija
(function () {
  function uniqueChecked(filterType) {
    return Array.from(document.querySelectorAll('.product-filter[data-filter="' + filterType + '"]:checked'))
      .map(function (input) { return input.value; });
  }

  function hasAny(productValues, selectedValues) {
    if (selectedValues.length === 0) return true;
    return selectedValues.some(function (value) { return productValues.includes(value); });
  }

  function applyProductFilters() {
    const productItems = document.querySelectorAll('.product-item');
    if (!productItems.length) return;

    const selectedDimensions = uniqueChecked('dimension');
    const selectedWidths = uniqueChecked('width');
    const selectedCollections = uniqueChecked('collection');
    let visibleCount = 0;

    productItems.forEach(function (item) {
      const itemDimensions = (item.dataset.dimensions || '').split(' ').filter(Boolean);
      const itemWidths = (item.dataset.widths || '').split(' ').filter(Boolean);
      const itemCollection = item.dataset.collection || '';

      const matchesDimensions = hasAny(itemDimensions, selectedDimensions);
      const matchesWidths = hasAny(itemWidths, selectedWidths);
      const matchesCollection = selectedCollections.length === 0 || selectedCollections.includes(itemCollection);
      const show = matchesDimensions && matchesWidths && matchesCollection;

      item.classList.toggle('is-hidden', !show);
      if (show) visibleCount += 1;
    });

    const noResults = document.getElementById('noResults');
    if (noResults) noResults.classList.toggle('d-none', visibleCount !== 0);
  }

  document.addEventListener('change', function (event) {
    if (!event.target.classList.contains('product-filter')) return;

    const filter = event.target.dataset.filter;
    const value = event.target.value;
    const checked = event.target.checked;

    document.querySelectorAll('.product-filter[data-filter="' + filter + '"][value="' + value + '"]').forEach(function (sameInput) {
      sameInput.checked = checked;
    });

    applyProductFilters();
  });

  document.addEventListener('click', function (event) {
    if (!event.target.classList.contains('reset-filters')) return;
    document.querySelectorAll('.product-filter').forEach(function (input) { input.checked = false; });
    applyProductFilters();
  });

  document.addEventListener('DOMContentLoaded', applyProductFilters);
})();

// Klik na sliku proizvoda otvara galeriju sa strelicama i swipe podrskom.
(function () {
  function ensureGalleryModal() {
    let modal = document.getElementById('productGalleryModal');
    if (modal) return modal;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal fade gallery-modal" id="productGalleryModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5 class="modal-title" id="productGalleryTitle">Galerija proizvoda</h5>
                <div class="gallery-help-text"></div>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Zatvori"></button>
            </div>
            <div class="modal-body p-0">
              <div id="productGalleryCarousel" class="carousel slide" data-bs-touch="true">
                <div class="carousel-inner" id="productGalleryInner"></div><div class="gallery-zoom-note">Točkićem miša uvećaj/smanji sliku • dvoklik za reset</div>
                <button class="carousel-control-prev" type="button" data-bs-target="#productGalleryCarousel" data-bs-slide="prev">
                  <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span class="visually-hidden">Prethodna</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#productGalleryCarousel" data-bs-slide="next">
                  <span class="carousel-control-next-icon" aria-hidden="true"></span>
                  <span class="visually-hidden">Sledeća</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(wrapper.firstElementChild);
    return document.getElementById('productGalleryModal');
  }

  function getProductTitle(card, clicked) {
    const title = card.querySelector('.card-title, h3, h5');
    return (title && title.textContent.trim()) || clicked.textContent.trim() || 'Proizvod';
  }

  function getGalleryItems(card, clicked) {
    const source = clicked.dataset.gallery || card.dataset.gallery || '';
    if (source.trim()) {
      return source.split(',').map(function (src) { return src.trim(); }).filter(Boolean);
    }

    const img = clicked.matches('img') ? clicked : card.querySelector('img');
    if (img && img.getAttribute('src')) {
      return [img.getAttribute('src')];
    }

    return [];
  }

  function openProductGallery(card, clicked) {
    const modal = ensureGalleryModal();
    const title = getProductTitle(card, clicked);
    const images = getGalleryItems(card, clicked);
    const inner = modal.querySelector('#productGalleryInner');
    const titleEl = modal.querySelector('#productGalleryTitle');

    titleEl.textContent = title;
    inner.innerHTML = '';

    if (images.length) {
      images.forEach(function (src, index) {
        const item = document.createElement('div');
        item.className = 'carousel-item' + (index === 0 ? ' active' : '');
        item.innerHTML = '<img class="gallery-slide-img" src="' + src + '" alt="' + title + ' slika ' + (index + 1) + '">';
        inner.appendChild(item);
      });
    } else {
      for (let i = 1; i <= 3; i += 1) {
        const item = document.createElement('div');
        item.className = 'carousel-item' + (i === 1 ? ' active' : '');
        item.innerHTML = '<div class="gallery-placeholder-slide"><span>' + title + ' — slika ' + i + '</span></div>';
        inner.appendChild(item);
      }
    }

    const carousel = bootstrap.Carousel.getOrCreateInstance(modal.querySelector('#productGalleryCarousel'), {
      interval: false,
      touch: true,
      keyboard: true
    });
    carousel.to(0);
    bootstrap.Modal.getOrCreateInstance(modal).show();
  }

  function resetImageZoom(img) {
    if (!img) return;
    img.dataset.scale = '1';
    img.dataset.panX = '0';
    img.dataset.panY = '0';
    img.style.transform = 'translate(0px, 0px) scale(1)';
    img.classList.remove('is-zoomed', 'is-dragging');
  }

  function applyImageZoom(img) {
    const scale = parseFloat(img.dataset.scale || '1');
    const panX = parseFloat(img.dataset.panX || '0');
    const panY = parseFloat(img.dataset.panY || '0');
    img.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + scale + ')';
    img.classList.toggle('is-zoomed', scale > 1.01);
  }

  function resetAllZoomedImages(modal) {
    modal.querySelectorAll('.gallery-slide-img').forEach(resetImageZoom);
  }

  document.addEventListener('click', function (event) {
    const clicked = event.target.closest('.product-card .product-img-placeholder, .product-card img');
    if (!clicked) return;

    const card = clicked.closest('.product-card');
    if (!card) return;

    openProductGallery(card, clicked);
  });

  document.addEventListener('wheel', function (event) {
    const img = event.target.closest('#productGalleryModal .gallery-slide-img');
    if (!img) return;
    event.preventDefault();

    const current = parseFloat(img.dataset.scale || '1');
    const direction = event.deltaY < 0 ? 0.18 : -0.18;
    const next = Math.min(3.2, Math.max(1, current + direction));

    if (next === 1) {
      img.dataset.panX = '0';
      img.dataset.panY = '0';
    }

    img.dataset.scale = String(next);
    applyImageZoom(img);
  }, { passive: false });

  document.addEventListener('dblclick', function (event) {
    const img = event.target.closest('#productGalleryModal .gallery-slide-img');
    if (!img) return;
    resetImageZoom(img);
  });

  let dragState = null;

  document.addEventListener('mousedown', function (event) {
    const img = event.target.closest('#productGalleryModal .gallery-slide-img');
    if (!img || parseFloat(img.dataset.scale || '1') <= 1.01) return;
    event.preventDefault();
    dragState = {
      img: img,
      startX: event.clientX,
      startY: event.clientY,
      panX: parseFloat(img.dataset.panX || '0'),
      panY: parseFloat(img.dataset.panY || '0')
    };
    img.classList.add('is-dragging');
  });

  document.addEventListener('mousemove', function (event) {
    if (!dragState) return;
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    dragState.img.dataset.panX = String(dragState.panX + dx);
    dragState.img.dataset.panY = String(dragState.panY + dy);
    applyImageZoom(dragState.img);
  });

  document.addEventListener('mouseup', function () {
    if (!dragState) return;
    dragState.img.classList.remove('is-dragging');
    dragState = null;
  });

  document.addEventListener('slide.bs.carousel', function (event) {
    if (event.target && event.target.id === 'productGalleryCarousel') {
      resetAllZoomedImages(document.getElementById('productGalleryModal'));
    }
  });
})();

/* galleryDotsBootstrapCarouselFix */
(function(){
  let galleryLength = 0;

  function ensureDots(){
    let box = document.getElementById('galleryIndicators');
    if(!box){
      box = document.createElement('div');
      box.id = 'galleryIndicators';
      box.className = 'gallery-indicators-custom';
      document.body.appendChild(box);
    }
    return box;
  }

  function hideDots(){
    const box = document.getElementById('galleryIndicators');
    if(box){
      box.style.display = 'none';
      box.innerHTML = '';
    }
  }

  function modalOpen(){
    const modal = document.getElementById('productGalleryModal');
    return !!(modal && modal.classList.contains('show'));
  }

  function activeIndex(){
    const items = Array.from(document.querySelectorAll('#productGalleryCarousel .carousel-item'));
    if(!items.length) return 0;
    const idx = items.findIndex(item => item.classList.contains('active'));
    return idx < 0 ? 0 : idx;
  }

  function renderDots(index){
    if(!modalOpen() || galleryLength <= 1){
      hideDots();
      return;
    }

    const box = ensureDots();
    box.innerHTML = Array.from({length: galleryLength}).map((_, i) =>
      '<span class="gallery-dot ' + (i === index ? 'active' : '') + '"></span>'
    ).join('');
    box.style.display = 'flex';
  }

  function updateFromCarousel(){
    const items = document.querySelectorAll('#productGalleryCarousel .carousel-item');
    galleryLength = items.length;
    renderDots(activeIndex());
  }

  document.addEventListener('click', function(e){
    const img = e.target.closest && e.target.closest('.product-card-img, .product-img-placeholder');
    if(img){
      setTimeout(updateFromCarousel, 80);
      setTimeout(updateFromCarousel, 250);
      return;
    }

    if(e.target.closest && (
      e.target.closest('.carousel-control-next') ||
      e.target.closest('.carousel-control-prev') ||
      e.target.closest('[data-bs-slide]')
    )){
      setTimeout(updateFromCarousel, 120);
      setTimeout(updateFromCarousel, 300);
    }

    if(e.target.closest && (
      e.target.closest('.btn-close') ||
      e.target.closest('[data-bs-dismiss="modal"]') ||
      e.target.closest('.modal-backdrop')
    )){
      setTimeout(hideDots, 120);
    }
  }, true);

  document.addEventListener('slid.bs.carousel', function(e){
    if(e.target && e.target.id === 'productGalleryCarousel'){
      const idx = typeof e.to === 'number' ? e.to : activeIndex();
      renderDots(idx);
    }
  });

  document.addEventListener('shown.bs.modal', function(e){
    if(e.target && e.target.id === 'productGalleryModal'){
      setTimeout(updateFromCarousel, 50);
    }
  });

  document.addEventListener('hidden.bs.modal', function(e){
    if(e.target && e.target.id === 'productGalleryModal'){
      hideDots();
    }
  });

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') setTimeout(hideDots, 80);
    if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){
      setTimeout(updateFromCarousel, 150);
    }
  });

  setInterval(function(){
    if(!modalOpen()) hideDots();
  }, 300);
})();
