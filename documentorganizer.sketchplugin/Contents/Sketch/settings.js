//  Thanks to Jason Burns, whose Symbol Orgainzer plugin's settings dialog provided many "Aha!" moments (and code snippets)
//  https://github.com/sonburn/symbol-organizer

@import 'common.js';
@import 'alertControls.js';
const Settings = require('sketch/settings');

// all stored settings for the settings dialog
const settingsObjects = [{
    name: 'useTOC',
    key: 'organize_document_useTOC',
    default: true
  },
  {
    name: 'tocColumnSpacing',
    key: 'organize_document_columnSpacing',
    default: 50
  },
  {
    name: 'tocShowSectionsOnly',
    key: 'organize_document_showTOCSectionsOnly',
    default: 0
  },
  {
    name: 'dashType',
    key: 'organize_document_dashType',
    default: '\u2013'
  },
  {
    name: 'useSections',
    key: 'organize_document_useSections',
    default: 1
  },
  {
    name: 'docTitle',
    key: 'organize_document_docTitle',
    default: 'Document title'
  },
  {
    name: 'dateFormatChoice',
    key: 'organize_document_dateFormatChoice',
    default: 0
  },
  {
    name: 'dateFormatTemplate',
    key: 'organize_document_dateFormatTemplate',
    default: '[ww], [mmmm] [ddd], [yyyy]'
  },
  {
    name: 'lastEnteredFormatTemplate',
    key: 'organize_document_lastEnteredFormatTemplate',
    default: '[ww], [mmmm] [ddd], [yyyy]'
  },
  {
    name: 'roundToNearestPixel',
    key: 'organize_document_roundToNearestPixel',
    default: 0
  },
  {
    name: 'nearestPixelToRoundTo',
    key: 'organize_document_nearestPixelToRoundTo',
    default: '0.5 pixels (recommended)'
  }
];

const stockDateFormats = ['[mm]/[dd]/[yyyy]', '[m]/[d]/[yyyy]'];
const stockDashes = ['-', '\u2013', '\u2014']; // dash, ndash, mdash
const stockRoundedPixels = ['0.1 pixels', '0.5 pixels (recommended)', '1.0 pixels'];

// function that gets a setting object from settingsObjects[]
// receives: setting name
// returns: a settings object given the 'name' key
const settingsObjectFromName = (name) => {
  return settingsObjects.find((settingsObject) => {
    return settingsObject.name == name;
  });
}

// function that returns a stored value
// receives: setting name
// returns: stored value of setting, or default value of setting if nothing is stored, or undefined if name is invalid
const storedValue = (name) => {
  const settingsObject = settingsObjectFromName(name);
  if (settingsObject) {
    const retVal = Settings.settingForKey(settingsObject.key)
    if (retVal == undefined) {
      // no value stored; return default value for setting
      return settingsObject.default;
    }
    return retVal;
  }
  return undefined;
}

// function that sets a stored values
// receives: setting name and value to store
// returns: stored setting value, or undefined if name parameter is invalid
const setStoredValue = (name, value) => {
  const settingsObject = settingsObjectFromName(name);
  if (settingsObject) {
    Settings.setSettingForKey(settingsObject.key, value);
    return value;
  }
  return undefined;
}

// function that adds a control to controls array
// receives: the control, the controls array, and the amount of padding to place below control
// returns: bottom bound of added control + padding
const addControlWithBottomPadding = (control, controls, padding = 0) => {
  controls.push(control);
  return CGRectGetMaxY(control.frame()) + padding;
}

// function that  converts point of font to height in pixels
// receives: font size in points, number of lines that will display
// returns: height in pixels multiplied by number of lines
const textHeight = (fontSize, lines) => {
  return lines * fontSize * (96 / 72);
}

// function that sets tab order of controls in alert as well as initial focus
// receives: the alert window and the controls array
// returns: true
const setTabOrder = (alert, controls) => {
  // set initial focus
  alert.window().setInitialFirstResponder(controls[0]);
  let nextItem = undefined;
  controls.reverse();
  for (const control of controls) {
    if (nextItem) {
      control.setNextKeyView(nextItem);
    }
    nextItem = control;
  }
  return true;
}

