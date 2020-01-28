@import 'common.js';
@import 'symbolfunctions.js';
@import 'settings.js';
const {
  toArray
} = require('util');

//=======================================================================================================================
//  Respond to plugin menu-items
//=======================================================================================================================

_settings = (context) => {
  let summary = [];
  const doc = context.document;
  page = doc.currentPage();

  const val = settingsDialog(context);
  if (val === undefined) {
    return;
  }
  // check if file is set up for creating a TOC
  if (checkTocSetup(doc, summary)) {
    setTimeout(() => {
      sortArtboards(doc, page);
      const tocArray = numberAndNameArtboards(context, summary);
      if (storedValue('useTOC')) {
        tableOfContents(context, tocArray, summary);
      }
      if (storedValue('roundToNearestPixel')) {
        roundToNearestPixel(context, summary);
      }
      displaySummary(doc, summary);
    }, 0);
    doc.showMessage('Updating artboards. This may take a moment...');
  } else {
    displaySummary(doc, summary);
  }
}


_organizeDocument = (context) => {
  let summary = [];
  const doc = context.document;
  page = doc.currentPage();
  if (checkTocSetup(doc, summary)) {
    setTimeout(() => {
      sortArtboards(doc, page);
      const tocArray = numberAndNameArtboards(context, summary);
      if (storedValue('useTOC')) {
        tableOfContents(context, tocArray, summary);
      }
      if (storedValue('roundToNearestPixel')) {
        roundToNearestPixel(context, summary);
      }
      displaySummary(doc, summary);
    }, 0);
    doc.showMessage('Updating artboards. This may take a moment...');
  } else {
    displaySummary(doc, summary);
  }
}

_updateCalloutsOnArtboard = (context) => {
  const doc = context.document;
  const page = doc.currentPage();
  artboard = page.currentArtboard();
  if (artboard == null) {
    alert('No artboard selected', 'Select at least one layer on the artboard, or select the artboard itself.');
  } else {
    const calloutsUpdated = updateCalloutsOnArtboard(artboard, doc);
    const summary = [`${calloutsUpdated} callouts updated`];
    displaySummary(doc, summary);
  }
}

// called when any layer is resized; this is defined in manifest.json
_onLayersResizedFinish = (context, instance) => {
  const action = context.actionContext;
  const doc = action.document;
  // get all layers that are being manually resized; note that this event does not
  // chain to children of the layer being resized
  const layers = action.layers;
  for (let i = 0; i < layers.count(); i++) {
    layer = layers[i];
    // lay out the TOC if the TOC group is being resized
    if (layer.name() == '<tocGroup>') {
      layoutTOC(doc);
    }
    if (layer.name() == '<calloutListGroup>') {
      layoutCalloutDescriptions(layer, doc);
    }
  };
}

//=======================================================================================================================
//  Add section numbering to page/section title instances, name artboards after page/section/document title instances,
//  update all doc-title symbol instances, update all current-date instances, update all callouts, return tocArray which
//  is used by createTOC() function
//=======================================================================================================================
const numberAndNameArtboards = (context, summary) => {
  // get stored useSections setting
  const tocArray = [];
  const doc = context.document;
  const page = doc.currentPage();
  let sectionNumber = sectionPageNumber = titlesAdded = calloutsUpdated = 0;
  const startPageNum = 1;
  let curPage = startPageNum;
  let firstPageFound = false;
  const artboards = allArtboards(page);
  let runningSectionTitle = undefined;
  // find index of first character that isn't part of an section number prefix
  for (const artboard of artboards) {
    let curPageTitle = curSectionTitle = undefined;
    const instances = toArray(artboard.children()).filter(item => item.class() === MSSymbolInstance);
    for (const instance of instances) {
      if (setOverrideText(instance, '<pageNumber>', curPage.toString())) {
        firstPageFound = true;
      }
      // check if current instance contains override '<sectionTitle>'
      if (instanceHasOverride(instance, '<sectionTitle>')) {
        sectionNumber++;
        sectionPageNumber = 0;
        curSectionTitle = runningSectionTitle = addSectionNumbers(getOverrideText(instance, '<sectionTitle>'), sectionNumber, sectionPageNumber);
        setOverrideText(instance, '<sectionTitle>', curSectionTitle);
        artboard.setName(curSectionTitle);
        titlesAdded++;
      }
      // check if current instance contains override '<pageTitle>'
      if (instanceHasOverride(instance, '<pageTitle>')) {
        sectionPageNumber++;
        curPageTitle = addSectionNumbers(getOverrideText(instance, '<pageTitle>'), sectionNumber, sectionPageNumber);
        setOverrideText(instance, '<pageTitle>', curPageTitle);
        artboard.setName(curPageTitle);
        titlesAdded++;
      };
      setOverrideText(instance, '<documentTitle>', storedValue('docTitle'));
      setOverrideText(instance, '<currentSection>', removeSectionNumbers(runningSectionTitle));
      setOverrideText(instance, '<currentDate>', dateFromTemplate(storedValue('dateFormatTemplate')));
    }
    if (curSectionTitle || curPageTitle) {
      tocArray.push({
        sectionTitle: (curSectionTitle === undefined) ? '<undefined>' : curSectionTitle,
        pageTitle: (curPageTitle === undefined) ? '<undefined>' : curPageTitle,
        pageNumber: (curPage === undefined) ? '<undefined>' : curPage
      });
    }
    if (firstPageFound) {
      curPage++;
    }
    calloutsUpdated += updateCalloutsOnArtboard(artboard, doc);
  }
  // summary
  summary.push(`${titlesAdded} artboards updated`);
  summary.push(`${calloutsUpdated} callouts updated`);
  return tocArray;
}

