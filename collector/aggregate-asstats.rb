require 'pg'
require 'json'
require 'net/http'

def initas(stats, asn)
  if !stats.key? asn
    stats[asn] = {
      asn: asn,
      transit_valid_v4: 0,
      transit_unknown_v4: 0,
      transit_as_invalid_v4: 0,
      transit_length_invalid_v4: 0,
      origin_valid_v4: 0,
      origin_unknown_v4: 0,
      origin_as_invalid_v4: 0,
      origin_length_invalid_v4: 0,
      transit_valid_v6: 0,
      transit_unknown_v6: 0,
      transit_as_invalid_v6: 0,
      transit_length_invalid_v6: 0,
      origin_valid_v6: 0,
      origin_unknown_v6: 0,
      origin_as_invalid_v6: 0,
      origin_length_invalid_v6: 0,
			min_distance: 1000
    }
  end
end

def incr_counter(stats, asn, type, status, family)
	stats[asn]["#{type}_#{status}_#{family}".to_sym] += 1
end

def set_distance(stats, asn, dist)
	if stats[asn][:min_distance] > dist
		stats[asn][:min_distance] = dist
	end
end

def sql_for_as(stat, gw)
  stat['vantage_point'] = %('#{gw}')
  "INSERT INTO asstats (#{stat.keys.join(', ')}) values (#{stat.values.join(', ')})"
end

def load(db, gw)
  conn = PG::Connection.open(dbname: db, user: 'dev')

  puts "  Flushing temporary table"
  conn.exec "DELETE FROM prefix_status;"

  #conn.exec "BEGIN TRANSACTION;"
  puts "  Truncating DB for asstats from #{gw}  "
  conn.exec "DELETE FROM asstats WHERE vantage_point='#{gw}'"

  puts "  Loading for #{gw} ... "
	stats = {}

  num = 0

  prefixes = {}
  # Prefixes with valid ROAs - 134425
  prefixes['valid'] = conn.exec "
    SELECT DISTINCT
    prefixes.family, prefixes.prefix, prefixes.originas, prefixes.aspath
    FROM prefixes
    INNER JOIN roas
    ON prefixes.prefix <<= roas.prefix AND prefixes.originas = roas.asn AND prefixes.prefixlen <= roas.maxlength
    WHERE prefixes.gw = '#{gw}';
  "
  conn.exec "INSERT INTO prefix_status (
    SELECT
    prefixes.family, prefixes.prefix
    FROM prefixes
    INNER JOIN roas
    ON prefixes.prefix <<= roas.prefix AND prefixes.originas = roas.asn AND prefixes.prefixlen <= roas.maxlength
    WHERE prefixes.gw = '#{gw}'
  );"

  # Prefixes with announced from invalid ASN - 603
  prefixes['as_invalid'] = conn.exec "
    SELECT DISTINCT
    prefixes.family, prefixes.prefix, prefixes.originas, prefixes.aspath
    FROM prefixes
    INNER JOIN roas_expanded
    ON prefixes.prefix = roas_expanded.prefix AND prefixes.originas != roas_expanded.asn
    LEFT OUTER JOIN prefix_status
    ON prefixes.prefix = prefix_status.prefix
    WHERE prefix_status.prefix IS NULL AND
          prefixes.gw = '#{gw}';
  "
  conn.exec "INSERT INTO prefix_status (
    SELECT DISTINCT
    prefixes.family, prefixes.prefix
    FROM prefixes
    INNER JOIN roas_expanded
    ON prefixes.prefix = roas_expanded.prefix AND prefixes.originas != roas_expanded.asn
    WHERE prefixes.gw = '#{gw}'
  );"

  # Prefixes with invalid prefix length - 2791
  prefixes['length_invalid'] = conn.exec "
    SELECT DISTINCT
    prefixes.family, prefixes.prefix, prefixes.originas, prefixes.aspath
    FROM prefixes
    INNER JOIN roas
    ON prefixes.prefix <<= roas.prefix AND prefixes.originas = roas.asn AND prefixes.prefixlen > roas.maxlength
    LEFT OUTER JOIN prefix_status
    ON prefixes.prefix = prefix_status.prefix
    WHERE prefix_status.prefix IS NULL AND
          prefixes.gw = '#{gw}';
  "
  conn.exec "INSERT INTO prefix_status (
    SELECT
    prefixes.family, prefixes.prefix
    FROM prefixes
    INNER JOIN roas
    ON prefixes.prefix <<= roas.prefix AND prefixes.originas = roas.asn AND prefixes.prefixlen > roas.maxlength
    WHERE prefixes.gw = '#{gw}'
  );"

  # Prefixes with RPKI unknown status
  prefixes['unknown'] = conn.exec "
    SELECT
    prefixes.family, prefixes.prefix, prefixes.originas, prefixes.aspath
    FROM prefixes
    LEFT OUTER JOIN prefix_status
    ON prefixes.prefix = prefix_status.prefix
    WHERE prefix_status.prefix IS NULL AND
          prefixes.gw = '#{gw}';
  "
  prefixes.each do |status, plist|
    plist.each do |pobj|
      (prefix, prefixlen) = pobj['prefix'].split('/')
      family = pobj['family']
      aspath = pobj['aspath'].split
      originas = aspath[-1]
      nexthopas = aspath[0]

      puts "[i] prefix #{prefix}/#{prefixlen} has status #{status.upcase}"

      transitases = aspath.select { |asn| asn != originas }

      if transitases.any? { |asn| asn == originas }
        puts "  [-] got #{originas} loop in #{aspath}. Transits are #{transitases}"
      end

			[originas].concat(transitases).each { |asn| initas(stats, asn) }
			incr_counter(stats, originas, 'origin', status, family)
			set_distance(stats, originas, transitases.length)
			transitases.each_with_index do |asn, idx|
				incr_counter(stats, asn, 'transit', status, family)
				set_distance(stats, asn, idx+1)
			end

      num += 1
    end
  end

  puts "  Aggregated #{num} entries, now pushing to DB"
	stats.each do |asn, stat|
		conn.exec sql_for_as(stat, gw)
	end
#  conn.exec "COMMIT;"
  puts "  Done"
end

load ARGV[0], ARGV[1]

