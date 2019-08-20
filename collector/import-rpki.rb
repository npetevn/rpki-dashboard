require 'pg'
require 'net/http'
require 'json'

uri = URI('http://rpkival:8080/api/export.json')
req = Net::HTTP::Get.new(uri)
req['Accept'] = 'text/json'
conn = PG::Connection.open(dbname: 'rpkilg', user: 'dev')

res = Net::HTTP.start(uri.hostname, uri.port) {|http|
  http.request(req)
}

parsed = JSON.parse(res.body)

conn.exec "BEGIN TRANSACTION;"
conn.exec "DELETE FROM roas;"
conn.exec "DELETE FROM roas_expanded;"

parsed['roas'].each do |roa|
  (prefix, prefixlen) = roa['prefix'].split('/')
  prefixlen = prefixlen.to_i
  maxlength = roa['maxLength'].to_i
  family = prefix.include?(':') ? 'v6' : 'v4'
  asn = roa['asn'].split('AS')[1].to_i
  columns = {
    'asn' => asn,
    'family' => "'#{family}'",
    'prefix' => "'#{prefix}/#{prefixlen}'",
    'prefixlen' => prefixlen,
    'maxlength' => maxlength,
    'ta'        => "'#{roa['ta']}'"
  }
  conn.exec "INSERT INTO roas (#{columns.keys.join(', ')}) values (#{columns.values.join(', ')})"

  (prefixlen..maxlength).each do |plen|
    columns = {
      'asn' => asn,
      'family' => "'#{family}'",
      'prefix' => "'#{prefix}/#{plen}'",
      'ta'        => "'#{roa['ta']}'"
    }
    conn.exec "INSERT INTO roas_expanded (#{columns.keys.join(', ')}) values (#{columns.values.join(', ')})"
  end
end
conn.exec "COMMIT;"

