const api_url = "https://gutendex.com/books";
const bookList = document.getElementById('book-list');

const searchInput = document.getElementById('search-input');
const genreSelect = document.getElementById('genre-select');
const paginationContainer = document.getElementById('pagination');

const wishlistBooks = document.getElementById('wishlist-books');
const bookDetailsPage = document.getElementById('book-details-page');

let allBooks = [];
let genres = new Set();

let wishlist = new Set(JSON.parse(localStorage.getItem('wishlist')) || []);
let currentPage = 1;
const booksPerPage = 10;

// Routing
const routes = {
    home: document.getElementById('home-page'),
    wishlist: document.getElementById('wishlist-page'),
    bookDetails: document.getElementById('book-details-page'),
}

function navigateTo(page) {
    Object.values(routes).forEach(route => route.classList.remove('active'));
    routes[page].classList.add('active');

    if (page === 'home') {
        filterBooks();
    } else if (page === 'wishlist') {
        displayWishlist();
    }
}

// Event listeners for navigation
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(e.target.dataset.page);
    });
});

async function fetchBooksData() {
    try {
        const res = await fetch(api_url);
        const data = await res.json();
        console.log(data);
        return data.results;
    } catch (err) {
        console.error(`Error fetching books: ${err}`);
    }
}

function displayBooks(books) {
    const startIndex = (currentPage - 1) * booksPerPage;
    const endIndex = startIndex + booksPerPage;
    const booksToDisplay = books.slice(startIndex, endIndex);

    bookList.innerHTML = '';
    booksToDisplay.forEach(book => {
        const bookCard = createBookCard(book);
        bookList.appendChild(bookCard);
    });

    updatePagination(books.length);
}

function createBookCard(book) {
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';
    bookCard.innerHTML = `
        <div class="image-container">
            <img src="${book.formats['image/jpeg']}" alt="${book.title} cover">
        </div>
        <div class="book-info">
            <h2>${book.title}</h2>
            <p>Author: ${book.authors[0]?.name || 'Unknown'}</p>
            <p class="genre">Genre: ${book.bookshelves.join(', ') || 'Not specified'}</p>
            <p>ID: ${book.id}</p>
        </div>
        <i class="fas fa-heart wishlist-icon ${wishlist.has(book.id.toString()) ? 'wishlisted' : ''}" data-id="${book.id}"></i>
    `;

    bookCard.querySelector('.wishlist-icon').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWishList(e);
    });

    bookCard.addEventListener('click', () => showBookDetails(book));

    return bookCard;
}

function populateGenreDropdown() {
    genres.forEach((genre) => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
    });
}

function filterBooks() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedGenre = genreSelect.value;

    const filteredBooks = allBooks.filter((book) => {
        const titleMatch = book.title.toLowerCase().includes(searchTerm);
        const genreMatch = selectedGenre === '' || book.bookshelves.includes(selectedGenre)
        return titleMatch && genreMatch;
    })

    displayBooks(filteredBooks);
}

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

const debouncedFilterBooks = debounce(() => {
    currentPage = 1;
    filterBooks();
}, 300);

searchInput.addEventListener('input', debouncedFilterBooks);
genreSelect.addEventListener('change', filterBooks);

function toggleWishList(ev) {
    // ev.stopPropagation();
    const bookId = ev.target.dataset.id;

    if (wishlist.has(bookId)) {
        wishlist.delete(bookId);
        ev.target.classList.remove('wishlisted');
    } else {
        wishlist.add(bookId);
        ev.target.classList.add('wishlisted');
    }

    localStorage.setItem('wishlist', JSON.stringify([...wishlist]));
    if (routes.wishlist.classList.contains('active')) {
        displayWishlist();
    }
}

function updatePagination(totalBooks) {
    const totalPages = Math.ceil(totalBooks / booksPerPage);
    paginationContainer.innerHTML = '';

    const prevButton = document.createElement('button');
    prevButton.textContent = 'prev';
    prevButton.addEventListener('click', () => changePage(currentPage - 1));
    prevButton.disabled = currentPage === 1;
    paginationContainer.appendChild(prevButton)

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => changePage(i));
        pageButton.classList.toggle('active', i === currentPage);
        paginationContainer.appendChild(pageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.textContent = 'next';
    nextButton.addEventListener('click', () => changePage(currentPage + 1));
    nextButton.disabled = currentPage === totalPages;
    paginationContainer.appendChild(nextButton);
}

function changePage(newPage) {
    currentPage = newPage;
    filterBooks();
}

function displayWishlist() {
    wishlistBooks.innerHTML = '';
    const wishlistedBooks = allBooks.filter(book => wishlist.has(book.id.toString()));
    wishlistedBooks.forEach(book => {
        const bookCard = createBookCard(book);
        wishlistBooks.appendChild(bookCard);
    });
}

function showBookDetails(book) {
    bookDetailsPage.innerHTML = `
        <h2>${book.title}</h2>
        <img src="${book.formats['image/jpeg']}" alt="${book.title} cover">
        <p><strong>Author:</strong> ${book.authors[0]?.name || 'Unknown'}</p>
        <p><strong>Genre:</strong> ${book.bookshelves.join(', ') || 'Not specified'}</p>
        <p><strong>Language:</strong> ${book.languages.join(', ')}</p>
        <p><strong>Download count:</strong> ${book.download_count}</p>
        <p><strong>ID:</strong> ${book.id}</p>
        <h3>Description:</h3>
        <p>${book.description || 'No description available.'}</p>
        <button id="back-button">Back to List</button>
    `;
    document.getElementById('back-button').addEventListener('click', () => navigateTo('home'));
    navigateTo('bookDetails');
}

async function init() {
    allBooks = await fetchBooksData();
    allBooks.forEach(book => {
        book.bookshelves.forEach(genre => {
            genres.add(genre);
        });
    })
    populateGenreDropdown();
    navigateTo('home');

    // Add event delegation for wishlist icons
    // document.addEventListener('click', function(e) {
    //     if (e.target && e.target.classList.contains('wishlist-icon')) {
    //         e.preventDefault();
    //         toggleWishList(e);
    //     }
    // });
}

init();