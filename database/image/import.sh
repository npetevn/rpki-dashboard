#!/bin/bash

ruby /collector/scripts/import-rpki.rb

cd /collector/mrt-exports
bunzip2 -z rpki-npn-full.mrt
ruby /collector/scripts/import-prefixes.rb 'rpkilg' 'border-lozenets' /collector/mrt-exports/rpki-npn-full.mrt.bz1

ruby /collector/scripts/aggregate-asstats.rb 'rpkilg' 'border-lozenes'
