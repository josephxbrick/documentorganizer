@import 'delegate.js'

// =====================================================================================================================
// create checkbox control
//
// * getValue() returns true for checked, false for unchecked
// * onSelectionChangedFunction is a function that can be passed in. It will be called (with the checkbox as a parameter)
//   when the selected state of the checkbox changes. Here's a sample function you could pass in:
//
//   const checkboxCallback = (checkbox) => {
//     const selected = checkbox.getValue();
//     console.log(selected);
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
//     const selectedIndex = notification.object().getValue();
//     console.log(selectedIndex);
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
  		"comboBoxSelectionDidChange:": onSelectionChangedFunction,
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
//   const textChangedCallback = (notification) => {
//     const newText = notification.object().getValue();
//     console.log(newText);
//   }

// =====================================================================================================================
const createField = (text, frame, onTextChangedFunction) => {
  frame.height = 22;
	const field = NSTextField.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height));
	field.setStringValue(text);
  field.getValue = () => field.stringValue();
  if (onTextChangedFunction) {
    const delegate = new MochaJSDelegate({
  		"controlTextDidChange:": onTextChangedFunction,
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
//   const radioSelectedCallback = (radioButtons) => {
//     const selectedButtonIndex = radioButtons.getValue();
//     if (selectedButtonIndex == 0){
//       console.log("The first radio button was selected")
//     }
//   }
// =====================================================================================================================
const createRadioButtons = (options, selected, frame, buttonHeight = 21, onRadioButtonSelected = undefined) => {
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
// create divider line
// =====================================================================================================================
const createDivider = (frame) => {
  frame.height = 1;
	const divider = NSView.alloc().initWithFrame(NSMakeRect(frame.x, frame.y, frame.width, frame.height ));
	divider.setWantsLayer(1);
	divider.layer().setBackgroundColor(CGColorCreateGenericRGB(204/255,204/255,204/255,1.0));
	return divider;
}
