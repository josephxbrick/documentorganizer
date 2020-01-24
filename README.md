# Document Organizer: a Sketch plugin

Note: this plugin requires Sketch 53.2 or above.

This plugin updates page numbers, section numbers, callout numbers, and creates a table of contents in your document. This readme describes how to set up your document to use this plugin.

**IMPORTANT!** plugin is currently in Beta. Please add any bug reports, feature requests, or suggested refinements to the Issues section of this repo.

## Installing the plugin

The easiest way to  install this plugin is to choose `Download Zip` from the `Clone or Download` button at the top of the page, unzip the downloaded file, and double-click `documentorganizer.sketchplugin`.

<img src="/readme_images/clone-or-download.png" width="320">

## Downloading the sample file

In addition to the documentation below, there is a `tocsample.sketch` file in the repository that's a sketch file designed to work with this plugin. It contains some explanations of how the plugin expects the document to be set up. Hit the download button [here](tocsample.sketch) to get the file.

# Plugin requirements

The plugin assumes the following about your document:

* Each page of the document is represented by an artboard
* All artboards for a document reside on a single Sketch page
* The the document is divided into sections, and each section is led by a section-heading page (artboard)
* The order that pages appear in the document is determined the artboard layout in the Sketch page. The artboards must be laid out either left to right in a single row, or with each document section on its own left-to-right row. In either case the artboards of a row must have their tops aligned. 
* At minimum, the document must contain the following, all of which is detailed below. If any of these elements is absent, the plugin will stop execution and display an error message regarding the missing elements. Here is what your file must contain. 
  * The page-number symbol
  * The section-title symbol, which titles an artboard that represents a section-heading
  * The page-title symbol, which titles an artboard representing a page of a given section
  
  If opting (in Settings) to create a table of contents:
  * The two symbols that are used by the TOC to create section-header entries and page entries
  * The TOC group (named `<tocGroup>`), which is placed on the artboard that displays the TOC.
  
Again, refer to the documentation below for details on each of these required elements.

---

# The plugin menu

<img src="/readme_images/calloutMenus.png" width="571">

After installing the plugin, `Organize Design Document` item will appear in Sketch's plugin menu. 

## Organize Now

Choosing `Organize Document Now` will update all artboards on the current Sketch page, including the TOC, section numbering, page numbering, callouts, document-title instances, and current-date instances, in accordance with the current settings.

## Update Callouts on Artboard

Choosing `Update Callouts on Artboard` will only update the callouts on the current artboard, which is a time saver when fiddling arround with a given artboard's callouts.

## Settings

This opens the Settings dialog. (See below)

---

# Settings

Here is the Settings dialog:

<img src="/readme_images/settings.png" width="718">

Settings are saved from session to session. Below is a description of each setting.


### Title of document

The value in this Settings field updates all symbol instances that have a text override named `<documentTitle>`. 

### Create table of contents

Creates the table of contents

### TOC column spacing

If the group containing the table of contents is not tall enough to list TOC entries in a single column, the TOC will use multiple columns for its display. This specifies how many pixels will be between the columns.

### What to include in the TOC

Choose "All pages" if you want both section and page entries in the table of contents. Choose "Section headings only" to list only the section headings.

### Use section numbering

Assigns legal-style numbering to section headings and pages in the document

### Dash style

A dash appears between section numbers and the name of the page that follows the section number. You can choose to use a dash, an ndash, or an mdash.

### Date format

You can choose between the formats mm/dd/yyyy and m/d/yyyy, or create a custom date format. Use the date elements below to construct a custom format. You can use either lowercase or uppercase for the elements.

#### Month elements, assuming it's January:
* [mmmm] – January
* [mmm] – Jan
* [mm]  – 01
* [m] – 1

Note that short [mmm] dates follow AP Style Guide recommendations, where March, April, May, June, and July are not abbrevieated, and September is abbreviated as Sept.

#### Weekday elements, assuming it's Friday
* [ww] - Friday
* [w] - Fri

