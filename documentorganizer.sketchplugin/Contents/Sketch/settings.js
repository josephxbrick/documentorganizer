@import 'common.js';
@import 'delegate.js'
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
  // alert.setIcon(NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path()));
  alert.setMessageText('Settings');
  let curY = 0;
  const viewWidth = 410;
  const viewHeight = 240;
  const alertContent = NSView.alloc().init();
  alertContent.setFlipped(true);
  let divider = helpText = label = controlDescription = undefined;
  // create and layout controls
  const controls = [];

  // ============================ Create controls that will appear in alert ============================

  // --------------- description: dialog heading ---------------
  controlDescription = createDescription("Organize design documents by creating a table of contents, adding page/section numbers, and managing callouts in mockups.", NSColor.darkGrayColor(), 12, {x: 0, y: curY, width: viewWidth, height: textHeight(12, 2)});
  curY = pushControlAndGetNewY(controls, controlDescription);
  curY += 3;

  // --------------- label: document title ---------------
  curY += 2;
  label = createLabel("Title of document:", {x: 0, y: curY, width: viewWidth});
  controls.push(label);
  curY -= 2;

  // =============== SETTING field: document title ===============
  const titleField = createField( (docTitle != undefined) ? docTitle : storedValue('docTitle'), {x: 114, y: curY, width: viewWidth - 114});
  curY = pushControlAndGetNewY(controls, titleField);

  // --------------- divider line ---------------
  divider = createDivider({x:0, y: curY, width: viewWidth});
  curY = pushControlAndGetNewY(controls, divider);
  curY -= 1;

  // --------------- label: Table of contents group header ---------------
  label = createSectionHeader("Table of contents", {x: 0, y: curY, width: viewWidth});
  curY = pushControlAndGetNewY(controls, label);

  // --------------- label: column spacing ---------------
  curY += 3
  label = createLabel("Column spacing:", {x: 0, y: curY, width: viewWidth});
  controls.push(label);
  curY -= 3;

  // =============== SETTING field: TOC column spacing ===============
  const spacingField = createField(storedValue('tocColumnSpacing'), {x: 104, y: curY, width: 35});
  controls.push(spacingField);
  curY += 4;

  // --------------- description: TOC spacing description ---------------
  controlDescription = createDescription("Applies when table has multiple columns", NSColor.grayColor(), 11, {x: 145, y: curY, width: viewWidth - 145, height: textHeight(11, 1)});
  curY = pushControlAndGetNewY(controls, controlDescription);

  // --------------- label: use section numbering ---------------
  curY -= 2;
  label = createLabel("Include:", {x: 0, y: curY, width: viewWidth}, 1);
  controls.push(label);

  // ===============  SETTING radio buttons: use section numberings ===============
  const tocShowRadios = createRadioButtons(["All pages","Section headings only"], storedValue('tocShowColumnsOnly'), {x: 54, y: curY, width: viewWidth - 54});  //
  curY = pushControlAndGetNewY(controls, tocShowRadios);

  // --------------- divider line ---------------
  divider = createDivider({x:0, y: curY, width: viewWidth});
  curY = pushControlAndGetNewY(controls, divider);

  // =============== SETTING checkbox: section numbering ===============
  // this function is passed into createCheckbox (below) and is called when the checkbox's selected state changes
  const onCheckboxSelectionChanged = (checkbox) => {
    dashStyleSelect.setEnabled(checkbox.getValue());
  }
  const useSectionsCheckbox = createCheckbox('Use section numbering', storedValue('useSections'), {x:0, y: curY, width: viewWidth}, onCheckboxSelectionChanged);
  curY = pushControlAndGetNewY(controls, useSectionsCheckbox);
  curY -= 8;

  // --------------- description: use section numbering ---------------
  controlDescription = createDescription("Affects page titles and callouts. Turn this off and on to see what it does.", NSColor.grayColor(), 11, {x: 0, y: curY, width: viewWidth, height: textHeight(11, 1)});
  curY = pushControlAndGetNewY(controls, controlDescription);

  // --------------- label: dash style ---------------
  curY += 4;
  label = createLabel("Dash style:", {x: 0, y: curY, width: viewWidth}, 6);
  controls.push(label);
  curY -= 4;

  // =============== SETTING dropdown: dash style ===============
  const dashStyleSelect = createSelect(['-', '\u2013', '\u2014'], storedValue('dashType'), {x: 73, y: curY, width: 45});
  dashStyleSelect.setEnabled(storedValue('useSections'));
  controls.push(dashStyleSelect);

  // --------------- description: dash style ---------------
  curY += 8;
  controlDescription = createDescription("Dashes separate section numbers and page titles", NSColor.grayColor(), 11, {x: 125, y: curY, width: viewWidth - 125, height: textHeight(11, 1)});
  curY = pushControlAndGetNewY(controls, controlDescription);

  // --------------- divider line ---------------
  divider = createDivider( {x:0, y: curY, width: viewWidth});
  curY = pushControlAndGetNewY(controls, divider);

  // --------------- label: date formet ---------------
  label = createLabel("Date format:", {x: 0, y: curY, width: viewWidth}, 1);
  controls.push(label);

  // ===============  SETTING radio buttons: date format ===============
  const sampleDate = new Date(2047, 0, 9);
  // this function is passed into createRadioButtons and is called when any radio button is selected
  const onRadioButtonSelected = (buttonMatrix) => {
    const buttonIndex = buttonMatrix.getValue();
    customFormatField.setEnabled(buttonIndex == 2);
  }
  const dateFormatRadios = createRadioButtons([dateFromTemplate(stockDateFormats[0], sampleDate), dateFromTemplate(stockDateFormats[1], sampleDate), "Custom format:"], storedValue('dateFormatChoice'), {x: 78, y: curY, width: viewWidth - 78}, onRadioButtonSelected);  //
  curY = CGRectGetMaxY(dateFormatRadios.frame()) - 18;
  controls.push(dateFormatRadios);

  // ===============  SETTING field: custom date format ===============
  // function updates the help text on the custom date field to show the entered format
  const updateSampleDate = (notification) => {
    sampleDateDisplay.setStringValue(dateFromTemplate(notification.object().getValue(), sampleDate));
  }
  const customFormatField = createField(storedValue('lastEnteredFormatTemplate'), {x: 192, y: curY, width: viewWidth - 192}, updateSampleDate);
  customFormatField.setEnabled(storedValue('dateFormatChoice') == 2);
  controls.push(customFormatField);
  curY += 26;

  // --------------- description: dynamic sample date display ---------------
  const sampleDateDisplay = createDescription(dateFromTemplate(storedValue('lastEnteredFormatTemplate'), sampleDate), NSColor.grayColor(), 11, {x: 192, y: curY, width: viewWidth - 192, height: textHeight(11, 1)});
  curY = pushControlAndGetNewY(controls, sampleDateDisplay);


  // --------------- divider line ---------------
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
        dateFormatRadios,
        okButton,
        cancelButton
  		]);

  // ==================================== display alert ====================================
  if (alert.runModal() == 1000){
    // user pressed OK, so save settings
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
    // user pressed cancel
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
	label.setSelectable(true);
	return label;
}

