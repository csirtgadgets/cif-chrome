#!/bin/bash
##
#builds to /tmp/CIF-FFExtension.xpi
##
rm -R -f /tmp/CIF-FFExtension.xpi
cd './CIF Chrome Extension'
zip -r /tmp/CIF-FFExtension.xpi ./
#cp /tmp/CIF-FFExtension.xpi ~/Desktop/