Note that short [w] weekdays follow AP Style Guide recommendations, where Tuesday is "Tues", Thursday is "Thurs", and all other weekdays are shortened to their first three letters.

#### Date elements, assiming it's the 3rd of the month:
* [ddd] – 3rd
* [dd] – 03
* [d] – 3

#### Year elements, assuming it's 2025
* [yyyy] – 2025
* [yy] – 25

### Examples templates, assuming it's January 3rd, 2025
* [ww], [mmmm] [ddd], [yyyy] – "Friday, January 3rd, 2025"
* [dd] [mmm] [yyyy] – "03 Jan 2025"
* [m].[d].[yyyy] – "1.3.2025"

---

# Page numbering

Page numbering is required by this plugin. This plugin automatically updates the page number on each artboard of the Sketch page. The first symbol instance found is assigned the number 1, and that number increases by 1 for each subsequent artboard, whether or not an artboard has a page-number instance on it.

So if you want to start numbering your artboards at 1 on the second artboard, put the first page-number instance on the second artboard. If you want to start numbering at 2, put a page-number instance on the previous artboard and set its opacity to 0. (The transparent instance will contain the number 1.)

You can opt not to page-number an artboard, but once the first page-number instance has been encountered, skipped artboards contribute to the page count. If the first page-number instance is on artboard 1 and the next instance is on artboard 5, these artboards will be numbered 1 and 5 respectively, with no page numbers appearing on artboards 2, 3, and 4.

## The page-number symbol instance

Place the page-number symbol instance on an artboard to assign it a page number. The symbol must have a text override named `<pageNumber>`. It doesn't matter what the symbol itself is named or what any of its instances are named. The name of the text override is all that matters.

<img src="/readme_images/page_number_symbol.png" width="335">

---

# Add the document title to an artboard

The document title is specified in Settings (see above). To display a document title on a given artboard, the artboard needs to include a symbol instance with a text override named `<documentTitle>`. The name of the symbol instance itself does not matter. Note that this override cannot be in a nested symbol.

---

# Add the current date to an artboard

To display a date, an artboard needs to include a symbol instance with a text override named `"<currentDate>"`. The name of the symbol instance itself does not matter. Note that this override cannot be in a nested symbol.

The current date will be in the format specified in Settings.

---

# Creating section headings and section pages in a document

Section headings are artboards that are titled using section-title symbol instances. Pages belonging to sections are titled using a page-title instance. For an artboard to listed in the table of contents, it must contain either a section-title instance or a page-title instance.

When the plugin is run, it will rename the artboard to the title of the section or page, and it can add section numbering (1.0, 1.1, 2.0, etc.) to all titles if desired.

## The section-title symbol

Section titles are required by this plugin. Instances of the section-title symbol display the title of a section on an artboard and denote the beginning of a new section. **Important**: these instances are to be used *only* on section-heading pages. If you want to display the current section's name on each page belonging to a section, use instances of the current-section symbol. (See below.)

The section-title symbol must contain a text override named `<sectionTitle>`. It doesn't matter what the symbol itself is named, nor what any instance of the symbol is named. Placing an instance of this symbol on an artboard will make it show up as a section in the TOC.

<img src="/readme_images/section_title_symbol.png" width="380">

And of course, once you place the symbol instance on an artboard, you'll need to set its `<sectionTitle>` override text to the desired title. (The plug-in won't make up section names for you!)

## The page-title symbol

Page titles are required by this plugin. Artboards that serve as pages of a section contain the page-title symbol instance, which displays the title of the page. The symbol must have a text override named `<pageTitle>`. It doesn't matter what the symbol itself is named. Placing this symbol on an artboard will make it show up as a page belonging to a section in the table of contents.

<img src="/readme_images/page_title_symbol.png" width="380">

## The current-section symbol

Instances of the current-section symbol display the name of the current section. This can be placed on any page, but is intended to appear on pages belonging to a section to remind readers which section they are in. Unlike the section-title symbol above, instances of the current-section symbol do not denote the beginning of a new section. It also does not display section numbering, even if section numbering is turned on. (This is to avoid unneccessary clutter.)

