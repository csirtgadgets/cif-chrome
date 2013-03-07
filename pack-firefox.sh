#!/bin/bash
##
#builds to /tmp/CIF-FFExtension.xpi
##
rm -R -f /tmp/CIF-FFExtension.xpi
cd './cif-browser-extension'
#zip -r /tmp/CIF-FFExtension.xpi ./
#cp /tmp/CIF-FFExtension.xpi ~/Desktop/
zip -r ../CIF-FFExtension.xpi ./
