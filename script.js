// Firebase Yapılandırması
const firebaseConfig = {
    apiKey: "AIzaSyA16M_6xOrUGEn9YCdzIFxBYXr-9ST7IWY",
    authDomain: "qrmenuapplication-9b920.firebaseapp.com",
    databaseURL: "https://qrmenuapplication-9b920-default-rtdb.firebaseio.com",
    projectId: "qrmenuapplication-9b920",
    storageBucket: "qrmenuapplication-9b920.appspot.com",
    messagingSenderId: "1050979828232",
    appId: "1:1050979828232:web:54d81e21056193bee147bd",
    measurementId: "G-C3S611TREX"
};

// Firebase'i Başlat
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let selectedLanguage = 'tr'; // Varsayılan dil
let categoriesData = {}; // Kategorileri depola
let productsData = {}; // Ürünleri depola
let categoriesHTML = ''; // Kategoriler ilk yüklendiğinde burada saklanacak
let sortedCategories = []; // Sıralanmış kategorileri sakla

// Modal Elementlerini Tanımla
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const modalClose = document.getElementById('modalClose');

// Modal Başlangıçta Gizli
modal.style.display = 'none';

// Modal'ı Kapatma İşlevi
if (modalClose) {
    modalClose.onclick = function() {
        modal.style.display = "none";
    };
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// Dil Ayarlama Fonksiyonu
function setLanguage(lang) {
    selectedLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    fetchMenuItems();
}

// Sayfa Yüklendiğinde Yapılacaklar
document.addEventListener('DOMContentLoaded', () => {
    const lang = localStorage.getItem('selectedLanguage');
    if (lang) {
        selectedLanguage = lang;
    }
    setLanguage(selectedLanguage);

    // QR Menü butonuna tıklama olayı ekle
    const qrMenuLabel = document.getElementById('qrMenuLabel');
    qrMenuLabel.addEventListener('click', () => {
        hideHeaderAndShowCategories();
    });

    // Popstate olayını dinle
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.view === 'categories') {
            showCategoriesView(false);
        } else if (event.state && event.state.view === 'products' && event.state.categoryId) {
            const categoryInfo = categoriesData[event.state.categoryId];
            if (categoryInfo) {
                showCategoryProducts(categoryInfo, false);
            }
        } else {
            // Eğer başka bir durum varsa, varsayılan olarak header'ı göster
            showInitialView(false);
        }
    });

    // Başlangıç Görünümünü Göster ve İlk Durumu Ayarla
    showInitialView(false);
    history.replaceState({ view: 'categories' }, 'Kategoriler', '#categories');
});

// Header'ı Gizle ve Kategorileri Göster
function hideHeaderAndShowCategories(pushState = true) {
    const header = document.getElementById('header');
    header.classList.add('hidden');
    fetchMenuItems();

    if (pushState) {
        history.pushState({ view: 'categories' }, 'Kategoriler', '#categories');
    }
}

// Kategorileri Yeniden Göster
function showCategoriesView(pushState = true) {
    const header = document.getElementById('header');
    header.classList.remove('hidden');
    header.classList.remove('category-header');
    header.style.backgroundImage = `url('special.png')`;

    const headerContent = document.getElementById('headerContent');
    headerContent.classList.remove('hidden');

    document.getElementById('qrMenuLabel').classList.remove('hidden');
    document.getElementById('socialIcons').classList.remove('hidden');
    document.getElementById('scrollDown').classList.remove('hidden');

    document.getElementById('googleReviewButton').style.display = 'block';
    document.body.classList.remove('header-hidden');

    const overlayDiv = document.querySelector('.header-overlay');
    if (overlayDiv) {
        overlayDiv.classList.remove('visible');
        overlayDiv.innerHTML = '';
    }

    const menuContent = document.getElementById('menuContent');
    menuContent.classList.remove('products-view');
    menuContent.innerHTML = categoriesHTML;

    // Kategori tıklama olaylarını tekrar ekle
    document.querySelectorAll('.category').forEach((categoryEl, i) => {
        categoryEl.addEventListener('click', () => {
            const categoryInfo = sortedCategories[i];
            showCategoryProducts(categoryInfo);
        });
    });

    if (pushState) {
        history.pushState({ view: 'categories' }, 'Kategoriler', '#categories');
    }
}

