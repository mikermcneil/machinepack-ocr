module.exports = {


  friendlyName: 'Recognize',


  description: 'Recognize text in an image.',


  moreInfoUrl: 'https://github.com/desmondmorris/node-tesseract',


  sideEffects: 'cacheable',


  inputs: {

    path: {
      required: true,
      example: '.tmp/uploads/38ba83-31910af3819-3819ba13.jpg',
      destination: 'The path to an image.',
      extendedDescription: 'If a relative path is specified, it will be resolved from the current working directory.',
    },

    language: {
      example: 'eng',
      description: 'The Tesseract language identifier of a specific language pack to use during character recognition.',
      extendedDescription:
      'By default, the default settings for your Tesseract install will be used.  '+
      'If you followed the instructions in the README file for this project, then that means **all languages** will '+
      'be checked.\n'+
      'Finally, note that the language identifiers understood by Tesseract may or may not be familiar to you.  Be sure '+
      'to check out the Tesseract language reference to verify that you are using the right identifier.',
      moreInfoUrl: 'https://github.com/tesseract-ocr/tesseract/blob/master/doc/tesseract.1.asc#languages',
    },

    tesseractBinPath: {
      example: '/usr/local/bin/tesseract',
      description: 'A custom absolute path to the Tesseract binary.',
      extendedDescription: 'You should only need to specify this if you are running a custom install of Tesseract.',
    }

  },


  exits: {

    success: {
      outputFriendlyName: 'Recognized text',
      outputDescription: 'A string of recognized text from the image.',
      outputExample: 'Dungeness\n\nHP33/33\n\nWater 901 kg\n\nTYW m\n\nD419 45\n\nSTARDUST KRABBY CANDY\n\n \n\n',
      moreInfoUrl: ''
    },

    languageNotFound: {
      description: 'A language pack could not be located for the specified language identifier.',
      extendedDescription: 'Be sure you typed the language identifier correctly, and '
    },

    tesseractNotFound: require('../constants/tesseract-not-found.exit')

  },


  fn: function(inputs, exits) {

    var path = require('path');
    var tesseract = require('node-tesseract');

    // Build Tesseract options
    var opts = {};
    if (inputs.tesseractBinPath) {
      opts.binary = '/usr/local/bin/tesseract';
    }
    if (inputs.language) {
      opts.l = inputs.language;
    }

    // Call `process` to recognize characters in the image.
    tesseract.process(path.resolve(inputs.path), opts, function(err, text) {
      try {
        if (err) {
          if (err.stack.match('Failed loading language \'en\'')) {
            return exits.languageNotFound(err);
          }
          else if (err.stack.match('tesseract: command not found')) {
            return exits.tesseractNotFound(err);
          }
          else { return exits.error(err); }
        }//</if :: err>

        // --•
        // Some text was recognized successfully!
        return exits.success(text);

      } catch (e) { return exits.error(e); }
    });//</tesseract.process>

  }


};
