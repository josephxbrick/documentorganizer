@import 'common.js';
const Settings = require('sketch/settings');

// =====================================================================================================================
// create and display the settings dialog
//
// * thanks to Jason Burns, whose Symbol Orgainzer plugin provided many "Aha!" moments (and code snippets)
// =====================================================================================================================
const settingsDialog = (context) => {
  const doc = context.document;
  const page = doc.currentPage();
  const docTitle = docTitleFromDocument(page);
  const stockDateFormats = [
    '[mm]/[dd]/[yyyy]',
    '[m]/[d]/[yyyy]'
  ]
  const alert =  NSAlert.alloc().init();
  alert.setIcon(NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path()));
  alert.setMessageText("Organize Document Settings");
  let curY = 0;
  const viewWidth = 360;
  const viewHeight = 240;
  const alertContent = NSView.alloc().init();
  alertContent.setFlipped(true);
  let divider = helpText = label = controlDescription = undefined;
  // create and layout controls
  const controls = [];

  // ============================ Create controls that will appear in alert ============================

  // =============== Dialog heading ===============
  const description = createDescription("Organize your document with page numbers, section/callout numbering, and a table of contents (TOC).", NSColor.darkGrayColor(), 12, {x: 0, y: curY, width: viewWidth, height: textHeight(12, 2)});
  curY = pushControlAndGetNewY(controls, description);

  // =============== Divider line ===============
  divider = createDivider({x:0, y: curY, width: viewWidth});
  curY = pushControlAndGetNewY(controls, divider);
  //
  // =============== Document title label, field, and help text ===============
  label = createLabel("Title of document:", {x: 0, y: curY, width: viewWidth});
  controls.push(label);
  const titleField = createField( (docTitle != undefined) ? docTitle : storedValue('docTitle') , {x: 114, y: curY, width: viewWidth - 114});
  curY = pushControlAndGetNewY(controls, titleField, 4);

  controlDescription = createDescription("Used to populate the document title", NSColor.grayColor(), 11, {x: 114, y: curY, width: viewWidth - 114, height: textHeight(11, 1)});
  curY = pushControlAndGetNewY(controls, controlDescription);

  // =============== Divider line ===============
  divider = createDivider({x:0, y: curY, width: viewWidth});
  curY = pushControlAndGetNewY(controls, divider);

  // =============== TOC column spacing ===============
  label = createLabel("TOC column spacing:", {x: 0, y: curY, width: viewWidth});
  controls.push(label);
  const spacingField = createField(storedValue('tocColumnSpacing'), {x: 130, y: curY, width: 34});
  curY = pushControlAndGetNewY(controls, spacingField, 4);
  controlDescription = createDescription("Applies when table of contents has multiple columns", NSColor.grayColor(), 11, {x: 130, y: curY, width: viewWidth - 130, height: textHeight(11, 2)});
  curY = pushControlAndGetNewY(controls, controlDescription);

  // =============== use sections radio buttons ===============
  label = createLabel("Include in TOC:", {x: 0, y: curY, width: viewWidth}, 1);
  controls.push(label);
  const tocShowRadios = createRadioButtons(["All pages","Section headings only"], storedValue('tocShowColumnsOnly'), {x: 130, y: curY, width: viewWidth});  //
  curY = pushControlAndGetNewY(controls, tocShowRadios);

  // =============== divider line ===============
  divider = createDivider({x:0, y: curY, width: viewWidth});
  curY = pushControlAndGetNewY(controls, divider);

  // =============== checkbox and dropdown for section numbering ===============
  // this function is passed into createCheckbox (below) and is called when the checkbox's selected state changes
  const onCheckboxSelectionChanged = (checkbox) => {
    dashStyleSelect.setEnabled(checkbox.getValue());
  }
  const useSectionsCheckbox = createCheckbox('Use section numbering', storedValue('useSections'), {x:0, y: curY, width: viewWidth}, onCheckboxSelectionChanged);
  curY = pushControlAndGetNewY(controls, useSectionsCheckbox, 5);
  controlDescription = createDescription("Section and page titles can include section numbering. Without section numbering, you will need to manually number callouts.", NSColor.grayColor(), 11, {x: 0, y: curY, width: viewWidth, height: textHeight(11, 2)});
  curY = pushControlAndGetNewY(controls, controlDescription);

  // =============== Dash type label, dash-type dropdown, and help text ===============

  label = createLabel("Dash style:", {x: 0, y: curY, width: viewWidth}, 6);
  controls.push(label);
  const dashStyleSelect = createSelect(['-', '\u2013', '\u2014'], storedValue('dashType'), {x: 73, y: curY, width: 45});
  dashStyleSelect.setEnabled(storedValue('useSections'));
  curY = pushControlAndGetNewY(controls, dashStyleSelect, 0);
  controlDescription = createDescription("Dashes appear between section numbers and page titles", NSColor.grayColor(), 11, {x: 73, y: curY, width: viewWidth - 73, height: textHeight(11, 2)});
  curY = pushControlAndGetNewY(controls, controlDescription);

  // =============== divider line ===============
  divider = createDivider( {x:0, y: curY, width: viewWidth});
  curY = pushControlAndGetNewY(controls, divider);

  // =============== date formats label, radio buttons, and custom-format field ===============
  label = createLabel("Date format:", {x: 0, y: curY, width: viewWidth}, 1);
  let customFormatField = undefined;
  controls.push(label);
  const sampleDate = new Date(2025, 1, 3);
  // this function is passed into createRadioButtons and is called when any radio button is selected
  const onRadioButtonSelected = (buttonMatrix) => {
    const buttonIndex = buttonMatrix.getValue();
    customFormatField.setEnabled(buttonIndex == 2);
  }
  const dateFormatRadios = createRadioButtons([dateFromTemplate(stockDateFormats[0], sampleDate), dateFromTemplate(stockDateFormats[1], sampleDate), "Custom format:"], storedValue('dateFormatChoice'), {x: 78, y: curY, width: viewWidth - 78}, onRadioButtonSelected);  //
  curY = CGRectGetMaxY(dateFormatRadios.frame()) - 18;
  controls.push(dateFormatRadios);
  customFormatField = createField(storedValue('lastEnteredFormatTemplate'), {x: 190, y: curY, width: viewWidth - 190});
  customFormatField.setEnabled(storedValue('dateFormatChoice') == 2);
  curY = pushControlAndGetNewY(controls, customFormatField);

  //  =============== divider line ===============
  divider = createDivider({x:0, y: curY, width: viewWidth});
  curY = pushControlAndGetNewY(controls, divider);

  // ==================================== All controls have been created ====================================

  addControls(alertContent, controls);
  // set height of alertContent based on bottom bounds of last control
	alertContent.frame = NSMakeRect(0,0,viewWidth,CGRectGetMaxY(controls[controls.length - 1].frame()));
  alert.accessoryView = alertContent;

  // ok and cancel buttons. These automatically appear at the bottom of the alert (below accessoryView area)
  const okButton = alert.addButtonWithTitle("Save Settings");
  const cancelButton = alert.addButtonWithTitle("Cancel");
  // set the tab order
  setTabOrder(alert,[
  			titleField,
  			spacingField,
  			tocShowRadios,
  			useSectionsCheckbox,
  			dashStyleSelect,
        okButton,
        cancelButton
  		]);
  // run modal! 1000 means Okay button was pressed, so store values //
  if (alert.runModal() == 1000){
    setStoredValue('tocColumnSpacing', spacingField.getValue());
    setStoredValue('docTitle', titleField.getValue());
    setStoredValue('tocShowColumnsOnly', tocShowRadios.getValue());
    setStoredValue('dashType', dashStyleSelect.getValue());
    setStoredValue('useSections', useSectionsCheckbox.getValue());
    const dateFormatChoice = dateFormatRadios.getValue();
    setStoredValue('dateFormatChoice', dateFormatChoice);
    if (dateFormatChoice == 2){
      setStoredValue('dateFormatTemplate', customFormatField.getValue());
      setStoredValue('lastEnteredFormatTemplate', customFormatField.getValue());
    } else {
      setStoredValue('dateFormatTemplate', stockDateFormats[dateFormatChoice]);
    }
    return true;
  } else {
    return undefined;
  }
}

