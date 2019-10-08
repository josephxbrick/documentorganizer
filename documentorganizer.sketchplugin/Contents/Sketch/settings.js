//  Thanks to Jason Burns, whose Symbol Orgainzer plugin's settings dialog provided many "Aha!" moments (and code snippets)
//  https://github.com/sonburn/symbol-organizer

@import 'common.js';
@import 'alertControls.js';
const Settings = require('sketch/settings');

// function: contains an array of objects, each representing a setting to store
// returns: a settings object given the 'name' key
const settingsObjectFromName = (name) => {
  // all stored settings for the settings dialog
  const settingsObjects = [
    {name: 'useTOC', key: 'organize_document_useTOC', default: true},
    {name: 'tocColumnSpacing', key: 'organize_document_columnSpacing', default: 50},
    {name: 'tocShowSectionsOnly', key: 'organize_document_showTOCSectionsOnly', default: 0},
    {name: 'dashType', key: 'organize_document_dashType', default: 1},
    {name: 'useSections', key: 'organize_document_useSections', default: 1},
    {name: 'docTitle', key: 'organize_document_docTitle', default: 'Document title'},
    {name: 'dateFormatChoice', key: 'organize_document_dateFormatChoice', default: 0},
    {name: 'dateFormatTemplate', key: 'organize_document_dateFormatTemplate', default: '[ww], [mmmm] [ddd], [yyyy]'},
    {name: 'lastEnteredFormatTemplate', key: 'organize_document_lastEnteredFormatTemplate', default: '[ww], [mmmm] [ddd], [yyyy]'}
  ];
  return settingsObjects.find(settingsObject => {return settingsObject.name == name});
}

// function: gets stored value by its name
// returns: stored value, or default value if nothing is stored, or undefined if name is invalid
const storedValue = (name) => {
  const settingsObject = settingsObjectFromName(name);
  if (settingsObject !== undefined){
    const retVal = Settings.settingForKey(settingsObject.key)
    if (retVal == undefined){
      // no value stored; return default value for setting
      return settingsObject.default;
    } else {
      return retVal;
    }
  }
  return undefined;
}

// function: stores setting value
// returns: stored setting value, or undefined if name parameter is invalid
const setStoredValue = (name, value) => {
  const settingsObject = settingsObjectFromName(name);
  if (settingsObject !== undefined){
    Settings.setSettingForKey(settingsObject.key, value);
    return value;
  }
  return undefined;
}

