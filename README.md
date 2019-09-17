# Document Organizer: a Sketch plugin

Note: this plugin requires Sketch 53.2 or above.

This plugin updates page numbers, section numbers, callout numbers, and a table of contents in your document. This readme describes how to set up your document to use this plugin.


## Installing the plugin

The easiest way to  install this plugin is to choose `Download Zip` from the `Clone or Download` button at the top of the page, unzip the downloaded file, and double-click `documentorganizer.sketchplugin`.

<img src="/readme_images/clone-or-download.png" width="320">

## Downloading the sample file

In addition to the documentation below, there is a `tocsample.sketch` file in the repository that's a sketch file designed to work with this plugin. It contains some explanations of how the plugin expects the document to be set up. Hit the download button [here](tocsample.sketch) to get the file.

# Table of contents, section numbering, and page numbering

The plugin creates a table of contents (TOC) for artboards on the current Sketch page, organized into sections. It will page-number the artboards for you, as well as add legal-style numbering (1.0, 1.1, 2.0) to the titles of the artboards and in to the TOC. Here is an example of what that can look like:

<img src="/readme_images/toc_image_newest.png" width="900">

You can customize the look of it however you want, because the TOC is created from symbols that you can customize the look of. Example: when the plugin creates the TOC, the TOC's symbol instances are stacked with no space between them, but you can adjusting the spacing by adding the desired padding to the symbols.  

The TOC will arrange itself into multiple columns (shown above) when there are too many entries to fit in a single column. You can specify the pixel spacing between these columns. (See Settings below.)

There is an option to display only the section headings in the TOC, rather than the section headings along with their associated pages.

Note that the table of contents does not yet suppport text wrapping for the TOC entries.

## Setting up the TOC

You'll need to set up the artboards of the Sketch page in a particular way in order for the plug-in to create your table of contents. The file `tocsample.sketch` in this repository is set up this way.

This plugin supports only documents that are organized into sections. It assumes that each section will have an artboard that serves as the section-heading page. To designate an artboard as a section-heading page, place an instance of the section-title symbol on it, which displays the title of the section on the artboard.

Any artboard that's not a section-heading page needs to have an instance of the page-title symbol on it; otherwise, it won't show up in the table of contents.

It doesn't matter how your artboards are ordered in the layer list. The plug-in will use the left-to-right order that the artboards are arranged in. You can either put the artboards in a single horizontal row, or you can put each section's artboards into their own horizontal row and stack the sections vertically (which is helpful when creating a large document). The the artboards in `tocsample.sketch` are arranged in a stack of section rows. Important: In either case, make sure that all artboards in a row have their tops aligned.


Note that all artboards must be on the same Sketch page. This plug-in does not span pages in the Sketch document.


### The TOC group

The table of contents will live in a specific group on whichever artboard you wish. It doesn't have to be selected in order to update it. 

The plug-in will arrange the TOC into however many columns it needs depending on the height this group. You can specify for the pixel spacing between these columns, which will be ignored if the TOC is a single column.

Once the TOC is is created in this group, you can resize the group, and the TOC will rearrange itself into properly spaced columns **as you resize it**. 

This group must be called `<tocGroup>` This group must contain a rectangle named `<tocGroupRect>`.

<img src="/readme_images/toc_group.png" width="200">

Note that this needs to be an actual group and **not** an instance of a symbol containing this group, as this plugin does not support nested symbols.


## The section-title symbol

The section-title symbol displays the title of a section on an artboard. Each artboard that you want listed in the TOC must contain either a section-title instance or a page-title instance.

The section-title symbol must contain a text override named `<sectionTitle>`. It doesn't matter what the symbol itself is named, or what any instance of the symbol is named. Placing an instance of this symbol on an artboard will make it show up as a section in the TOC.

<img src="/readme_images/section_title_symbol.png" width="380">

And of course, once you place the symbol instance on an artboard, you'll need to set its `<sectionTitle>` override text to the desired title. (The plug-in won't make up section names for you!)

### The page title symbol

The page-title symbol displays the title of a page on an artboard. The symbol must have a text override named `<pageTitle>`. It doesn't matter what the symbol itself is named. Placing this symbol on an artboard will make it show up as a page that belongs to a section in the TOC.

