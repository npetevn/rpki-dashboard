function drawDoughnutChart(elementId, labels, data) {
  var originAsesChart = new Chart($(elementId), {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#5d6afd'],
        hoverBackgroundColor: ['#2e59d9', '#17a673', '#2c9faf', '#f2cf3a'],
        hoverBorderColor: "rgba(234, 236, 244, 1)"
      }]
    },
    options: {
      maintainAspectRatio: false,
      tooltips: {
        backgroundColor: "rgb(255,255,255)",
        bodyFontColor: "#858796",
        borderColor: '#dddfeb',
        borderWidth: 1,
        xPadding: 15,
        yPadding: 15,
        displayColors: false,
        caretPadding: 10
      },
      legend: {
        display: false
      },
      cutoutPercentage: 80
    }
  });
}

$(document).ready(function() {
  Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  Chart.defaults.global.defaultFontColor = '#858796';

  $.getJSON('/api/stats', function(stats) {
    console.log('got stats', stats);
    drawDoughnutChart("#prefixChart",
      ['RPKI Valid prefixes', 'RPKI unknown prefixes', 'RPKI protected prefixes from wrong AS', 'RPKI protected prefixes with wrong prefix length'],
      [ stats.validPrefixCount, stats.unknownPrefixCount, stats.asInvalidPrefixCount, stats.lengthInvalidPrefixCount]
    );

    drawDoughnutChart("#originAsesChart",
      ['ASes originating valid prefixes', 'ASes originating unknown prefixes', 'ASes originating invalid maxlength prefixes', 'ASes originating hijacked prefixes'],
      [ stats.originValidAsCount, stats.originUnknownAsCount, stats.originLengthInvalidAsCount, stats. originAsInvalidAsCount]
    );

    drawDoughnutChart("#transitAsesChart",
      ['ASes transiting valid prefixes', 'ASes transiting unknown prefixes', 'ASes transiting invalid maxlength prefixes', 'ASes transiting hijacked prefixes'],
      [ stats.transitValidAsCount, stats.transitUnknownAsCount, stats.transitLengthInvalidAsCount, stats. transitAsInvalidAsCount]
    );

  });
});