// =====================================================================================================================
// create checkbox control
//
// * getValue() returns true for checked, false for unchecked
// * onSelectionChangedFunction is a function that can be passed in. It will be called (with the checkbox as a parameter)
//   when the selected state of the checkbox changes. Here's a sample function you could pass in:
//
//   const checkboxCallback = (checkbox) => {
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
// * getValue() returns the selected item's index.
// * onSelectionChangedFunction is a function that can be passed in. It will be called (with the notification message
//   as its paramater) whenever the selected state of the checkbox changes. Here's a sample function you could pass in,
//   where console.log displays the index of the selected item:
//
//   const selectCallback = (notification) => {
//     console.log(notification.object().getValue());
//   }
// =====================================================================================================================
const createSelect = (items, selectedItemIndex, frame, onSelectionChangedFunction) => {
  frame.height = 30;
	const comboBox = NSComboBox.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height));
	comboBox.addItemsWithObjectValues(items);
	comboBox.selectItemAtIndex(selectedItemIndex);
	comboBox.setNumberOfVisibleItems(items.length);
	comboBox.setCompletes(1);
  comboBox.getValue = () => comboBox.indexOfSelectedItem();
  if (onSelectionChangedFunction) {
    const delegate = new MochaJSDelegate({
  		"comboBoxSelectionDidChange:" : onSelectionChangedFunction
  	});
  	comboBox.setDelegate(delegate.getClassInstance());
  }
	return comboBox;
}

