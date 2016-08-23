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

    // Resolve path to make sure it is absolute.
    inputs.path = path.resolve(inputs.path);


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // TODO: tune OCR
    // See:
    // • https://mlichtenberg.wordpress.com/2015/11/04/tuning-tesseract-ocr/
    // • https://github.com/tesseract-ocr/tesseract/wiki/Command-Line-Usage
    // • https://github.com/tesseract-ocr/tesseract/wiki/ControlParams
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // We can also try inverting/simplifying the image first.
    //
    // Probably the best thing is to use imagemagick.  But for posterity:
    //
    // • require('image-filter-invert') -- http://npmjs.com/package/image-filter-invert
    //
    // ```
    // // Load file in memory in order to invert it.
    // var binaryBitmap = fs.readFileSync(inputs.path);
    // var base64Str = new Buffer(binaryBitmap).toString('base64');
    // // Invert it.
    // var invertedBase64Str = imageFilterInvert({ data: base64Str });
    // // Write it back to disk temporarily.
    // var invertedBinaryBitmap = new Buffer(base64Str, 'base64');
    // var tmpPathForInvertedImg = path.basename(inputs.path)+'-tmp'+path.extname(inputs.path);
    // fs.writeFileSync(tmpPathForInvertedImg, bitmap);
    // ```
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


    // Call `process` to recognize characters in the image.
    tesseract.process(inputs.path, opts, function (err, text) {
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
