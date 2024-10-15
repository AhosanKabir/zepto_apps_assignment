const api_url = "https://gutendex.com/books";
const bookList = document.getElementById('book-list');
const searchInput = document.getElementById('search-input');
let allBooks = [];

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

function displayBooks(books){
    bookList.innerHTML = '';
    books.forEach((book) => {
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
        `;

        bookList.appendChild(bookCard);
    });
}


function filterBooks(searchTerm) {
    const filteredBooks = allBooks.filter((book) => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    displayBooks(filteredBooks);
}

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

const debouncedFilterBooks = debounce(filterBooks, 300);

searchInput.addEventListener('input', (e) => {
    debouncedFilterBooks(e.target.value);
});

async function init() {
    allBooks = await fetchBooksData();
    displayBooks(allBooks);
}

init();
