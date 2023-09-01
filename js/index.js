// Globala variabler & Query selectors ------------------------------------------------------------------------
const apiUrl = 'http://localhost:1337';

const profile = document.querySelector('div#profile');
const bookmark = document.querySelector('div#bookmark');
const bookmarkIcon = document.querySelector('#bookmark-icon');
const bookmarkText = document.querySelector('#bookmark-text');
const profileIcon = document.querySelector('#user-icon');
const loginMenu = document.querySelector('nav#login-menu');
const loginAlt = document.querySelector('#login-alt');
const registerAlt = document.querySelector('#register-alt');
const loginDiv = document.querySelector('#login-div');
const registerDiv = document.querySelector('#register-div');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const username = document.querySelector('#username');
const profileMenu = document.querySelector('#profile-menu');
const logoutBtn = document.querySelector('#logout');
const pageContent = document.querySelector('#page-content');
const content = document.querySelector('#content');
const headerLogo = document.querySelector('#header-logo');
const heading = document.querySelector('#heading');

let savedBooksArr = [];



// Spara info i session storage -------------------------------------------------------------------------------
let saveInfo = ((data) => {
    sessionStorage.setItem('userJwt', data.jwt);
    sessionStorage.setItem('userEmail', data.user.email);
    sessionStorage.setItem('username', data.user.username);
    sessionStorage.setItem('userId', data.user.id);
});



// Toggla display block/none på element -----------------------------------------------------------------------
let toggle = ((element) => {
    element.classList.toggle('display-none');
    element.classList.toggle('display-block');
});



// Add & remove class på element ------------------------------------------------------------------------------
let addAndRemove = ((elementOne, addClass, elementTwo, removeClass) => {
    elementOne.classList.add(addClass);
    elementTwo.classList.remove(removeClass);
});



// Meny om användare inte är inloggad -------------------------------------------------------------------------
loginMenu.addEventListener('click', (e) => {

        if(e.target === loginAlt){
            addAndRemove(registerDiv, 'display-none', loginDiv, 'display-none');
        }
        else if(e.target === registerAlt){
            addAndRemove(loginDiv, 'display-none', registerDiv, 'display-none');
        }
});



// Logga in som användare -------------------------------------------------------------------------------------
let loginFunc = async (e) => {
    e.preventDefault();

    let email = loginForm.elements.email.value;
    let password = loginForm.elements.password.value;

    let response = await fetch(`${apiUrl}/api/auth/local`, {
        method: 'POST',
        body: JSON.stringify({
            identifier: email,
            password: password,
        }),
        headers: {
            'Content-type': 'application/json',
        },
    });

    if(response.status === 200){
        let data = await response.json();
        saveInfo(data);
        toggle(loginMenu);
        onPageLoad();
    }
    else{
        alert('Ett fel uppstod');
        console.log('response:', response.status);
    }

};

loginForm.addEventListener('submit', loginFunc);