// Başlangıç Görünümünü Göster
function showInitialView(pushState = true) {
    const header = document.getElementById('header');
    header.classList.remove('category-header');
    header.style.backgroundImage = `url('special.png')`;

    const headerContent = document.getElementById('headerContent');
    headerContent.classList.remove('hidden');

    document.getElementById('qrMenuLabel').classList.remove('hidden');
    document.getElementById('socialIcons').classList.remove('hidden');
    document.getElementById('scrollDown').classList.remove('hidden');

    document.getElementById('googleReviewButton').style.display = 'block';
    document.body.classList.remove('header-hidden');

    const overlayDiv = document.querySelector('.header-overlay');
    if (overlayDiv) {
        overlayDiv.classList.remove('visible');
        overlayDiv.innerHTML = '';
    }

    const menuContent = document.getElementById('menuContent');
    menuContent.classList.remove('products-view');
    menuContent.innerHTML = categoriesHTML;

    // Kategori tıklama olaylarını tekrar ekle
    document.querySelectorAll('.category').forEach((categoryEl, i) => {
        categoryEl.addEventListener('click', () => {
            const categoryInfo = sortedCategories[i];
            showCategoryProducts(categoryInfo);
        });
    });

    if (pushState) {
        history.pushState({ view: 'categories' }, 'Kategoriler', '#categories');
    }
}

// Menü Öğelerini Firebase'den Çek
async function fetchMenuItems() {
    const menuContent = document.getElementById('menuContent');
    menuContent.innerHTML = '';
    categoriesData = {};
    productsData = {};
    document.getElementById('googleReviewButton').style.display = 'block';
    document.body.classList.remove('header-hidden');

    try {
        const [catSnapshot, productSnapshot] = await Promise.all([
            database.ref('Categories3').orderByChild('order').once('value'),
            database.ref('Products3').once('value')
        ]);

        const categoryData = catSnapshot.val() || {};
        const productsDataRaw = productSnapshot.val() || {};

        // Kategorileri İşle
        for (let categoryId in categoryData) {
            const categoryInfo = categoryData[categoryId];
            if (categoryInfo && categoryInfo.status !== 'inactive') {
                categoriesData[categoryId] = {
                    ...categoryInfo,
                    id: categoryId
                };
            }
        }

        // Ürünleri İşle
        for (let productId in productsDataRaw) {
            const product = productsDataRaw[productId];
            if (product && product.categoryId && categoriesData[product.categoryId]) {
                const categoryId = product.categoryId;
                if (!productsData[categoryId]) {
                    productsData[categoryId] = [];
                }
                productsData[categoryId].push({
                    ...product,
                    id: productId
                });
            }
        }

        // Kategorileri 'order' Değerine Göre Sırala
        sortedCategories = Object.values(categoriesData).sort((a, b) => {
            const orderA = a.order || 0;
            const orderB = b.order || 0;
            return orderA - orderB;
        });

        // Kategorileri Görüntüle
        let tempHTML = '';
        sortedCategories.forEach((categoryInfo, index) => {
            const categoryName = categoryInfo['name_' + selectedLanguage] || categoryInfo['name_tr'] || 'Kategori İsmi';
            const categoryImageUrl = categoryInfo.imageUrl || '';

            tempHTML += `
            <div class="category-container" style="animation-delay: ${index * 0.2}s;">
                <div class="category" style="background-image: url(${categoryImageUrl}); cursor: pointer;">
                    <h2>${categoryName}</h2>
                </div>
            </div>`;
        });

        menuContent.innerHTML = tempHTML;
        categoriesHTML = tempHTML; // Kategori HTML'sini Sakla

        // Kategori tıklama olaylarını ekle
        document.querySelectorAll('.category').forEach((categoryEl, i) => {
            categoryEl.addEventListener('click', () => {
                const categoryInfo = sortedCategories[i];
                showCategoryProducts(categoryInfo);
            });
        });

    } catch (error) {
        console.error('Veri çekilirken hata oluştu:', error);
    }
}

