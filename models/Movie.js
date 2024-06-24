const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  tmdbId: {
    type: String,
    required: true,
    unique: true,
  },
  title: String,
  overview: String,
  release_date: String,
  genres: [String],
  poster_path: String,
  trailer_url: String,
});

module.exports = mongoose.model('Movie', MovieSchema);