const prefixEndIndex = (text) => {
  const ndash = '\u2013';
  const mdash = '\u2014';
  const possibleIndexChars = '1234567890 .-'.concat(ndash).concat(mdash);
  const charArray = text.trim().split('');
  for (let i = 0; i < charArray.length; i++) {
    const char = charArray[i];
    if (possibleIndexChars.indexOf(char) < 0) {
      return i;
    }
  }
  return 0;
}
// adds section numbers, makes all dashes match the dash preference
const addSectionNumbers = (text, sectionNumber, sectionPageNumber) => {
  const endIndex = prefixEndIndex(text);
  let retval = undefined;
  const desiredDash = storedValue('dashType');
  if (storedValue('useSections')) {
    if (sectionPageNumber == 0) {
      retval = `${sectionNumber} ${desiredDash} ${text.substring(endIndex)}`
    } else {
      retval = `${sectionNumber}.${sectionPageNumber} ${desiredDash} ${text.substring(endIndex)}`
    }
  } else {
    retval = `${text.substring(endIndex)}`
  }
  return retval
}

const removeSectionNumbers = (text) => {
  if (text) {
    const endIndex = prefixEndIndex(text);
    return `${text.substring(endIndex)}`
  }
}

//=======================================================================================================================
//  Table of contents
//
//  This creates a table of contents for artboards on the current page. This plugin assumes that the TOC is broken into
//  sections, where each section is headed by an artboard containg a section-title symbol instance, and that all artboards
//  belonging to a section contain a page-title symbol instance.
//
//  Required elements:
//    Each artboard that will be represented in the TOC must have either:
//    - A symbol instance with a text override named <sectionTitle> on all artboards you want a TOC section entry
//    - A symbol instance with a text override named <pageTitle> on all artboards you want a TOC page entry
//    Page numbers are also required. Page numbering will start at 1 upon finding the first instance of:
//    - A symbol instance with a text override named <pageNumber> on any artboard you want the TOC to show a page number
//    The TOC requires the following symbols. The plugin will create instances of them to create the TOC.
//    - A symbol (on the Symbols page) with text overrides <tocSectionTitle> and <tocPageNumber>
//      This symbol will be instantiated in the TOC for each page that has a section-title instance (see above)
//    - A symbol (on the Symbols page) with text overrides <tocPageTitle> and <tocPageNumber>
//      This symbol will be instantiated in the TOC for each page that has a page-title instance (see above)
//=======================================================================================================================

const tableOfContents = (context, tocArray, summary) => {
  const doc = context.document;
  initializeTOC(doc)
  createTOC(doc, tocArray, summary);
  layoutTOC(doc);
}

// remove all previous TOC groups from the TOC
const initializeTOC = (doc) => {
  const page = doc.currentPage();
  const tocGroup = layerWithName(page, MSLayerGroup, '<tocGroup>');
  if (tocGroup) {
    // remove all TOC groups.
    const groups = toArray(tocGroup.layers()).filter(item => item.class() === MSLayerGroup);
    for (const group of groups) {
      tocGroup.removeLayer(group);
    }
    return true;
  } else {
    return undefined;
  }
}

