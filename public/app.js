// DOM elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const movieSearchContainer = document.getElementById('movieSearchContainer');
const logoutButton = document.getElementById('logoutButton'); // Added this line

// Function to show login form
function showLoginForm() {
  if (loginForm) {
    loginForm.style.display = 'block';
  }
  if (registerForm) {
    registerForm.style.display = 'none';
  }
  if (movieSearchContainer) {
    movieSearchContainer.style.display = 'none';
  }
  if (logoutButton) {
    logoutButton.style.display = 'none';
  }
}

// Function to show registration form
function showRegisterForm() {
  if (loginForm) {
    loginForm.style.display = 'none';
  }
  if (registerForm) {
    registerForm.style.display = 'block';
  }
  if (movieSearchContainer) {
    movieSearchContainer.style.display = 'none';
  }
  if (logoutButton) {
    logoutButton.style.display = 'none';
  }
}

// Function to show movie search after successful login
function showMovieSearch() {
  if (loginForm) {
    loginForm.style.display = 'none';
  }
  if (registerForm) {
    registerForm.style.display = 'none';
  }
  if (movieSearchContainer) {
    movieSearchContainer.style.display = 'block';
  }
  if (logoutButton) {
    logoutButton.style.display = 'none';
  }
}

// Event listeners for forms
document.addEventListener('DOMContentLoaded', () => {
  showLoginForm(); // Show login form initially
});

async function login(event) {
  event.preventDefault();

  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    const { userId, token } = data; 

    // Store userId and token in localStorage
    localStorage.setItem('userId', userId);
    localStorage.setItem('token', token);

    // Show success message
    const successMessage = document.createElement('p');
    successMessage.textContent = 'Login successful!';
    successMessage.style.color = 'green'; 
    document.getElementById('loginForm').appendChild(successMessage);

    // Remove success message after a few seconds
    setTimeout(() => {
      successMessage.remove();
    }, 3000); // Remove after 3 seconds (3000 milliseconds)

    showMovieSearch();
    
  } catch (error) {
    console.error('Error logging in:', error.message);
    alert('Login Failed. Please try again.');
  }
}

async function register(event) {
  event.preventDefault();

  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;

  try {
    const response = await fetch('/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    // Clear any previous error messages
    document.getElementById('registerErrorMessage').textContent = '';

    // Registration successful, hide form and show success message
    showLoginForm(); // Hide registration form and show login form
    document.getElementById('registerSuccessMessage').textContent = 'Registration successful. Redirecting...';

    setTimeout(() => {
    showMovieSearch(); // Redirect to home page after 2 seconds
    }, 2000); // Wait for 2 seconds 

  } catch (error) {
    console.error('Error registering:', error.message);
    document.getElementById('registerSuccessMessage').textContent = ''; // Clear success message
    document.getElementById('registerErrorMessage').textContent = 'Registration failed. Please try again.';
  }
}

async function searchMovie() {
  const query = document.getElementById('searchInput').value;
  const results = document.getElementById('results');
  const errorMessage = document.getElementById('errorMessage');

  // Clear previous results and error messages
  results.innerHTML = '';
  errorMessage.textContent = '';

  try {
    const response = await fetch(`/api/movies/search/${query}`);
    if (!response.ok) {
      // Handle different error statuses
      if (response.status === 400) {
        throw new Error('Invalid search query. Please enter a valid movie title.');
      } else if (response.status === 404) {
        throw new Error('Movie not found. Please try another search.');
      } else {
        throw new Error('Please enter a movie title.');
      }
    }
    const movies = await response.json();
    if (movies.length === 0) {
      throw new Error('No movies found. Please try another search.');
    }
    displayResults(movies);
  } catch (error) {
    errorMessage.textContent = error.message;
  }
}

// Function to fetch and watch trailer
async function watchTrailer(movieId) {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`/api/movies/${movieId}/trailer`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Trailer not found');
    }

    const data = await response.json();
    const trailerUrl = data.url;

    // Open trailer in new tab
    window.open(trailerUrl, '_blank');
  } catch (error) {
    console.error('Error fetching trailer:', error.message);
    alert('Failed to fetch trailer. Please try again later.');
  }
}

function displayResults(movies) {
  const results = document.getElementById('results');
  results.innerHTML = '';

  movies.forEach(movie => {
    const movieDiv = document.createElement('div');
    movieDiv.classList.add('movie');
    movieDiv.innerHTML = `
      <h2>${movie.title}</h2>
      <div class="movie-details">
        <div class="poster-container">
          <img src="${getPosterUrl(movie.poster_path)}" alt="Movie Poster" class="movie-poster">
        </div>
        <div class="movie-info">
          <p>${movie.overview}</p>
          <p><strong>Movie Release Date:</strong> ${movie.release_date}</p>
          <p><strong>Movie Category:</strong> ${movie.genres ? movie.genres.join(', ') : 'No genres available'}</p>
          <div id="trailerButtonContainer">
          <p><strong>Watch the movie trailer here:</strong></p>
          <button onclick="watchTrailer('${movie.id}')">
            <img src="youtube.png" alt="YouTube Logo" class="youtube-logo">
          </button>
        </div>
        </div>
      </div>
    `;
    results.appendChild(movieDiv);
  });
}

function getPosterUrl(posterPath) {
  if (posterPath) {
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  } else {
    return 'https://via.placeholder.com/150'; // Placeholder image if no poster available
  }
}

async function logout() {
  try {
    // Clear the user ID from localStorage
    localStorage.removeItem('userId');
    
    // Clear the JWT token from localStorage
    localStorage.removeItem('token');

    // Redirect to the login page
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error logging out:', error.message);
    alert('Failed to logout. Please try again.');
  }
}