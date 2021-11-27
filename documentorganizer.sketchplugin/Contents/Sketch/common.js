const UI = require('sketch/ui');
const sketch = require('sketch');

// javascript's modulo operator does not support a floating-point modulus
// this function works when both numbers are floating-point
// source: https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript
const fmod = (val, modulus) => {
  const valDecCount = Math.min((val.toString().split('.')[1] || '').length, 20);
  const stepDecCount = (modulus.toString().split('.')[1] || '').length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = parseInt(val.toFixed(decCount).replace('.', ''));
  const stepInt = parseInt(modulus.toFixed(decCount).replace('.', ''));
  return (((valInt % stepInt) + stepInt) % stepInt) / Math.pow(10, decCount)
}

// get artboards out of bullshit NSFrozenArray
const allArtboards = (page) => {
  const artboards = page.artboards();
  const newArtboards = [];
  artboards.forEach(artboard => {
    newArtboards.push(artboard);
  });
  return newArtboards;
}

// returns first layer from list with name
const layerWithName = (layerList, className, name) => {
  for (let i = 0; i < layerList.count(); i++) {
    const layer = layerList[i];
    if (layer.class() === className && layer.name() == name) {
      return layer;
    }
  }
  return undefined;
}

const layersWithClass = (layerList, className) => {
  const predicate = NSPredicate.predicateWithFormat('class == %@', className);
  return layerList.filteredArrayUsingPredicate(predicate);
}

const layerWithClass = (layerList, className) => {
  for (let i = 0; i < layerList.count(); i++) {
    const layer = layerList[i];
    if (layer.class() === className) {
      return layer;
    }
  }
  return undefined;
}


const addLeadingZeroes = (val, totalLength = 2) => {
  const stringVal = val.toString();
  return '0'.repeat(totalLength - stringVal.length).concat(stringVal);
}

const addTrailingZeroes = (val, totalLength = 2) => {
  const stringVal = val.toString();
  return stringVal.concat('0'.repeat(totalLength - stringVal.length));
}

// returns a timestamp
const timeStamp = () => {
  const now = new Date();
  return `${addLeadingZeroes(now.getHours())}:${addLeadingZeroes(now.getMinutes())}:${addLeadingZeroes(now.getSeconds())}.${addTrailingZeroes(now.getMilliseconds(), 3)}`;
}
// assumes an existing text layer called 'debug_output' on the current page that's NOT in a group or artboard
// parameters: the Sketch page object, the thing (or an array of things) to log, whether or not to clear previous logs
const logIt = (page, args, clear = false) => {
  // converts args to array if it's not already an array
  args = [].concat(args || []);
  // find the 'debug_output' layer on page
  const debugTextLayer = layerWithName(page.layers(), MSTextLayer, 'debug_output');
  if (debugTextLayer === undefined) {
    return undefined;
  }
  // clear out previous logs
  if (clear) {
    debugTextLayer.setStringValue("Debug output:");
  }
  // construct debug string from args[], delimited by the pipe character
  if (args.length > 0) {
    let debugString = `(${timeStamp()}): `;
    for (arg of args) {
      debugString = `${debugString}${arg.toString()} | `;
    }
    // get rid of trailing pipe delimiter
    debugString = debugString.slice(0, debugString.length - 3);
    // add debug string to debug_output text layer
    debugTextLayer.setStringValue(`${debugTextLayer.stringValue()}\n${debugString}`);
  }
}

const isNumeric = (value) => {
  return !isNaN(value - parseFloat(value));
}

const displaySummary = (doc, summary) => {
  const br = String.fromCharCode(13);
  const slash = String.fromCharCode(47);
  let errorMessage = '';
  let successMessage = '';
  for (var val of summary) {
    if (val.indexOf('[ERROR]') >= 0) {
      val = val.replace('[ERROR]', '');
      errorMessage = errorMessage.concat(`${val}${br}${br}`);
    } else {
      successMessage = successMessage.concat(`${val}, `);
    }
  }
  if (successMessage != '') {
    // get rid of trailing comma and space
    successMessage = successMessage.substr(0, successMessage.length - 2);
    doc.showMessage(`${successMessage}`);
  }
  if (errorMessage != '') {
    errorMessage = errorMessage.concat(`Plugin and documentation:${br}https:${slash}${slash}github.com${slash}josephxbrick${slash}documentorganizer${br}`);
    UI.alert('Error', errorMessage);
  }
}

