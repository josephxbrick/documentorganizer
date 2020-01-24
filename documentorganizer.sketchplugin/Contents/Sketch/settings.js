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


// ====================================================================================================
// function that creates and displays the settings dialog and stores settings
// receives: Sketch context
// returns: true if settings are saved, or undefined if they aren't
// ====================================================================================================

const settingsDialog = (context) => {
  const doc = context.document;
  const page = doc.currentPage();
  const docTitle = docTitleFromDocument(page);
  // set up alert window
  const alert = NSAlert.alloc().init();
  alert.setIcon(NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path()));
  alert.setMessageText('Settings – Organize Design Document');
  const viewWidth = 485;
  const controlMaxWidth = 472;
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

  // ====================SETTING: document title ===============================

  // description: dialog heading
  control = createDescription("This plugin creates a table of contents, numbers pages and sections, and manages callouts in mockups.", NSColor.labelColor(), 13, {
    x: 0,
    y: curY,
    width: controlMaxWidth,
    height: textHeight(13, 2)
  });
  curY = addControlWithBottomPadding(control, controls, 18);

  // label: document title
  curY += 2;
  control = createLabel("Title of document:", {
    x: 0,
    y: curY,
    width: controlMaxWidth
  });
  controls.push(control);
  curY -= 2;

  // field: docment title
  const titleField = createField(docTitle, {
    x: 114,
    y: curY,
    width: 300
  });
  curY = addControlWithBottomPadding(titleField, controls, 14);

  // divider line
  control = createDivider({
    x: 0,
    y: curY,
    width: controlMaxWidth
  });
  curY = addControlWithBottomPadding(control, controls, 12);

  // ======================SETTING: Table of contents ==========================

  // function (passed into createCheckbox below) is called when checkbox's selected state changes
  const useTOCCallback = (checkbox) => {
    spacingField.setEnabled(checkbox.value);
    tocShowRadios.setEnabled(checkbox.value);
  }

  // checkbox: use TOC
  const useTOCCheckbox = createCheckbox('Create table of contents', storedValue('useTOC'), {
    x: 0,
    y: curY,
    width: controlMaxWidth
  }, useTOCCallback);
  curY = addControlWithBottomPadding(useTOCCheckbox, controls, 6);

  // description: use table of contents
  control = createDescription("Placed in group \"<tocGroup>\" containing rectangle \"<tocGroupRect>\"", NSColor.secondaryLabelColor(), 12, {
    x: 0,
    y: curY,
    width: controlMaxWidth,
    height: textHeight(12, 1)
  });
  curY = addControlWithBottomPadding(control, controls, 10);

  // label: column spacing
  curY += 2
  control = createLabel("Column spacing:", {
    x: 0,
    y: curY,
    width: controlMaxWidth
  });
  controls.push(control);
  curY -= 2;

  // description: column spacing
  curY += 2;
  control = createDescription("Applies when the TOC has multiple columns", NSColor.secondaryLabelColor(), 12, {
    x: 145,
    y: curY,
    width: controlMaxWidth - 145,
    height: textHeight(12, 1)
  });
  controls.push(control);
  curY -= 2;

  // field: column spacing
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
    width: controlMaxWidth
  }, 1);
  controls.push(control);
  curY -= 1;

  const tocShowRadios = createRadioButtonsHorizontal(["Section headings only", "All pages"], storedValue('tocShowSectionsOnly'), {
    x: 54,
    y: curY,
    width: controlMaxWidth - 54
  }, 155); //
  tocShowRadios.setEnabled(storedValue('useTOC'));
  curY = addControlWithBottomPadding(tocShowRadios, controls, 12);

  // divider line
  control = createDivider({
    x: 0,
    y: curY,
    width: controlMaxWidth
  });
  curY = addControlWithBottomPadding(control, controls, 10);

  // =================SETTING: legal style numbering ===========================

  // function (passed into createCheckbox) is called when checkbox's selected state changes
  const useSectionsCallback = (checkbox) => {
    const selected = checkbox.value; // gets true or false
    dashStyleSelect.setEnabled(selected);
  }
  const useSectionsCheckbox = createCheckbox('Use legal-style numbering for pages and callouts', storedValue('useSections'), {
    x: 0,
    y: curY,
    width: controlMaxWidth
  }, useSectionsCallback);
  curY = addControlWithBottomPadding(useSectionsCheckbox, controls, 6);

  // description: use section numbering
  control = createDescription("Page 1 of section 5 is numbered 5.1; the first callout on page 5.1 is numbered 5.1.1", NSColor.secondaryLabelColor(), 12, {
    x: 0,
    y: curY,
    width: controlMaxWidth,
    height: textHeight(12, 1)
  });
  curY = addControlWithBottomPadding(control, controls, 8);

  // label: dash style
  curY += 5;
  control = createLabel("Dash style:", {
    x: 0,
    y: curY,
    width: controlMaxWidth
  }, 6);
  controls.push(control);
  curY -= 5;

  // description: dash style
  curY += 5;
  control = createDescription("Separates section numbers and page titles", NSColor.secondaryLabelColor(), 12, {
    x: 128,
    y: curY,
    width: controlMaxWidth - 130,
    height: textHeight(12, 1)
  });
  controls.push(control);
  curY -= 5;

  const dashStyleSelect = createDropdown(stockDashes, stockDashes.indexOf(storedValue('dashType')), {
    x: 73,
    y: curY,
    width: 50
  });
  dashStyleSelect.setEnabled(storedValue('useSections'));
  curY = addControlWithBottomPadding(dashStyleSelect, controls, 3);

  // description: use section numbering
  control = createDescription("If legal-style numbering isn't used, callouts will be lettered. (A, B, C, etc.)", NSColor.secondaryLabelColor(), 12, {
    x: 0,
    y: curY,
    width: controlMaxWidth,
    height: textHeight(12, 1)
  });
  curY = addControlWithBottomPadding(control, controls, 12);

  // divider line
  control = createDivider({
    x: 0,
    y: curY,
    width: controlMaxWidth
  });
  curY = addControlWithBottomPadding(control, controls, 10);

  // ====================== SETTING: current date format =======================

  // label: date formet
  control = createLabel("Add current date to symbol instances", {
    x: 0,
    y: curY,
    width: controlMaxWidth
  }, 1);
  curY = addControlWithBottomPadding(control, controls, 3);

  // description: use section numbering
  control = createDescription("Instances with <currentDate> override get today's date using the format below:", NSColor.secondaryLabelColor(), 12, {
    x: 0,
    y: curY,
    width: controlMaxWidth,
    height: textHeight(12, 1)
  });
  curY = addControlWithBottomPadding(control, controls, 7);


  // function (passed into createRadioButtonsVertical) is called when radio button is selected
  const radioSelectedCallback = (buttonMatrix) => {
    const buttonIndex = buttonMatrix.value; // gets index of selected button
    customFormatField.setEnabled(buttonIndex == 2); // enables custom-format field if 3rd radio button is selected
  }
  const sampleDate = new Date(2047, 0, 5);

  // radio buttons: date formats
  const dateFormatRadios = createRadioButtonsVertical([dateFromTemplate(stockDateFormats[0], sampleDate), dateFromTemplate(stockDateFormats[1], sampleDate), "Custom format:"], storedValue('dateFormatChoice'), {
    x: 0,
    y: curY,
    width: controlMaxWidth - 78
  }, 23, radioSelectedCallback); //
  controls.push(dateFormatRadios);
  curY += 3;

  // description: sample date for first radio button
  control = createDescription(stockDateFormats[0], NSColor.secondaryLabelColor(), 12, {
    x: 92,
    y: curY,
    width: controlMaxWidth - 170,
    height: textHeight(12, 1)
  });
  curY = addControlWithBottomPadding(control, controls, 8);

  // description: sample date for second radio button
  control = createDescription(stockDateFormats[1], NSColor.secondaryLabelColor(), 12, {
    x: 77,
    y: curY,
    width: controlMaxWidth - 155,
    height: textHeight(12, 1)
  });
  curY = addControlWithBottomPadding(control, controls, 6);

  // function (passed into createField) called when field's text changes. Updates date in sample-date below field to reflect the format entered.
  const textChangedCallback = (notification) => {
    const newText = notification.object().value; // gets text of field
    const newDate = dateFromTemplate(newText, sampleDate);
    sampleDateDisplay.value = newDate;
  }

  const customFormatField = createField(storedValue('lastEnteredFormatTemplate'), {
    x: 114,
    y: curY,
    width: 200
  }, textChangedCallback);
  customFormatField.setEnabled(storedValue('dateFormatChoice') == 2);
  curY = addControlWithBottomPadding(customFormatField, controls, 1);

  // description: dynamic sample date display
  const sampleDateDisplay = createDescription(dateFromTemplate(storedValue('lastEnteredFormatTemplate'), sampleDate), NSColor.secondaryLabelColor(), 12, {
    x: 114,
    y: curY,
    width: controlMaxWidth - 192,
    height: textHeight(12, 1)
  });
  curY = addControlWithBottomPadding(sampleDateDisplay, controls, 12);

  // divider line
  control = createDivider({
    x: 0,
    y: curY,
    width: controlMaxWidth
  });
  curY = addControlWithBottomPadding(control, controls, 14);

  // ================== SETTING: round to nearest pixel ========================

  // function (passed into createCheckbox) is called when checkbox's selected state changes
  const roundToPixelCallback = (checkbox) => {
    roundToPixelSelect.setEnabled(checkbox.value);
  }
  const roundToPixelCheckbox = createCheckbox('Round layer dimensions to nearest', storedValue('roundToNearestPixel'), {
    x: 0,
    y: curY,
    width: controlMaxWidth
  }, roundToPixelCallback);
  controls.push(roundToPixelCheckbox);
  curY -= 6;

  const roundToPixelText = "Round each layer's x, y, width and height to nearest [n] pixels."
  const roundToPixelDropdownChanged = (dropdown) => {
    const val = stockRoundedPixels[dropdown.value].slice(0, 3);
    roundToPixelDescription.value = roundToPixelText.replace('[n]', val);
  }
  // dropdown: rounding options
  const roundToPixelSelect = createDropdown(stockRoundedPixels, stockRoundedPixels.indexOf(storedValue('nearestPixelToRoundTo')), {
    x: 220,
    y: curY,
    width: 198,
  }, roundToPixelDropdownChanged);
  roundToPixelSelect.setEnabled(storedValue('roundToNearestPixel'));
  curY = addControlWithBottomPadding(roundToPixelSelect, controls, -1);

  // description
  roundToPixelDescription = createDescription(roundToPixelText, NSColor.secondaryLabelColor(), 12, {
    x: 0,
    y: curY,
    width: controlMaxWidth,
    height: textHeight(12, 1)
  });
  curY = addControlWithBottomPadding(roundToPixelDescription, controls, 14);
  roundToPixelDescription.value = roundToPixelText.replace('[n]', storedValue('nearestPixelToRoundTo').slice(0, 3));

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
  alert.accessoryView = alertView; // add alert as accessory view
  // Add OK, cancel, and view documentation buttons. These automatically appear at the bottom of the alert (below accessoryView area)
  const okButton = alert.addButtonWithTitle("Save & Run");
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
    NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString("https://github.com/josephxbrick/documentorganizer/blob/master/README.md"));
  }
  // user chose cancel or view docs
  return undefined;
}
