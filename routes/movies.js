const express = require('express');
const axios = require('axios');
const Movie = require('../models/Movie');
const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Search movies endpoint with genre filter
router.get('/search/:title', async (req, res) => {
  try {
    const title = req.params.title;

    // Check if title is empty
    if (!title) {
      return res.status(400).json({ error: 'Please enter a movie title' });
    }

    let params = {
      api_key: TMDB_API_KEY,
      query: title,
    };

    const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, { params });

    const movies = response.data.results;

    if (movies.length === 0) {
      return res.status(404).json({ error: 'No movies found' });
    }

    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to fetch movie details by ID
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findOne({ tmdbId: req.params.id });
    if (movie) {
      return res.json(movie);
    }

    const response = await axios.get(`https://api.themoviedb.org/3/movie/${req.params.id}`, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });

    const movieData = response.data;
    
    const newMovie = new Movie({
      tmdbId: movieData.id,
      title: movieData.title,
      overview: movieData.overview,
      release_date: movieData.release_date,
      genres: movieData.genres.map((genre) => genre.name),
      poster_path: movieData.poster_path,
      trailer_url: movieData.trailer_url,
    });

    await newMovie.save();
    res.json(newMovie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to fetch movie trailer by movie ID
router.get('/:movieId/trailer', async (req, res) => {
  const movieId = req.params.movieId;

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}/videos`, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });

    const videos = response.data.results;
    const trailer = videos.find(video => video.type === 'Trailer');

    if (!trailer) {
      return res.status(404).json({ error: 'Trailer not found for this movie' });
    }

    const trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
    res.json({ url: trailerUrl });
  } catch (error) {
    console.error('Error fetching trailer:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