// load the TOC with sectionTitle and pageTitle instances
const createTOC = (doc, tocArray, summary) => {
  const showSectionsOnly = (storedValue('tocShowSectionsOnly') == 0) ? true : false;
  let tocItemCount = 0;
  const page = doc.currentPage();
  const tocSectionMaster = symbolMasterWithOverrideName(doc, '<tocSectionTitle>');
  const tocPageMaster = symbolMasterWithOverrideName(doc, '<tocPageTitle>');
  let tocGroup = layerWithName(page, MSLayerGroup, '<tocGroup>');
  // The TOC will be broken up into groups. The plugin groups sections together (e.g.,
  // the section header is grouped with all of its pages). If there is a page with no
  // parent section, it gets its own group. The loop below creates the groups.
  let curGroup = [];
  let curGroupName = undefined;
  let runningTop = 0;
  let groupNumber = 0;
  let isPartOfSection = false;
  let instance = undefined
  let initColWidth = 100; // this is to make sure that sections are same width as pages
  for (let i = 0; i < tocArray.length; i++) {
    let tocItem = tocArray[i];
    if (showSectionsOnly == true && tocItem.sectionTitle != '<undefined>' || !showSectionsOnly) {
      tocItemCount++;
      if (curGroup.length == 0) {
        curGroupName = `TOC group: ${(tocItem.sectionTitle != '<undefined>') ? tocItem.sectionTitle : tocItem.pageTitle}`;
      }
      if (tocItem.sectionTitle != '<undefined>') {
        // this item is a TOC section header
        instance = tocSectionMaster.newSymbolInstance();
        instance.frame().setWidth(initColWidth);
        // we've just started a new section, so set isPartOfSection to true
        isPartOfSection = true;
      } else if (tocItem.pageTitle != '<undefined>') {
        // this item is a TOC page
        instance = tocPageMaster.newSymbolInstance();
        instance.frame().setWidth(initColWidth);
      }
      instance.setConstrainProportions(0); // unlock the aspect ratio
      // store text values into object properties, because we can't set the overrides
      // yet as the instances are not part of the document
      instance.pageTitle = (tocItem.sectionTitle != '<undefined>') ? tocItem.sectionTitle : tocItem.pageTitle;
      instance.setName(`TOC item: ${tocItem.pageTitle}`);
      instance.pageNumber = tocItem.pageNumber;
      instance.frame().setX(0);
      instance.frame().setY(runningTop);
      runningTop += instance.frame().height();
      // add the instance to the array we're building; we will eventually add this
      // array to a group
      curGroup.push(instance);
      if (i == tocArray.length - 1 || isPartOfSection == false || tocArray[i + 1].sectionTitle != '<undefined>' || showSectionsOnly) {
        // the current item is either the very last TOC item, or it's a sectionless TOC page,
        // or the next item starts a new section, or we're only showing sections in the TOC,
        // so let's add the items we've been collecting to a new group
        let tocEntry = MSLayerGroup.new();
        tocEntry.setConstrainProportions(0); // unlock aspect ratio
        groupNumber++;
        tocEntry.setName(curGroupName);
        tocEntry.addLayers(curGroup);
        sizeGroupToContent(tocEntry); // fit group to its contents
        tocGroup.addLayers([tocEntry]); // add the group to the TOC
        // get ready to start a new group
        curGroup = [];
        isPartOfSection = false;
      }
    }
  }
  // now that all instances reside in the document, we can update their overrides
  instances = toArray(tocGroup.children()).filter(item => item.class() === MSSymbolInstance);
  for (const instance of instances) {
    setOverrideText(instance, '<tocPageNumber>', instance.pageNumber.toString());
    setOverrideText(instance, '<tocPageTitle>', instance.pageTitle.toString());
    setOverrideText(instance, '<tocSectionTitle>', instance.pageTitle.toString());
  }
  summary.push(`${tocItemCount} items added to TOC`);
}

