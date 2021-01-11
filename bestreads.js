/**
 * Name: Jack Do
 * Date: 5/22/19
 * Section: CSE 154 AC
 *
 * This is my js file that dynamically loads the page with info returned from the bestreads API
 */

(function() {
  "use strict";

  const BASE_URL = "bestreads.php";

  window.addEventListener("load", init);

  /**
   * Populates book list when the page loads and add click event functionality
   * to home button, search button and back button.
   */
  function init() {
    getBooks("");
    id("home").addEventListener("click", home);
    id("search-btn").addEventListener("click", searchResults);
    id("back").addEventListener("click", back);
  }

  /**
   * Fetches and displays JSON data for all the books.
   * @param {string} searchQuery - search parameter value for a book
   */
  function getBooks(searchQuery) {
    fetch(BASE_URL + "?mode=books" + searchQuery)
      .then(checkStatus)
      .then(JSON.parse)
      .then(response => bookListView(response, searchQuery))
      .catch(fetchError);
  }

  /**
   * Loads JSON response for all the books into the page and
   * add click event functionality (single book view) for all the bosks on the page.
   * Hides the back button after a search call.
   * @param {object} response - the response that is being returned from the API in JSON format
   * @param {string} searchQuery - search parameter value for a book
   */
  function bookListView(response, searchQuery) {
    let backBtn = id("back");
    if (!backBtn.classList.contains("hidden")) {
      addHidden(id("back"));
    }

    // Displays error when no books are being returned from the server
    if (response.books.length === 0) {
      let homeBtn = id("home");
      homeBtn.disabled = false;
      homeBtn.addEventListener("click", home);
      id("error-text").innerText = "No books found that match the "
                                    + "search string '"
                                    + id("search-term").value.trim() + " ', "
                                    + "please try again.";

    } else {
      addHidden(id("error-text"));
      for (let i = 0; i < response.books.length; i++) {
        let bookFolder = response.books[i].folder;
        let bookContainer = document.createElement("div");
        let bookTitle = document.createElement("p");
        bookTitle.innerText = response.books[i].title;
        let bookImg = document.createElement("img");
        bookImg.src = "books/" + bookFolder + "/cover.jpg";
        bookImg.alt = bookFolder;
        bookContainer.classList.add("selectable");
        bookContainer.appendChild(bookImg);
        bookContainer.appendChild(bookTitle);
        bookContainer.addEventListener("click",
                                      () => singleBookView(bookImg.src,
                                              bookFolder, searchQuery));
        id("book-list").appendChild(bookContainer);
      }
    }
  }

  /**
   * Transitions to the single book view and
   * displays all the information of a book when
   * a book clicked from the book list view.
   * @param {string} bookImgSrc - the img source for the book's cover
   * @param {string} bookFolder - the book's folder
   */
  function singleBookView(bookImgSrc, bookFolder) {
    addHidden(id("book-list"));
    removeHidden(id("single-book"));
    removeHidden(id("back"));
    id("book-cover").src = bookImgSrc;
    id("book-cover").alt = bookFolder;

    // Fetches data for the book's info (title and author)
    requestBookInfo("?mode=info&title=", bookFolder, bookTitleAndAuthor);

    // Fetches data for the book's description
    fetch(BASE_URL + "?mode=description&title=" + bookFolder)
      .then(checkStatus)
      .then(bookDescription)
      .catch(fetchError);

    // Fetches data for the book's reviews
    requestBookInfo("?mode=reviews&title=", bookFolder, bookReviews);
  }

  /**
   * Fetches and displays JSON data based on the mode the user is using
   * @param {string} query - the query paramters for the fetch request
   * @param {string} bookFolder - the book's folder
   * @param {function} displayBookInfo - a function that displays the JSON data
   *                                     based on what request was made
   */
  function requestBookInfo(query, bookFolder, displayBookInfo) {
    fetch(BASE_URL + query + bookFolder)
      .then(checkStatus)
      .then(JSON.parse)
      .then(displayBookInfo)
      .catch(fetchError);
  }

  /**
   * Loads JSON response for the book's title and author into the page
   * @param {object} response - the response that is being returned from the API in JSON format
   */
  function bookTitleAndAuthor(response) {
    id("book-title").innerText = response.title;
    id("book-author").innerText = response.author;
    // return response for error handling?
  }

  /**
   * Loads JSON response for book's description into the page
   * @param {object} response - the response that is being returned
   *                            from the API in plain text format
   */
  function bookDescription(response) {
    id("book-description").innerText = response;
    // return response for error handling?
  }

  /**
   * Loads JSON response for the book's reviews, reviewer's name and ratings into the page
   * @param {object} response - the response that is being returned
   *                            from the API in JSON format
   */
  function bookReviews(response) {
    let avgRating = 0.0;
    let reviewsCount = response.length;
    for (let i = 0; i < reviewsCount; i++) {
      let reviewer = document.createElement("h3");
      reviewer.innerText = response[i].name;
      let rating = document.createElement("h4");
      let responseRating = parseFloat(response[i].rating);
      rating.innerText = "Rating: " + responseRating.toFixed(1);
      avgRating += responseRating;
      let review = document.createElement("p");
      review.innerText = response[i].text;
      let reviewContainer = id("book-reviews");
      reviewContainer.appendChild(reviewer);
      reviewContainer.appendChild(rating);
      reviewContainer.appendChild(review);
    }
    id("book-rating").innerText = (avgRating / reviewsCount).toFixed(1);
    // return response for error handling?
  }

  /**
   * This function is called when an error occurs in the fetch call chains (e.g. the request
   * returns a non-200 error code, such as when the bestreads service is down).
   * Displays an error message, clear book view list and book reviews containers,
   * and hides single book view.
   */
  function fetchError() {
    id("home").disabled = false;
    clearContainers();
    addHidden(id("single-book"));
    let errorText = id("error-text");
    removeHidden(errorText);
    errorText.innerText = "Something went wrong with the request. Please try again later.";
  }

  /**
   * Makes a request to the bestreads web service (mode=books) to
   * repopulate the page with books when the home button is clicked.
   * Then eturns to the book list view and disables the home button.
   * Clears out any search term inputs and hides the back button.
   */
  function home() {
    id("search-term").value = "";
    addHidden(id("single-book"));
    clearContainers();
    let bookList = id("book-list");
    if (bookList.classList.contains("hidden")) {
      removeHidden(bookList);
    }
    getBooks("");
    this.disabled = true;
  }

  /**
   * When the back button is clicked, takes the user back
   * to the previous state of the book list when
   * the current view is single book.
   * Hides the back button.
   */
  function back() {
    id("book-reviews").innerHTML = "";
    addHidden(id("single-book"));
    removeHidden(id("book-list"));
    addHidden(id("back"));
  }

  /**
   * Clear the book list and book reviews containers.
   */
  function clearContainers() {
    id("book-list").innerHTML = "";
    id("book-reviews").innerHTML = "";
  }

  /**
   * When the search button is clicked:
   * Nothing will happend if the trimmed search term is empty.
   * Otherwise, makes a request to the bestreads
   * web service (mode=books&search=serchTerm) with the trimmed search term
   * upon a successful response, replaces the current collection of books in
   * book list with books from the response data and show book list view.
   */
  function searchResults() {
    id("search-term").value = id("search-term").value.trim();
    let searchTerm = id("search-term").value;
    if (searchTerm.length !== 0) {
      id("home").disabled = false;
      let bookList = id("book-list");
      clearContainers();
      if (bookList.classList.contains("hidden")) {
        removeHidden(bookList);
      }
      let errorText = id("error-text");
      if (errorText.classList.contains("hidden")) {
        removeHidden(errorText);
      }
      addHidden(id("single-book"));
      getBooks("&search=" + searchTerm);
    }
  }

  /**
   * Adds hidden class to the given DOM object.
   * @param {object} element - DOM object to add hidden class
   */
  function addHidden(element) {
    element.classList.add("hidden");
  }

  /**
   * Remove hidden class from the given DOM object.
   * @param {object} element - DOM object to remove hidden class
   */
  function removeHidden(element) {
    element.classList.remove("hidden");
  }

  /**
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @param {object} response - response to check for success/error
   * @returns {object} - valid result text if response was successful, otherwise rejected
   *                     Promise result
   */
   function checkStatus(response) {
     if (response.status >= 200 && response.status < 300 || response.status === 0) {
       return response.text();
     } else {
       return Promise.reject(new Error(response.status + ": " + response.statusText));
     }
   }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

})();
