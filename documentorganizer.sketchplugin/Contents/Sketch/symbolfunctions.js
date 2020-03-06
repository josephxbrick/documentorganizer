// assumes non-nested symbol
const setOverrideText = (instance, overrideName, newText) => {
  const child = getOverrideLayerfromSymbolMaster(instance.symbolMaster(), overrideName);
  if (child != undefined) {
    const objectID = child.objectID();
    const dictionary = instance.overrides() || NSDictionary.dictionary();
    const overrides = NSMutableDictionary.dictionaryWithDictionary(dictionary);
    overrides[objectID] = newText;
    instance.overrides = overrides;
    return newText;
  }
  return undefined;
}

// assumes non-nested symbol
const getOverrideText = (instance, overrideName) => {
  const child = getOverrideLayerfromSymbolMaster(instance.symbolMaster(), overrideName);
  if (child != undefined) {
    let retval = instance.overrides()[child.objectID()];
    if (retval == null) {
      // user left override blank: use default override instead
      retval = getDefaultOverrideText(instance, overrideName);
    }
    return retval;
  }
  return undefined;
}

// assumes non-nested symbol
const getDefaultOverrideText = (instance, overrideName) => {
  const child = getOverrideLayerfromSymbolMaster(instance.symbolMaster(), overrideName);
  if (child != undefined) {
    return child.stringValue()
  }
  return undefined;
}

// returns true if instance has override (or, at least, has a text layer with the same name as the override)
const instanceHasOverride = (instance, overrideName) => {
  const child = getOverrideLayerfromSymbolMaster(instance.symbolMaster(), overrideName);
  return (child !== undefined);
}

// returns all instances with override
const instancesWithOverride = (instances, overrideName) => {
  const retval = [];
  instances.forEach(instance => {
    const child = getOverrideLayerfromSymbolMaster(instance.symbolMaster(), overrideName);
    if (child) {
      retval.push(instance)
    }
  });
  return retval;
}

// gets the layer representing the override from a symbol master
const getOverrideLayerfromSymbolMaster = (symbolMaster, overrideName) => {
  const layerList = symbolMaster.children();
  for (let i = 0; i < layerList.count(); i++) {
    const layer = layerList[i];
    if (layer.name() == overrideName) {
      return layer;
    }
  }
  return undefined;
}

// returns the first symbol master in the document that contains a given override name
const symbolMasterWithOverrideName = (doc, overrideName) => {
  const symbolMasters = doc.documentData().allSymbols();
  for (let i = 0; i < symbolMasters.count(); i++) {
    const symbolMaster = symbolMasters[i];
    const layers = symbolMaster.children();
    for (let j = 0; j < layers.count(); j++) {
      const layer = layers[j];
      if (layer.name() == overrideName) {
        return symbolMaster;
      }
    }
  }
  return undefined;
}