// =====================================================================================================================
// create description control
// =====================================================================================================================
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

// =====================================================================================================================
// create checkbox control
//
// * getValue() function will return true for checked, false for unchecked
// * The onSelectionChangedFunction can be passed in. It will be called (with the checkbox as a parameter) whenever the
//   selected state of the checkbox changes. Here's a sample function you could pass in:
//
//   const onCheckboxSelectionChanged = (checkbox) => {
//     if (checkbox.getValue() == true) {
//       console.log("checkbox is selected");
//     }
//   }
// =====================================================================================================================
const createCheckbox = (title, checkState, frame, onSelectionChangedFunction = undefined) => {
  frame.height = textHeight(12, 1);
	const checkbox = NSButton.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height));
	const checkStateNS = (checkState == false) ? NSOffState : NSOnState;
	checkbox.setButtonType(NSSwitchButton);
	checkbox.setBezelStyle(0);
	checkbox.setTitle(title);
	checkbox.setTag(1);
	checkbox.setState(checkStateNS);
  checkbox.getValue = () => (checkbox.stringValue() == "1") ? true : false;
  if (onSelectionChangedFunction != undefined){
    checkbox.setAction("callAction:");
    checkbox.setCOSJSTargetFunction(onSelectionChangedFunction);
  }
	return checkbox;
}

