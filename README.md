# Table of contents: a Sketch plugin

Note: this plugin requires Sketch 53.2 or above.

This sketch plugin creates a table of contents (TOC) for artboards on the current page. If your document has sections, it will organize the table of contents into sections. It will also page-number your artboards for you. Here is an example of what that looks like:

<img src="/readme_images/toc_image_newest.png" width="900">

You can customize the look of it however you want, as the TOC is created from symbols that you can customize the look of. Note that it does not support text wrapping of the page or section names.

## Setting up the TOC

You'll need to set up your document in a particular way in order for the plug-in to create your table of contents. The tocsample.sketch file in this repository is set up in that way. 

Note that it doesn't matter how your artboards are ordered in the layer list. The plug-in will use the left-to-right or top-to-bottom order that the artboards are arranged in, so all artboards need to be arranged in a single horizontal row or a single vertical column. (The plug-in will figure out which.) 

The plugin does not support placing artboards on top of artboards, which is a practice I don't quite understand.

For the TOC to use sections, each section must start with a section-heading artboard. Again, check out the sample sketch file to see the setup.

### The TOC group

The table of contents will live in a group on whichever artboard you wish. It doesn't have to be selected in order to update it. You do need to be on the Sketch page that contains the group, however. 

The plug-in will arrange the TOC into however many columns it needs depending on the height this group. You will be prompted for the pixel spacing between columns, which will be ignored if your TOC is a single column.

Once the TOC is is created in this group, you can resize the group, and the TOC will rearrange itself into properly spaced columns **as you resize it**. 

This group must be called `<tocGroup>` This group must contain a rectangle named `<tocGroupRect>`:

<img src="/readme_images/toc_group.png" width="200">

### The page number symbol

The page number symbol, which you will put an instance of on each artboard that you want a page number listed, must have a text override named `<pageNumber>`. It doesn't matter what the symbol itself or any of its instances is named. (In the example below it's named `pageNumber`, but you can call it whatever you like. This is so you can still organize your symbols into folders using slashes.)

<img src="/readme_images/page_number_symbol.png" width="335">

The plug-in will update the page numbers for you before creating the TOC. It starts numbering pages (starting at 1) upon the first instance of this symbol that it finds. 

So if you want to start numbering your artboards at 1 on the second artboard, put the first page number instance on the second artboard. If you want to start numbering at 2, put the first page-number instance on the previous artboard and set its opacity to 0.

Note that the hash character in the default override text (which you see above) will be replaced by the page number, so if you want your page numbers listed in the format "Page 1" you would make the default override text "Page #"

### The page title symbol

Each artboard that you want listed in the TOC must have either a page-title instance or a section-title instance on it.

The page title symbol must have a text override named `<pageTitle>`. It doesn't matter what the sy mbol itself is named, and it doesn't matter what the default override text is. 

<img src="/readme_images/page_title_symbol.png" width="380">

And of course, once you place the symbol instance on an artboard, you'll need to set its override text to the desired title of the page. (The plug-in won't make up page names for you!)

### The page-section symbol (optional)

To have sections in your TOC, you will need to have a section header artboard that starts each section, and this artboard needs to have an instance of the section-header symbol. This symbol is just like the page-title symbol, except its text override must be named `<sectionTitle>`. Again, as with every symbol this plugin uses, it doesn't matter what the symbol or symbol instance is named.

<img src="/readme_images/section_title_symbol.png" width="380">

### The TOC page-title symbol

This is the symbol whose instances will be added to the TOC for each page in your document. It needs to have a text override called `<tocPageTitle>` and a text override called `<tocPageNumber>`. Note that these overrides cannot be in nested symbols. Again, it doesn't matter what the symbol or its instances are called.
  
<img src="/readme_images/page_entry_symbol.png" width="480">

When added to the TOC, the symbol instances will be stacked upon each other with no space in between, so build any desired padding into the symbol itself.

You'll also need to set design this symbol so that it resizes its content, with the title and page number pinned appropriately. For best results, use this pinning:

<img src="/readme_images/page_entry_pinning_1.png" width="380"> 

<img src="/readme_images/page_entry_pinning_2.png" width="380">

The symbol instances that the plug-in adds to the TOC will always remain same height as the corresponding symbol.

### The TOC section-title symbol (optional)

This is the symbol whose instances will be added to the TOC for each section in your document. See "The page-section symbol" above for what it takes to make TOC sections. 

This symbol needs to have a text override called `<tocSectionTitle>` and a text override called `<tocPageNumber>`, but if you don't want your TOC sections to have a page number, you can leave the latter text override out, out or set its opacity to 0.
  
<img src="/readme_images/section_entry_symbol.png" width="390">

Use the same pinning as shown in the section above.

### Troubleshooting

If you have any issues, check out the sample.sketch file in this repository.
