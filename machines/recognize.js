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

    psm: {
      example: 6,
      description: 'The Tesseract PSM strategy to use.',
      moreInfoUrl: 'http://manpages.ubuntu.com/manpages/precise/man1/tesseract.1.html'
    },

    convertToGrayscale: {
      example: false,
      defaultsTo: false,
      description: 'Whether the image should be converted to grayscale before performing analysis.'
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


  // TO TEST:
  // ```
  // mp exec recognize --path='/Users/mikermcneil/Desktop/foo.png'
  // ```
  fn: function(inputs, exits) {

    var path = require('path');
    var os = require('os');
    var LWIP = require('lwip');
    var tesseract = require('node-tesseract');


    // Resolve path to make sure it is absolute.
    inputs.path = path.resolve(inputs.path);


    // If `convertToGrayscale` was enabled, do that first.
    (function _asyncIf(done){

      if (!inputs.convertToGrayscale) { return done(undefined, inputs.path); }

      // --•
      // Otherwise, we'll preprocess the image.
      // (we'll create a modified copy of the image on disk)
      LWIP.open(inputs.path, function (err, image){
        if (err) { return done(err); }
        try {

          // Figure out the appropriate path to a directory where the package will
          // be extracted after it is downloaded.  If no explicit `destination` path
          // was specified, then use the path to a new subfolder within the operating
          // system's `/tmp` directory.
          var tmpPathForModifiedImg = path.resolve(os.tmpDir(), path.basename(inputs.path)+'-grayscale.tmp.jpg');

          // DEBUG
          // --------------------------------------------------------------------------------------------------------------------
          // var tmpPathForModifiedImg = path.resolve('/Users/mikermcneil/Desktop', path.basename(inputs.path)+'-grayscale.tmp.jpg');
          // console.log('tmpPathForModifiedImg',tmpPathForModifiedImg);
          // --------------------------------------------------------------------------------------------------------------------

          // Make grayscale version of image.
          image.batch()
          .saturate(-1) // https://github.com/EyalAr/lwip#saturate (<< Desaturating definitely improves recog, at least somewhat)
          // .darken(0.2) // https://github.com/EyalAr/lwip#darken (<< Darkening doesn't seem to make a difference.)
          // .sharpen(0.2) // https://github.com/EyalAr/lwip#sharpen (<< Sharpening MIGHT actually hurt recog a bit..)
          .writeFile(tmpPathForModifiedImg, function (err){
            try {
              if (err) { return done(err); }

              return done(undefined, tmpPathForModifiedImg);

            } catch (e) { return done(e); }
          });//</image.batch()>
        } catch (e) { return done(e); }
      });//</LWIP.open()>

    })(function afterwards(err, pathOfImgToAnalyze) {
      // Build Tesseract options
      var tesseractOpts = {};
      if (inputs.tesseractBinPath) {
        tesseractOpts.binary = '/usr/local/bin/tesseract';
      }
      if (inputs.language) {
        tesseractOpts.l = inputs.language;
      }
      if (inputs.psm) {
        tesseractOpts.psm = inputs.psm;
      }

      // Call `process` to recognize characters in the image.
      tesseract.process(pathOfImgToAnalyze, tesseractOpts, function (err, text) {
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
    });//</self-calling function :: get path of image to analyze>

  }


};



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// TODO: tune OCR
// See:
// • https://mlichtenberg.wordpress.com/2015/11/04/tuning-tesseract-ocr/
// • https://github.com/tesseract-ocr/tesseract/wiki/Command-Line-Usage
// • https://github.com/tesseract-ocr/tesseract/wiki/ControlParams
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// UPDATE: see https://github.com/EyalAr/lwip
//
// could also use imagemagick.
//
// Finally, for posterity:
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
