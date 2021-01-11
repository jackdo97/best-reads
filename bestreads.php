<?php
/*
 * Name: Jack Do
 * Date: 5/22/19
 * Section: CSE 154 AC
 *
 * bestreads.php web service to get different type of data of books.

 * Web service details:
 *   Required GET parameters:
 *   - mode
 *    - if mode is "description" or "info" or "reviews", parameter "title" is also required.
 *   Optional GET parameters:
 *     - search (for mode=books only)
 *   Examples:
 *     - mode=books
 *     - mode=books&search=harrypotter
 *     - mode=description&title=harrypotter
 *     - mode=info&title=harrypotter
 *     - mode=reviews&title=harrypotter
 *   Output Format:
 *   - txt or JSON
 *   Output Details:
 *     - If mode parameter is passed and is set to books and the search parameter is not passed,
 *       it will output a JSON encoded object that contains the titles
 *       and folder names of all the books.
 *     - If search parameter is passed along side with mode=books and search term for
 *       the book is found, the output JSON object will
 *       only include the books where the  titles are a case-sensitive to match to the search term.
 *        - Else outputs an emtpy books array.
 *     - If mode parameter is passed and is set to description and the required parameter title
 *       passed and is set to an existing book folder, it will output the description of that book
 *       as plain text.
 *     - If mode parameter is passed and is set to info and the required parameter title
 *       passed and is set to an existing book folder, it will output a JSON encoded object
 *       that contains the title and author of that book.
 *     - If mode parameter is passed and is set to reviews and the required parameter title
 *       passed and is set to an existing book folder, it will output a JSON encoded object
 *       that contains all the review(s), the name(s) of the reviewer(s)
 *       and the rating(s) of that book.
 *     - If title parameter is missing, outputs 400 error message as plain text:
 *       "Please remember to add the title parameter when using mode=<mode>."
 *     - IF no book for that passed in title was found (including an empty file),
 *       outputs 400 error message as plain text: No <mode> for <title> was found..
 *   - Else outputs 400 error message as plain text :
 *     "Please provide a mode of description, info, reviews, or books.".
 *
 */

  $book_folders = glob("books/*");  # Get the path for book folders

  if (isset($_GET["mode"])) {
    $mode = $_GET["mode"];

    # Check if the mode value is valid
    if ($mode === "books" || $mode === "description" || $mode === "info" || $mode === "reviews") {
      if ($mode === "books") {
        books_mode($mode, $book_folders);
      } else {
        get_book_info($mode, $book_folders);
      }
    } else {
      mode_error(); # Error for invalid mode value
    }
  } else {
    mode_error(); # Tell the user to pass in a mode parameter, in plain text.
  }

  /**
   * Get a list of books (with optional seach parameter)
   * @param string $mode the books mode
   * @param array $book_folders an array that contains the paths for books' folders
   */
  function books_mode($mode, $book_folders) {
    header("Content-type: application/json");
    if (isset($_GET["search"])) {
      $search = $_GET["search"];
      get_books($mode, $book_folders, $search);
    } else {
      get_books($mode, $book_folders);
    }
  }

  /**
   * Loads all of the titles and folder names of the books into an array.
   * The array structure is
   * array("books" => array(array("title" => <book's title>,
   *                              "folder" => <folder that contains the book>)))
   * @param string $mode the books mode
   * @param array $book_folders an array that contains the paths for books' folders
   * @param string $search(optional with default empty string) a search string for a book
   */
  function get_books($mode, $book_folders, $search="") {
    $output = array();
    $books = array();
    for ($i = 0; $i < count($book_folders); $i++) {
      $book_folder = array();
      $nth_book_folder = $book_folders[$i];
      $folder_name = get_nth_folder_name($nth_book_folder);
      $title = file($nth_book_folder . "/info.txt", FILE_IGNORE_NEW_LINES)[0];
      if (($search !== "" && strpos($title, $search) !== false) || $search === "") {
        $book_folder["title"] = $title;
        $book_folder["folder"] = $folder_name;
        array_push($books, $book_folder);
      }
    }
    $output["books"] = $books;
    print(json_encode($output));
  }

  /**
   * Get the folder name of a book folder
   * @param string $nth_book_folder the path for nth book folder
   * @return array returns an array containing the folder name in the nth book folder
   */
  function get_nth_folder_name($nth_book_folder) {
    return explode("/", $nth_book_folder)[1];
  }

  /**
   * Get a book's info based on the mode being used and outputs the data
   * using appropriate format (JSON for info and reviews, plain text for description)
   * Prints error message if the title is not found. 
   * @param string $mode the mode being used (description, info or reviews)
   * @param array $book_folders an array that contains the paths for books' folders
   */
  function get_book_info($mode, $book_folders) {
    if (isset($_GET["title"])) {
      $title_not_found = true;
      $title_query = $_GET["title"];
      $json_output = array();
      $text_output = "";
      for ($i = 0; $i < count($book_folders); $i++) {
        $nth_book_folder = $book_folders[$i];
        $folder_name = get_nth_folder_name($nth_book_folder);
        if (title_found($folder_name, $title_query)) {
          $title_not_found = false;

          # Get a book's description
          if ($mode === "description") {
            $text_output = file_get_contents($nth_book_folder . "/description.txt");
            header("Content-type: text/plain");
            echo $text_output;
          } else if ($mode === "info") {
            $json_output = info($nth_book_folder);
            header("Content-type: application/json");
            print(json_encode($json_output));
          } else {
            $json_output = reviews($folder_name);
            header("Content-type: application/json");
            print(json_encode($json_output));
          }
        }
      }
      if ($title_not_found) {
        title_not_found_error($mode, $title_query);
      }
    } else {
      missing_title_error($mode);
    }
  }

  /**
   * Gets a book's title and author
   * The array structure is
   * array("title" => <book's title>,
   *       "author"=> <book's author>)
   * @param string $nth_book_folder the path for ntn book folder
   * @return array returns an associative array containing book's title and author
   */
  function info($ntn_book_folder) {
    $result = array();
    $info = file($ntn_book_folder . "/info.txt", FILE_IGNORE_NEW_LINES);
    $info_spec = array("title", "author");
    for ($j = 0; $j < count($info); $j++) {
      $result[$info_spec[$j]] = $info[$j];
    }
    return $result;
  }

  /**
   * Get a book's reviews
   * array(array("name" => <name of the reviewer>,
   *             "rating"=> <rating out of 5>,
   *             "text" => <review text>))
   * @param string $folder_name folder name for nth book folder
   * @return array returns an array containing an associative array with book's title and author
   */
  function reviews($folder_name) {
    $result = array();
    $review_spec = array("name", "rating", "text");
    $review_files = glob("books/" . $folder_name . "/review*");
    for ($j = 0; $j < count($review_files); $j++) {
      $review = array();
      $ntn_review_file = file($review_files[$j], FILE_IGNORE_NEW_LINES);
      for ($k = 0; $k < count($ntn_review_file); $k++) {
        $review[$review_spec[$k]] = $ntn_review_file[$k];
      }
      array_push($result, $review);
    }
    return $result;
  }

  /**
   * Returns true when the title query matches one of the folder names (case sensitive),
   * returns false otherwise
   * @param string $folder_name book's folder name
   * @param string $title_query the title being used to search for book
   * @return boolean returns whether the title matches one of the folder names
   */
  function title_found($folder_name, $title_query) {
    return (strcmp($folder_name, $title_query) === 0);
  }

  /**
   * Outputs error associated with mode paramter in plain text
   */
  function mode_error() {
    header("HTTP/1.1 400 Invalid Request");
    header("Content-type: text/plain");
    die("Please provide a mode of description, info, reviews, or books.");
  }

  /**
   * Outputs a title not found error for specific modes in plain text
   * @param string $mode the mode being used (description, info or reviews)
   * @param string $title_query the title being used to search for book
   */
  function title_not_found_error($mode, $title_query) {
    header("HTTP/1.1 400 Invalid Request");
    header("Content-type: text/plain");
    die("No {$mode} for {$title_query} was found");
  }

  /**
   * Outputs a missing required title error for specific modes in plain text
   * @param string $mode the mode being used (description, info or reviews)
   */
  function missing_title_error($mode) {
    header("HTTP/1.1 400 Invalid Request");
    header("Content-type: text/plain");
    die("Please remember to add the title parameter when using mode={$mode}.");
  }
?>
