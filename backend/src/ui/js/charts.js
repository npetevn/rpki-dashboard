let drawDoughnutChart = (elementId, labels, data) => {
  let length = labels.length;
  let bgColors = ['#5c80bc', '#8f7fc4', '#c07cbf', '#e77aac', '#ff8090', '#ff9171', '#ffa955', '#e8c547'].slice(0, length);
  let hoverColors = ['#57467b', '#8d4c86', '#c05382', '#e96271', '#ff8057', '#ffa73b', '#f3d32a', '#cafe48'].slice(0, length);
  let originAsesChart = new Chart($(elementId), {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: bgColors,
        hoverBackgroundColor: hoverColors,
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
        display: true,
        position: 'left'
      },
      cutoutPercentage: 80,
      //legendCallback: function(chart) {
      //  var text = [];
      //  text.push('<ul class="' + chart.id + '-legend">');
      //  var data = chart.data;
      //  var datasets = data.datasets;
      //  var labels = data.labels;
      //  if (datasets.length) {
      //     for (var i = 0; i < datasets[0].data.length; ++i) {
      //        text.push('<li><span style="background-color:' + datasets[0].backgroundColor[i] + '"></span>');
      //        if (labels[i]) {
      //           // calculate percentage
      //           var total = datasets[0].data.reduce(function(previousValue, currentValue, currentIndex, array) {
      //              return previousValue + currentValue;
      //           });
      //           var currentValue = datasets[0].data[i];
      //           var percentage = Math.floor(((currentValue / total) * 100) + 0.5);

      //           text.push(labels[i] + ' (' + percentage + '%)');
      //        }
      //        text.push('</li>');
      //     }
      //  }
      //  text.push('</ul>');
      //  return text.join('');
      //}
    }
  });
};

let chartRoas = (roas) => {
  let tals = {};
  _.each(_.uniq(_.map(roas, roa => roa.ta)), ta => {
    tals[ta] = {
      ta: ta,
      prefixes: 0,
      ases: 0
    };
  });
  _.each(roas, (roa) => {
    tals[roa.ta].ases += 1;
    tals[roa.ta].prefixes += Number(roa.count);
  });
  tals = _.sortBy(_.values(tals), tal => tal.prefixes);

  let roasByTal = new Chart($("#roasByTal"), {
    type: 'bar',
    data: {
      labels: _.map(tals, tal => tal.ta),
      datasets: [
        {
          label: 'Prefixes',
          backgroundColor: '#5c80bc',
          data: _.map(tals, tal => tal.prefixes)
        },
        {
          label: 'ASes',
          backgroundColor: '#e8c547',
          data: _.map(tals, tal => tal.ases)
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      barValueSpacing: 20,
      scales: {
        yAxes: [{
          ticks: {
            min: 0,
          }
        }]
      }
    }
  });
};

let chartNeighbors = (neighbors) => {
  let neighStats = _.map(neighbors, (neighbor) => {
      let originating = neighbor.origin_valid + neighbor.origin_unknown + neighbor.origin_length_invalid + neighbor.origin_as_invalid;
      let origin_valid = neighbor.origin_valid;
      let origin_invalid = neighbor.origin_length_invalid + neighbor.origin_as_invalid;
      return {
        originating: originating,
        origin_valid: origin_valid,
        origin_invalid: origin_invalid,
        asn: neighbor.asn
      };
  });

  let maxOriginating = _.max(_.map(neighStats, (n) => n.originating));
  let maxR = 100;

  let neighborChart = new Chart($("#originatingChart"), {
    type: 'bubble',
    data: {
      datasets: _.map(neighStats, (neighbor) => ({
        label: `AS${neighbor.asn}: ${neighbor.originating}`,
        data: [{
            x: neighbor.origin_valid,
            y: neighbor.origin_invalid,
            r: (neighbor.originating / maxOriginating) * maxR
        }],
        backgroundColor: '#e8c547'
      }))
      // datasets: [{
      //   label: 'Direct Neighbors',
      //   data: _.map(neighStats, (neighbor) => {
      //     return {
      //       x: neighbor.origin_valid,
      //       y: neighbor.origin_invalid,
      //       r: (neighbor.originating / maxOriginating) * maxR
      //     }
      //   }),
      //   backgroundColor: '#e8c547'
      // }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        display: false
      }
    }
  });
};

$(document).ready(function() {
  let vantagePoint = $("#vantagepoint").val();

  Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  Chart.defaults.global.defaultFontColor = '#858796';

  $.getJSON(`/api/stats/${vantagePoint}`, function(stats) {
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

  $.getJSON(`/api/as-resources/${vantagePoint}`, function(res) {
    let roas = res.roas;
    let neighbors = res.neighbors;
    console.log('got roas', roas);
    console.log('got neighbors', neighbors);

    chartRoas(roas);
    chartNeighbors(neighbors);
  });
});