// sort layers laid out in horizontal rows
const sortLayersByRows = (layers) => {
  let minX = minY = Number.MAX_SAFE_INTEGER;
  layers.forEach(layer => {
    minX = Math.min(minX, layer.frame().x())
    minY = Math.min(minY, layer.frame().y())
  });
  layers.sort((a, b) => sortVal(a, minX, minY) - sortVal(b, minX, minY));
}
const sortVal = (layer, minX, minY) => {
  return (layer.frame().y() - minY) * 100 + (layer.frame().x())
}

const sortByHorizontalPosition = (layers) => {
  layers.sort((a, b) => a.frame().x() - b.frame().x());
}

const sortByVerticalPosition = (layers) => {
  layers.sort((a, b) => a.frame().y() - b.frame().y());
}

// sorts artboards in the layer list to match the layout order (determined by artboard position),
// and moves all top-level layers on page such that the first artboard is at 0,0



// Note that this function is modified from a function created by StackOverflow user "S Vogt" who was ordering
// a tilted and possibly warped grid for camera calibration.
// https://stackoverflow.com/a/64659569/8479960

const sortArtboards = (doc, page, options = { hSpacing: 200, vSpacing: 200, moveArtboards: true }) => {
  // insure that spacing values are 0 or greater
  options.hSpacing = Math.max(options.hSpacing, 0);
  options.vSpacing = Math.max(options.vSpacing, 0);
  // inner function adjusts the in-between spacing and aligns the tops of artboards of the given row.
  // It returns the y value of the bottom of the row (i.e., the bottom of its tallest artboard)
  const tidyUpRow = (rowArtboards, rowX, rowY, rowSpacing) => {
      let maxArtboardHeight = 0;
      for (artboard of rowArtboards) {
          maxArtboardHeight = Math.max(artboard.frame().height(), maxArtboardHeight);
          if(options.moveArtboards){
            artboard.frame().setX(rowX);
            artboard.frame().setY(rowY);
          }
          // update rowX to the desired x value of next artboard in the row
          rowX += artboard.frame().width() + rowSpacing;
      }
      return rowY + maxArtboardHeight;
  };
  let sortedArtboards = [];
  let rowX = 0;
  let rowY = 0;
  let isFirstRow = true;
  // get all top-level artboards on the page
  let availableArtBoards = allArtboards(page);
  while (availableArtBoards.length > 0) {
      // find y of topmost artboard in availableArtBoards, as well as the height of the shortest artboard. 
      // We will use these to find artboards in the top row.
      let minY = Number.MAX_SAFE_INTEGER;
      let minHeight = Number.MAX_SAFE_INTEGER;
      for (const artboard of availableArtBoards) {
          minY = Math.min(minY, artboard.frame().y());
          minHeight = Math.min(minHeight, artboard.frame().height());
      }
      // find artboards in top row: assume a artboard is in the top row when its distance from minY 
      // is less than the height of the shortest artboard.
      const topRow = [];
      const otherRows = [];
      for (const artboard of availableArtBoards) {
          if (Math.abs(minY - artboard.frame().y()) < minHeight * 0.85) {
              topRow.push(artboard);
          }
          else {
              otherRows.push(artboard);
          }
      }
      // we have the top row of the remaining rows!
      topRow.sort((a, b) => a.frame().x() - b.frame().x()); // sort artboards in array by left-to-right positon
      // check if this is the first row so we can initialize rowX and rowY
      if (isFirstRow) {
          rowX = topRow[0].frame().x();
          rowY = topRow[0].frame().y();
          isFirstRow = false;
      }
      // clean up the row layout, get y value for top of next row
      rowY = tidyUpRow(topRow, rowX, rowY, options.hSpacing) + options.vSpacing;
      sortedArtboards = [...sortedArtboards, ...topRow]; // append artboards in row to sorted artboards
      availableArtBoards = [...otherRows]; // update to contain the artboards not in any previous row
  }
  // sort the artboards in the layer list such that they read top-to-bottom (i.e., reverse z-order)
  // for (let i = sortedArtboards.length - 1; i >= 0; i--) {
  //     const docPage = sortedArtboards[i];
  //     figma.currentPage.appendChild(docPage);
  // }

  sortedArtboards.forEach(artboard => {
    artboard.moveToLayer_beforeLayer(page,nil);
    artboard.select_byExtendingSelection(0,1);
  });  
  // return array of sorted artboards
  return sortedArtboards;
};

