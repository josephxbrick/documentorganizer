const UI = require('sketch/ui');

const allArtboards = (page) => {
  return toArray(page.layers()).filter(item => item.class() === MSArtboardGroup);
}

const isNumeric = (value) => {
  return !isNaN(value - parseFloat(value));
}

//get string from user. defaultValue is ignored if value is stored in key
const getStringFromUser = (prompt, defaultValue, key)  => {
  let storedValue = Settings.settingForKey(key);
  if (storedValue === undefined) {
    storedValue = defaultValue;
  }
  let retval = undefined;
  const ui = UI.getInputFromUser(
    prompt, {
      type: UI.INPUT_TYPE.string,
      initialValue: storedValue,
    },
    (err, value) => {
      if (!err) {
        // user did not cancel
        retval = value;
      }
    }
  );
  ui.setIcon(NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path()));
  if (retval !== undefined) {
    Settings.setSettingForKey(key, retval);
  }
  return retval;
}

const getSelectionFromUser = (prompt, possibleValues, defaultValue, key) => {
  let storedValue = Settings.settingForKey(key);
  if (storedValue === undefined) {
    storedValue = defaultValue;
  }
  let retval = undefined;
  UI.getInputFromUser(
    prompt, {
      type: UI.INPUT_TYPE.selection,
      possibleValues: possibleValues,
      initialValue: storedValue,
    },
    (err, value) => {
      if (!err) {
        // user did not cancel
        retval = value;
      }
    }
  );
  if (retval !== undefined) {
    Settings.setSettingForKey(key, retval);
  }
  return retval;
}

const displaySummary = (doc, summary)  => {
  console.log('got here');
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
    UI.alert('Error', errorMessage );
  }

}

const layerWithName = (container, className, name) => {
  const layers = container.children();
  for (let i = 0; i < layers.count(); i++) {
    let layer = layers[i];
    if (layer.class() === className && layer.name() == name) {
      return layer;
    }
  }
  return undefined;
}

const layersWithName = (container, className, name) => {
  const layers = container.children();
  const retval = [];
  for (let i = 0; i < layers.count(); i++) {
    let layer = layers[i];
    if (layer.class() === className && layer.name() == name) {
      retval.push(layer)
    }
  }
  return retval;
}

// sort layers laid out in horizontal rows
const sortLayersByRows = (layers) => {
  let minX = minY = Number.MAX_SAFE_INTEGER;
  for (const layer of layers){
    minX = Math.min(minX, layer.frame().x())
    minY = Math.min(minY, layer.frame().y())
  }
  layers.sort( (a, b) => sortVal(a, minX, minY) - sortVal(b, minX, minY) );
}
const sortVal = (layer, minX, minY) =>  {
  return (layer.frame().y() - minY) * 100 + (layer.frame().x())
}

const sortByHorizontalPosition = (layers) => {
  layers.sort((a, b) => a.frame().x() - b.frame().x());
}

const sortByVerticalPosition = (layers) => {
  layers.sort((a, b) => a.frame().y() - b.frame().y());
}

const sortArtboards = (page) => {
  artboards = allArtboards(page);
  sortLayersByRows(artboards);
	for (const artboard of artboards){
    artboard.moveToLayer_beforeLayer(page, nil);
		artboard.select_byExtendingSelection(false, true);
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
  if (dateTemplate == origTemplate){
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


// This code is for wrapping the TOC. It's not working yet.
// const wrapGroup = (group, width) => {
//   let runningTop = 0;
//   const instances = group.layers());
//   for (let i = 0; i < instances.count(); i++){
//     const instance = instances[i];
//     let overrideName = undefined;
//     instance.frame().setY(runningTop);
//     if (instanceHasOverride(instance, '<tocSectionTitle>')){
//       overrideName = '<tocSectionTitle>';
//     } else {
//       overrideName = '<tocPageTitle>';
//     }
//     const master = instance.symbolMaster();
//     const override = getOverrideLayerfromMaster(master, overrideName);
//     const overrideCopy = override.copy();
//     group.addLayers([overrideCopy]);
//     const horizontalPadding = master.frame().width() - override.frame().width();
//     const verticalPadding = master.frame().height() - override.frame().height();
//     overrideCopyframe().setWidth(width - horizontalPadding);
//     overrideCopy.setStringValue(getOverrideText(instance, overrideName));
//     runningTop += verticalPadding + overrideCopy.frame().height();
//     group.removeLayer(overrideCopy);
//   }
//   return runningTop;
// }