const layoutTOC = (doc) => {
  // get stored colSpacing setting
  const colSpacing = Number(storedValue('tocColumnSpacing'));
  const page = doc.currentPage();
  const tocGroup = layerWithName(page, MSLayerGroup, '<tocGroup>');
  const tocRect = layerWithName(tocGroup, MSRectangleShape, '<tocGroupRect>')
  const tocW = tocGroup.frame().width();
  const tocH = tocGroup.frame().height();
  const groups = toArray(tocGroup.layers()).filter(item => item.class() === MSLayerGroup);
  let curY = curCol = 0;
  // add groups to an array of columns while setting each group's vertical position
  const columns = [
    []
  ];
  for (const group of groups) {

    if (curY > 0 && curY + group.frame().height() > tocH) {
      // group extends beyond the height of the TOC, so create new column for it
      curCol++
      columns.push([]);
      curY = 0;
    }
    group.frame().setY(curY);
    curY += group.frame().height();
    columns[curCol].push(group);
  }
  // set each group's x position and width; also set each group's pinning
  const numColumns = columns.length;
  const colWidth = Math.round((tocW - colSpacing * (numColumns - 1)) / numColumns);
  for (let i = 0; i < numColumns; i++) {
    let column = columns[i];
    let x = i * (colWidth + colSpacing);
    for (let j = 0; j < column.length; j++) {
      const group = column[j];
      // set all pinning to false
      group.setFixed_forEdge_(false, 32) //pin top
      group.setFixed_forEdge_(false, 1) // pin right
      group.setFixed_forEdge_(false, 4) // pin left
      // fix height of group
      group.setFixed_forEdge_(true, 16); // fixed height
      // set x and width
      group.frame().setX(x);
      group.frame().setWidth(colWidth);
      if (j == 0) {
        // group is top group of column
        group.setFixed_forEdge_(true, 32); // pin top
      }
      if (i == 0) {
        // group is leftmost group
        group.setFixed_forEdge_(true, 4); // pin left
      } else if (i == numColumns - 1) {
        // group is rightmost group
        group.setFixed_forEdge_(true, 1); // pin right
      }
    }
  }
  // set the tocGroup's rectangle to size of group, just in case
  tocRect.frame().setWidth(tocGroup.frame().width());
  tocRect.frame().setHeight(tocGroup.frame().height());
}


// make sure user is set up for TOC
const checkTocSetup = (doc, summary) => {
  let retval = 'success';
  const page = doc.currentPage();
  const artboards = allArtboards(page);
  // make sure page contains artboards. Return error immediately in not
  if (artboards.length == 0) {
    summary.push('[ERROR]The current page contains no artboards.');
    return undefined;
  }
  // check for page numbers, section titles and page titles;
  const pageNumber = symbolMasterWithOverrideName(doc, '<pageNumber>');
  if (pageNumber === undefined) {
    summary.push('[ERROR]No symbol with override <pageNumber> found.');
    retval = undefined;
  }
  const sectionTitle = symbolMasterWithOverrideName(doc, '<sectionTitle>');
  if (sectionTitle === undefined) {
    summary.push('[ERROR]No symbol with override <sectionTitle> found.');
    retval = undefined;
  }
  const pageTitle = symbolMasterWithOverrideName(doc, '<pageTitle>');
  if (pageTitle === undefined) {
    summary.push('[ERROR]No symbol with override <pageTitle> found.');
    retval = undefined;
  }
  if (retval === undefined) {
    // page numbers, section titles and/or page titles are absent
    return retval
  }
  // check for TOC stuff
  if (storedValue('useTOC')) {
    const tocSectionTitle = symbolMasterWithOverrideName(doc, '<tocSectionTitle>');
    if (tocSectionTitle === undefined) {
      summary.push('[ERROR]Table of contents: No symbol with override <tocSectionTitle> found.');
      retval = undefined;
    }
    const tocPageTitle = symbolMasterWithOverrideName(doc, '<tocPageTitle>');
    if (tocPageTitle === undefined) {
      summary.push('[ERROR]Table of contents: No symbol with override <tocPageTitle> found.');
      retval = undefined;
    }
    const tocGroup = layerWithName(page, MSLayerGroup, '<tocGroup>');
    if (tocGroup === undefined) {
      summary.push('[ERROR]Table of contents: Group named <tocGroup> not found on any artboard.');
      retval = undefined;
    }
    if (tocGroup && layerWithName(tocGroup, MSRectangleShape, '<tocGroupRect>') === undefined) {
      summary.push('[ERROR]Table of contents: <tocGroup> must contain a rectangle named <tocGroupRect>.');
      retval = undefined;
    }
  }
  return retval;
}

//=======================================================================================================================
//  Callouts
//=======================================================================================================================


const updateCalloutsOnArtboard = (artboard, doc) => {
  const useSections = storedValue('useSections');
  const callouts = sortedCallouts(artboard));
