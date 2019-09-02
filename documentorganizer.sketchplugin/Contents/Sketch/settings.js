
const Settings = require('sketch/settings');

// array of objects used for setting and retrieving values
const valuesForStorage = [
  {name: 'tocColumnSpacing', key: 'organize_document_columnSpacing', default: 50},
  {name: 'tocShowColumnsOnly', key: 'organize_document_showTOCSectionsOnly', default: 0},
  {name: 'dashType', key: 'organize_document_dashType', default: 1},
  {name: 'useSections', key: 'organize_document_useSections', default: 1}
];


// Thanks to Jason Burns, whose Symbol Orgainzer plugin guided me through the creation of this settings dialog
const settingsDialog = (context) => {
  const alert =  NSAlert.alloc().init();
  alert.setIcon(NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path()));
  alert.setMessageText("Organize Document Settings");
  alert.addButtonWithTitle("OK");
  alert.addButtonWithTitle("Cancel");
  let curY = 0;
  const rightColumnPos = 130;
  const viewWidth = 360;
  const viewHeight = 240;
  const alertContent = NSView.alloc().init();
  alertContent.setFlipped(true);

  // create and layout controls
  const controls = [];
  // Heading
  const description = createDescription("Organize your document with page numbers, section/callout numbering, and a table of contents (TOC).", NSColor.blackColor(), 12, {x: 0, y: curY, width: viewWidth, height: textHeight(12, 2)});
  curY = pushControlAndGetNewY(controls, description);
  // Divider line
  const divider1 = createDivider({x:0, y: curY, width: viewWidth});
  curY = pushControlAndGetNewY(controls, divider1);
  // Column spacing label, field, and help text
  const spacingLabel = createLabel("TOC column spacing:", {x: 0, y: curY, width: viewWidth});
  controls.push(spacingLabel);
  const spacingField = createField(storedValue('tocColumnSpacing'), {x: rightColumnPos, y: curY, width: 34});  // < ================ Stored value
  curY = pushControlAndGetNewY(controls, spacingField, 4);
  const spacingHelp = createDescription("Applies when table of contents has multiple columns", NSColor.grayColor(), 11, {x: rightColumnPos, y: curY, width: viewWidth - rightColumnPos, height: textHeight(11, 2)});
  curY = pushControlAndGetNewY(controls, spacingHelp);
  // radio buttons
  const tocShowLabel = createLabel("Include in TOC:", {x: 0, y: curY, width: viewWidth});
  controls.push(tocShowLabel);
  const tocShowRadios = createRadioButtons(["All pages","Section headings only"], storedValue('tocShowColumnsOnly'), {x: rightColumnPos, y: curY, width: viewWidth});  // < ================ Stored value
  curY = pushControlAndGetNewY(controls, tocShowRadios);
  // divider line
  const divider2 = createDivider({x:0, y: curY, width: viewWidth});
  curY = pushControlAndGetNewY(controls, divider2);

  //Section numbering checkbox
  const useSectionsCheckbox = createCheckbox('Use section numbering', storedValue('useSections'), {x:0, y: curY, width: viewWidth}); // < ================ Stored value
  curY = pushControlAndGetNewY(controls, useSectionsCheckbox, 5);
  useSectionsCheckbox.setAction("callAction:");
  useSectionsCheckbox.setCOSJSTargetFunction(function(sender) { dashStyleSelect.setEnabled(sender.state()); });
  const sectionsHelp = createDescription("Section and page titles can include section numbering. Without section numbering, you will need to manually number callouts.", NSColor.grayColor(), 11, {x: 0, y: curY, width: viewWidth, height: textHeight(11, 2)});
  curY = pushControlAndGetNewY(controls, sectionsHelp);
  // Dash type label, dropdown, and help text
  const dashStyleLabel = createLabel("Dash style:", {x: 0, y: curY, width: viewWidth});
  controls.push(dashStyleLabel);
  const dashStyleSelect = createSelect(['-', '\u2013', '\u2014'], storedValue('dashType'), {x: 73, y: curY, width: 45});  // < ================ Stored value
  dashStyleSelect.setEnabled(storedValue('useSections'));
  curY = pushControlAndGetNewY(controls, dashStyleSelect, 0);
  const dashHelp = createDescription("Dashes appear between section numbers and page titles", NSColor.grayColor(), 11, {x: 73, y: curY, width: viewWidth - 73, height: textHeight(11, 2)});
  curY = pushControlAndGetNewY(controls, dashHelp);
  // divider line
  const divider3 = createDivider( {x:0, y: curY, width: viewWidth});
  curY = pushControlAndGetNewY(controls, divider3);
  // add all controls to the alertContent view
  addControls(alertContent, controls);
	alertContent.frame = NSMakeRect(0,0,viewWidth,CGRectGetMaxY(controls[controls.length - 1].frame()));
  alert.accessoryView = alertContent;
  // Store the values if cancel isn't hit

  if (alert.runModal() == 1000){
    setStoredValue('tocColumnSpacing', spacingField.getValue());
    setStoredValue('tocShowColumnsOnly', tocShowRadios.getValue());
    setStoredValue('dashType', dashStyleSelect.getValue());
    setStoredValue('useSections', useSectionsCheckbox.getValue());
    return true;
  } else {
    return undefined;
  }
}

