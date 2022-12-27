// load libraries
// use imagemagick for custome tranformation
const im = require('imagemagick')
// use file system to store intermediate files 
// for imagemagick transformation
const fs = require('fs')
// parse multi part form
const busboy = require('busboy');
// use moment for date used in overlay
const moment = require('moment')

// log and throw transformation error
const fail = message => {
  console.log(message)
  throw new Error(message)
}

// process imagemagick transformation
const perform = (operation, args) =>
  new Promise((resolve, reject) =>
    im[operation](args, (err, res) => {
      if (err) {
        console.log(`${operation} operation failed:`, err)
        reject(err)
      } else {
        console.log(`${operation} completed successfully`)
        resolve(res)
      }
    })
  )

// cleanup after transformation
// need to remove tempoarary files if they were created
const postProcessResource = (resource, fn) => {
  let ret = null
  if (resource) {
    if (fn) {
      ret = fn(resource)
    }
    try {
      fs.unlinkSync(resource)
    } catch (err) {
      // Ignore
    }
  }
  return ret
}

// set up the transformation by calculating
// date and created imagemagick args array
const transform = async file => {
  // current time as string
  const date = moment().format('MMM Do YYYY, h:mm a')
  // transformation in imagemagick: resize to 314px, overlay text at x=5px, y=20px.
  const customArgs = [
    '-resize',
    '314x',
    '-fill',
    'blue',
    '-draw',
    `text 5,15 'Date cached: ${date}'`
  ]
  // prepare temporary input and output files
  let inputFile = null
  let outputFile = null
  inputFile = '/tmp/inputFile.jpg'
  // write the temporary input file
  fs.writeFileSync(inputFile, file.buffer)
  // add the input file name to custom args
  customArgs.unshift(inputFile)
  // add the output file name to custom args
  outputFile = '/tmp/outputFile.jpg'
  customArgs.push(outputFile)

  // call 'perform' function and then cleanup
  try {
    const output = await perform('convert', customArgs)
    postProcessResource(inputFile)
    if (outputFile) {
      // if a transformation was successful there will
      // be an output file and it can be returned
      return postProcessResource(outputFile, file =>
        Buffer.from(fs.readFileSync(file))
      )
    }
    // Return the command line output as a debugging aid
    return output
  } catch (err) {
    fail('perform fail:', err)
  }
}


function parseMultipartForm(event) {
  return new Promise((resolve) => {
    // we'll store all form fields inside of this
    const fields = {};

    // let's instantiate our busboy instance!
    const busboy = new Busboy({
      // it uses request headers
      // to extract the form boundary value (the ----WebKitFormBoundary thing)
      headers: event.headers,
    });

    // before parsing anything, we need to set up some handlers.
    // whenever busboy comes across a file ...
    busboy.on(
      "file",
      (fieldname, filestream, filename, transferEncoding, mimeType) => {
        // ... we take a look at the file's data ...
        filestream.on("data", (data) => {
          // ... and write the file's name, type and content into `fields`.
          fields[fieldname] = {
            filename,
            type: mimeType,
            content: data,
          };
        });
      }
    );

    // whenever busboy comes across a normal field ...
    busboy.on("field", (fieldName, value) => {
      // ... we write its value into `fields`.
      fields[fieldName] = value;
    });

    // once busboy is finished, we resolve the promise with the resulted fields.
    busboy.on("finish", () => {
      resolve(fields);
    });

    // now that all handlers are set up, we can finally start processing our request!
    busboy.write(event.body);
  });
}
// netlify/functions/restaurantReservationEndpoint
module.exports.handler = async (event, context) => {
  const fields = await parseMultipartForm(event);
  const imageFile = fields.file;// { filename: "some_logo.svg", type: "image/svg+xml", content: Buffer([...]) }

  

  return transform(imageFile)
    .then(result => {
      res.statusCode = 200
      res.headers = {
        'Content-Type': 'image/jpeg',
        'Content-Length': result.length
      }
      res.isBase64Encoded = true
      res.send(result)
    })
    .catch(error => {
      console.log('error xxx')
      console.log(error)

      res.statusCode = 502
      res.headers = { 'Content-Type': 'application/json' }
      const body = `{"error": "Error manipulating image ${error}"}`
      res.send(body)
    })
};
