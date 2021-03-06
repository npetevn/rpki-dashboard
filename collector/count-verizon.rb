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
			min_distance: 1000
    }
  end
end

def incr_counter(stats, asn, type, status)
	stats[asn]["#{type}_#{status}_v4".to_sym] += 1
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

def load(db, gw, file)
  conn = PG::Connection.open(dbname: db, user: 'dev')

  conn.exec "BEGIN TRANSACTION;"
  puts "  Truncating DB for prefixes from #{gw}  "
  conn.exec "DELETE FROM asstats WHERE vantage_point='#{gw}'"

  puts "  Loading for #{gw} #{file} ... "
	stats = {}

  num = 0
  IO.popen("cat #{file}") do |io|
    while str = io.gets
      arr = str.split('|')
      p = arr[0].split('=')[1]
      (prefix, prefixlen) = p.split('/')
      nexthop = ''

      aspath = arr[1].split('=')[1].split
      originas = aspath[aspath.length-1]
      nexthopas = aspath[0]

      status = 'unknown'
      roas = conn.exec "SELECT * FROM roas WHERE prefix >>= inet '#{prefix}/#{prefixlen}';"
      if roas.any? { |roa| roa['asn'] == originas && prefixlen <= roa['maxlength'] }
        status = 'valid'
      elsif roas.any? { |roa| roa['asn'] == originas && prefixlen > roa['maxlength'] }
        status = 'length_invalid'
      elsif roas.ntuples > 0
        status = 'as_invalid'
      end

      puts "[i] prefix #{prefix}/#{prefixlen} has status #{status.upcase}"
      if aspath[-1] != originas
        puts "  [-] expected #{originas} to be at end of #{aspath}"
      end

      #originidx=0
      #aspath.reverse.each_with_index do |asn, idx|
      #  if asn != originas
      #    break
      #  else
      #    originidx = idx
      #  end
      #end
      #transitases = aspath[0, aspath.length - originidx - 1]
      transitases = aspath.select { |asn| asn != originas }

      if transitases.any? { |asn| asn == originas }
        puts "  [-] got #{originas} loop in #{aspath}. Transits are #{transitases}"
      end

			[originas].concat(transitases).each { |asn| initas(stats, asn) }
			incr_counter(stats, originas, 'origin', status)
			set_distance(stats, originas, transitases.length)
			transitases.each_with_index do |asn, idx|
				incr_counter(stats, asn, 'transit', status)
				set_distance(stats, asn, idx+1)
			end

      num += 1
    end
  end

  puts "  Aggregated #{num} entries, now pushing to DB"
	stats.each do |asn, stat|
		conn.exec sql_for_as(stat, gw)
	end
  conn.exec "COMMIT;"
  puts "  Done"
end

load ARGV[0], ARGV[1], ARGV[2]