// function: creates and displays the settings dialog, stores settings
// returns: true if dialog is not canceled, or undefined if it is
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
  alert.setMessageText('Settings');
  const viewWidth = 415;
  const controls = [];
  let curY = 0;
  let control = undefined;

  // ===========================================================================
  // ======         Create controls that will appear in alert             ======
  // ===========================================================================

  // description: dialog heading
  control = createDescription("Organize design documents by creating a table of contents, adding page/section numbers, and managing callouts in mockups.", NSColor.darkGrayColor(), 12, {x: 0, y: curY, width: viewWidth, height: textHeight(12, 2)});
  curY = addControlWithBottomPadding(control, controls, 15);

  // label: document title
  curY += 2;
  control = createLabel("Title of document:", {x: 0, y: curY, width: viewWidth});
  controls.push(control);
  curY -= 2;

  // SETTING FIELD: document title =============================================
  const titleField = createField(docTitle, {x: 114, y: curY, width: viewWidth - 114});
  curY = addControlWithBottomPadding(titleField, controls, 14);

  // divider line
  control = createDivider({x:0, y: curY, width: viewWidth});
  curY = addControlWithBottomPadding(control, controls, 12);

  // SETTING CHECKBOX: create table of contents ================================
  // function (passed into createCheckbox) is called when checkbox's selected state changes
  const useTOCCallback = (checkbox) => {
    const selected = checkbox.getValue(); //gets true or false
    spacingField.setEnabled(selected);
    tocShowRadios.setEnabled(selected);
  }
  const useTOCCheckbox = createCheckbox('Create table of contents', storedValue('useTOC'), {x:0, y: curY, width: viewWidth}, useTOCCallback);
  curY = addControlWithBottomPadding(useTOCCheckbox, controls, 3);

  // description: use table of contents
  control = createDescription("Place in group \"<tocGroup>\" containing rectangle \"<tocGroupRect>\"", NSColor.grayColor(), 11, {x: 0, y: curY, width: viewWidth, height: textHeight(11, 1)});
  curY = addControlWithBottomPadding(control, controls, 12);

  // label: column spacing
  curY += 2
  control = createLabel("Column spacing:", {x: 0, y: curY, width: viewWidth});
  controls.push(control);
  curY -= 2;

  // description: column spacing
  curY += 4;
  control = createDescription("Applies when table has multiple columns", NSColor.grayColor(), 11, {x: 145, y: curY, width: viewWidth - 145, height: textHeight(11, 1)});
  controls.push(control);
  curY -= 4;

  // SETTING FIELD: column spacing =============================================
  const spacingField = createField(storedValue('tocColumnSpacing'), {x: 104, y: curY, width: 35});
  spacingField.setEnabled(storedValue('useTOC'));
  curY = addControlWithBottomPadding(spacingField, controls, 10);

  // label: pages to include in TOC
  curY += 1;
  control = createLabel("Include:", {x: 0, y: curY, width: viewWidth}, 1);
  controls.push(control);
  curY -= 1;

  // SETTING RADIO BUTTONS: pages to include in TOC ============================
  const tocShowRadios = createRadioButtons(["All pages","Section headings only"], storedValue('tocShowSectionsOnly'), {x: 54, y: curY, width: viewWidth - 54});  //
  tocShowRadios.setEnabled(storedValue('useTOC'));
  curY = addControlWithBottomPadding(tocShowRadios, controls, 14);

  // divider line
  control = createDivider({x:0, y: curY, width: viewWidth});
  curY = addControlWithBottomPadding(control, controls, 14);

  // SETTING CHECKBOX: use section numbering ===================================
  // function (passed into createCheckbox) is called when checkbox's selected state changes
  const useSectionsCallback = (checkbox) => {
    const selected = checkbox.getValue(); // gets true or false
    dashStyleSelect.setEnabled(selected);
  }
  const useSectionsCheckbox = createCheckbox('Use section numbering', storedValue('useSections'), {x:0, y: curY, width: viewWidth}, useSectionsCallback);
  curY = addControlWithBottomPadding(useSectionsCheckbox, controls, 3);

  // description: use section numbering
  control = createDescription("Number page titles and callouts. Turn this off and on to see what it does.", NSColor.grayColor(), 11, {x: 0, y: curY, width: viewWidth, height: textHeight(11, 1)});
  curY = addControlWithBottomPadding(control, controls, 12);

  // label: dash style
  curY += 4;
  control = createLabel("Dash style:", {x: 0, y: curY, width: viewWidth}, 6);
  controls.push(control);
  curY -= 4;

  // description: dash style
  curY += 7;
  control = createDescription("A dash separates section numbers and page titles", NSColor.grayColor(), 11, {x: 123, y: curY, width: viewWidth - 123, height: textHeight(11, 1)});
  controls.push(control);
  curY -= 7;

  // SETTING DROPDOWN: dash style ==============================================
  const dashStyleSelect = createSelect(['-', '\u2013', '\u2014'], storedValue('dashType'), {x: 73, y: curY, width: 45});
  dashStyleSelect.setEnabled(storedValue('useSections'));
  curY = addControlWithBottomPadding(dashStyleSelect, controls, 14);

  // divider line
  control = createDivider( {x:0, y: curY, width: viewWidth});
  curY = addControlWithBottomPadding(control, controls, 13);

  // label: date formet
  curY +=2;
  control = createLabel("Date format:", {x: 0, y: curY, width: viewWidth}, 1);
  controls.push(control);
  curY -=2;

  // SETTING RADIO BUTTONS: date format ========================================
  // function (passed into createRadioButtons) is called when radio button is selected
  const radioSelectedCallback = (buttonMatrix) => {
    const buttonIndex = buttonMatrix.getValue(); // gets index of selected button
    customFormatField.setEnabled(buttonIndex == 2);
  }
  const sampleDate = new Date(2047, 0, 5);
  const dateFormatRadios = createRadioButtons([dateFromTemplate(stockDateFormats[0], sampleDate), dateFromTemplate(stockDateFormats[1], sampleDate), "Custom format:"], storedValue('dateFormatChoice'), {x: 78, y: curY, width: viewWidth - 78}, 22, radioSelectedCallback);  //
  controls.push(dateFormatRadios);
  curY += 4;

  // description: sample date for first radio button
  control = createDescription(stockDateFormats[0], NSColor.grayColor(), 11, {x: 170, y: curY, width: viewWidth - 170, height: textHeight(11, 1)});
  curY = addControlWithBottomPadding(control, controls, 8 );

  // description: sample date for second radio button
  control = createDescription(stockDateFormats[1], NSColor.grayColor(), 11, {x: 155, y: curY, width: viewWidth - 155, height: textHeight(11, 1)});
  curY = addControlWithBottomPadding(control, controls, 6);

  // SETTING FIELD: custom date format =========================================
  // function (passed into createField) called when field's text changes. Updates date in sample-date below field to reflect the format entered.
  const textChangedCallback = (notification) => {
    const newText = notification.object().getValue(); // gets text of field
    const newDate = dateFromTemplate(newText, sampleDate);
    sampleDateDisplay.setStringValue(newDate);
  }
  const customFormatField = createField(storedValue('lastEnteredFormatTemplate'), {x: 192, y: curY, width: viewWidth - 192}, textChangedCallback);
  customFormatField.setEnabled(storedValue('dateFormatChoice') == 2);
  curY = addControlWithBottomPadding(customFormatField, controls, 3);

  // description: dynamic sample date display
  const sampleDateDisplay = createDescription(dateFromTemplate(storedValue('lastEnteredFormatTemplate'), sampleDate), NSColor.grayColor(), 11, {x: 192, y: curY, width: viewWidth - 192, height: textHeight(11, 1)});
  curY = addControlWithBottomPadding(sampleDateDisplay, controls, 14);

  // divider line
  control = createDivider({x:0, y: curY, width: viewWidth});
  curY = addControlWithBottomPadding(control, controls, 6);

  // description: URL of Github repository
  control = createDescription('Documentation: https://github.com/josephxbrick/documentorganizer', NSColor.grayColor(), 11, {x: 0, y: curY, width: viewWidth, height: textHeight(11, 1)});
  curY = addControlWithBottomPadding(control, controls, 10);

  // ===========================================================================
  // ======                Done creating controls in alert                 =====
  // ===========================================================================

  //create view for alert controls
  const alertView = NSView.alloc().init();
  alertView.setFrame(NSMakeRect(0, 0, viewWidth, curY)); // size view
  alertView.setFlipped(true); // flip vertical coordinate system so that y is 0 at view's top (instead of at its bottom)
  // add controls to view
  for (const control of controls) {
    alertView.addSubview(control);
  }
  alert.accessoryView = alertView;
  // Add OK and cancel buttons. These automatically appear at the bottom of the alert (below accessoryView area)
  const okButton = alert.addButtonWithTitle("Save Settings");
  const cancelButton = alert.addButtonWithTitle("Cancel");
  // set the tab order
  setTabOrder(alert,[
  			titleField,
        useTOCCheckbox,
  			spacingField,
  			tocShowRadios,
  			useSectionsCheckbox,
  			dashStyleSelect,
        dateFormatRadios,
        customFormatField,
        okButton,
        cancelButton
  		]);
  // display alert
  if (alert.runModal() == 1000){
    // user pressed OK, so save settings
    setStoredValue('useTOC', useTOCCheckbox.getValue());
    setStoredValue('tocColumnSpacing', spacingField.getValue());
    setStoredValue('docTitle', titleField.getValue());
    setStoredValue('tocShowSectionsOnly', tocShowRadios.getValue());
    setStoredValue('dashType', dashStyleSelect.getValue());
    setStoredValue('useSections', useSectionsCheckbox.getValue());
    setStoredValue('dateFormatChoice', dateFormatRadios.getValue());
    if (dateFormatRadios.getValue() == 2){
      // custom date template chosen
      setStoredValue('dateFormatTemplate', customFormatField.getValue());
      setStoredValue('lastEnteredFormatTemplate', customFormatField.getValue());
    } else {
      // choose from stock formats
      setStoredValue('dateFormatTemplate', stockDateFormats[dateFormatRadios.getValue()]);
    }
    return true;
  }
  return undefined;
}

// function: Adds a control to controls array
// returns: bottom bound of control + padding
const addControlWithBottomPadding = (control, controls, padding = 0) => {
  controls.push(control);
  return CGRectGetMaxY(control.frame()) + padding;
}

// function: converts point of font to height in pixels
// returns: height in pixels multiplied by number of lines
const textHeight = (fontSize, lines) => {
   return  lines * fontSize * (96 / 72);
}

// function: sets tab order of controls in alert as well as initial focus
// returns: true
const setTabOrder = (alert, order) => {
	for (var i = 0; i < order.length; i++) {
		var thisItem = order[i],
			nextItem = order[i+1];
		if (nextItem) thisItem.setNextKeyView(nextItem);
	}
  // set initial focus
	alert.window().setInitialFirstResponder(order[0]);
  return true;
}

// function: gets document title from instance (in document) rather than from stored value. (values are stored at the plugin-level, not the document level)
// returns: value of the first '<documentTitle>' override found on an artboard
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
  // no override found; return stored value
  return storedValue('docTitle');
}
