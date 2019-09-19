const UI = require('sketch/ui');


const allArtboards = (page) => {
  return toArray(page.layers()).filter(item => item.class() === MSArtboardGroup);
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
  const br = String.fromCharCode(13);
  const slash = String.fromCharCode(47);
  let errorMessage = '';
  let successMessage = '';
  for (let val of summary) {
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
    doc.showMessage(successMessage);
  }
  if (errorMessage != '') {
    errorMessage = errorMessage.concat(`Plugin and documentation:${br}https:${slash}${slash}github.com${slash}josephxbrick${slash}tidyupdocument${br}`);
    UI.alert('Update error', errorMessage );
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
  for (let layer of layers){
    minX = Math.min(minX, layer.frame().x())
    minY = Math.min(minY, layer.frame().y())
  }
  layers.sort( (a, b) => sortVal(a, minX, minY) - sortVal(b, minX, minY) );
}
const sortVal = (layer, minX, minY) =>  {return (layer.frame().y() - minY) * 100 + (layer.frame().x())}

const sortByHorizontalPosition = (layers) => {
  layers.sort((a, b) => a.frame().x() - b.frame().x());
}

const sortByVerticalPosition = (layers) => {
  layers.sort((a, b) => a.frame().y() - b.frame().y());
}

function sortArtboards(page) {
  artboards = allArtboards(page);
  sortLayersByRows(artboards);
	for (artboard of artboards){
    artboard.moveToLayer_beforeLayer(page,nil);
		artboard.select_byExtendingSelection(false,true);
  }
}

const currentDate = (dateTemplate = '[MM]/[DD]/[YYYY]') => {
  const origTemplate = dateTemplate;
  const today = new Date();
  const w = today.getDay(); // Sunday is 0, Saturday is 6
  const d = today.getDate(); // date of month: 1 to (max) 31
  const m = today.getMonth(); //January is 0, December is 11
  const y = today.getFullYear(); // four digit year
  const longMonth = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m];
  const shortMonth = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'][m];
  const longWeekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][w];
  const shortWeekday = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'][w];
  // comments below assume date of Friday, 1/4/2019
  dateTemplate = dateTemplate.replace('[MMMM]', longMonth); // January
  dateTemplate = dateTemplate.replace('[MMM]', shortMonth); // Jan
  dateTemplate = dateTemplate.replace('[MM]', '0'.concat(m + 1).slice(-2)); // 01
  dateTemplate = dateTemplate.replace('[M]', m + 1); // 1
  dateTemplate = dateTemplate.replace('[WW]', longWeekday); // Friday
  dateTemplate = dateTemplate.replace('[W]', shortWeekday); // Fri
  dateTemplate = dateTemplate.replace(['[DDD]'], addOrdinalIndicator(d)); // 4th
  dateTemplate = dateTemplate.replace(['[DD]'], '0'.concat(d).slice(-2)); // 04
  dateTemplate = dateTemplate.replace('[D]', d); // 4
  dateTemplate = dateTemplate.replace('[YYYY]', y); // 2019
  dateTemplate = dateTemplate.replace('[YY]', y.toString().slice(-2)); // 19
  if (dateTemplate == origTemplate){
    // template passed in was unrecognized: return date in MM/DD/YYYY format
    dateTemplate = `${'0'.concat(m + 1).slice(-2)}/${'0'.concat(d).slice(-2)}/${y}`;
  }
  return dateTemplate;
}

const addOrdinalIndicator = (num) => {
  lastNum = num.toString().slice(-1);
  if (lastNum == '1') {
    return `${num}st`;
  } else if (lastNum == '2') {
    return `${num}nd`;
  } else if (lastNum == '3') {
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
