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
  // check if file is set up for creating a TOC
  if (checkTocSetup(doc, summary) !== undefined) {
    const val = settingsDialog(context);
    if (val === undefined){
      return;
    }
    sortArtboards(page);
    // pageNumberArtboards(context, summary);
    const tocArray = numberAndNameArtboards(context, summary);   //
    tableOfContents(context, tocArray, summary);
    if (storedValue('useSections')){
      updateCalloutLists(doc);
    }
  }
  displaySummary(doc, summary);
}

_organizeDocument = (context) => {
  const doc = context.document;
  let tocArray = undefined;
  page = doc.currentPage();
  sortArtboards(page);
  let summary = [];
  if (checkNameArtboardSetup(doc, summary) !== undefined) {
    tocArray = numberAndNameArtboards(context, summary);
  }
  // if (checkDateSetup(doc, summary) !== undefined) {
  //   addCurrentDate(context, summary);
  // }
  if (checkTocSetup(doc, summary) !== undefined) {
    tableOfContents(context, tocArray, summary);
  }
  displaySummary(doc, summary);
  if (storedValue('useSections')){
    updateCalloutLists(doc);
  }
}

_updateCalloutsOnArtboard = (context) => {
  const doc = context.document;
  const page = doc.currentPage();
  artboard = page.currentArtboard();
  if (artboard == null){
    alert('No artboard selected', 'Select at least one layer on the artboard, or select the artboard itself.');
  } else {
    updateCalloutsOnArtboard(artboard, doc);
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
//  Add section numbering to page/section title instances, name artboards after page/section title instances, update all
//  doc-title symbol instances, update all current-date instances, return tocArray which is used by createTOC() function
//=======================================================================================================================
const numberAndNameArtboards = (context, summary) => {
  // get stored useSections setting
  const tocArray = [];
  const doc = context.document;
  const page = doc.currentPage();
  let sectionNumber = sectionPageNumber = titlesAdded = 0;
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
      if (setOverrideText(instance, '<pageNumber>', curPage.toString())){
        firstPageFound = true;
      }
      // check if current instance contains override '<sectionTitle>'
      if (instanceHasOverride(instance, '<sectionTitle>')){
        sectionNumber++;
        sectionPageNumber = 0;
        curSectionTitle = runningSectionTitle = addSectionNumbers(getOverrideText(instance, '<sectionTitle>'), sectionNumber, sectionPageNumber);
        setOverrideText(instance, '<sectionTitle>', curSectionTitle);
        artboard.setName(curSectionTitle);
        titlesAdded++;
      }
      // check if current instance contains override '<pageTitle>'
      if (instanceHasOverride(instance, '<pageTitle>')){
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
    if (curSectionTitle !== undefined || curPageTitle !== undefined) {
      tocArray.push({
        sectionTitle: (curSectionTitle === undefined) ? '<undefined>' : curSectionTitle,
        pageTitle: (curPageTitle === undefined) ? '<undefined>' : curPageTitle,
        pageNumber: (curPage === undefined) ? '<undefined>' : curPage
      });
    }
    if (firstPageFound) {
      curPage++;
    }
  }
  // summary
  summary.push(`${titlesAdded} artboards named`);
  return tocArray;
}

const prefixEndIndex = (text) => {
  const ndash = '\u2013';
  const mdash = '\u2014';
  const possibleIndexChars = '1234567890 .-'.concat(ndash).concat(mdash);
  const charArray = text.trim().split('');
  for (let i = 0; i < charArray.length; i++){
    const char = charArray[i];
    if (possibleIndexChars.indexOf(char) < 0){
      return i;
    }
  }
  return 0;
}
// adds section numbers, makes all dashes match the dash preference
const addSectionNumbers = (text, sectionNumber, sectionPageNumber) => {
  const endIndex = prefixEndIndex(text);
  let retval = undefined;
  const ndash = '\u2013';
  const mdash = '\u2014';
  const dasharray = ['-', ndash, mdash];
  const index = Number(storedValue('dashType'));
  const desiredDash = dasharray[index];
  if (storedValue('useSections')){
      retval = `${sectionNumber}.${sectionPageNumber} ${desiredDash} ${text.substring(endIndex)}`
  } else {
      retval = `${text.substring(endIndex)}`
  }
  return retval
}

const removeSectionNumbers = (text) => {
  if (text){
    const endIndex = prefixEndIndex(text);
    return `${text.substring(endIndex)}`
  }
}

const checkNameArtboardSetup = (doc, summary) => {
  const pageTitle = symbolMasterWithOverrideName(doc, '<pageTitle>');
  if (pageTitle === undefined) {
    summary.push('[ERROR]Name artboards: No symbol with override <pageTitle> found.');
    return undefined;
  }
  const sectionTitle = symbolMasterWithOverrideName(doc, '<sectionTitle>');
  if (sectionTitle === undefined) {
    summary.push('[ERROR]Name artboards: No symbol with override <sectionTitle> found.');
    return undefined;
  }
  const pageNumber = symbolMasterWithOverrideName(doc, '<pageNumber>');
  if (pageNumber === undefined) {
    summary.push('[ERROR]Page-number artboards: No symbol with override <pageNumber> found.');
    return undefined;
  }
  return 'success';
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
  if (tocGroup !== undefined) {
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
  const showSectionsOnly =  (storedValue('tocShowColumnsOnly') == 0) ? false: true;

  let tocItemCount = 0;``
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
    if (showSectionsOnly == true && tocItem.sectionTitle != '<undefined>' || !showSectionsOnly){
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
      instance.pageTitle = (tocItem.sectionTitle != '<undefined>') ?  tocItem.sectionTitle: tocItem.pageTitle;
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
        tocEntry.fixGeometryWithOptions(0); // fit group to its contents
        tocGroup.addLayers([tocEntry]); // add the group to the TOC
        // get ready to start a new group
        curGroup = [];
        isPartOfSection = false;
      }
    }
  }
  // now that all instances reside in the document, we can update their overrides
  instances = toArray(tocGroup.children()).filter(item => item.class() === MSSymbolInstance);
  for (instance of instances) {
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
    for (j = 0; j < column.length; j++) {
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
  const pageNumber = symbolMasterWithOverrideName(doc, '<pageNumber>');
  if (pageNumber === undefined) {
    summary.push('[ERROR]Table of contents: No symbol with override <pageNumber> found.');
    retval = undefined;
  }
  const pageTitle = symbolMasterWithOverrideName(doc, '<pageTitle>');
  if (pageTitle === undefined) {
    summary.push('[ERROR]Table of contents: No symbol with override <pageTitle> found.');
    retval = undefined;
  }
  const tocPageTitle = symbolMasterWithOverrideName(doc, '<tocPageTitle>');
  if (tocPageTitle === undefined) {
    summary.push('[ERROR]Table of contents: No symbol with override <tocPageTitle> found.');
    retval = undefined;
  }
  const tocGroup = layerWithName(doc.currentPage(), MSLayerGroup, '<tocGroup>');
  if (tocGroup === undefined) {
    summary.push('[ERROR]Table of contents: No group named <tocGroup> found on this Sketch page.');
    retval = undefined;
  }
  if (tocGroup !== undefined && layerWithName(tocGroup, MSRectangleShape, '<tocGroupRect>') === undefined) {
    summary.push('[ERROR]Table of contents: <tocGroup> must contain a rectangle named <tocGroupRect>.');
    retval = undefined;
  }
  return retval;
}

//=======================================================================================================================
//  Callouts
//=======================================================================================================================

const updateCalloutLists = (doc) => {
  const page = doc.currentPage();
  // get all artboards on the current page
  const artboards = allArtboards(page);
  for (const artboard of artboards) {
    updateCalloutsOnArtboard(artboard, doc);
  }
}

const updateCalloutsOnArtboard = (artboard, doc) => {
  const callouts = sortedCallouts(artboard));
  let calloutCount = 0;
  const sectionNumber = artboard.name().substring(0, artboard.name().indexOf(' '));
  // get all symbol instances on the current artboard and find the ones that we care about
  const calloutListDescriptions = [];
  for (const callout of callouts) {
    calloutCount ++;
    let overrideText = getOverrideText(callout, '<calloutDescription>');
    const calloutNumber = `${sectionNumber}.${calloutCount}`;
    setOverrideText(callout, '<calloutNumber>', calloutNumber);
      // reset this to its normal value to avoid the bug where you can't change any override in the Sketch UI.
    setOverrideText(callout, '<calloutDescription>', '');
    setOverrideText(callout, '<calloutDescription>', overrideText);
    calloutListDescriptions.push({description: overrideText, calloutNumber: calloutNumber});
    callout.setName(`${sectionNumber}.${calloutCount} - ${overrideText.substring(0,30)}...`);
  }
  let calloutDescriptionsGroup = layerWithName(artboard, MSLayerGroup, '<calloutListGroup>');
  if (calloutDescriptionsGroup !== undefined && calloutListDescriptions.length > 0){
    // get reference to the listing symbol
    const calloutDescriptionSymbol = symbolMasterWithOverrideName(doc, '<calloutListDescription>');
    // remove existing groups from calloutDescriptionsGroup
    const instances = toArray(calloutDescriptionsGroup.layers()).filter(item => item.class() === MSSymbolInstance || item.class() === MSTextLayer);
    for (const instance of instances) {
      calloutDescriptionsGroup.removeLayer(instance);
    }
    // add one symbol to calloutDescriptionsGroup per string in array
    for (calloutListDescription of calloutListDescriptions){
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
}

// lays out the descriptions for callouts in the calloutDescriptionsGroup
const layoutCalloutDescriptions = (calloutDescriptionsGroup, doc) => {
  const groupRect = layerWithName(calloutDescriptionsGroup, MSRectangleShape, '<calloutGroupRect>')
  const calloutDescriptionSymbol = symbolMasterWithOverrideName(doc, '<calloutListDescription>');
  const overrideLayer = getOverrideLayerfromSymbol(calloutDescriptionSymbol, '<calloutListDescription>')
  const symbolPaddingVertical = calloutDescriptionSymbol.frame().height() - overrideLayer.frame().height();
  const symbolPaddingHorizonal = calloutDescriptionSymbol.frame().width() - overrideLayer.frame().width();
  const instances = toArray(calloutDescriptionsGroup.layers()).filter(item => item.class() === MSSymbolInstance);
  let runningTop = 0;
  for (instance of instances){
    instance.frame().setWidth(calloutDescriptionsGroup.frame().width());
    instance.frame().setY(runningTop);
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
  for (group of groups){
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
