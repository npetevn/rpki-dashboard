$(document).ready(function() {
  $('#roasTable').DataTable({
    ajax: {
      url: '/api/roas',
      dataSrc: ''
    },
    columns: [
      { data: 'asn' },
      { data: 'prefix' },
      { data: 'maxlength' },
      { data: 'ta' }
    ]
  });
});
