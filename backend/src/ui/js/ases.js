$(document).ready(function() {
  let vantagePoint = $("#vantagepoint").val();

  $('#asesTable').DataTable({
    ajax: {
      url: `/api/ases/${vantagePoint}`,
      dataSrc: ''
    },
    columns: [
      { data: 'asn' },
      { data: 'total_originated' },
      { data: 'origin_valid' },
      { data: 'origin_invalid' },
      { data: 'total_transited' },
      { data: 'transit_valid' },
      { data: 'transit_invalid' },
      { data: 'min_distance' }
    ],
    order: [[7, 'asc']]
  });
});
