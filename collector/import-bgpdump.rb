require 'pg'

module RouteViews
  DIR = 'mrt'

  class << self
    def load(type, db, gw, file)
      conn = PG::Connection.open(dbname: db, user: 'dev')

      print "  Truncating DB for prefixes from #{gw}  "
      conn.exec "DELETE FROM prefixes WHERE gw='#{gw}'"

      print "  Loading for #{gw} #{file} ... "

      num = 0
      IO.popen("bgpdump2 #{file}") do |io|
        while str = io.gets
          bgp = Bgp.new(gw, type, str)
          bgp.sql.each do |s|
            begin
              conn.exec s
              num += 1
            rescue
              $stderr.puts "SQL failed: #{s}"
            end
          end
        end
      end

      puts "done #{num} entries"
    end
  end

  class Bgp
    def initialize(gw, type, str)
      @type = type
      @str = str
      @columns = {gw: %('#{gw}')}
      @nlris = []
      @withdrawals = []
    end

    def sql
      parse

      case @type
      when 'update'
        sql_for_updates
      when 'rib'
        sql_for_ribs
      when 'prefix'
        sql_for_prefix
      end
    end

    private

    def parse
      arr = @str.split
      (prefix, @columns[:prefixlen]) = arr[0].split('/')
      @columns[:prefix] = %('#{prefix}')
      @columns[:nexthop] = %('#{arr[1]}')
      @columns[:originas] = arr[3]
      @columns[:nexthopas] = arr[5]
      @columns[:aspath] = %('#{arr[5, arr.length].join(" ")}')
    end

    def sql_for_updates
        @nlris.map {|prefix|
          "INSERT INTO updates (#{@columns.keys.join(', ')}, prefix) \
          values (#{@columns.values.join(', ')}, '#{prefix}'::CIDR)"
        } + @withdrawals.map {|prefix|
          "INSERT INTO updates (ix, time, neighbor_addr, neighbor_as, local_addr, local_as, prefix, withdraw) \
          values (#{@columns[:ix]}, #{@columns[:time]}, #{@columns[:neighbor_addr]}, #{@columns[:neighbor_as]}, \
          #{@columns[:local_addr]}, #{@columns[:local_as]}, '#{prefix}'::CIDR, TRUE)"
        }
    end

    def sql_for_ribs
      ["INSERT INTO rib (#{@columns.keys.join(', ')}) values (#{@columns.values.join(', ')})"]
    end

    def sql_for_prefix
      ["INSERT INTO prefixes (#{@columns.keys.join(', ')}) values (#{@columns.values.join(', ')})"]
    end
  end
end

usage = <<EOS
Usage: #$0 command
Commands:
  update download YYYYmmdd.HHMM     Download MRT UPDATE archive
  update load DB_NAME               INSERT routes into database
  rib download YYYYmmdd.HHMM        Download MRT UPDATE archive
  rib load DB_NAME                  INSERT routes into database
  prefix load DB_NAME GW FILE
  migrate DB_NAME                   Migrate database
EOS

if !%w(update rib prefix).product(%w(download load)).include?(ARGV[0..1]) and ARGV[0] != 'migrate'
  abort usage
end

case ARGV[1]
when 'load'
  RouteViews.load ARGV[0], ARGV[2], ARGV[3], ARGV[4]
end
