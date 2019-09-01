const UI = require('sketch/ui');

//get string from user. defaultValue is ignored if value is stored in key
// const getStringFromUser = (prompt, defaultValue, key)  => {
//   let storedValue = Settings.settingForKey(key);
//   if (storedValue === undefined) {
//     storedValue = defaultValue;
//   }
//   let retval = undefined;
//   const ui = UI.getInputFromUser(
//     prompt, {
//       type: UI.INPUT_TYPE.string,
//       initialValue: storedValue,
//     },
//     (err, value) => {
//       if (!err) {
//         // user did not cancel
//         retval = value;
//       }
//     }
//   );
//   ui.setIcon(NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path()));
//   if (retval !== undefined) {
//     Settings.setSettingForKey(key, retval);
//   }
//   return retval;
// }
//
// const getSelectionFromUser = (prompt, possibleValues, defaultValue, key) => {
//   let storedValue = Settings.settingForKey(key);
//   if (storedValue === undefined) {
//     storedValue = defaultValue;
//   }
//   let retval = undefined;
//   UI.getInputFromUser(
//     prompt, {
//       type: UI.INPUT_TYPE.selection,
//       possibleValues: possibleValues,
//       initialValue: storedValue,
//     },
//     (err, value) => {
//       if (!err) {
//         // user did not cancel
//         retval = value;
//       }
//     }
//   );
//   if (retval !== undefined) {
//     Settings.setSettingForKey(key, retval);
//   }
//   return retval;
// }
//
//
//
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
const sortVal = (layer, minX, minY) => {
  return (layer.frame().y() - minY) * 100 + (layer.frame().x() - minX);
}

const sortByHorizontalPosition = (layers) => {
  layers.sort((a, b) => a.frame().x() - b.frame().x());
}

const sortByVerticalPosition = (layers) => {
  layers.sort((a, b) => a.frame().y() - b.frame().y());
}
