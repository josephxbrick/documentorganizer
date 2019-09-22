// assumes non-nested symbol

const setOverrideText = (instance, overrideName, newText) => {
	const children = instance.symbolMaster().children();
	for (let i = 0; i < children.count(); i++){
		const child = children[i];
		if (child.class() === MSTextLayer && child.name() == overrideName){
			const objectID = child.objectID();
			if (instance.overrides()[objectID] !== undefined) {
				const dictionary = instance.overrides() || NSDictionary.dictionary();
				const overrides = NSMutableDictionary.dictionaryWithDictionary(dictionary);
				overrides[objectID] = newText;
				instance.overrides = overrides;
				return newText;
			}
		}
	}
	return undefined;
}

const symbolsWithOverride = (symbols, overrideName) => {
	const retval = [];
  for (symbol of symbols){
		const children = symbol.symbolMaster().children();
		for (let i = 0; i < children.count(); i++){
			const child = children[i];
			if (child.name() == overrideName){
				retval.push(symbol);
				continue;
			}
		}
	}
	return retval;
}

const instanceHasOverride = (instance, overrideName) => 	{
	const children = instance.symbolMaster().children()
	for (let i = 0; i < children.count(); i++){
		const child = children[i];
		if (child.name() == overrideName){
			return true;
		}
	}
	return false;
}

// assumes non-nested symbol
const getInstanceDefaultOverrideText = (instance, overrideName) => {
	const children = instance.symbolMaster().children();
	for (let i = 0; i < children.count(); i++){
		const child = children[i];
		if (child.class() === MSTextLayer && child.name() == overrideName){
			return child.stringValue();
		}
	}
	return undefined;
}

// assumes non-nested symbol
const getOverrideText = (instance, overrideName) => {
	const children = instance.symbolMaster().children();
	for (let i = 0; i < children.count(); i++){
		const child = children[i];
		if (child.class() === MSTextLayer && child.name() == overrideName){
			return instance.overrides()[child.objectID()];
		}
	}
	return undefined;
}

const getOverrideLayerfromSymbol = (symbol, overrideName) => {
	const children = symbol.children();
	for (let i = 0; i < children.count(); i++){
		const child = children[i];
		if (child.name() == overrideName){
			return child;
		}
	}
	return undefined;
}

const symbolMasterWithOverrideName = (doc, overrideName)  => {
  const symbolMasters = doc.documentData().allSymbols();
  for (let i = 0; i < symbolMasters.count(); i++){
		const symbolMaster = symbolMasters[i];
		const children = symbolMaster.children();
		for (let j = 0; j < children.count(); j++){
			const child = children[j];
      if (child.class() === MSTextLayer && child.name() == overrideName) {
          return symbolMaster;
      }
		}
  }
	return undefined;
}