// Registrera ny användare ------------------------------------------------------------------------------------
let registerFunc = async (e) => {
    e.preventDefault();

    let username = registerForm.elements.username.value;
    let email = registerForm.elements.email.value;
    let password = registerForm.elements.password.value;

    let response = await fetch(`${apiUrl}/api/auth/local/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify ({
            username: username,
            email: email,
            password: password,
        }),
    });
    console.log(response);

    if(response.status === 200){
        let data = await response.json();
        saveInfo(data);
        toggle(loginMenu);
        onPageLoad();
    }
    else if(response.status === 400){
        alert('Ditt lösenord måste bestå av minst 6 tecken');
    }
    else{
        alert('Ett fel uppstod');
        console.log('response:', response.status);
    }
};

registerForm.addEventListener('submit', registerFunc);


// Meny om användare är inloggad vs. inte inloggad ------------------------------------------------------------
let menuFunc = (() => {
    if(sessionStorage.getItem('userJwt')){
        // If logged in
        toggle(profileMenu);

    }else if(!sessionStorage.getItem('userJwt')){
        // If NOT logged in
        toggle(loginMenu);
    }
});

profile.addEventListener('click', menuFunc);



// Logga ut inloggad användare ----------------------------------------------------------------------------------
let logoutFunc = (() => {
    sessionStorage.removeItem('userJwt');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('username');

    savedBooksArr = [];
    toggle(profileMenu);
    onPageLoad();
    renderBooks();
});

logoutBtn.addEventListener('click', logoutFunc);



// Rendera alla böcker på hemsidan --------------------------------------------------------------------------------
let renderBooks = async () => {
    content.innerHTML = '';
    heading.innerText = 'Alla böcker';

    let response = await fetch(`${apiUrl}/api/books?populate=*`);

    if(response.status === 200){
        let data = await response.json();
        let books = data.data;

        books.forEach(book => {
            // Skapa card
            content.innerHTML += `
            <div class="card">
                <div class="card-content">
                    <div class="img-container flex-row flex-justify-center">
                        <img src="${apiUrl}${book.attributes.cover.data.attributes.url}" alt="Bokomslag: ${book.attributes.title}">
                        <div onclick="saveBookFunc(${book.id})" class="save-book">
                            <div class="save-btn flex-row flex-justify-center flex-align-center">
                                <span id="${book.id}" class="fa-regular fa-bookmark fa-lg"></span>
                            </div>
                        </div>
                    </div>
                    <div class="book-info">
                        <h2 class="title">${book.attributes.title}</h2>
                        <ul onclick="reviewFunc(event)" id="bookStars-${book.id}" class="stars flex-row flex-justify-center">
                        </ul>
                        <h3 class="author">Författare: <span>${book.attributes.author}</span></h3>
                        <p class="info">Antal sidor: <span>${book.attributes.pages}</span></p>
                        <p class="info">Publicerad: <span>${book.attributes.published}</span></p>
                    </div>
                </div>
            </div>
            `;
            showBookGrade(`${book.id}`, `bookStars-${book.id}`);
        });
    }
    else{
        alert('Ett fel uppstod');
        console.log('response:', response.status);
    }
};

renderBooks();



// Uppdatera bokikon -----------------------------------------------------------------------------------------
let updateBookIcon = (() => {
    if(savedBooksArr.length > 0){
        addAndRemove(bookmarkIcon, 'fa-solid', bookmarkIcon, 'fa-regular');
        // Ändra text?
        bookmarkText.innerText = 'Visa sparade böcker';
    }
    else if(savedBooksArr.length === 0){
        addAndRemove(bookmarkIcon, 'fa-regular', bookmarkIcon, 'fa-solid');
        // Ändra text?
        bookmarkText.innerText = 'Du har inga sparade böcker';
    }
})



// Hämta sparade böcker --------------------------------------------------------------------------------------
let getSavedBooks = async () => {
        // Hämta data om books från inloggad user
        let response = await fetch(`${apiUrl}/api/users/${sessionStorage.getItem('userId')}?populate=books`, {
            headers: {
                Authorization: `Bearer ${sessionStorage.getItem('userJwt')}`,
            }
        });
        let data = await response.json();
        let books = data.books;

        // Pusha id till array med sparade böcker
        books.forEach((book) => {
            savedBooksArr.push(book.id);
            let saveBtn = document.getElementById(book.id);
            // console.log(saveBtn);
            saveBtn.classList.add('fa-solid');
            saveBtn.classList.remove('fa-regular');
        });

        updateBookIcon();

};



// Funktion för att spara böcker ------------------------------------------------------------------------------
let saveBookFunc = async (id) => {

    if(sessionStorage.getItem('userJwt')){

        if(!savedBooksArr.includes(id)){
            savedBooksArr.push(id);
            
            let saveBtn = document.getElementById(id);
            saveBtn.classList.remove('fa-regular');
            saveBtn.classList.add('fa-solid');
            
            updateBookIcon();
        }
        else{
            let temporaryArr = savedBooksArr.filter(book => book !== id);
            
            savedBooksArr = [];
            
            temporaryArr.forEach(item => {
                savedBooksArr.push(item);
            });
            
            let saveBtn = document.getElementById(id);
            saveBtn.classList.add('fa-regular');
            saveBtn.classList.remove('fa-solid');
            
            updateBookIcon();
        }
    }

    // console.log('savedBooksArr:', savedBooksArr);

    // Koppla böcker till user
    let response = await fetch(`${apiUrl}/api/users/${sessionStorage.getItem('userId')}`, {
        method: 'PUT',
        body: JSON.stringify({
            books: savedBooksArr,
            user: sessionStorage.getItem('userId'),
        }),
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('userJwt')}`,
        },
    });

    // console.log('Response:', response);

    if(response.status === 200){
        // console.log(response);
    }
    else if(response.status === 401){
        alert('Du måste vara inloggad för att kunna spara dina favoritböcker');
    }
    else{
        alert('Ett fel uppstod');
        console.log('Ett fel uppstod:', response.status);
    }

};