This symbol must contain the text override `<currentSection>`

<img src="/readme_images/current_section_symbol.png" width="520">

## About section numbering

The plugin can prefix section titles and page titles with section numbering (e.g., 1.0, 1.1, 2.0, etc.) followed by a hyphen, which can be either a dash, an n-dash, or an m-dash. That table of contents pictured below is in a document that uses section numbering.

Important: the title of the page (after the prefix) cannot begin with a number, a period, or any type of dash.

---

# Table of contents

A table of contents (TOC) is optional and can be enabled in Settings. The plugin creates a TOC for artboards on the current Sketch page, organized into sections. The image below shows a TOC that has both section headers and pages, but you can choose to list only section headers.

<img src="/readme_images/toc_image_newest.png" width="900">

You can customize the look of the TOC however you want, because the TOC is created from symbols that you can customize the look of. When the plugin creates the TOC, the TOC's symbol instances are stacked with no space between them, but you can adjusting the spacing by adding the desired padding to the symbols.  

The TOC will arrange itself into multiple columns (shown above) when there are too many entries to fit in a single column. You can specify the pixel spacing between these columns.

Note that the table of contents does not yet suppport text wrapping for the TOC entries.

## Setting up the TOC

To display a table of contents, simply place the TOC group (see below) on an artboard. The plugin will find it and populate it with page entries.  It doesn't have to be selected – or even on the current artboard – in order to update it. 

## The group that contains the table of contents

The table of contents is created in a specific group on whichever artboard you wish.

This group must be called `<tocGroup>` This group must contain a rectangle named `<tocGroupRect>`.

<img src="/readme_images/toc_group.png" width="200">

Once the TOC is is created in this group, you can resize the group, and the TOC will rearrange itself into properly spaced columns **as you resize it**. 

Important: the TOC group needs to be an actual group and **not** an instance of a symbol containing this group, as this plugin does not support nested symbols.

## The symbols used to construct the TOC

The TOC is constructed using instances of two symbols: one for the section-heading entries, and one for the page entries. Important: these symbols different from the symbols used to display section titles and page titles on artboards. 

When the TOC is constructed, its entries are stacked with no vertical spacing in between, so add any desired vertical padding to the symbols themselves.

The symbol used for section-heading entries in the TOC must have text overrides named `<tocSectionTitle>` and `<tocPageNumber>`. It doesn't matter what the symbol itself is called. Likewise, the symbol for page entries must have text  overrides named `<tocPageTitle>` and `<tocPageNumber>`. Here's an example of a page-entry symbol.
  
<img src="/readme_images/page_entry_symbol.png" width="480">

You'll also need to design these symbols so that they appropriately lay themselves out on resize, with the title and page number pinned appropriately. For best results, use this pinning:

<img src="/readme_images/page_entry_pinning_1.png" width="380"> 

<img src="/readme_images/page_entry_pinning_2.png" width="380">

The symbol instances that the plug-in adds to the TOC will always remain same height as the corresponding symbol: their text does not wrap.

---

# Callouts

Callouts consist of *callout markers* and *callout descriptions*. 

<img src="/readme_images/calloutsOverview.png" width="670">

Note that the appearance of callouts can be completely customized since they are based on symbols in your document.


## Callout markers

Callout markers are labeled pointers that refer to elements in a mockup. (See image above). These are symbol instances that you manually position on the mockup. Here is a sample, showing its required overrides.

<img src="/readme_images/calloutOverrides.png" width="334">

Don't worry about the marker's `<calloutNumber>` override: the plugin will do that for you. But you do need to put the description of what the marker is pointing at in the marker's `<calloutDescription>` text override.

Since you probably want all markers to be the same size, there is no need to point out any symbol resizing/pinning here. 

Since you don't want the symbol's `calloutDescription` text layer to be visible in marker instances, set its opacity to 0, its size to the size of the symbol, and its text alignment to "wrap to width/height." (I also set its font size to 1.)
 
 ## Callout descriptions

A callout description contains a graphic containing the callout marker's number and the descriptions. Callout descriptions live in a vertical list with the width and location of your choosing. Here is a sample, showing its required overrides.

