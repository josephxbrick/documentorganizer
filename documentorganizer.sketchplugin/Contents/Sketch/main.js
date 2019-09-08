@import 'common.js';
@import 'symbolfunctions.js';
@import 'settings.js';
const {
  toArray
} = require('util');

// called from plug-in menu
_settings = (context) => {
  let summary = [];
  const doc = context.document;
  // check if file is set up for creating a TOC
  if (checkTocSetup(doc, summary) !== undefined) {
    const val = settingsDialog(context);
    if (val === undefined){
      return;
    }
    sortArtboards(context, sortLayersByRows);
    pageNumberArtboards(context, summary);
    nameArtboards(context, summary)
    tableOfContents(context, summary);
    if (storedValue('useSections')){
      updateCalloutLists(doc);
    }
  }
  displaySummary(doc, summary);
}

// called from plug-in menu
_updateCalloutsOnArtboard = (context) => {
  if (!storedValue('useSections')){
    context.document.showMessage('This document must use section numbering to number the callouts automatically.');
    return;
  }
  const doc = context.document;
  const page = doc.currentPage();
  artboard = page.currentArtboard();
  if (artboard == null){
    alert('No artboard selected', 'Select at least one layer on the artboard, or select the artboard itself.');
  } else {
    updateCalloutsOnArtboard(artboard, doc);
  }
}

