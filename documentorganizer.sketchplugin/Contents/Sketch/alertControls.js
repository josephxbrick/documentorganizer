//  Thanks to Jason Burns, whose Symbol Orgainzer plugin's settings dialog provided many "Aha!" moments (and code snippets)
//  https://github.com/sonburn/symbol-organizer

@import 'delegate.js'

// =====================================================================================================================
// create checkbox control
//
// * checkbox.value returns true or false depending on the selected state. To set a checkbox's state, set
//   checkbox.value to true or false.
// * onSelectionChangedFunction is a function that can be passed in. It will be called (with the checkbox as a parameter)
//   when the selected state of the checkbox changes. Here's a sample function you could pass in:
//
//   const checkboxCallback = (checkbox) => {
//     if (checkbox.value == true) {
//       console.log('Checkbox is selected');
//     }
//   }
// =====================================================================================================================
const createCheckbox = (title, selectedState, frame, onSelectionChangedFunction = undefined) => {
  frame.height = textHeight(12, 1);
  const checkbox = NSButton.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height));
  const checkStateNS = (selectedState == true) ? NSOnState : NSOffState;
  checkbox.setButtonType(NSSwitchButton);
  checkbox.setBezelStyle(0);
  checkbox.setTitle(title);
  checkbox.setTag(1);
  checkbox.setState(checkStateNS);
  if (onSelectionChangedFunction) {
    checkbox.setCOSJSTargetFunction(onSelectionChangedFunction);
  }
  // define getter-setter for 'value'
  Object.defineProperty(checkbox, 'value', {
    get: () => (checkbox.state() == NSOnState) ? true : false,
    set: (value) => checkbox.setState((value == true) ? NSOnState : NSOffState),
  });
  return checkbox;
}

// =====================================================================================================================
// create combobox control
//
// * combobox.value returns the chosen index of the combobox
// * to select a given index, set combobox.value to that index
// * onSelectionChangedFunction is a function that can be passed in. It will be called (with the notification message
//   as its paramater) whenever the selected state of the checkbox changes. Here's a sample function you could pass in,
//   where console.log displays the index of the selected item:
//
//   const selectCallback = (notification) => {
//     // notification.object() returns the combobox control
//     console.log(notification.object().value);
//   }
// =====================================================================================================================
const createCombobox = (items, selectedIndex, frame, onSelectionChangedFunction) => {
  frame.height = 30;
  const combobox = NSComboBox.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height));
  combobox.addItemsWithObjectValues(items);
  combobox.selectItemAtIndex(selectedIndex);
  combobox.setNumberOfVisibleItems(items.length);
  combobox.setCompletes(1);
  if (onSelectionChangedFunction) {
    const delegate = new MochaJSDelegate({
      "comboBoxSelectionDidChange:": onSelectionChangedFunction,
    });
    combobox.setDelegate(delegate.getClassInstance());
  }
  // define getter-setter for 'value'
  Object.defineProperty(combobox, 'value', {
    get: () => combobox.indexOfSelectedItem(),
    set: (value) => combobox.selectItemAtIndex(value),
  });
  return combobox;
}

// =====================================================================================================================
// creates dropdown control (where you cannot type in a new value)
//
// * dropdown.value returns the chosen index of the select
// * to select a given index, set dropdown.value to that index
// * onSelectionChangedFunction is a function that can be passed in. It will be called (with the dropdown control as its
//   paramater) whenever the selected state of the checkbox changes. Here's a sample function you could pass in,
//   where console.log displays the index of the newly selected item:
//
//   const selectCallback = (dropdown) => {
//     console.log(dropdown.value);
//   }
// =====================================================================================================================
const createDropdown = (items, selectedIndex, frame, onSelectionChangedFunction) => {
  frame.height = 30;
  const popup = NSPopUpButton.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height));
  popup.addItemsWithTitles(items);
  popup.selectItemAtIndex(selectedIndex);
  if (onSelectionChangedFunction) {
    popup.setCOSJSTargetFunction(onSelectionChangedFunction);
  }
  // define getter-setter for 'value'
  Object.defineProperty(popup, 'value', {
    get: () => popup.indexOfSelectedItem(),
    set: (value) => popup.selectItemAtIndex(value),
  });
  return popup;
}