<img src="/readme_images/calloutDescriptionOverrides.png" width="626">

When updating the callouts on a given artboard, the plugin first deletes all description instances from the description list. It then repopulates the list with new description instances, filling in each new instance's overrides using its marker's `<calloutDescription>` value. 

Note that the overrides above are filled in by the plugin, using the the override values of the associated marker. Do not edit the overrides above, as that will result in no change to the doucment.

Below is an example symbol used to create description instances. The graphical (numbered) indicator should be pinned as follows:

<img src="/readme_images/calloutListingIndicator.png" width="565">

The description (text) layer should be pinned and have its text attributes set as follows:

<img src="/readme_images/calloutListingIndicatorText.png" width="565">

The callout-description instances are stacked vertically with no space between instances, so add padding to the symbol itself to change the spacing in the descriptions list.

Callout descriptions support text wrapping. The plugin will automatically adjust the list's layout when you resize the containing group in Sketch.

## The callout-descriptions group

The plugin needs to know where you want the description listing for the callouts to appear in the artboard. It expects the artboard to contain a group called `<calloutListGroup>` that contains a rectangle called `<calloutGroupRect>`. If this group does not exist on an artboard that contains callout markers, the plugin will create it.

<img src="/readme_images/calloutListGroup.png" width="229">

Each time the plugin is run, it will delete all callout-description instance in the group and repopoulate the group with new instances. 

## Automatic numbering of callout markers

If you are using section numbers (see Settings above), the callout markers on artboard "3.4" will be numbered as "3.4.1", "3.4.2", "3.4.3," etc. If you are not using section numbers, the markers will be numbered as "A", "B", "C", etc, on each artboard.

### Sequential order of callout markers

The plugin numbers the marker instances based on their position in the mockup: the higher-up the marker appears in the mockup, the lower its number. If multiple markers have the same `y` value, they will be numbered left to right. 

Here's an example of callout numbering when using section numbering. Note how the numbering follows the vertical positions of the markers.

<img src="/readme_images/calloutVerticalLayout.png" width="730">

### Numbering callouts in group order

You can create groups of callout markers on the given artboard if you want numbering to be in group order. Example: you have two mobile mockups on an artboard, laid out left-to-right. If you group the callout markers with the mockups they refer to, the plugin will first number the leftmost group's markers vertically, and then number the markers in the group to the right vertically. 

The image below shows two mobile mockups, where each mockup has been grouped with its associated callout markers. Note the order of the numbering. (Section numbering is not used in this example.)

<img src="/readme_images/multiMockupExample.png" width="600">

---

# Round dimensions to nearest pixel

This option will round each layer's x, y, width and height to the nearest pixel specified.

## To nearest 0.1 pixels

This rounds each dimension to the nearest 0.1 pixel, so both 100.37 and 100.43 become 100.4.

## To nearest 0.5 pixels

This rounds each dimension to the nearest 0.5 pixel, so both 100.37 and 100.63 become 100.5.

This is recommended if the pixel-fitting preference is on, as upon resizing groups some layers might be moved or sized to a non-integer pixel value. Keeping such an object to the nearest half pixel will be more likely not to change the appearance or throw things out of alignment.

## To nearest 1.0 pixels

This rounds each dimension to the nearest whole number.

---

# Troubleshooting your document

## The TOC lists pages in the wrong order

Make sure the tops of all artboards in arrow are aligned perfectly and arranged left-to right, whether your artboards are arranged in a single horizontal row, or if each section's artboards are arranged in their own row.

---

# To-dos

## TOC documentation

Show images of both symbols that create the TOC instead of just the page-entry symbol.

## Saving settings

Currently settings are saved session-to-session at the plug-in level, meaning that the saved settings are the same no matter which document you are editing. (I put in a hack so document-title doesn't behave that way.) This is annoying.

It would be better if settings were saved **per document**. An easy method might be saving them to a special symbol on the Symbols page. The symbol would not even need a to have an instance in the document: could just write to text layers of the symbol itself.
