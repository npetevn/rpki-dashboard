require 'pg'
require 'net/http'
require 'json'

uri = URI('http://localhost:8080/api/export.json')
req = Net::HTTP::Get.new(uri)
req['Accept'] = 'text/json'
conn = PG::Connection.open(dbname: 'rpkilg', user: 'dev')

res = Net::HTTP.start(uri.hostname, uri.port) {|http|
  http.request(req)
}

parsed = JSON.parse(res.body)

parsed['roas'].each do |roa|
  (prefix, prefixlen) = roa['prefix'].split('/')
  columns = {
    'asn' => roa['asn'].split('AS')[1].to_i,
    'prefix' => prefix,
    'prefixlen' => prefixlen.to_i,
    'maxlength' => roa['maxLength'],
    'ta'        => roa['ta']
  }
  conn.exec "INSERT INTO prefixes (#{columns.keys.join(', ')}) values (#{columns.values.join(', ')})"
end
