require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const dns = require('dns');
const { isURL } = require('validator');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('MongoDB connected'))
        .catch(err => console.error('MongoDB connection error:', err));


const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    sequence_value: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);


const getNextSequenceValue = (sequenceName) => {
  return new Promise((resolve, reject) => {
      Counter.findOneAndUpdate(
          { _id: sequenceName },
          { $inc: { sequence_value: 1 } },
          { new: true, upsert: true }
      )
      .then(sequenceDocument => {
          resolve(sequenceDocument.sequence_value);
      })
      .catch(err => {
          reject(err);
      });
  });
}


const urlSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  }
});

let URLModel = mongoose.model("URLModel", urlSchema);

const createNewURLDocument = (inputURL) => {
  return new Promise((resolve, reject) => {
    getNextSequenceValue('urlId')
    .then(nextID => {
      const newURL = new URLModel ({
        _id: nextID,
        url: inputURL
      });
    newURL.save()
      .then(() => {
        resolve({ original_url: newURL.url, short_url: nextID });
      })
      .catch(err => {
        console.error('Error saving new URL document:', err);
        reject(err)});
  })
    .catch(err => {
      console.error('Error getting next ID:', err);
      reject(err);});
  });
}

const findURLByID = (url_id) => {
  return URLModel.findById(url_id).exec();
    }

const findURLByURLName = (URLName) => {
  return URLModel.find({url: URLName}).exec();
      if (err) {
        return reject(err);
      }
      return resolve({ original_url: URLName, short_url: _id });
    }

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.route("/api/shorturl/:url_id?")
   .get((req, res) => {
    findURLByID(req.params.url_id)
      .then(url => {
        url ? res.redirect(url.url) : res.json({"error":"No short URL found for the given input"});
      })
      .catch(err => {
        console.error('Error finding URL by ID:', err);
        res.status(500).json({ message: 'Server error' });
      })
  })
   .post((req, res) => {
    const inputURL = req.body.url;
    if (!isURL(inputURL)) {
      return res.status(400).json({ "error": "invalid URL" });
    } 
    const hostname = new URL(inputURL).hostname;
    dns.lookup(hostname, err => {
      if (err)  {
        res.json({"error":"invalid Hostname"})
      } else {
          findURLByURLName(inputURL)
            .then(existingURL => {
              if (existingURL && existingURL.length > 0) {
                res.json({
                  original_url: existingURL[0].url, 
                  short_url: existingURL[0]._id});
              } else {
                createNewURLDocument(inputURL)
                  .then(savedURL => res.json(savedURL))
                  .catch(err => res.status(500).json({ message: 'Server error' }));
              }})
            .catch(err => {
              console.error('Error finding URL by name:', err);
              res.status(500).json({ message: 'Server error'})});
    }});
  });
   

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
