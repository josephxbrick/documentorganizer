# Document Organizer: a Sketch plugin

Note: this plugin requires Sketch 53.2 or above.

This plugin updates page numbers, section numbers, callout numbers, and creates a table of contents in your document. This readme describes how to set up your document to use this plugin.

The plugin assumes the following about your document:

* Each page of the document is represented by an artboard
* All artboards for a document reside on a single Sketch page
* The the document is divided into sections, and each section is led by a section-heading page (artboard)
* The order that pages appear in the document is determined the artboard layout in the Sketch page. The artboards must be laid out either left to right in a single row, or with each document section on its own left-to-right row. In either case the artboards of a row must have their tops aligned. 
* At minimum, the document must contain five symbols, all of which will be discussed below
** The page-number symbol
** The section-title symbol (titles an artboard that represents a section-heading)
** The page-title symbol (titles an artboard representing a page of a section)
** The two symbols that are used by the TOC to create section-header entries and page entries

## Installing the plugin

The easiest way to  install this plugin is to choose `Download Zip` from the `Clone or Download` button at the top of the page, unzip the downloaded file, and double-click `documentorganizer.sketchplugin`.

<img src="/readme_images/clone-or-download.png" width="320">

## Downloading the sample file

In addition to the documentation below, there is a `tocsample.sketch` file in the repository that's a sketch file designed to work with this plugin. It contains some explanations of how the plugin expects the document to be set up. Hit the download button [here](tocsample.sketch) to get the file.

---

# The plugin menu

<img src="/readme_images/calloutMenus.png" width="517">

After installing the plugin, the `Organize Document` menu item will appear in Sketch's plugin menu. 

## Organize Document Now

Choosing `Organize Document Now` will update all artboards on the current Sketch page, including the TOC, section numbering, page numbering, callouts, document-title instances, and current-date instances, in accordance with the current settings.

## Update Callouts on Current Artboard

Choosing `Update Callouts on Current Artboard` will only renumber the callouts on the current artboard, which is a time saver when fiddling arround with a given artboard's callouts.

## Settings

This opens the Settings dialog. (See below)

---

# Settings

Here is the Settings dialog:

<img src="/readme_images/settings.png" width="582">


## Title of document

The value in this Settings field updates all symbol instances that have a text override named '<documentTitle>'. 

## TOC column spacing

If the group containing the table of contents is not tall enough to list TOC entries in a single column, the TOC will use multiple columns for its display. This specifies how many pixels will be between the columns.

## Include all pages or section headings only in TOC

Choose "All pages" if you want both section and page entries in the table of contents. Choose "Section headings only" to  display only the section headings.

## Use section numbering

Assigns legal-style numbering to section headings and pages in the document

## Dash style

A dash appears between section numbers and the name of the page that follows the section number. You can choose to use a dash, an ndash, or an mdash.

## Date format

You can between the formats mm/dd/yyyy and m/d/yyyy, or choose a custom date format. Use the elements below to construct a custom format. You can use either lowercase or uppercase for the elements.

### Month elements, assuming it's January:
* [mmmm] – January
* [mmm] – Jan
* [mm]  – 01
* [m] – 1

Note that short [mmm] dates follow AP Style Guide recommendations, where March, April, May, June, and July are not abbrevieated, and September is abbreviated as Sept.

### Weekday elements, assuming it's Friday
* [ww] - Friday
* [w] - Fri

Note that short [w] weekdays follow AP Style Guide recommendations, where Tuesday is "Tues", Thursday is "Thurs", and all other weekdays are shortened to their first three letters.

### Date elements, assiming it's the 3rd of the month:
* [ddd] – 3rd
* [dd] – 03
* [d] – 3

### Year elements, assuming it's 2025
* [yyyy] – 2025
* [yy] – 25

### Examples templates, assuming it's January 3rd, 2025
* Today is [ww], [mmmm] [dd], [yyyy] – "Today is Friday, January 3rd, 2025"
* [dd] [mmm] [yyyy] – "03 Jan 2025"
* [m].[d].[yyyy] – "1.3.2025"

---

# Page numbering

This plugin automatically updates the page number on each artboard of the Sketch page. The first symbol instance found is assigned the number 1, and that number increases by 1 for each subsequent artboard, whether or not an artboard has a page-number instance on it.

