cif-client-chrome
=================
cif chrome plugin and firefox plugin


How to Install
=================
#### Chrome
  * Using Chrome, open the *CIF Chrome Extension.crx* to install it.
  * Click on the CIF icon to enter your server settings.


#### Firefox
  * Using Firefox, download the *CIF-FFExtension.xpi* and drag it onto the Firefox window to install it.
  * Click on the CIF icon to enter your server settings.


Change Log
=================
0.98
  * update to watch for new groups in results that don't appear in group_map

0.97
  * bug fixes for firefox version and right-click query in chrome version

0.96
  * backend changes to make compatible with firefox

0.90
  * bug fix for related events
  
0.89
  * added alternative id and alternative id restriction to data submission page
  * added version check

0.88
  * popup inherits logging settings from options page
  * description defaulted to unknown on data adding page
  * most protocols on data adding page hidden by default

0.87 
  * added version number display in popup
  * UUID/MD5/SHA1 detection on data input page
  
  
How to Build
=================
#### Firefox
  * Create a zip file of the contents in "CIF Chrome Extension". (don't include the "CIF Chrome Extension" directory itself)
  * Change the extension of the zip file to .xpi

#### Chrome
  * In Chrome, go to *Tools->Extensions* and click on *Load unpacked extension...*. Open the "CIF Chrome Extension" directory.
  * Under *Tools->Extensions* and click on *Pack extension...* and point it to the "CIF Chrome Extension" directory.