// =====================================================================================================================
// create select (combobox) control
//
// * The control's getValue() method returns the selected item's index.
// =====================================================================================================================

const createSelect = (items, selectedItemIndex, frame) => {
  frame.height = 30;
	var comboBox = NSComboBox.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height)),
		selectedItemIndex = (selectedItemIndex > -1) ? selectedItemIndex : 0;
	comboBox.addItemsWithObjectValues(items);
	comboBox.selectItemAtIndex(selectedItemIndex);
	comboBox.setNumberOfVisibleItems(items.length);
	comboBox.setCompletes(1);
  comboBox.getValue = () => comboBox.indexOfSelectedItem();
	return comboBox;
}

// =====================================================================================================================
// create entry field
//
// * getValue() returns string in field
// =====================================================================================================================
const createField = (text, frame) => {
  frame.height = 22;
	const field = NSTextField.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height));
	field.setStringValue(text);
  field.getValue = () => field.stringValue();
	return field;
}

// =====================================================================================================================
// create vertical radio buttons
//
// * getValue() returns the index of the chosen radio button
// * The onRadioButtonSelected function (if passed in) is called when any radio button is selected. Here's a sample
//   function you might pass in:
//
//   const onRadioButtonSelected = (radioButtons) => {
//     if (radioButtons.getValue() == 0){
//       console.log("The first radio button was selected")
//     }
//   }
// =====================================================================================================================
const createRadioButtons = (options, selected, frame, onRadioButtonSelected = undefined) => {
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
    const button = buttonMatrix.cells().objectAtIndex(i);
		button.setTitle(options[i]);
		button.setTag(i);
    if (onRadioButtonSelected != undefined){
      button.setCOSJSTargetFunction(onRadioButtonSelected);
    }
	}
	// Select the default cell
	buttonMatrix.selectCellAtRow_column(selected,0);
  buttonMatrix.getValue = () => buttonMatrix.selectedCell().tag();
	return buttonMatrix;
}