So if you want to start numbering your artboards at 1 on the second artboard, put the first page-number instance on the second artboard. If you want to start numbering at 2, put a page-number instance on the previous artboard and set its opacity to 0. (The transparent instance will contain the number 1.)

You can skip page-numbering an artboard, but once the first instance has been encountered, skipped artboards contribute to the page count. If the first page-number instance is on artboard 1 and the next instance is on artboard 5, these artboards will be numbered 1 and 5 respectively, with no page numbers appearing on artboards 2, 3, and 4.

## The page-number symbol instance

Place the page-number symbol instance on an artboard to assign it a page number. The symbol must have a text override named `<pageNumber>`. It doesn't matter what the symbol itself is named or what any of its instances are named. The name of the text override is all that matters.

<img src="/readme_images/page_number_symbol.png" width="335">

---

# Creating section headings and section pages in a document

Section headings are artboards that are titled using section-title symbol instances. Pages belonging to sections are titled using a page-title instance. For an artboard to listed in the table of contents, it must contain either a section-title instance or a page-title instance.

When the plugin is run, it will rename the artboard to the title of the section or page, and it can add section numbering (1.0, 1.1, 2.0, etc.) to all titles if desired.

## The section-title symbol

The section-title symbol displays the title of a section on an artboard. 

The section-title symbol must contain a text override named `<sectionTitle>`. It doesn't matter what the symbol itself is named, nor what any instance of the symbol is named. Placing an instance of this symbol on an artboard will make it show up as a section in the TOC.

<img src="/readme_images/section_title_symbol.png" width="380">

And of course, once you place the symbol instance on an artboard, you'll need to set its `<sectionTitle>` override text to the desired title. (The plug-in won't make up section names for you!)

## The page title symbol

Artboards that serve as pages of a section contain the page-title symbol instance, which displays the title of the page. The symbol must have a text override named `<pageTitle>`. It doesn't matter what the symbol itself is named. Placing this symbol on an artboard will make it show up as a page belonging to a section in the table of contents.

<img src="/readme_images/page_title_symbol.png" width="380">

## Section numbering

The plugin can prefix section titles and page titles with section numbering (e.g., 1.0, 1.1, 2.0, etc.) followed by a hyphen, which can be either a dash, an n-dash, or an m-dash. 

Important: the title of the page (after the prefix) cannot begin with a number, a period, or any type of dash.

---

# The table of contents

The plugin creates a table of contents (TOC) for artboards on the current Sketch page, organized into sections. The image below shows a TOC that has both section headers and pages, but you can choose to list only section headers.

<img src="/readme_images/toc_image_newest.png" width="900">

You can customize the look of the TOC however you want, because the TOC is created from symbols that you can customize the look of. When the plugin creates the TOC, the TOC's symbol instances are stacked with no space between them, but you can adjusting the spacing by adding the desired padding to the symbols.  

The TOC will arrange itself into multiple columns (shown above) when there are too many entries to fit in a single column. You can specify the pixel spacing between these columns.

Note that the table of contents does not yet suppport text wrapping for the TOC entries.

## Setting up the TOC

To decide where to display the the table of contents, simply place a TOC group on an artboard. The plugin will find it and populate it with page entries.  It doesn't have to be selected in order to update it. 

## The TOC group

The table of contents are created in a specific group on whichever artboard you wish.

The plug-in will arrange the TOC into however many columns it needs depending on the height this group. You can specify the pixel spacing between these columns, which will be ignored if the TOC is a single column.

Once the TOC is is created in this group, you can resize the group, and the TOC will rearrange itself into properly spaced columns **as you resize it**. 

This group must be called `<tocGroup>` This group must contain a rectangle named `<tocGroupRect>`.

<img src="/readme_images/toc_group.png" width="200">

Note that this needs to be an actual group and **not** an instance of a symbol containing this group, as this plugin does not support nested symbols.

## The symbols used to construct the TOC

The TOC is constructed using instances of two symbols: one for the section-heading entries, and one for the page entries. Important: these symbols different from the symbols used to display section titles and page titles on artboards. When the TOC is constructed, its entries are stacked with no vertical spacing in between, so add any desired vertical padding to the symbols themselves.