// called from plug-in menu
_organizeDocument = (context) => {
  const doc = context.document;
  sortArtboards(context);
  let summary = [];
  if (checkPageNumberSetup(doc, summary) !== undefined) {
    pageNumberArtboards(context, summary);
  }
  if (checkNameArtboardSetup(doc, summary) !== undefined) {
    nameArtboards(context, summary);
  }
  // if (checkDateSetup(doc, summary) !== undefined) {
  //   addCurrentDate(context, summary);
  // }
  if (checkTocSetup(doc, summary) !== undefined) {
    tableOfContents(context, summary);
  }
  displaySummary(doc, summary);
  if (storedValue('useSections')){
    updateCalloutLists(doc);
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

//======================================================

/*
This creates a table of contents for artboards on the current page. If the document
is broken into sections using section-heading pages, the TOC will be broken up
into sections as well

Required elements:
  - A symbol instance with a text override named <pageTitle> on all pages you want a TOC page entry
  - A symbol instance with a text override named <pageNumber> on any page you want the TOC to show a page number
  - A symbol master (on the Symbols page) with text overrides <tocPageTitle> and <tocPageNumber>
    This symbol will be instantiated in the TOC for each page that has an instance with the override <pageTitle>
Optional elements (if you have sections in your doc)
  - A symbol instance with a text override named <sectionTitle> on all pages you want a TOC section entry
  - A symbol master (on the Symbols page) with text override <tocSectionTitle>
    (This symbol can also include a <tocPageNumber> override if you want to page-number sections)
    This symbol will be instantiated in the TOC for each page that has an instance with the override <sectionTitle>
*/

const tableOfContents = (context, summary) => {
  const tocArray = getTOCArray(context);
  const doc = context.document;
  initializeTOC(doc)
  createTOC(doc, tocArray, summary);
  layoutTOC(doc);
}

const getTOCArray = (context) => {
  const doc = context.document;
  const page = doc.currentPage();
  // get all artboards on the current page
  const artboards = allArtboards(page);
  // this array will contain each TOC entry, which will be either a section title or page title)
  const tocArray = [];
  for (const artboard of artboards) {
    let curPageNumber = curPageTitle = curSectionTitle = undefined;
    // get all symbol instances on the current artboard and find the ones that we care about
    const instances = toArray(artboard.children()).filter(item => item.class() === MSSymbolInstance);
    for (const instance of instances) {
      // Here we will walk through every symbol instance on the artboard looking for TOC values.
      // The second parameter of getOverrideText() is the name of the text override whose
      // value we want. If the instance's symbol does not offer that override, getOverrideText()
      // returns undefined.
      if (curPageNumber === undefined) {
        curPageNumber = getOverrideText(instance, '<pageNumber>');
      }
      if (curSectionTitle === undefined) {
        curSectionTitle = getOverrideText(instance, '<sectionTitle>');
      }
      if (curPageTitle === undefined) {
        curPageTitle = getOverrideText(instance, '<pageTitle>');
      }
    }
    // if we have a page title or a section title, we've got a TOC entry, so log it
    if (curSectionTitle !== undefined || curPageTitle !== undefined) {

      tocArray.push({
        sectionTitle: (curSectionTitle === undefined) ? '<undefined>' : curSectionTitle,
        pageTitle: (curPageTitle === undefined) ? '<undefined>' : curPageTitle,
        pageNumber: (curPageNumber === undefined) ? '<undefined>' : curPageNumber,

      });
    }
  }
  return tocArray;
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

// ===================================================================================================

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
        instance.setConstrainProportions(0); // unlock the aspect ratio
        instance.frame().setWidth(initColWidth);
        // we've just started a new section, so set isPartOfSection to true
        isPartOfSection = true;
      } else if (tocItem.pageTitle != '<undefined>') {
        // this item is a TOC page
        instance = tocPageMaster.newSymbolInstance();
        instance.setConstrainProportions(0); // unlock the aspect ratio
        instance.frame().setWidth(initColWidth);
      }
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
    setOverrideText(instance, '<tocPageTitle>', instance.pageTitle);
    setOverrideText(instance, '<tocSectionTitle>', instance.pageTitle);
    setOverrideText(instance, '<tocPageNumber>', instance.pageNumber);
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

// assumes all members of group are symbol instances
// const wrapGroup = (group, width) => {
//   let runningTop = 0;
//   const instances = group.layers());
//   for (let i = 0; i < instances.count(); i++){
//     const instance = instances[i];
//     let overrideName = undefined;
//     instance.frame().setY(runningTop);
//     if (instanceHasOverride(instance, '<tocSectionTitle>')){
//       overrideName = '<tocSectionTitle>';
//     } else {
//       overrideName = '<tocPageTitle>';
//     }
//     const master = instance.symbolMaster();
//     const override = getOverrideLayerfromMaster(master, overrideName);
//     const overrideCopy = override.copy();
//     group.addLayers([overrideCopy]);
//     const horizontalPadding = master.frame().width() - override.frame().width();
//     const verticalPadding = master.frame().height() - override.frame().height();
//     overrideCopy.frame().setWidth(width - horizontalPadding);
//     overrideCopy.setStringValue(getOverrideText(instance, overrideName));
//     runningTop += verticalPadding + overrideCopy.frame().height();
//     group.removeLayer(overrideCopy);
//   }
//   return runningTop;
// }

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
//============================================================

const addCurrentDate = (context, summary) => {
  const doc = context.document;
  const page = doc.currentPage();
  const artboards = allArtboards(page);
  let datesAdded = 0;
  for (const artboard of artboards) {
    instances = toArray(artboard.children()).filter(item => item.class() === MSSymbolInstance);
    for (const instance of instances) {
      if (setCurrentDate(instance, '<currentDate>') !== undefined) {
        datesAdded++;
      }
    }
  }
  // summary
  const br = String.fromCharCode(13);
  summary.push(`${datesAdded} dates updated`);
}

const setCurrentDate = (instance, overrideName) => {
  let template = originalTemplate = getDefaultOverrideText(instance, overrideName);
  if (template !== undefined) {
    const today = new Date();
    const d = today.getDate();
    const m = today.getMonth(); //January is 0
    const y = today.getFullYear();
    const longMonth = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m];
    // using month abbreviations from writing style guide, rather than just first 3 letters.
    const shortMonth = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'][m];

    // comments below assume date of 1/3/2019
    template = template.replace('[MMMM]', longMonth); // January
    template = template.replace('[MMM]', shortMonth); // Jan
    template = template.replace('[MM]', '0'.concat(m + 1).slice(-2)); // 01
    template = template.replace('[M]', m + 1); // 1
    template = template.replace(['[DDD]'], addOrdinalIndicator(d)); // 3rd
    template = template.replace(['[DD]'], '0'.concat(d).slice(-2)); // 03
    template = template.replace('[D]', d); // 3
    template = template.replace('[YYYY]', y); // 2019
    template = template.replace('[YY]', y.toString().slice(-2)); // 19

    if (template == originalTemplate) {
      // no template specified, so return date in MM/DD/YYYY format
      template = `${'0'.concat(m + 1).slice(-2)}/${'0'.concat(d).slice(-2)}/${y}`;
    }
    return setOverrideText(instance, overrideName, template);
  }
  return undefined;
}

const addOrdinalIndicator = (num) => {
  lastNum = num.toString().slice(-1);
  if (lastNum == '1') {
    return `${num}st`;
  } else if (lastNum == '2') {
    return `${num}nd`;
  } else if (lastNum == '3') {
    return `${num}rd`;
  } else {
    return `${num}th`;
  }
}

// make sure user is set up for current date
const checkDateSetup = (doc, summary) => {
  const curDate = symbolMasterWithOverrideName(doc, '<currentDate>');
  if (curDate === undefined) {
    summary.push('[ERROR]Update dates: No symbol with override <currentDate> found.');
    return undefined;
  }
  return 'success';
}

//==================================================================

const nameArtboards = (context, summary) => {
  // get stored useSections setting
  const useSections = Number(storedValue('useSections'));
  const doc = context.document;
  const page = doc.currentPage();
  let sectionNumber = sectionPageNumber = 0;
  const artboards = allArtboards(page);
  sortLayersByRows(artboards);
  let titlesAdded = 0;
  for (const artboard of artboards) {
    pageTitle = undefined;
    instances = toArray(artboard.children()).filter(item => item.class() === MSSymbolInstance);
    for (const instance of instances) {
      // check if current instance contains override '<sectionTitle>'
      pageTitle = getOverrideText(instance, '<sectionTitle>');
      if (pageTitle != undefined){
        sectionNumber++;
        sectionPageNumber = 0;
        pageTitle = addSectionNumbers(pageTitle, sectionNumber, sectionPageNumber, useSections);
        setOverrideText(instance, '<sectionTitle>', pageTitle);
        artboard.setName(pageTitle);
        titlesAdded++;
      }
      pageTitle = getOverrideText(instance, '<pageTitle>');
      if (pageTitle != undefined){
        sectionPageNumber++;
        pageTitle = addSectionNumbers(pageTitle, sectionNumber, sectionPageNumber, useSections);
        setOverrideText(instance, '<pageTitle>', pageTitle);
        artboard.setName(pageTitle);
        titlesAdded++;
      }
    }
  }
  // summary
  summary.push(`${titlesAdded} artboards named`);
}

// adds section numbers, makes all dashes match the dash preference
const addSectionNumbers = (text, sectionNumber, sectionPageNumber, useSections) => {

  const dash = '-';
  const ndash = '\u2013';
  const mdash = '\u2014';
  const dashIndex = storedValue('dashType');
  const desiredDash = [dash, ndash, mdash][dashIndex];
  const possibleIndexChars = '1234567890 .-'.concat(ndash).concat(mdash);
  // find index of first character that isn't part of an section number prefix
  const charArray = text.trim().split('');
  let prefixEndChar = 0;
  for (let i = 0; i < charArray.length; i++){
    const char = charArray[i];
    if (possibleIndexChars.indexOf(char) < 0){
      prefixEndChar = i;
      break;
    }
  }
  if (useSections){
      retVal = `${sectionNumber}.${sectionPageNumber} ${desiredDash} ${text.substring(prefixEndChar, charArray.length)}`
  } else {
      retVal = `${text.substring(prefixEndChar, charArray.length)}`
  }

  return retVal
}

const checkNameArtboardSetup = (doc, summary) => {
  const pageTitle = symbolMasterWithOverrideName(doc, '<pageTitle>');
  if (pageTitle === undefined) {
    summary.push('[ERROR]Name artboards: No symbol with override <pageTitle> found.');
    return undefined;
  }
  return 'success';
}

// =============================================================

const pageNumberArtboards = (context, summary) => {
  const doc = context.document
  const page = doc.currentPage();
  const startPageNum = 1;
  const artboards = allArtboards(page);
  sortLayersByRows(artboards);
  let curPage = startPageNum;
  let totalPages = 0
  let numbersAdded = 0;
  let firstPageWithNumber = 0;
  let firstPageFound = false;

  for (let i = 0; i < artboards.length; i++) {
    let artboard = artboards[i];
    instances = toArray(artboard.children()).filter(item => item.class() === MSSymbolInstance);
    for (const instance of instances) {
      if (setPageNumber(instance, '<pageNumber>', curPage) !== undefined) {
        firstPageFound = true;
        numbersAdded++;
      }
    }
    if (firstPageFound) {
      if (firstPageWithNumber == 0) {
        firstPageWithNumber = i + 1;
      }
      totalPages = curPage;
      curPage++;
    }
  }
  // summary
  const br = String.fromCharCode(13);
  summary.push(`${numbersAdded} page numbers updated`);
}

const setPageNumber = (instance, overrideName, pageNumber) => {
  let template = getDefaultOverrideText(instance, overrideName);
  if (template !== undefined) {
    if (template.indexOf('#') >= 0) {
      // look for '#' in default override (e.g., 'Page #') and replace # with pageNumber
      template = template.replace('#', pageNumber);
      return setOverrideText(instance, overrideName, template);
    } else {
      // '#' not found, so simply set the override text to page number
      return setOverrideText(instance, overrideName, pageNumber.toString());
    }
  }
  return undefined;
}

// make sure user is set up for page numbers
const checkPageNumberSetup = (doc, summary) => {
  const pageNumber = symbolMasterWithOverrideName(doc, '<pageNumber>');
  if (pageNumber === undefined) {
    summary.push('[ERROR]Page-number artboards: No symbol with override <pageNumber> found.');
    return undefined;
  }
  return 'success';
}

// =======================================================================

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
  const overrideLayer = getOverrideLayerfromMaster(calloutDescriptionSymbol, '<calloutListDescription>')
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
    sortByVerticalPosition(instances);
    callouts = callouts.concat(instances);
  }
  // get all ungrouped callout symbols
  const ungroupedSymbols = toArray(artboard.layers()).filter(item => item.class() === MSSymbolInstance);
  const instances = symbolsWithOverride(ungroupedSymbols, '<calloutDescription>');
  sortByVerticalPosition(instances);
  callouts = callouts.concat(instances);
  return callouts;
}