<img src="/readme_images/page_title_symbol.png" width="380">


### The symbols used to construct the TOC

The TOC is constructed using instances of two symbols: one for the section-heading entries, and one for the page entries. Important: these symbols different from the symbols used to display section titles and page titles on artboards. When the TOC is constructed, its entries are stacked with no vertical spacing in between, so add any desired vertical padding to the symbols themselves.

The symbol used for section-heading entries in the TOC must have text overrides named `<tocSectionTitle>` and `<tocPageNumber>`. It doesn't matter what the symbol itself is called. Likewise, the symbol for page entries must have text  overrides named `<tocPageTitle>` and `<tocPageNumber>`. Here's an example of a page-entry symbol.
  
<img src="/readme_images/page_entry_symbol.png" width="480">

You'll also need to design these symbols so that they appropriately lay themselves out on resize, with the title and page number pinned appropriately. For best results, use this pinning:

<img src="/readme_images/page_entry_pinning_1.png" width="380"> 

<img src="/readme_images/page_entry_pinning_2.png" width="380">

The symbol instances that the plug-in adds to the TOC will always remain same height as the corresponding symbol.

## Page numbering

This plugin automatically updates the page number on each artboard of the page.

### The page number symbol

The page number symbol, which you will put an instance of on each artboard that you want a page number listed, must have a text override named `<pageNumber>`. It doesn't matter what the symbol itself is named or what any of its instances are named. The name of the text override is all that matters.

<img src="/readme_images/page_number_symbol.png" width="335">

The plug-in will update the page numbers for you before creating the TOC. It starts numbering pages (starting at 1) upon the first instance of this symbol that it finds. 

So if you want to start numbering your artboards at 1 on the second artboard, put the first page number instance on the second artboard. If you want to start numbering at 2, put a page-number instance on the previous artboard and set its opacity to 0. (The transparent instance will contain the number 1.)

Note that the hash character in the default override text (which you see above) will be replaced by the page number, so if you want your page numbers listed in the format "Page 1" you would make the default override text "Page #"

## Section numbering

The plugin prefixes  section titles and page titles with section numbering (which is a value like 1.0, 1.1, 2.0, etc.) followed by a hyphen, which can be either a dash, an n-dash, or an m-dash. (Note to self: I should make section numbering optional.)

Important: the title of the page (after the prefix) cannot begin with a number, a period, or any type of dash.

## Callouts and the callout listing

Coming soon. For now, examine `tocsample.sketch` in this repository 

## Troubleshooting

### The TOC lists pages in the wrong order

Make sure the tops of each row of artboards are aligned perfectly and arranged left-to right, whether your artboards are arranged in a single horizontal row, or if each section's artboards are arranged in their own row.

# AddCurrentDateToArtboards

A Sketch plugin that updates today's date on artboards in the current Sketch page that contain a symbol instance to display the page number. 

To see how it works, try the sample.sketch file in the repository.

To get a date, an artboard needs to include a symbol instance with a text override named `"<currentDate>"`. The name of the symbol instance itself does not matter. Note that this override cannot be in a nested symbol.

## Date template
If you don't provide a date template, the date format will default to MM/DD/YYYY. You can specify other date formats by placing various date templates in the default text of the text override. Your symbol (on the Symbols page) should look like this with a template:

<img src="/readme_images/sample.png" width="650">

Here are the supported formats:

### Month formats, assuming it's January:
* [MMMM] – January
* [MMM] – Jan
* [MM]  – 01
* [M] – 1

Note that the short [MMM] dates follow AP Style Guide recommendations, where March, April, May, June, and July are not abbrevieated, and September is abbreviated as Sept.

### Date formats, assiming it's the 3rd of the month:
* [DDD] – 3rd
* [DD] – 03
* [D] – 3

### Year formats, assuming it's 2021
* [YYYY] – 2021
* [YY] – 21

## Examples assuming it's January 3rd, 2021
* [MMMM] [DDD], [YYYY] – January 3rd, 2021
* [DD] [MMM] [YYYY] – 03 Jan 2021
* [MM].[DD].[YYYY] – 01.03.2021
