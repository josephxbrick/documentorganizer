// assumes non-nested symbol

const setOverrideText = (instance, overrideName, newText) => {
  const child = toArray(instance.symbolMaster().children()).filter(item => item.class() === MSTextLayer && item.name() == overrideName)[0];
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
    const child = toArray(instance.symbolMaster().children()).filter(item => item.class() === MSTextLayer && item.name() == overrideName)[0];
    if (child) {
      retval.push(instance)
    }
  }
  return retval;
}

const instanceHasOverride = (instance, overrideName) => {
  const child = toArray(instance.symbolMaster().children()).filter(item => item.class() === MSTextLayer && item.name() == overrideName)[0];
  return (child !== undefined);
}

// assumes non-nested symbol
const getInstanceDefaultOverrideText = (instance, overrideName) => {
  const child = toArray(instance.symbolMaster().children()).filter(item => item.class() === MSTextLayer && item.name() == overrideName)[0];
  if (child != undefined) {
    return child.stringValue()
  }
  return undefined;
}

// assumes non-nested symbol
const getOverrideText = (instance, overrideName) => {
  const child = toArray(instance.symbolMaster().children()).filter(item => item.class() === MSTextLayer && item.name() == overrideName)[0];
  if (child != undefined) {
    return instance.overrides()[child.objectID()];
  }
  return undefined;
}

const getOverrideLayerfromSymbolMaster = (symbolMaster, overrideName) => {
  return toArray(symbolMaster.children()).filter(item => item.class() === MSTextLayer && item.name() == overrideName)[0];
}

const symbolMasterWithOverrideName = (doc, overrideName) => {
  const symbolMasters = toArray(doc.documentData().allSymbols());
  for (symbolMaster of symbolMasters) {
    const child = toArray(symbolMaster.children()).filter(item => item.class() === MSTextLayer && item.name() == overrideName)[0];
    if (child != undefined) {
      return symbolMaster;
    }
  }
  return undefined;
}
