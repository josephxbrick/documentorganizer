const UI = require('sketch/ui');

// javascript's modulo operator does not support floating-point numbers
// source: https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript
const floatingPointModulo = (val, modulus) => {
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
  return toArray(container.children()).filter(item => item.class() === className && item.name() == name)[0];
}

const layersWithName = (container, className, name) => {
  return toArray(container.children()).filter(item => item.class() === className && item.name() == name);
}

const leadingZeroes = (val, desiredLength) => {
  return '0'.repeat(desiredLength).concat(val).slice(-desiredLength);
}

// returns a timestamp
const timeStamp = () => {
  const now = new Date();
  return `${'0'.concat(now.getHours()).slice(-2)}:${'0'.concat(now.getMinutes()).slice(-2)}:${'0'.concat(now.getSeconds()).slice(-2)}.${now.getMilliseconds().toString().concat('000').slice(0,3)}`;

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

const sortArtboards = (doc, page) => {
  artboards = allArtboards(page);
  sortLayersByRows(artboards);
  for (const artboard of artboards) {
    artboard.moveToLayer_beforeLayer(page, nil);
    artboard.select_byExtendingSelection(false, true);
  }
  const action = doc.actionsController().actionForID("MSCollapseAllGroupsAction");
  if (action.validate()) {
    action.doPerformAction(nil);
  }
}

const dateFromTemplate = (dateTemplate, date = new Date()) => {
  dateTemplate = dateTemplate.toLowerCase();
  const origTemplate = dateTemplate;
  const w = date.getDay(); // Sunday is 0, Saturday is 6
  const d = date.getDate(); // date of month: 1 to (max) 31
  const m = date.getMonth(); //January is 0, December is 11
  const y = date.getFullYear(); // four digit year
  const longMonth = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m];
  const shortMonth = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'][m];
  const longWeekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][w];
  const shortWeekday = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'][w];
  // comments below assume date of Friday, 1/4/2019
  dateTemplate = dateTemplate.replace('[mmmm]', longMonth); // January
  dateTemplate = dateTemplate.replace('[mmm]', shortMonth); // Jan
  dateTemplate = dateTemplate.replace('[mm]', '0'.concat(m + 1).slice(-2)); // 01
  dateTemplate = dateTemplate.replace('[m]', m + 1); // 1
  dateTemplate = dateTemplate.replace('[ww]', longWeekday); // Friday
  dateTemplate = dateTemplate.replace('[w]', shortWeekday); // Fri
  dateTemplate = dateTemplate.replace(['[ddd]'], addOrdinalIndicator(d)); // 4th
  dateTemplate = dateTemplate.replace(['[dd]'], '0'.concat(d).slice(-2)); // 04
  dateTemplate = dateTemplate.replace('[d]', d); // 4
  dateTemplate = dateTemplate.replace('[yyyy]', y); // 2019
  dateTemplate = dateTemplate.replace('[yy]', y.toString().slice(-2)); // 19
  if (dateTemplate == origTemplate) {
    // no segment of the date template was recognized, so return date in MM/DD/YYYY format
    dateTemplate = `${'0'.concat(m + 1).slice(-2)}/${'0'.concat(d).slice(-2)}/${y}`;
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
