require 'pg'
require 'json'
require 'net/http'

def sql_for_prefix(stat, gw)
  stat['gw'] = %('#{gw}')
  "INSERT INTO prefixes (#{stat.keys.join(', ')}) values (#{stat.values.join(', ')})"
end

def load(db, gw, file)
  conn = PG::Connection.open(dbname: db, user: 'dev')

  conn.exec "BEGIN TRANSACTION;"
  puts "  Truncating DB for prefixes from #{gw}  "
  conn.exec "DELETE FROM prefixes WHERE gw='#{gw}'"

  puts "  Loading for #{gw} #{file} ... "

  num = 0
  IO.popen("bgpdump -m #{file}") do |io|
    while str = io.gets
      arr = str.split('|')
      prefix = {}
      prefix[:prefix] = "'#{arr[5]}'"
      prefix[:prefixlen] = arr[5].split('/')[1]
      prefix[:family] = "'#{arr[5].include?(':') ? 'v6' : 'v4'}'"
      prefix[:nexthop] = "'#{arr[8]}'"
      aspath = arr[6].split
      # clean up from assets at end of aspath
      aspath = aspath.select { |as| !as.include?('{') }
      # skip internal resources
      if aspath.empty?
        next
      end
      prefix[:aspath] = "'#{aspath.join(' ')}'"
      prefix[:originas] = aspath[-1]
      prefix[:nexthopas] = aspath[0]

      # (prefix, prefixlen) = arr[5].split('/')
      # family = prefix.include?(':') ? 'v6' : 'v4'
      # nexthop = arr[8]
      # aspath = arr[6].split
      # originas = aspath[-1]
      # nexthopas = aspath[0]

      conn.exec sql_for_prefix(prefix, gw)

      if (num % 100 == 0)
        puts "[i] imported #{num} prefixes"
      end
      num += 1
    end
  end

  conn.exec "COMMIT;"
  puts "  Done"
end

load ARGV[0], ARGV[1], ARGV[2]