// Funktion för visa sparade böcker ---------------------------------------------------------------------------
let showSavedBooks = async () => {
    content.innerHTML = '';
    heading.innerText = 'Dina sparade böcker';

    let response = await fetch(`${apiUrl}/api/books?populate=*`);

    if(response.status === 200){

        let data = await response.json();
        let books = data.data
        let userId = sessionStorage.getItem('userId');
        
        books.forEach(book => {
            let bookUsers = book.attributes.users.data;
            
            bookUsers.forEach(user => {
                if(user.id == userId){
                    
                    content.innerHTML += `
                    <div class="card">
                        <div class="card-content">
                            <div class="img-container flex-row flex-justify-center">
                                <img src="${apiUrl}${book.attributes.cover.data.attributes.url}" alt="Bokomslag: ${book.attributes.title}">
                            </div>
                            <div class="book-info">
                                <h2 class="title">${book.attributes.title}</h2>
                                <ul onclick="infoFunc()" id="bookStars-${book.id}" class="stars flex-row flex-justify-center">
                                </ul>
                                <h3 class="author">Författare: <span>${book.attributes.author}</span></h3>
                                <p class="info">Antal sidor: <span>${book.attributes.pages}</span></p>
                                <p class="info">Publicerad: <span>${book.attributes.published}</span></p>
                            </div>
                        </div>
                    </div>
                    `;
                    showBookGrade(`${book.id}`, `bookStars-${book.id}`);
                }
            });
        });
    }
    else{
        alert('Ett fel uppstod');
        console.log(response.status);
    }
};

bookmark.addEventListener('click', showSavedBooks);



// Funktion för visa betyg på böcker -------------------------------------------------------------------------
let showBookGrade = async (bookId, bookStarsId) => {
    let response = await fetch(`${apiUrl}/api/books/${bookId}?populate=*`);

    if(response.status === 200){
        let data = await response.json();
        let book = await data.data;
        let reviewCount = book.attributes.reviews.data.length;

        let element = document.getElementById(bookStarsId);
        // console.log('element:', element);
        // console.log('children:', element.children);

        if(reviewCount > 0){
            let reviewArr = book.attributes.reviews.data;
            let sumOfStars = 0;

            for(let i = 0; i < reviewArr.length; i++){
                sumOfStars += reviewArr[i].attributes.stars;
            }
            let averageVal = sumOfStars / reviewCount;
            let grade = Math.floor(averageVal);
            // console.log('grade:', grade);

            if(grade === 1){
                element.innerHTML = `
                <li class="star" ><span class="star1 fa-solid fa-star"></span></li>
                <li class="star"><span class="star2 fa-regular fa-star"></span></li>
                <li class="star"><span class="star3 fa-regular fa-star"></span></li>
                <li class="star"><span class="star4 fa-regular fa-star"></span></li>
                <li class="star"><span class="star5 fa-regular fa-star"></span></li>
            `;
            }
            else if(grade === 2){
                element.innerHTML = `
                    <li class="star"><span class="star1 fa-solid fa-star"></span></li>
                    <li class="star"><span class="star2 fa-solid fa-star"></span></li>
                    <li class="star"><span class="star3 fa-regular fa-star"></span></li>
                    <li class="star"><span class="star4 fa-regular fa-star"></span></li>
                    <li class="star"><span class="star5 fa-regular fa-star"></span></li>
                `;
            }
            else if(grade === 3){
                element.innerHTML = `
                <li class="star"><span class="star1 fa-solid fa-star"></span></li>
                <li class="star"><span class="star2 fa-solid fa-star"></span></li>
                <li class="star"><span class="star3 fa-solid fa-star"></span></li>
                <li class="star"><span class="star4 fa-regular fa-star"></span></li>
                <li class="star"><span class="star5 fa-regular fa-star"></span></li>
            `;
            }
            else if(grade === 4){
                element.innerHTML = `
                <li class="star"><span class="star1 fa-solid fa-star"></span></li>
                <li class="star"><span class="star2 fa-solid fa-star"></span></li>
                <li class="star"><span class="star3 fa-solid fa-star"></span></li>
                <li class="star"><span class="star4 fa-solid fa-star"></span></li>
                <li class="star"><span class="star5 fa-regular fa-star"></span></li>
            `;
            }
            else if(grade === 5){
                element.innerHTML = `
                <li class="star"><span class="star1 fa-solid fa-star"></span></li>
                <li class="star"><span class="star2 fa-solid fa-star"></span></li>
                <li class="star"><span class="star3 fa-solid fa-star"></span></li>
                <li class="star"><span class="star4 fa-solid fa-star"></span></li>
                <li class="star"><span class="star5 fa-solid fa-star"></span></li>
            `;
            }
        }
        else if(reviewCount === 0){
            element.innerHTML = `
            <li class="star"><span class="star1 fa-regular fa-star"></span></li>
            <li class="star"><span class="star2 fa-regular fa-star"></span></li>
            <li class="star"><span class="star3 fa-regular fa-star"></span></li>
            <li class="star"><span class="star4 fa-regular fa-star"></span></li>
            <li class="star"><span class="star5 fa-regular fa-star"></span></li>
        `;
        }
    }
    else{
        alert('Ett fel uppstod');
        console.log(response.status);
    }
};