let sectionNumber = '';
let calloutCount = 0;
if (useSections) {
  sectionNumber = artboard.name().substring(0, artboard.name().indexOf(' ')).concat('.');
}
// get all symbol instances on the current artboard and find the ones that we care about
const calloutListDescriptions = [];
for (const callout of callouts) {
  calloutCount++;
  let overrideText = getOverrideText(callout, '<calloutDescription>');
  if (overrideText === null) {
    overrideText = ''
  }
  const calloutNumber = (useSections) ? `${sectionNumber}${calloutCount}` : numberToLetters(calloutCount - 1);
  setOverrideText(callout, '<calloutNumber>', calloutNumber);
  // reset this to its normal value to avoid the bug where you can't change any override in the Sketch UI.
  setOverrideText(callout, '<calloutDescription>', ' ');
  setOverrideText(callout, '<calloutDescription>', overrideText);
  calloutListDescriptions.push({
    description: overrideText,
    calloutNumber: calloutNumber
  });
  callout.setName(`${calloutNumber} - ${overrideText.substring(0,30)}...`);
}
if (calloutCount > 0) {
  let calloutDescriptionsGroup = layerWithName(artboard, MSLayerGroup, '<calloutListGroup>');
  if (calloutDescriptionsGroup == undefined) {
    calloutDescriptionsGroup = createCalloutDescriptionGroup(artboard);
  } else {
    // remove existing groups from calloutDescriptionsGroup
    const instances = toArray(calloutDescriptionsGroup.layers()).filter(item => item.class() !== MSRectangleShape);
    for (const instance of instances) {
      calloutDescriptionsGroup.removeLayer(instance);
    }
  }
  // get reference to the listing symbol
  const calloutDescriptionSymbol = symbolMasterWithOverrideName(doc, '<calloutListDescription>');
  // add one symbol to calloutDescriptionsGroup per string in array
  for (const calloutListDescription of calloutListDescriptions) {
    const instance = calloutDescriptionSymbol.newSymbolInstance();
    instance.setConstrainProportions(0); // unlock the aspect ratio
    instance.setFixed_forEdge_(true, 4); // pin left
    instance.setFixed_forEdge_(true, 32); // pin top
    calloutDescriptionsGroup.addLayers([instance]);
    setOverrideText(instance, '<calloutListDescription>', calloutListDescription.description);
    setOverrideText(instance, '<calloutListNumber>', calloutListDescription.calloutNumber);
    instance.setName(calloutListDescription.calloutNumber);
  }
  layoutCalloutDescriptions(calloutDescriptionsGroup, doc);
}
return calloutCount;
}

const numberToLetters = (num) => {
  const firstDigit = (num <= 25) ? '' : String.fromCharCode(Math.floor(num / 26) + 64);
  const secondDigit = String.fromCharCode(num % 26 + 65);
  return `${firstDigit}${secondDigit}`;
}

// lays out the descriptions for callouts in the calloutDescriptionsGroup
const layoutCalloutDescriptions = (calloutDescriptionsGroup, doc) => {
  let groupRect = layerWithName(calloutDescriptionsGroup, MSRectangleShape, '<calloutGroupRect>')
  // if the rectangle is for some reason missing
  if (groupRect == undefined) {
    groupRect = MSRectangleShape.new();
    groupRect.setName('<calloutGroupRect>');
    // turn off constrain proportions
    groupRect.setConstrainProportions(0);
    groupRect.frame().setWidth(calloutDescriptionsGroup.frame().width());
    groupRect.frame().setHeight(calloutDescriptionsGroup.frame().height());
    calloutDescriptionsGroup.addLayers([groupRect]);
    // make group fit its content
    sizeGroupToContent(calloutDescriptionsGroup);
    MSLayerMovement.moveToBack([groupRect]);
  }
  const calloutDescriptionSymbol = symbolMasterWithOverrideName(doc, '<calloutListDescription>');
  const overrideLayer = getOverrideLayerfromSymbol(calloutDescriptionSymbol, '<calloutListDescription>')
  // get horizontal and vertical space NOT occupied by the description text area
  const symbolPaddingVertical = calloutDescriptionSymbol.frame().height() - overrideLayer.frame().height();
  const symbolPaddingHorizonal = calloutDescriptionSymbol.frame().width() - overrideLayer.frame().width();
  // get all symbols in the group
  const instances = toArray(calloutDescriptionsGroup.layers()).filter(item => item.class() === MSSymbolInstance);
  let runningTop = 0;
  for (const instance of instances) {
    instance.frame().setWidth(calloutDescriptionsGroup.frame().width());
    instance.frame().setY(runningTop);
    // Need to account for wrapping of text. Get copy of the description text area, set it to the width of the
    // the field in the symbol, set its text to the same text, then check the text area's height.
    // Use that height
    const overrideLayerCopy = overrideLayer.copy();
    calloutDescriptionsGroup.addLayers([overrideLayerCopy]);
    overrideLayerCopy.frame().setWidth(calloutDescriptionsGroup.frame().width() - symbolPaddingHorizonal);
    overrideLayerCopy.setStringValue(getOverrideText(instance, '<calloutListDescription>'));
    runningTop += symbolPaddingVertical + overrideLayerCopy.frame().height();
    calloutDescriptionsGroup.removeLayer(overrideLayerCopy);
  }
  // set the calloutDescriptionsGroup's rectangle to size of group, just in case
  calloutDescriptionsGroup.frame().setHeight(runningTop);
  groupRect.frame().setWidth(calloutDescriptionsGroup.frame().width());
  groupRect.frame().setHeight(calloutDescriptionsGroup.frame().height());
}