const sortArtboardsOld = (doc, page) => {
  const artboards = allArtboards(page);
  sortLayersByRows(artboards);
  const xOffset = artboards[0].frame().x();
  const yOffset = artboards[0].frame().y();
  artboards.forEach(artboard => {
    artboard.moveToLayer_beforeLayer(page,nil);
    artboard.select_byExtendingSelection(0,1);
  });


  // move all top-level layers (including artboards) such that the first artboard is at x:0,y:0

  if (xOffset != 0 || yOffset != 0) {
    const layers = page.layers();
    layers.forEach(layer => {
      layer.frame().setX(layer.frame().x() - xOffset);
      layer.frame().setY(layer.frame().y() - yOffset);
    });
    // scroll Sketch's viewport to compensate for the movement of the artboards; this way nothing
    // will visually move and the user won't lose their place
    const drawView = doc.contentDrawView();
    const curZoom = drawView.zoomValue();
    const curScroll = drawView.scrollOrigin();
    curScroll.x += xOffset * curZoom;
    curScroll.y += yOffset * curZoom;
    drawView.setScrollOrigin(curScroll);
  }
  const action = doc.actionsController().actionForID("MSCollapseAllGroupsAction");
  if (action.validate()) {
    action.doPerformAction(nil);
  }
}

const dateFromTemplate = (dateTemplate, date = new Date()) => {
  const origTemplate = dateTemplate;
  const w = date.getDay(); // Sunday is 0, Saturday is 6
  const d = date.getDate(); // date of month: 1 to (max) 31
  const m = date.getMonth(); //January is 0, December is 11
  const y = date.getFullYear(); // four digit year
  const hour24 = date.getHours().toString();
  const hour12 = (date.getHours() % 12).toString();
  const min = addLeadingZeroes(date.getMinutes());
  const sec = addLeadingZeroes(date.getSeconds());
  const ampm = (date.getHours() < 12) ? 'am' : 'pm';

  const longMonth = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m];
  const shortMonth = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'][m];
  const longWeekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][w];
  const shortWeekday = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'][w];
  // comments below assume date of Friday, 1/4/2019
  dateTemplate = dateTemplate.replace('[mmmm]', longMonth); // January
  dateTemplate = dateTemplate.replace('[mmm]', shortMonth); // Jan
  dateTemplate = dateTemplate.replace('[mm]', addLeadingZeroes(m + 1)); // 01
  dateTemplate = dateTemplate.replace('[m]', m + 1); // 1
  dateTemplate = dateTemplate.replace('[ww]', longWeekday); // Friday
  dateTemplate = dateTemplate.replace('[w]', shortWeekday); // Fri
  dateTemplate = dateTemplate.replace(['[ddd]'], addOrdinalIndicator(d)); // 4th
  dateTemplate = dateTemplate.replace(['[dd]'], addLeadingZeroes(d)); // 04
  dateTemplate = dateTemplate.replace('[d]', d); // 4
  dateTemplate = dateTemplate.replace('[yyyy]', y); // 2019
  dateTemplate = dateTemplate.replace('[yy]', y.toString().slice(-2)); // 19
  dateTemplate = dateTemplate.replace('[hour24]', hour24);
  dateTemplate = dateTemplate.replace('[hour12]', hour12);
  dateTemplate = dateTemplate.replace('[min]', min);
  dateTemplate = dateTemplate.replace('[sec]', sec);
  dateTemplate = dateTemplate.replace('[ampm]', ampm);
  dateTemplate = dateTemplate.replace('[AMPM]', ampm.toUpperCase());

  if (dateTemplate == origTemplate) {
    // no segment of the date template was recognized, so return date in MM/DD/YYYY format
    dateTemplate = `${addLeadingZeroes(m + 1)}/${addLeadingZeroes(d)}/${y}`;
  }
  return dateTemplate;
}

const addOrdinalIndicator = (num) => {
  const lastNum = num.toString().slice(-1);
  const lastTwoNums = num.toString().slice(-2);
  if (lastNum == '1' && lastTwoNums != '11') {
    return `${num}st`;
  } else if (lastNum == '2' && lastTwoNums != '12') {
    return `${num}nd`;
  } else if (lastNum == '3' && lastTwoNums != '13') {
    return `${num}rd`;
  } else {
    return `${num}th`;
  }
}

// resizeToFitChildrenWithOption() was deprecated in Sketch v. 53.
const sizeGroupToContent = (group) => {
  if (sketch.version.sketch > 52) {
    group.fixGeometryWithOptions(0);
  } else {
    group.resizeToFitChildrenWithOption(0);
  }
}
