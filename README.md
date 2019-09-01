# Document Organizer: a Sketch plugin

Note: this plugin requires Sketch 53.2 or above.

This plugin updates page numbers, section numbers, callout numbers, and a table of contents in your document. This readme describes how to set up your document to use this plugin.

# Table of contents and page numbering

The plugin creates a table of contents (TOC) for artboards on the current page organized into sections. It will page-number the artboards for you, as well as add legal-style numbering (1.0, 1.1, 2.0) to the titles of the artboards and in to the TOC. Here is an example of what that can look like:

<img src="/readme_images/toc_image_newest.png" width="900">

You can customize the look of it however you want, because the TOC is created from symbols that you can customize the look of. Example: when the plugin creates the TOC, the TOC's symbol instances are stacked with no space between them, but you can adjusting the spacing by adding the desired padding to the symbols.  

The TOC will arrange itself into multiple columns (shown above) when there are too many entries to fit in a single column. You can specify the pixel spacing between these columns. (See Settings below.)

Note that the table of contents does not yet suppport text wrapping for the TOC entries.

## Setting up the TOC

You'll need to set up your document in a particular way in order for the plug-in to create your table of contents. The file `tocsample.sketch` in this repository is set up this way.

This plugin supports only documents that are organized into sections. It assumes that each section will have an artboard that serves as the section-heading page. To designate an artboard as a section-heading page, place an instance of the section-title symbol on it, which displays the title of the section on the artboard. 

Any artboard that's not a section-heading page needs to have an instance of the page-title symbol on it; otherwise, it won't show up in the table of contents.

It doesn't matter how your artboards are ordered in the layer list. The plug-in will use the left-to-right order that the artboards are arranged in. You can either put the artboards in a single horizontal row, or you can put each section's artboards into their own horizontal row and stack the sections vertically (which is helpful when creating a large document). The the artboards in `tocsample.sketch` are arranged in a stack of section rows.


Important: In either case, make sure that all artboards in a row have their tops aligned.


### The TOC group

The table of contents will live in a group on whichever artboard you wish. It doesn't have to be selected in order to update it. You do need to be on the Sketch page that contains the group, however. 

The plug-in will arrange the TOC into however many columns it needs depending on the height this group. You will be prompted for the pixel spacing between columns, which will be ignored if your TOC is a single column.

Once the TOC is is created in this group, you can resize the group, and the TOC will rearrange itself into properly spaced columns **as you resize it**. 

This group must be called `<tocGroup>` This group must contain a rectangle named `<tocGroupRect>`:

<img src="/readme_images/toc_group.png" width="200">


### The page title symbol

Each artboard that you want listed in the TOC must have either a page-title symbol instance or a section-title symbol instance on it.

The page title symbol must have a text override named `<pageTitle>`. It doesn't matter what the sy mbol itself is named, and it doesn't matter what the default override text is. 

<img src="/readme_images/page_title_symbol.png" width="380">

And of course, once you place the symbol instance on an artboard, you'll need to set its override text to the desired title of the page. (The plug-in won't make up page names for you!)

### The section-title symbol (optional)

To have sections in your TOC, you will need to have a section-header artboard that starts each section, and this artboard needs to have an instance of the section-header symbol. This symbol is just like the page-title symbol, except its text override must be named `<sectionTitle>`. It doesn't matter what the symbol or symbol instance is named.

<img src="/readme_images/section_title_symbol.png" width="380">

### The TOC-page-listing symbol

This is the symbol whose instances will be added to the TOC for each page in your document. It needs to have a text override called `<tocPageTitle>` and a text override called `<tocPageNumber>`. Note that these overrides cannot be in nested symbols. Again, it doesn't matter what the symbol or its instances are called.
  
<img src="/readme_images/page_entry_symbol.png" width="480">

When added to the TOC, the symbol instances will be stacked upon each other with no space in between, so build any desired padding into the symbol itself.

You'll also need to set design this symbol so that it resizes its content, with the title and page number pinned appropriately. For best results, use this pinning:

<img src="/readme_images/page_entry_pinning_1.png" width="380"> 

<img src="/readme_images/page_entry_pinning_2.png" width="380">

The symbol instances that the plug-in adds to the TOC will always remain same height as the corresponding symbol.

### The TOC-section-listing symbol (optional)

This is the symbol whose instances will be added to the TOC for each section in your document. See "The page-section symbol" above for what it takes to make TOC sections. 

This symbol needs to have a text override called `<tocSectionTitle>` and a text override called `<tocPageNumber>`, but if you don't want your TOC sections to have a page number, you can leave the latter text override out, out or set its opacity to 0.
  
<img src="/readme_images/section_entry_symbol.png" width="390">

Use the same pinning as shown in the section above.






### The page number symbol

The page number symbol, which you will put an instance of on each artboard that you want a page number listed, must have a text override named `<pageNumber>`. It doesn't matter what the symbol itself is named or what any of its instances are named. The name of the text override is all that matters. E.g., you can still organize your symbols into folders using slashes in the symbol names.

<img src="/readme_images/page_number_symbol.png" width="335">

The plug-in will update the page numbers for you before creating the TOC. It starts numbering pages (starting at 1) upon the first instance of this symbol that it finds. 

So if you want to start numbering your artboards at 1 on the second artboard, put the first page number instance on the second artboard. If you want to start numbering at 2, put the first page-number instance on the previous artboard and set its opacity to 0.

Note that the hash character in the default override text (which you see above) will be replaced by the page number, so if you want your page numbers listed in the format "Page 1" you would make the default override text "Page #"


### Troubleshooting

If you have any issues, check out the sample.sketch file in this repository.