// =====================================================================================================================
// create vertical radio buttons
//
// * buttonHeight parameter sets height for all radio buttons
// * radiobuttons.value returns the chosen index of the radio buttons
// * to select a given radio button by index, set radiobuttons.value to that index.
// * The onRadioButtonSelected function (if passed in) is called when any radio button is selected. Here's a sample
//   function you might pass in, which returns the index of the selected radio button
//
//   const radioSelectedCallback = (radioButtons) => {
//     console.log(radioButtons.value)
//   }
// =====================================================================================================================
const createRadioButtonsVertical = (options, selectedIndex, frame, buttonHeight = 21, onRadioButtonSelected = undefined) => {
  const rows = options.length;
  frame.height = rows * buttonHeight;
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
  buttonMatrix.setCellSize(NSMakeSize(frame.width, buttonHeight));
  // Create a cell for each option
  for (i = 0; i < options.length; i++) {
    const button = buttonMatrix.cells().objectAtIndex(i);
    button.setTitle(options[i]);
    button.setTag(i);
    if (onRadioButtonSelected) {
      button.setCOSJSTargetFunction(onRadioButtonSelected);
    }
  }
  // Select the default cell
  buttonMatrix.selectCellAtRow_column(selectedIndex, 0);
  // define getter-setter for 'value'
  Object.defineProperty(buttonMatrix, 'value', {
    get: () => buttonMatrix.selectedCell().tag(),
    set: (value) => buttonMatrix.selectCellAtRow_column(value, 0),
  });
  return buttonMatrix;
}

// =====================================================================================================================
// create horizontal radio buttons
//
// * buttonWidth parameter sets width for all radio buttons
// * radiobuttons.value returns the chosen index of the radio buttons
// * to select a given radio button by index, set radiobuttons.value to that index
// * The onRadioButtonSelected function (if passed in) is called when any radio button is selected. Here's a sample
//   function you might pass in, which puts the selected index into console upon selecting a radio button:
//
//   const radioSelectedCallback = (radioButtons) => {
//     console.log(radioButtons.value)
//   }
// =====================================================================================================================
const createRadioButtonsHorizontal = (options, selectedIndex, frame, buttonWidth = 200, onRadioButtonSelected = undefined) => {
  const columns = options.length;
  frame.height = 21;
  const rows = 1;
  const buttonCell = NSButtonCell.alloc().init();
  buttonCell.setButtonType(NSRadioButton);
  const buttonMatrix = NSMatrix.alloc().initWithFrame_mode_prototype_numberOfRows_numberOfColumns(
    NSMakeRect(frame.x, frame.y, frame.width, frame.height),
    NSRadioModeMatrix,
    buttonCell,
    rows,
    columns
  );
  buttonMatrix.setCellSize(NSMakeSize(buttonWidth, frame.height));
  // Create a cell for each option
  for (i = 0; i < options.length; i++) {
    const button = buttonMatrix.cells().objectAtIndex(i);
    button.setTitle(options[i]);
    button.setTag(i);
    if (onRadioButtonSelected) {
      button.setCOSJSTargetFunction(onRadioButtonSelected);
    }
  }
  // Select the default cell
  buttonMatrix.selectCellAtRow_column(0, selectedIndex);
  // define getter-setter for 'value'
  Object.defineProperty(buttonMatrix, 'value', {
    get: () => buttonMatrix.selectedCell().tag(),
    set: (value) => buttonMatrix.selectCellAtRow_column(0, value),
  });
  return buttonMatrix;
}

// =====================================================================================================================
// create entry field
//
// * field.value returns the string in the field
// * to set the field's string, set field.value to the desired string.
// * onTextChangedFunction is a function that can be passed in. It will be called (with the notification message
//   as its paramater) whenever the text in the field changes. Here's a sample function you could pass in,
//   where console.log displays the text after the change:
//
//   const textChangedCallback = (notification) => {
//     const newText = notification.object().value;
//     console.log(newText);
//   }

// =====================================================================================================================
const createField = (text, frame, onTextChangedFunction) => {
  frame.height = 22;
  const field = NSTextField.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height));
  field.setStringValue(text);
  if (onTextChangedFunction) {
    const delegate = new MochaJSDelegate({
      "controlTextDidChange:": onTextChangedFunction,
    });
    field.setDelegate(delegate.getClassInstance());
  }
  // define getter-setter for 'value'
  Object.defineProperty(field, 'value', {
    get: () => field.stringValue(),
    set: (value) => field.setStringValue(value),
  });
  return field;
}


// =====================================================================================================================
// create label
//
// * label.value returns the string in the label. To set the label's string, set label.value to the desired string.
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
  // define getter-setter for 'value'
  Object.defineProperty(label, 'value', {
    get: () => label.stringValue(),
    set: (value) => label.setStringValue(value),
  });
  return label;
}

// =====================================================================================================================
// create description control
//
// * description.value returns the descrition's string. To set the description's string, set description.value to the
//   desired string.
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
  // define getter-setter for 'value'
  Object.defineProperty(label, 'value', {
    get: () => label.stringValue(),
    set: (value) => label.setStringValue(value),
  });
  return label;
}

// =====================================================================================================================
// create divider line
// =====================================================================================================================
const createDivider = (frame) => {
  frame.height = 1;
  const divider = NSView.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height));
  divider.setWantsLayer(1);
  divider.setBackgroundColor(NSColor.quaternaryLabelColor());
  return divider;
}
