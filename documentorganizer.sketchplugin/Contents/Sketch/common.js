const UI = require('sketch/ui');
const sketch = require('sketch');

// javascript's modulo operator does not support a floating-point modulus
// this function works when both numbers are floating-point
// source: https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript
const fmod = (val, modulus) => {
  const valDecCount = (val.toString().split('.')[1] || '').length;
  const stepDecCount = (modulus.toString().split('.')[1] || '').length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = parseInt(val.toFixed(decCount).replace('.', ''));
  const stepInt = parseInt(modulus.toFixed(decCount).replace('.', ''));
  return (((valInt % stepInt) + stepInt) % stepInt) / Math.pow(10, decCount)
}

const allArtboards = (page) => {
  return toArray(page.layers()).filter(item => item.class() === MSArtboardGroup);
}

const layerWithName = (container, className, name) => {
  return toArray(container.children()).find(item => item.class() === className && item.name() == name);
}

const layersWithName = (container, className, name) => {
  return toArray(container.children()).filter(item => item.class() === className && item.name() == name);
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
  const debugTextLayer = toArray(page.layers()).filter(item => item.name() == 'debug_output')[0];
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
  for (const layer of layers) {
    minX = Math.min(minX, layer.frame().x())
    minY = Math.min(minY, layer.frame().y())
  }
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
const sortArtboards = (doc, page) => {
  const artboards = allArtboards(page);
  sortLayersByRows(artboards);
  for (const artboard of artboards) {
    MSLayerMovement.moveToFront([artboard]);
  }

  // move all top-level layers (including artboards) such that the first artboard is at x:0,y:0
  const artBoardZero = artboards[0];
  const xOffset = artBoardZero.frame().x();
  const yOffset = artBoardZero.frame().y();
  if (xOffset != 0 || yOffset != 0) {
    const layers = toArray(page.layers());
    for (const layer of layers) {
      layer.frame().setX(layer.frame().x() - xOffset);
      layer.frame().setY(layer.frame().y() - yOffset);
    }
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
