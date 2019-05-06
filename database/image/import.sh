#!/bin/bash

sleep 60
date=`date +%Y%m%d`
hour= $(( `date +%H` ))

if [[ $hour != $(( ($hour / 2) * 2 )) ]]; then
  hour=$(($hour-1))
fi

if [[ $hour -lt 10 ]]; then
  hour="0${hour}"
fi

file="rib.${date}.${hour}00.bz2"
dir=`date +%Y.%m`

wget http://archive.routeviews.org/route-views.soxrs/bgpdata/$dir/RIBS/$file -O /collector/data/$file
ruby /collector/scripts/import.rb prefix load rpkilg ripe-amsix /collector/data/$file

#ruby /collector/scripts/import-rpki.rb