// Seçili Kategorinin Ürünlerini Göster
function showCategoryProducts(categoryInfo, pushState = true) {
    const menuContent = document.getElementById('menuContent');
    menuContent.innerHTML = '';

    const header = document.getElementById('header');
    header.classList.add('category-header');
    header.style.backgroundImage = `url(${categoryInfo.imageUrl || 'default-category.jpg'})`;

    const headerContent = document.getElementById('headerContent');
    headerContent.classList.add('hidden');

    document.getElementById('qrMenuLabel').classList.add('hidden');
    document.getElementById('socialIcons').classList.add('hidden');
    document.getElementById('scrollDown').classList.add('hidden');

    document.getElementById('googleReviewButton').style.display = 'none';
    document.body.classList.add('header-hidden');

    let overlayDiv = document.querySelector('.header-overlay');
    if (!overlayDiv) {
        overlayDiv = document.createElement('div');
        overlayDiv.classList.add('header-overlay');
        header.appendChild(overlayDiv);
    }
    overlayDiv.classList.add('visible');
    overlayDiv.innerHTML = '';

    const backButton = document.createElement('button');
    backButton.classList.add('back-button');
    backButton.innerHTML = '<i class="fas fa-arrow-left"></i>';
    overlayDiv.appendChild(backButton);

    // Geri butonuna basılınca kategoriler geri gelsin
    backButton.addEventListener('click', () => {
        history.back();
    });

    const categoryTitle = document.createElement('h2');
    categoryTitle.textContent = categoryInfo['name_' + selectedLanguage] || categoryInfo['name_tr'] || 'Kategori İsmi';
    overlayDiv.appendChild(categoryTitle);

    menuContent.classList.add('products-view');

    const categoryId = categoryInfo.id;
    const products = productsData[categoryId] || [];

    header.classList.remove('hidden');

    // Ürünleri Görüntüle
    products.forEach((product, index) => {
        const productDetailsDiv = document.createElement('div');
        productDetailsDiv.classList.add('product-details');
        productDetailsDiv.style.animationDelay = `${index * 0.2}s`;

        const productName = product['name_' + selectedLanguage] || product['name_tr'] || 'Ürün İsmi';
        const productDescription = product['description_' + selectedLanguage] || product['description_tr'] || '';
        const productPrice = product.price ? `₺${product.price}` : '';

        const productInfoDiv = document.createElement('div');
        productInfoDiv.classList.add('product-info');

        const titleDiv = document.createElement('div');
        titleDiv.classList.add('product-title');
        titleDiv.textContent = productName;

        const priceSpan = document.createElement('div');
        priceSpan.classList.add('product-price');
        priceSpan.textContent = productPrice;

        const descriptionP = document.createElement('p');
        descriptionP.classList.add('product-description');
        descriptionP.textContent = productDescription;

        productInfoDiv.appendChild(titleDiv);
        productInfoDiv.appendChild(priceSpan);
        productInfoDiv.appendChild(descriptionP);

        // Eğer resim varsa ekle
        if (product.imageUrl) {
            const img = document.createElement('img');
            img.src = product.imageUrl;
            img.alt = productName;
            img.classList.add('product-image');

            img.onload = () => {
                img.style.filter = 'blur(0)';
            };
            img.style.filter = 'blur(10px)';

            img.addEventListener('click', () => {
                openImageModal(product.imageUrl, productName);
            });

            productDetailsDiv.appendChild(img);
        }

        productDetailsDiv.appendChild(productInfoDiv);
        menuContent.appendChild(productDetailsDiv);
    });

    // Ürünler yüklendikten sonra sayfanın en üstüne kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pushState) {
        history.pushState({ view: 'products', categoryId: categoryId }, categoryInfo['name_' + selectedLanguage] || categoryInfo['name_tr'] || 'Kategori', `#category-${categoryId}`);
    }
}

// Ürün Resim Modali Aç
function openImageModal(imageUrl, altText) {
    modal.style.display = "block";
    modalImg.src = imageUrl;
    modalImg.alt = altText;
}

// Header Animasyonunu Sıfırla (Opsiyonel)
function resetHeaderAnimation() {
    const header = document.getElementById('header');
    header.classList.remove('category-header');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            header.classList.add('category-header');
        });
    });
}