// =====================================================================================================================
// create entry field
//
// * getValue() returns string in field
// * onTextChangedFunction is a function that can be passed in. It will be called (with the notification message
//   as its paramater) whenever the text in the field changes. Here's a sample function you could pass in,
//   where console.log displays the text after the change:
//
//   const fieldCallback = (notification) => {
//     console.log(notification.object().getValue());
//   }

// =====================================================================================================================
const createField = (text, frame, onTextChangedFunction) => {
  frame.height = 22;
	const field = NSTextField.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height));
	field.setStringValue(text);
  field.getValue = () => field.stringValue();
  if (onTextChangedFunction) {
    const delegate = new MochaJSDelegate({
  		"controlTextDidChange:" : onTextChangedFunction
  	});
  	field.setDelegate(delegate.getClassInstance());
  }
	return field;
}

// =====================================================================================================================
// create vertical radio buttons
//
// * getValue() returns the index of the chosen radio button
// * The onRadioButtonSelected function (if passed in) is called when any radio button is selected. Here's a sample
//   function you might pass in:
//
//   const radioButtonsCallback = (radioButtons) => {
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
// create label
// =====================================================================================================================
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

// =====================================================================================================================
// create section header
// =====================================================================================================================
const createSectionHeader = (text, frame) => {
  const retval = createLabel(text, frame);
  retval.setFont(NSFont.systemFontOfSize(13.5));
  return retval;
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



// =============== Adds all controls to the view ===============
const addControls = (alert, controls) => {
  for (control of controls) {
    alert.addSubview(control);
  }
}

// =============== converts point of font to pixels ===============
const textHeight = (fontSize, lines) => {
   return  lines * fontSize * (96 / 72);
}

// =============== Adds a control to controls array and return its bottom bound ===============
const pushControlAndGetNewY = (controls, control) => {
  controls.push(control);
  const padding = 12;
  return CGRectGetMaxY(control.frame()) + padding;
}

// =============== Sets tab order of controls in alert ===============
const setTabOrder = (alert, order) => {
	for (var i = 0; i < order.length; i++) {
		var thisItem = order[i],
			nextItem = order[i+1];
		if (nextItem) thisItem.setNextKeyView(nextItem);
	}
  // set initial focus
	alert.window().setInitialFirstResponder(order[0]);
}

// =============== Gets document title from instance (in document) rather than from stored value ===============
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

// =============== returns a settings object (with keys 'name,' 'key,' and 'default') given the 'name' key ===============
const settingsObjectFromName = (name) => {
  // all stored settings
  const valuesForStorage = [
    {name: 'tocColumnSpacing', key: 'organize_document_columnSpacing', default: 50},
    {name: 'tocShowColumnsOnly', key: 'organize_document_showTOCSectionsOnly', default: 0},
    {name: 'dashType', key: 'organize_document_dashType', default: 1},
    {name: 'useSections', key: 'organize_document_useSections', default: 1},
    {name: 'docTitle', key: 'organize_document_docTitle', default: 'Document title'},
    {name: 'dateFormatChoice', key: 'organize_document_dateFormatChoice', default: 0},
    {name: 'dateFormatTemplate', key: 'organize_document_dateFormatTemplate', default: '[dd] [mmmm] [yyyy]'},
    {name: 'lastEnteredFormatTemplate', key: 'organize_document_lastEnteredFormatTemplate', default: '[dd] [mmmm] [yyyy]'}
  ];
  for (const val of valuesForStorage){
    if (val.name == name){
      return val;
    }
  }
  return undefined;
}

// =============== gets stored value ===============
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

// =============== sets stored value ===============
const setStoredValue = (name, value) => {
  const obj = settingsObjectFromName(name);
  if (obj !== undefined){
    Settings.setSettingForKey(obj.key, value)
    return value;
  }
  return undefined;
}