The symbol used for section-heading entries in the TOC must have text overrides named `<tocSectionTitle>` and `<tocPageNumber>`. It doesn't matter what the symbol itself is called. Likewise, the symbol for page entries must have text  overrides named `<tocPageTitle>` and `<tocPageNumber>`. Here's an example of a page-entry symbol.
  
<img src="/readme_images/page_entry_symbol.png" width="480">

You'll also need to design these symbols so that they appropriately lay themselves out on resize, with the title and page number pinned appropriately. For best results, use this pinning:

<img src="/readme_images/page_entry_pinning_1.png" width="380"> 

<img src="/readme_images/page_entry_pinning_2.png" width="380">

The symbol instances that the plug-in adds to the TOC will always remain same height as the corresponding symbol.

---

# Callouts and the callout listing

The plugin will automatically number your callouts and organize your callout descriptions. When using section numbering, the callouts are automatically numbered based on their layout.

<img src="/readme_images/calloutsOverview.png" width="872">

Callouts require that the document has two symbols defined: one whose instances point to locations in the mockups, and another that shows the callout descriptions in a vertical list. (See the image above.) 

Note that when editing an artboard with mockups, you will modify only the callouts that point to locations in the mockup; the descriptions list is automatically generated when the plugin is run. (See details below.) Again, it will be helpful to refer to the [sample sketch file](tocsample.sketch) included in this repository.

## The callout symbol

<img src="/readme_images/calloutOverrides.png" width="334">

Instances of this symbol are used to point out various elements of a mockup. The symbol contains the graphics that define the look of the pointer, and two text overrides, which must have the names listed below:

* `<calloutNumber>` This text override displays the callout number. There is no need to edit this override when the plugin uses section numbering; the callouts will be automatically numbered for you. 
* `<calloutDescription>` This override is used to define the callout's description. Note that the text layer to create this override should have its opacity set to 0 (so it's not visible). Set its font size to 1px so that a long description will fit. This description is used by the plugin when creating the callout description listing. 

## The callout description symbol

Instances of this symbol create the description listing, using the descriptions defined in the symbol instances above. Note that you will NOT be creating instances of this symbol; the plugin does that for you, just as the plugin automatically creates instances of the TOC elements. 

This symbol allows for text wrapping to deal with longer descriptions. It is important that the symbol's pinning is defined appropriately, both of the graphical (numbered) indicator as well as of the descriptive text:

The graphical (numbered) indicator should be pinned as follows:

<img src="/readme_images/calloutListingIndicator.png" width="565">

The description (text) layer should be pinned and have its text attributes set as follows:

<img src="/readme_images/calloutListingIndicatorText.png" width="565">

This symbol has two text overrides. Both will be populated by the plugin.

* `<calloutListNumber>` This override displays the callout number
* `<calloutListDescription>` This override displays the callout description

## The callout descriptions list group

The plugin needs to know where you want the description listing for the callouts to appear in the artboard. It expects the artboard to contain a group called `<calloutListGroup>` that contains a rectangle called `<calloutGroupRect>`. 

<img src="/readme_images/calloutListGroup.png" width="229">

Each time the plugin is run, it will delete all callout-description elements from the group will popoulate the group with new instances. Again, see the [sample sketch file](tocsample.sketch) included in this repository for an example.

## Auto-numbering of the callouts

The callouts (that point to elements in the mockups) are numbered in order vertically: the higher the callout on the artboard, the lower its number. If multiple callouts have the same `y` value, they will be numbered left to right.

Note that you can create groups of callouts on the given artboard if you want numbering to be in group order. For example, say you have two mobile mockups on an artboard laid out left-to-right. If you group the callouts with the mockups, the callouts will first number the leftmost group's callouts vertically, and then number the callouts in the group to the right vertically. The image below shows how two sets of callouts will be numbered when each set is grouped with each callout.

<img src="/readme_images/multiMockupExample.png" width="675">

---

# AddCurrentDateToArtboards

A Sketch plugin that updates today's date on artboards in the current Sketch page that contain a symbol instance to display the page number. 

To get a date, an artboard needs to include a symbol instance with a text override named `"<currentDate>"`. The name of the symbol instance itself does not matter. Note that this override cannot be in a nested symbol.

---

# Troubleshooting the document

## The TOC lists pages in the wrong order

Make sure the tops of each row of artboards are aligned perfectly and arranged left-to right, whether your artboards are arranged in a single horizontal row, or if each section's artboards are arranged in their own row.