// =====================================================================================================================
// create non-bolded label
// =====================================================================================================================
const createLabel = (text, frame, topPadding = 2) => {
  frame.height = textHeight(12, 1);
	const label = NSTextField.alloc().initWithFrame(NSMakeRect(frame.x, frame.y + topPadding, frame.width, frame.height));
	label.setStringValue(text);
	label.setFont(NSFont.systemFontOfSize(12));
	label.setBezeled(false);
	label.setDrawsBackground(false);
	label.setEditable(false);
	label.setSelectable(false);
	return label;
}

// =====================================================================================================================
// create bold label
//   * to do: make "bold" an option of createLabel() above
// =====================================================================================================================
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

// =====================================================================================================================
// create divider line
// =====================================================================================================================
const createDivider = (frame) => {
  frame.height = 1;
	const divider = NSView.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height ));
	divider.setWantsLayer(1);
	divider.layer().setBackgroundColor(CGColorCreateGenericRGB(204/255,204/255,204/255,1.0));
	return divider;
}

// =====================================================================================================================
// Add all controls to the view
// =====================================================================================================================
const addControls = (alert, controls) => {
  for (control of controls) {
    alert.addSubview(control);
  }
}

// =====================================================================================================================
// convert point of font to pixels
// =====================================================================================================================
const textHeight = (fontSize, lines) => {
   return  lines * fontSize * (96 / 72);
}

// =====================================================================================================================
// Add a control to controls array and return its bottom bound
// =====================================================================================================================
const pushControlAndGetNewY = (controls, control, padding = 12) => {
  controls.push(control);
  return CGRectGetMaxY(control.frame()) + padding;
}

// =====================================================================================================================
// Sets tab order of controls in alert
// =====================================================================================================================
const setTabOrder = (alert, order) => {
	for (var i = 0; i < order.length; i++) {
		var thisItem = order[i],
			nextItem = order[i+1];
		if (nextItem) thisItem.setNextKeyView(nextItem);
	}
  // set initial focus
	alert.window().setInitialFirstResponder(order[0]);
}

// =====================================================================================================================
// Get document title from instance (in document) rather than from stored value; the stored value will return
// the same title no matter which document you are working on
// =====================================================================================================================
const docTitleFromDocument = (page) => {
  let docTitle = undefined;
  const artboards = allArtboards(page);
  for (artboard of artboards) {
    const instances = toArray(artboard.children()).filter(item => item.class() === MSSymbolInstance)
    for (instance of instances) {
      docTitle = getOverrideText(instance, '<documentTitle>');
      if (docTitle != undefined) {
        return docTitle;
      }
    }
  }
  return undefined;
}

// =====================================================================================================================
// returns a settings object (with keys 'name,' 'key,' and 'default') given the 'name' key
// =====================================================================================================================
const settingsObjectFromName = (name) => {
  // all stored settings
  const valuesForStorage = [
    {name: 'tocColumnSpacing', key: 'organize_document_columnSpacing', default: 50},
    {name: 'tocShowColumnsOnly', key: 'organize_document_showTOCSectionsOnly', default: 0},
    {name: 'dashType', key: 'organize_document_dashType', default: 1},
    {name: 'useSections', key: 'organize_document_useSections', default: 1},
    {name: 'docTitle', key: 'organize_document_docTitle', default: 'Document title'},
    {name: 'dateFormatChoice', key: 'organize_document_dateFormatChoice', default: 0},
    {name: 'dateFormatTemplate', key: 'organize_document_dateFormatTemplate', default: '[d] [mmm] [yyyy]'},
    {name: 'lastEnteredFormatTemplate', key: 'organize_document_lastEnteredFormatTemplate', default: '[d] [mmm] [yyyy]'}
  ];
  for (const val of valuesForStorage){
    if (val.name == name){
      return val;
    }
  }
  return undefined;
}

// =====================================================================================================================
// get stored value
// =====================================================================================================================
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

// =====================================================================================================================
// set stored value
// =====================================================================================================================
const setStoredValue = (name, value) => {
  const obj = settingsObjectFromName(name);
  if (obj !== undefined){
    Settings.setSettingForKey(obj.key, value)
    return value;
  }
  return undefined;
}