// Funktion för att betygsätta böcker -------------------------------------------------------------------------
let reviewFunc = async (event) => {

    let findClass = event.target.classList;
    let doArray = Array.from(findClass);
    
    if(doArray.includes('fa-star')){
        // Get userId
        let userId = sessionStorage.getItem('userId');

        // Get bookId
        let parentId = event.target.parentElement.parentElement.id;
        let findChar = parentId.indexOf('-');
        const bookId = parentId.substring(findChar + 1);

        // Get starId
        if(doArray.includes('star1')){
            grade = 1;
        }
        else if(doArray.includes('star2')){
            grade = 2;
        }
        else if(doArray.includes('star3')){
            grade = 3;
        }
        else if(doArray.includes('star4')){
            grade = 4;
        }
        else if(doArray.includes('star5')){
            grade = 5;
        }

        // Kolla om användare redan lämnat recension på boken
        let response = await fetch(`${apiUrl}/api/reviews?populate=*`, {
            headers: {
                Authorization: `Bearer ${sessionStorage.getItem('userJwt')}`,
            },
        });

        if(response.status === 401){
            alert('Du måste vara inloggad för att kunna lämna en recension');
        }

        let data = await response.json();
        let reviews = await data.data;

        let reviewExists = false;

        for(let i = 0; i < reviews.length; i++){
            let review = reviews[i];

            if(review.attributes.book.data.id == bookId && review.attributes.user.data.id == userId){
                reviewExists = true;
                break;
            }
        }

        if(reviewExists && response.status === 200){
            alert('Du har redan betygsatt denna bok :)');
        }
        else if(!reviewExists && response.status === 200){
            response = await fetch(`${apiUrl}/api/reviews?populate=*`, {
                method: 'POST',
                body: JSON.stringify({
                    data: {
                        stars: grade,
                        book: bookId,
                        user: userId,
                    }
                }),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionStorage.getItem('userJwt')}`,
                }
            });
            alert(`Tack för din recension med ${grade} stjärnor!`);
        }
        else{
            alert('Ett fel uppstod');
            console.log(response.status);
        }
    }
    renderBooks();   
    getSavedBooks();
};



// Tillbaka till start ----------------------------------------------------------------------------------------
headerLogo.addEventListener('click', () => {
    renderBooks();
    getSavedBooks();
});



// Lite info bara ---------------------------------------------------------------------------------------------
let infoFunc = (() => {
    alert('Du kan se bokens betyg men inte lämna en recension från denna vy :)');
});



// Rendera olika information baserat på om användare är inloggad eller inte ------------------------------------
let onPageLoad = (() => {
    if(sessionStorage.getItem('userJwt')){
        // console.log('logged in');
        username.innerText = `Välkommen, ${sessionStorage.getItem('username')}!`;
        addAndRemove(profileIcon, 'fa-solid', profileIcon, 'fa-regular');
        bookmark.classList.remove('display-none');
        getSavedBooks();

    }
    else{
        // console.log('NOT logged in');
        username.innerText = `Logga in`;
        addAndRemove(profileIcon, 'fa-regular', profileIcon, 'fa-solid');
        bookmark.classList.add('display-none');

    }
});

onPageLoad();