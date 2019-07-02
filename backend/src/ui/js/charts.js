//let bgPalette = ['#5c80bc', '#8f7fc4', '#c07cbf', '#e77aac', '#ff8090', '#ff9171', '#ffa955', '#e8c547'];
let bgPalette = ['#6610f2', '#e83e8c', '#fd7e14', '#f6c23e', '#20c9a6'];
let hoverPalette = ['#795da8', '#b47492', '#ad8667', '#b8a67a', '#52988a'];

let drawDoughnutChart = (elementId, labels, data) => {
  let length = labels.length;
  let bgColors = bgPalette.slice(0, length);
  let hoverColors = hoverPalette.slice(0, length);
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
          backgroundColor: bgPalette[0],
          hoverBackgroundColor: hoverPalette[0],
          data: _.map(tals, tal => tal.prefixes)
        },
        {
          label: 'ASes',
          backgroundColor: bgPalette[1],
          hoverBackgroundColor: hoverPalette[1],
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

let chartOriginNeighbors = (neighbors) => {
  let neighStats = _.map(_.filter(neighbors, (n) => n.min_distance <= 0), (neighbor) => {
      let originating = neighbor.origin_valid + neighbor.origin_unknown + neighbor.origin_length_invalid + neighbor.origin_as_invalid;
      let origin_valid = neighbor.origin_valid;
      let origin_invalid = neighbor.origin_length_invalid + neighbor.origin_as_invalid;
      return {
        originating: originating,
        origin_valid: origin_valid,
        origin_invalid: origin_invalid,
        asn: neighbor.asn,
        min_distance: neighbor.min_distance
      };
  });

  let maxOriginating = _.max(_.map(neighStats, (n) => n.originating));
  let maxR = 80;

  let neighborChart = new Chart($("#originatingChart"), {
    type: 'bubble',
    data: {
      datasets: _.map(neighStats, (neighbor) => ({
        label: `AS${neighbor.asn} originates ${neighbor.origin_valid} valid and ${neighbor.origin_invalid} invalid of ${neighbor.originating} prefixes`,
        data: [{
            x: (neighbor.origin_valid / neighbor.originating) * 100,
            y: (neighbor.origin_invalid / neighbor.originating) * 100,
            r: (neighbor.originating / maxOriginating) * maxR
        }],
        backgroundColor: bgPalette[neighbor.min_distance],
        hoverBackgroundColor: hoverPalette[neighbor.min_distance],
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
      },
      tooltips: {
        enabled: true,
        callbacks: {
          label: function(tooltipItems, data) {
            return data.datasets[tooltipItems.datasetIndex].label;
          }
        }
      },
      scales: {
        xAxes: [{
          scaleLabel: {
            display: true,
            padding: 10,
            labelString: 'RPKI valid prefixes as % of totally originated'
          }
        }],
        yAxes: [{
          scaleLabel: {
            display: true,
            padding: 60,
            labelString: 'RPKI invalid prefixes as % of totally originated'
          },
          ticks: {
            min: 0,
            max: 15
          }
        }]
      }
    }
  });
};

let chartTransitNeighbors = (neighbors) => {
  let neighStats = _.map(neighbors, (neighbor) => {
      let transiting = neighbor.transit_valid + neighbor.transit_unknown + neighbor.transit_length_invalid + neighbor.transit_as_invalid;
      let transit_valid = neighbor.transit_valid;
      let transit_invalid = neighbor.transit_length_invalid + neighbor.transit_as_invalid;
      return {
        transiting: transiting,
        transit_valid: transit_valid,
        transit_invalid: transit_invalid,
        asn: neighbor.asn,
        min_distance: neighbor.min_distance
      };
  });

  let maxTransiting = _.max(_.map(neighStats, (n) => n.transiting));
  let maxR = 80;
  let datasets = _.map(neighStats, (neighbor) => ({
    label: `AS${neighbor.asn} (${neighbor.min_distance} hops away) transits ${neighbor.transit_valid} valid and ${neighbor.transit_invalid} invalid of ${neighbor.transiting} prefixes`,
    data: [{
      x: (neighbor.transit_valid / neighbor.transiting) * 100,
      y: (neighbor.transit_invalid / neighbor.transiting) * 100,
      r: (neighbor.transiting / maxTransiting) * maxR
    }],
    backgroundColor: bgPalette[bgPalette.length - 1 - neighbor.min_distance],
    hoverBackgroundColor: hoverPalette[hoverPalette.length - 1 - neighbor.min_distance],
  }));
  console.log('transiting', datasets);

  let neighborChart = new Chart($("#transitingChart"), {
    type: 'bubble',
    data: {
      datasets: datasets
      // datasets: [{
      //   label: 'Direct Neighbors',
      //   data: _.map(neighStats, (neighbor) => {
      //     return {
      //       x: neighbor.transit_valid,
      //       y: neighbor.transit_invalid,
      //       r: (neighbor.transiting / maxOriginating) * maxR
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
      },
      tooltips: {
        enabled: true,
        callbacks: {
          label: function(tooltipItems, data) {
            return data.datasets[tooltipItems.datasetIndex].label;
          }
        }
      },
      scales: {
        xAxes: [{
          scaleLabel: {
            display: true,
            padding: 10,
            labelString: 'RPKI valid prefixes as % of totally transitted'
          }
        }],
        yAxes: [{
          scaleLabel: {
            display: true,
            padding: 60,
            labelString: 'RPKI invalid prefixes as % of totally transitted'
          },
          ticks: {
            min: 0,
            max: 15
          }
        }]
      }
    }
  });
};

$(document).ready(function() {
  let vantagePoint = $("#vantagepoint").val();

  Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  Chart.defaults.global.defaultFontColor = '#858796';

  $.getJSON(`/api/stats/${vantagePoint}`, function(stats) {
    $("#total_prefixes").html(stats.totalPrefixCount);
    $("#total_origin_asns").html(stats.originAsCount);
    $("#total_transit_asns").html(stats.transitAsCount);

    $("#total_valid").html(`(${stats.validPrefixCount})`);
    let totalValidPercent = (Number(stats.validPrefixCount) / Number(stats.totalPrefixCount)) * 100;
    $("#total_valid_percent").html(totalValidPercent.toFixed(2) + '%');
    $("#origin_valid_asns").html(`(${stats.originValidAsCount})`);
    let originValidAsnsPercent = (Number(stats.originValidAsCount) / Number(stats.originAsCount)) * 100;
    $("#origin_valid_asns_percent").html(originValidAsnsPercent.toFixed(2) + '%');
    $("#transit_valid_asns").html(`(${stats.transitValidAsCount})`);
    let transitValidAsnsPercent = (Number(stats.transitValidAsCount) / Number(stats.transitAsCount)) * 100;
    $("#transit_valid_asns_percent").html(transitValidAsnsPercent.toFixed(2) + '%');

    let totalInvalid = Number(stats.asInvalidPrefixCount) + Number(stats.lengthInvalidPrefixCount);
    $("#total_invalid").html(`(${totalInvalid})`);
    let totalInvalidPercent = (totalInvalid / Number(stats.totalPrefixCount)) * 100;
    $("#total_invalid_percent").html(totalInvalidPercent.toFixed(2) + '%');
    let originInvalidAsCount = Number(stats.originAsInvalidAsCount) + Number(stats.originLengthInvalidAsCount);
    $("#origin_invalid_asns").html(`(${originInvalidAsCount})`);
    let originInvalidAsnsPercent = (originInvalidAsCount / Number(stats.originAsCount)) * 100;
    $("#origin_invalid_asns_percent").html(originInvalidAsnsPercent.toFixed(2) + '%');
    let transitInvalidAsCount = Number(stats.transitAsInvalidAsCount) + Number(stats.transitLengthInvalidAsCount);
    $("#transit_invalid_asns").html(`(${transitInvalidAsCount})`);
    let transitInvalidAsnsPercent = (transitInvalidAsCount / Number(stats.transitAsCount)) * 100;
    $("#transit_invalid_asns_percent").html(transitInvalidAsnsPercent.toFixed(2) + '%');

    drawDoughnutChart("#prefixChart",
      ['RPKI Valid prefixes', 'RPKI unknown prefixes', 'RPKI protected prefixes from wrong AS', 'RPKI protected prefixes with wrong prefix length'],
      [ stats.validPrefixCount, stats.unknownPrefixCount, stats.asInvalidPrefixCount, stats.lengthInvalidPrefixCount]
    );

    drawDoughnutChart("#originAsesChart",
      ['ASes originating valid prefixes', 'ASes originating unknown prefixes', 'ASes originating invalid maxlength prefixes', 'ASes originating hijacked prefixes'],
      [ stats.originValidAsCount, stats.originUnknownAsCount, stats.originLengthInvalidAsCount, stats.originAsInvalidAsCount]
    );

    drawDoughnutChart("#transitAsesChart",
      ['ASes transiting valid prefixes', 'ASes transiting unknown prefixes', 'ASes transiting invalid maxlength prefixes', 'ASes transiting hijacked prefixes'],
      [ stats.transitValidAsCount, stats.transitUnknownAsCount, stats.transitLengthInvalidAsCount, stats.transitAsInvalidAsCount]
    );

  });

  $.getJSON(`/api/as-resources/${vantagePoint}`, function(res) {
    let roas = res.roas;
    let neighbors = res.neighbors;

    chartRoas(roas);
    chartOriginNeighbors(neighbors);
    chartTransitNeighbors(neighbors);
  });
});