// function that gets document title from instance (in document) rather than from stored value. (values are stored at the plugin-level, not the document level)
// receives: the current Sketch page
// returns: value of the first '<documentTitle>' override found in document, or the stored/default value if not found in document.
const docTitleFromDocument = (page) => {
  let docTitle = undefined;
  const artboards = allArtboards(page);
  for (const artboard of artboards) {
    const instances = toArray(artboard.children()).filter(item => item.class() === MSSymbolInstance)
    for (const instance of instances) {
      docTitle = getOverrideText(instance, '<documentTitle>');
      if (docTitle != undefined) {
        return docTitle;
      }
    }
  }
  // no override found; return stored value
  return storedValue('docTitle');
}

// function that creates and displays the settings dialog and stores settings
// receives: Sketch context
// returns: true if dialog is not canceled, or undefined if it is
const settingsDialog = (context) => {
  const doc = context.document;
  const page = doc.currentPage();
  const docTitle = docTitleFromDocument(page);
  // set up alert window
  const alert = NSAlert.alloc().init();
  alert.setIcon(NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path()));
  alert.setMessageText('Settings');
  const viewWidth = 418;
  const controls = [];
  let curY = 0;
  let control = undefined;

  // backward compatibility: dash type was once stored as the index, not the character
  const possibleOldDashType = storedValue('dashType');
  if (isNumeric(possibleOldDashType)) {
    // it's an index, so convert it to the corresponding character
    setStoredValue('dashType', stockDashes[possibleOldDashType]);
  }

  // ===========================================================================
  // ======         Create controls that will appear in alert             ======
  // ===========================================================================

  // description: dialog heading
  control = createDescription("Organize design documents by creating a table of contents, adding page/section numbers, and managing callouts in mockups.", NSColor.darkGrayColor(), 12, {
    x: 0,
    y: curY,
    width: viewWidth,
    height: textHeight(12, 2)
  });
  curY = addControlWithBottomPadding(control, controls, 15);

  // label: document title
  curY += 2;
  control = createLabel("Title of document:", {
    x: 0,
    y: curY,
    width: viewWidth
  });
  controls.push(control);
  curY -= 2;

  // SETTING FIELD: document title =============================================
  const titleField = createField(docTitle, {
    x: 114,
    y: curY,
    width: viewWidth - 114
  });
  curY = addControlWithBottomPadding(titleField, controls, 14);

  // divider line
  control = createDivider({
    x: 0,
    y: curY,
    width: viewWidth
  });
  curY = addControlWithBottomPadding(control, controls, 12);

  // SETTING CHECKBOX: create table of contents ================================
  // function (passed into createCheckbox) is called when checkbox's selected state changes
  const useTOCCallback = (checkbox) => {
    spacingField.setEnabled(checkbox.value);
    tocShowRadios.setEnabled(checkbox.value);
  }
  const useTOCCheckbox = createCheckbox('Create table of contents', storedValue('useTOC'), {
    x: 0,
    y: curY,
    width: viewWidth
  }, useTOCCallback);
  curY = addControlWithBottomPadding(useTOCCheckbox, controls, 3);

  // description: use table of contents
  control = createDescription("Place in group \"<tocGroup>\" containing rectangle \"<tocGroupRect>\"", NSColor.grayColor(), 11, {
    x: 0,
    y: curY,
    width: viewWidth,
    height: textHeight(11, 1)
  });
  curY = addControlWithBottomPadding(control, controls, 12);

  // label: column spacing
  curY += 2
  control = createLabel("Column spacing:", {
    x: 0,
    y: curY,
    width: viewWidth
  });
  controls.push(control);
  curY -= 2;

  // description: column spacing
  curY += 4;
  control = createDescription("Applies when table has multiple columns", NSColor.grayColor(), 11, {
    x: 145,
    y: curY,
    width: viewWidth - 145,
    height: textHeight(11, 1)
  });
  controls.push(control);
  curY -= 4;

  // SETTING FIELD: column spacing =============================================
  const spacingField = createField(storedValue('tocColumnSpacing'), {
    x: 104,
    y: curY,
    width: 35
  });
  spacingField.setEnabled(storedValue('useTOC'));
  curY = addControlWithBottomPadding(spacingField, controls, 10);

  // label: pages to include in TOC
  curY += 1;
  control = createLabel("Include:", {
    x: 0,
    y: curY,
    width: viewWidth
  }, 1);
  controls.push(control);
  curY -= 1;

  // SETTING RADIO BUTTONS: pages to include in TOC ============================
  const tocShowRadios = createRadioButtonsHorizontal(["Section headings only", "All pages"], storedValue('tocShowSectionsOnly'), {
    x: 54,
    y: curY,
    width: viewWidth - 54
  }, 155); //
  tocShowRadios.setEnabled(storedValue('useTOC'));
  curY = addControlWithBottomPadding(tocShowRadios, controls, 14);

  // divider line
  control = createDivider({
    x: 0,
    y: curY,
    width: viewWidth
  });
  curY = addControlWithBottomPadding(control, controls, 14);

  // SETTING CHECKBOX: use section numbering ===================================
  // function (passed into createCheckbox) is called when checkbox's selected state changes
  const useSectionsCallback = (checkbox) => {
    const selected = checkbox.value; // gets true or false
    dashStyleSelect.setEnabled(selected);
  }
  const useSectionsCheckbox = createCheckbox('Use section numbering', storedValue('useSections'), {
    x: 0,
    y: curY,
    width: viewWidth
  }, useSectionsCallback);
  curY = addControlWithBottomPadding(useSectionsCheckbox, controls, 3);

  // description: use section numbering
  control = createDescription("Number page titles and callouts. Turn this off and on to see what it does.", NSColor.grayColor(), 11, {
    x: 0,
    y: curY,
    width: viewWidth,
    height: textHeight(11, 1)
  });
  curY = addControlWithBottomPadding(control, controls, 12);

  // label: dash style
  curY += 4;
  control = createLabel("Dash style:", {
    x: 0,
    y: curY,
    width: viewWidth
  }, 6);
  controls.push(control);
  curY -= 4;

  // description: dash style
  curY += 7;
  control = createDescription("A dash separates section numbers and page titles", NSColor.grayColor(), 11, {
    x: 130,
    y: curY,
    width: viewWidth - 123,
    height: textHeight(11, 1)
  });
  controls.push(control);
  curY -= 7;

  // SETTING COMBOBOX: dash style ==============================================
  const dashStyleSelect = createDropdown(stockDashes, stockDashes.indexOf(storedValue('dashType')), {
    x: 73,
    y: curY,
    width: 50
  });
  dashStyleSelect.setEnabled(storedValue('useSections'));
  curY = addControlWithBottomPadding(dashStyleSelect, controls, 14);

  // divider line
  control = createDivider({
    x: 0,
    y: curY,
    width: viewWidth
  });
  curY = addControlWithBottomPadding(control, controls, 13);

  // label: date formet
  curY += 2;
  control = createLabel("Date format:", {
    x: 0,
    y: curY,
    width: viewWidth
  }, 1);
  controls.push(control);
  curY -= 2;

  // SETTING RADIO BUTTONS: date format ========================================
  // function (passed into createRadioButtonsVertical) is called when radio button is selected
  const radioSelectedCallback = (buttonMatrix) => {
    const buttonIndex = buttonMatrix.value; // gets index of selected button
    customFormatField.setEnabled(buttonIndex == 2); // enables custom-format field if 3rd radio button is selected
  }
  const sampleDate = new Date(2047, 0, 5);
  const dateFormatRadios = createRadioButtonsVertical([dateFromTemplate(stockDateFormats[0], sampleDate), dateFromTemplate(stockDateFormats[1], sampleDate), "Custom format:"], storedValue('dateFormatChoice'), {
    x: 78,
    y: curY,
    width: viewWidth - 78
  }, 22, radioSelectedCallback); //
  controls.push(dateFormatRadios);
  curY += 3;

  // description: sample date for first radio button
  control = createDescription(stockDateFormats[0], NSColor.grayColor(), 11, {
    x: 170,
    y: curY,
    width: viewWidth - 170,
    height: textHeight(11, 1)
  });
  curY = addControlWithBottomPadding(control, controls, 8);

  // description: sample date for second radio button
  control = createDescription(stockDateFormats[1], NSColor.grayColor(), 11, {
    x: 155,
    y: curY,
    width: viewWidth - 155,
    height: textHeight(11, 1)
  });
  curY = addControlWithBottomPadding(control, controls, 6);

  // SETTING FIELD: custom date format =========================================
  // function (passed into createField) called when field's text changes. Updates date in sample-date below field to reflect the format entered.
  const textChangedCallback = (notification) => {
    const newText = notification.object().value; // gets text of field
    const newDate = dateFromTemplate(newText, sampleDate);
    sampleDateDisplay.value = newDate;
  }
  const customFormatField = createField(storedValue('lastEnteredFormatTemplate'), {
    x: 192,
    y: curY,
    width: viewWidth - 192
  }, textChangedCallback);
  customFormatField.setEnabled(storedValue('dateFormatChoice') == 2);
  curY = addControlWithBottomPadding(customFormatField, controls, 3);

  // description: dynamic sample date display
  const sampleDateDisplay = createDescription(dateFromTemplate(storedValue('lastEnteredFormatTemplate'), sampleDate), NSColor.grayColor(), 11, {
    x: 192,
    y: curY,
    width: viewWidth - 192,
    height: textHeight(11, 1)
  });
  curY = addControlWithBottomPadding(sampleDateDisplay, controls, 14);

  // divider line
  control = createDivider({
    x: 0,
    y: curY,
    width: viewWidth
  });
  curY = addControlWithBottomPadding(control, controls, 12);

  // SETTING CHECKBOX: round to nearest pixel =================================
  // function (passed into createCheckbox) is called when checkbox's selected state changes
  const roundToPixelCallback = (checkbox) => {
    roundToPixelSelect.setEnabled(checkbox.value);
  }
  const roundToPixelCheckbox = createCheckbox('Round layer dimensions to nearest', storedValue('roundToNearestPixel'), {
    x: 0,
    y: curY,
    width: viewWidth
  }, roundToPixelCallback);
  controls.push(roundToPixelCheckbox);
  curY -= 6;

  // SETTING COMBOBOX: dash style ==============================================

  const roundToPixelSelect = createDropdown(stockRoundedPixels, stockRoundedPixels.indexOf(storedValue('nearestPixelToRoundTo')), {
    x: 220,
    y: curY,
    width: viewWidth - 220
  });
  roundToPixelSelect.setEnabled(storedValue('roundToNearestPixel'));
  curY = addControlWithBottomPadding(roundToPixelSelect, controls, 0);


  // description
  control = createDescription("Round each layer's x, y, width and height to nearest [n] pixels.", NSColor.grayColor(), 11, {
    x: 0,
    y: curY,
    width: viewWidth,
    height: textHeight(11, 1)
  });
  curY = addControlWithBottomPadding(control, controls, 12);


  // divider line
  control = createDivider({
    x: 0,
    y: curY,
    width: viewWidth
  });
  curY = addControlWithBottomPadding(control, controls, 6);


  // ===========================================================================
  // ======      Done creating controls in alert: now finalize             =====
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
  // Add OK, cancel, and view documentation buttons. These automatically appear at the bottom of the alert (below accessoryView area)
  const okButton = alert.addButtonWithTitle("Save Settings");
  const cancelButton = alert.addButtonWithTitle("Cancel");
  const viewDocs = alert.addButtonWithTitle("View Documentation");
  // set the tab order
  setTabOrder(alert, [
    titleField,
    useTOCCheckbox,
    spacingField,
    tocShowRadios,
    useSectionsCheckbox,
    dashStyleSelect,
    dateFormatRadios,
    customFormatField,
    roundToPixelCheckbox,
    roundToPixelSelect,
    okButton,
    cancelButton,
    viewDocs
  ]);
  // display alert
  const alertValue = alert.runModal();
  if (alertValue == 1000) {
    // user pressed OK, so save settings
    setStoredValue('useTOC', useTOCCheckbox.value);
    setStoredValue('tocColumnSpacing', spacingField.value);
    setStoredValue('docTitle', titleField.value);
    setStoredValue('tocShowSectionsOnly', tocShowRadios.value);
    setStoredValue('dashType', stockDashes[dashStyleSelect.value]);
    setStoredValue('useSections', useSectionsCheckbox.value);
    setStoredValue('dateFormatChoice', dateFormatRadios.value);
    setStoredValue('roundToNearestPixel', roundToPixelCheckbox.value);
    setStoredValue('nearestPixelToRoundTo', stockRoundedPixels[roundToPixelSelect.value]);

    if (dateFormatRadios.value == 2) {
      // custom date templatehosen
      setStoredValue('dateFormatTemplate', customFormatField.value);
      setStoredValue('lastEnteredFormatTemplate', customFormatField.value);
    } else {
      // choose from stock formats
      setStoredValue('dateFormatTemplate', stockDateFormats[dateFormatRadios.value]);
    }
    return true;
  } else if (alertValue == 1002) {
    // user chose to view documentation
    NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString("https://github.com/josephxbrick/documentorganizer"));
  }
  // user chose cancel
  return undefined;
}
