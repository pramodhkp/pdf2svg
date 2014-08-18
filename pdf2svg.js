/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

//
// Node tool to dump SVG output into a file.
//

var fs = require('fs');

// HACK few hacks to let PDF.js be loaded not as a module in global space.
global.window = global;
global.navigator = { userAgent: 'node' };
global.PDFJS = {};

PDFJS.workerSrc = true;
require('./js/pdf.combined.js');
require('./js/domstubs.js');


// Loading file from file system into typed array
var pdfPath = process.argv[2] || 'tracemonkey.pdf';
var data = new Uint8Array(fs.readFileSync(pdfPath));

// Dumps svg outputs to a folder called svgdump
function writeToFile(svgdump, pageNum) {
  var name = getFileNameFromPath(pdfPath);
  fs.mkdir('./svgdump/', function(err) {
    if (!err || err.code === 'EEXIST') {
      fs.writeFile('./svgdump/' + name + "-" + pageNum + '.svg', svgdump,
        function(err) {
          if (err) {
            console.log('Error: ' + err);
          } else {
            console.log('Page: ' + pageNum);
          }
        });
    }
  });
}

function createIndex(pdfPath, numPages) {
  var name = getFileNameFromPath(pdfPath);
  var page= 1;

  // Read from a template file
  var html = fs.readFileSync('./template.html');
  var htmlend = '</div></div></div></body></html>';

  fs.writeFile('./index.html', html, function (err) {
    if (err) {
      console.log("Error");
    }
  });
  
  while (page <= numPages) {
    var attr = 'style="background-image:url(./svgdump/' + name + '-' + page++ + '.svg);"';
    var div = '<div class="sheet"' + attr + '></div>\n'
    fs.appendFile('./index.html', div, function(err) {
      if (err) {
        console.log("Error");
      }
    });
  }
  fs.appendFile('./index.html', htmlend, function (err) {
    if (err) {
      console.log("Error creating index file");
    }
  });
}

// Get filename from the path
function getFileNameFromPath(path) {
  var index = path.lastIndexOf('/');
  var extIndex = path.lastIndexOf('.');
  return path.substring(index , extIndex);
}

// Will be using promises to load document, pages and misc data instead of
// callback.
PDFJS.getDocument(data).then(function (doc) {
  var numPages = doc.numPages;
  console.log('# Document Loaded');
  console.log('Number of Pages: ' + numPages);
  console.log();

  createIndex(pdfPath, numPages);
  var lastPromise = Promise.resolve(); // will be used to chain promises
  var loadPage = function (pageNum) {
    return doc.getPage(pageNum).then(function (page) {
      var viewport = page.getViewport(1.0 /* scale */);
      console.log();
      
      return page.getOperatorList().then(function (opList) {
        var svgGfx = new PDFJS.SVGGraphics(page.commonObjs, page.objs);
        svgGfx.embedFonts = true;
        return svgGfx.getSVG(opList, viewport).then(function (svg) {
          var svgDump = svg.toString();
          writeToFile(svgDump, pageNum);
        });
      });
    })
  };
  
  for (var i = 1; i <= numPages; i++) {
    lastPromise = lastPromise.then(loadPage.bind(null, i));
  }
  return lastPromise;
}).then(function () {
  console.log('# End of Document');
}, function (err) {
  console.error('Error: ' + err);
});