// create description control
const createDescription = (text, textColor, textSize, frame) => {
	const label = NSTextField.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height));
	label.setStringValue(text);
	label.setFont(NSFont.systemFontOfSize(textSize));
	label.setTextColor(textColor);
	label.setBezeled(false);
	label.setDrawsBackground(false);
	label.setEditable(false);
	label.setSelectable(false);
	return label;
}

// create a checkbox control
const createCheckbox = (title, checkState, frame) => {
  frame.height = textHeight(12, 1);
	const checkbox = NSButton.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height));
	const checkStateNS = (checkState == false) ? NSOffState : NSOnState;
	checkbox.setButtonType(NSSwitchButton);
	checkbox.setBezelStyle(0);
	checkbox.setTitle(title);
	checkbox.setTag(1);
	checkbox.setState(checkStateNS);
  checkbox.getValue = () => (checkbox.stringValue() == "1") ? true: false;
	return checkbox;
}

// create dropdown control
const createSelect = (items, selectedItemIndex, frame) => {
  frame.height = 30;
	var comboBox = NSComboBox.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height)),
		selectedItemIndex = (selectedItemIndex > -1) ? selectedItemIndex : 0;
	comboBox.addItemsWithObjectValues(items);
	comboBox.selectItemAtIndex(selectedItemIndex);
	comboBox.setNumberOfVisibleItems(items.length);
	comboBox.setCompletes(1);
  comboBox.getValue = () => comboBox.indexOfSelectedItem();
	// comboBox.setEditable(false);
	return comboBox;
}

// create entry field
const createField = (text, frame) => {
  frame.height = 22;
	const field = NSTextField.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height));
	field.setStringValue(text);
  field.getValue = () => field.stringValue();
	return field;
}

// create set of vertical radio buttons
const createRadioButtons = (options, selected, frame) => {
  const rows = options.length;
  frame.height = rows * 20;
  const columns = 1;
	const buttonCell = NSButtonCell.alloc().init();
  buttonCell.setButtonType(NSRadioButton);
	const buttonMatrix = NSMatrix.alloc().initWithFrame_mode_prototype_numberOfRows_numberOfColumns(
		NSMakeRect(frame.x, frame.y, frame.width, frame.height),
		NSRadioModeMatrix,
		buttonCell,
		rows,
		columns
	);
	buttonMatrix.setCellSize(NSMakeSize(frame.width,20));
	// Create a cell for each option
	for (i = 0; i < options.length; i++) {
		buttonMatrix.cells().objectAtIndex(i).setTitle(options[i]);
		buttonMatrix.cells().objectAtIndex(i).setTag(i);
	}
	// Select the default cell
	buttonMatrix.selectCellAtRow_column(selected,0);
  buttonMatrix.getValue = () => buttonMatrix.selectedCell().tag();
	// Return the matrix
	return buttonMatrix;
}

// create a non-bolded label
const createLabel = (text, frame) => {
  frame.height = textHeight(12, 1);
	const label = NSTextField.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height));
	label.setStringValue(text);
	label.setFont(NSFont.systemFontOfSize(12));
	label.setBezeled(false);
	label.setDrawsBackground(false);
	label.setEditable(false);
	label.setSelectable(false);
	return label;
}

// create bold label
const createBoldLabel = (text, frame) => {
  frame.height = textHeight(12, 1);
	const label = NSTextField.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height));
	label.setStringValue(text);
	label.setFont(NSFont.boldSystemFontOfSize(12));
	label.setBezeled(false);
	label.setDrawsBackground(false);
	label.setEditable(false);
	label.setSelectable(false);
	return label;
}

// create divider line
const createDivider = (frame) => {
  frame.height = 1;
	const divider = NSView.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height ));
	divider.setWantsLayer(1);
	divider.layer().setBackgroundColor(CGColorCreateGenericRGB(204/255,204/255,204/255,1.0));
	return divider;
}

// Add all controls to the view
const addControls = (alert, controls) => {
  for (control of controls) {
    alert.addSubview(control);
  }
}

// convert point of font to pixels
const textHeight = (fontSize, lines) => {
   return  lines * fontSize * (96 / 72);
}

// get value from settings
const storedValue = (name) => {
  let retVal = undefined;
  const obj = settingsObjectFromName(name);
  if (obj !== undefined){
    retVal = Settings.settingForKey(obj.key)
    if (retVal == undefined){
      return obj.default;
    } else {
      return retVal;
    }
  }
  return undefined;
}

// set value in settings
const setStoredValue = (name, value) => {
  const obj = settingsObjectFromName(name);
  if (obj !== undefined){

    Settings.setSettingForKey(obj.key, value)
    return value;
  }
  return undefined;
}

// get object in valuesForStorage array (defined up top) that has a given name
const settingsObjectFromName = (name) => {
  for (val of valuesForStorage){
    if (val.name == name){
      return val;
    }
  }
  return undefined;
}

// Add a control to array and return its bottom bound
const pushControlAndGetNewY = (controls, control, padding = 12) => {
  const settingPad = padding;
  controls.push(control);
  return CGRectGetMaxY(control.frame()) + settingPad;
}
