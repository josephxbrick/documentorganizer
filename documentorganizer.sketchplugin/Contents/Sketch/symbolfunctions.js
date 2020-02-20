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

const instancesWithOverride = (instances, overrideName) => {
  const retval = [];
  for (instance of instances) {
    const child = getOverrideLayerfromSymbolMaster(instance.symbolMaster(), overrideName);
    if (child) {
      retval.push(instance)
    }
  }
  return retval;
}

const instanceHasOverride = (instance, overrideName) => {
  const child = getOverrideLayerfromSymbolMaster(instance.symbolMaster(), overrideName);
  return (child !== undefined);
}

// assumes non-nested symbol
const getDefaultOverrideText = (instance, overrideName) => {
  const child = getOverrideLayerfromSymbolMaster(instance.symbolMaster(), overrideName);
  if (child != undefined) {
    return child.stringValue()
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

const getOverrideLayerfromSymbolMaster = (symbolMaster, overrideName) => {
  return toArray(symbolMaster.children()).find(item => item.class() === MSTextLayer && item.name() == overrideName);
}

const symbolMasterWithOverrideName = (doc, overrideName) => {
  const symbolMasters = toArray(doc.documentData().allSymbols());
  for (symbolMaster of symbolMasters) {
    const child = toArray(symbolMaster.children()).find(item => item.class() === MSTextLayer && item.name() == overrideName);
    if (child != undefined) {
      return symbolMaster;
    }
  }
  return undefined;
}