// Callouts can be organized into groups, or they can just be on the artboard.
// If they are in groups, the sort order will be sorted first by group (running left to right),
// then by vertical position within each group.
const sortedCallouts = (artboard) => {
  let callouts = [];
  // get all top-level layer groups
  const groups = toArray(artboard.layers()).filter(item => item.class() === MSLayerGroup);
  sortByHorizontalPosition(groups);
  for (const group of groups) {
    const symbols = toArray(group.children()).filter(item => item.class() === MSSymbolInstance);
    const instances = symbolsWithOverride(symbols, '<calloutDescription>');
    sortLayersByRows(instances);
    callouts = callouts.concat(instances);
  }
  // get all ungrouped callout symbols
  const ungroupedSymbols = toArray(artboard.layers()).filter(item => item.class() === MSSymbolInstance);
  const instances = symbolsWithOverride(ungroupedSymbols, '<calloutDescription>');
  sortByVerticalPosition(instances);
  callouts = callouts.concat(instances);
  return callouts;
}

// creates group for callout list
const createCalloutDescriptionGroup = (artboard) => {
  const group = MSLayerGroup.new()
  const rect = MSRectangleShape.new()
  group.setName('<calloutListGroup>');
  rect.setName('<calloutGroupRect>');
  // turn off constrain proportions
  rect.setConstrainProportions(0);
  group.setConstrainProportions(0);
  // position group
  group.frame().setX(Math.round(artboard.frame().width() * 0.72));
  group.frame().setY(Math.round(artboard.frame().height() * 0.07));
  rect.frame().setWidth(Math.round(artboard.frame().width() * 0.25));
  rect.frame().setHeight(artboard.frame().height());
  artboard.addLayers([group]);
  group.addLayers([rect]);
  // make group fit its content
  sizeGroupToContent(group);
  return group;
}


const roundToNearestPixel = (context, summary) => {
  const doc = context.document;
  const page = doc.currentPage();
  const roundToValue = Number(storedValue('nearestPixelToRoundTo').slice(0, 3));
  const artboards = allArtboards(page);
  let fixCount = 0;
  for (const artboard of artboards) {

    const layers = toArray(artboard.children()).filter(item => item.class() != MSLayerGroup);

    for (const layer of layers) {
      if (layer.parentGroup() !== undefined && layer.parentGroup().name() != '<calloutListGroup>' && layer.parentGroup().name() != '<tocGroup>') {
        const frame = layer.frame();
        const x = frame.x();
        const y = frame.y();
        const w = frame.width();
        const h = frame.height();
        if (fmod(x, roundToValue) != 0) {
          fixCount++;
          frame.setX(Math.round(x / roundToValue) * roundToValue);
        }
        if (fmod(y, roundToValue) != 0) {
          fixCount++;
          frame.setY(Math.round(y / roundToValue) * roundToValue);
        }
        if (fmod(w, roundToValue) != 0) {
          fixCount++;
          frame.setWidth(Math.round(w / roundToValue) * roundToValue);
        }
        if (fmod(h, roundToValue) != 0) {
          fixCount++;
          frame.setHeight(Math.round(h / roundToValue) * roundToValue);
        }
      }
    }
  }
  summary.push(`${fixCount} dimensions rounded to nearest ${roundToValue.toFixed(1)} pixels`);
}
