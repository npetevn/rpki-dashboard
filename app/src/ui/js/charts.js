//let bgPalette = ['#5c80bc', '#8f7fc4', '#c07cbf', '#e77aac', '#ff8090', '#ff9171', '#ffa955', '#e8c547'];
let bgPalette = _.reverse(['#6610f2', '#e83e8c', '#fd7e14', '#f6c23e', '#20c9a6']);
let hoverPalette = _.reverse(['#795da8', '#b47492', '#ad8667', '#b8a67a', '#52988a']);
let goPalette = ['#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6', '#dd4477', '#66aa00', '#b82e2e', '#316395', '#3366cc', '#994499', '#22aa99', '#aaaa11', '#6633cc', '#e67300', '#8b0707', '#651067', '#329262', '#5574a6', '#3b3eac', '#b77322', '#16d620', '#b91383', '#f4359e', '#9c5935', '#a9c413', '#2a778d', '#668d1c', '#bea413', '#0c5922', '#743411'];

Chart.plugins.unregister(ChartDataLabels);

let drawDoughnutChart = (elementId, labels, data, oldChart) => {
  let length = labels.length;
  let bgColors = bgPalette.slice(0, length);
  let hoverColors = hoverPalette.slice(0, length);

  if (oldChart) {
    oldChart.destroy();
  }

  let doughnutChart = new Chart($(elementId), {
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
      layout: {
        padding: {
          left: 0,
          top: 120,
          bottom: 70,
          right: 40
        }
      },
      plugins: {
        outlabels: {
          text: '%v (%p)',
          color: 'white',
          stretch: 45,
          font: {
              resizable: true,
              minSize: 12,
              maxSize: 18
          }
        }
      },
      cutoutPercentage: 80,
    }
  });


  return doughnutChart;
};

let chartRoas = (roas, oldChart) => {
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

  if (oldChart) {
    oldChart.destroy();
  }

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
    plugins: [ChartDataLabels],
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
      },
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'top',
          offset: 4
        }
      }
    }
  });

  return roasByTal;
};

let chartOriginNeighbors = (neighbors, oldChart, ipFamily) => {
  let neighStats = _.map(_.filter(neighbors, (n) => n.min_distance <= 0), (neighbor) => {
      let originating = neighbor[`origin_valid_${ipFamily}`] + neighbor[`origin_unknown_${ipFamily}`] + neighbor[`origin_length_invalid_${ipFamily}`] + neighbor[`origin_as_invalid_${ipFamily}`];
      let origin_valid = neighbor[`origin_valid_${ipFamily}`];
      let origin_invalid = neighbor[`origin_length_invalid_${ipFamily}`] + neighbor[`origin_as_invalid_${ipFamily}`];
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

  let datasets = _.map(neighStats, (neighbor) => ({
    label: `AS${neighbor.asn} originates ${neighbor.origin_valid} valid and ${neighbor.origin_invalid} invalid of ${neighbor.originating} prefixes`,
    data: [{
        x: (neighbor.origin_valid / neighbor.originating) * 100,
        y: (neighbor.origin_invalid / neighbor.originating) * 100,
        r: (neighbor.originating / maxOriginating) * maxR + 1
    }],
    //backgroundColor: bgPalette[neighbor.min_distance],
    backgroundColor: bgPalette[Math.floor((neighbor.originating / maxOriginating) * (bgPalette.length-1))],
    hoverBackgroundColor: hoverPalette[neighbor.min_distance],
  }));

  datasets = _.sortBy(datasets, neighStats => neighStats.data[0].r);

  let maxY = _.max(_.map(datasets, neighStats => neighStats.data[0].y));

  if (oldChart) {
    oldChart.destroy();
  }

  let neighborChart = new Chart($("#originatingChart"), {
    type: 'bubble',
    data: {
      datasets: datasets
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
        //bodyFontSize: 20,
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
            //fontColor: '#000',
            //fontSize: 18,
            labelString: 'RPKI valid prefixes as % of totally originated'
          },
          ticks: {
            //fontSize: 20,
            min: 0,
            max: 100
          }
        }],
        yAxes: [{
          scaleLabel: {
            display: true,
            padding: 60,
            //fontColor: '#000',
            //fontSize: 18,
            labelString: 'RPKI invalid prefixes as % of totally originated'
          },
          ticks: {
            //fontSize: 20,
            min: 0,
            max: maxY+2
          }
        }]
      }
    }
  });

  return neighborChart;
};

let chartTransitNeighbors = (neighbors, oldChart, ipFamily) => {
  let neighStats = _.map(neighbors, (neighbor) => {
      let transiting = neighbor[`transit_valid_${ipFamily}`] + neighbor[`transit_unknown_${ipFamily}`] + neighbor[`transit_length_invalid_${ipFamily}`] + neighbor[`transit_as_invalid_${ipFamily}`];
      let transit_valid = neighbor[`transit_valid_${ipFamily}`];
      let transit_invalid = neighbor[`transit_length_invalid_${ipFamily}`] + neighbor[`transit_as_invalid_${ipFamily}`];
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
      r: (neighbor.transiting / maxTransiting) * maxR + 1
    }],
    backgroundColor: bgPalette[bgPalette.length - 1 - neighbor.min_distance],
    hoverBackgroundColor: hoverPalette[hoverPalette.length - 1 - neighbor.min_distance],
  }));

  datasets = _.sortBy(datasets, neighStats => neighStats.data[0].r);

  let maxY = _.max(_.map(datasets, neighStats => neighStats.data[0].y));

  if (oldChart) {
    oldChart.destroy();
  }

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
        //bodyFontSize: 20,
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
            //fontColor: '#000',
            //fontSize: 18,
            labelString: 'RPKI valid prefixes as % of totally transitted'
          },
          ticks: {
            //fontSize: 20,
            min: 0,
            max: 100
          }
        }],
        yAxes: [{
          scaleLabel: {
            display: true,
            padding: 60,
            //fontColor: '#000',
            //fontSize: 18,
            labelString: 'RPKI invalid prefixes as % of totally transitted'
          },
          ticks: {
            min: 0,
            max: maxY+2,
            //fontSize: 20,
          }
        }]
      }
    }
  });

  return neighborChart;
};

let prefixChart,
    originAsesChart,
    transitAsesChart,
    roasChart,
    originNeighChart,
    transitNeighChart;

let fetchAndLoad = () => {
  let vantagePoint = $("#vantagepoint").val();
  let ipFamily = $("#family").val();

  $.getJSON(`/api/stats/${vantagePoint}/${ipFamily}`, function(stats) {
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

    prefixChart = drawDoughnutChart("#prefixChart",
      ['RPKI valid prefixes', 'RPKI unknown prefixes', 'RPKI protected prefixes from wrong AS', 'RPKI protected prefixes with wrong prefix length'],
      [ stats.validPrefixCount, stats.unknownPrefixCount, stats.asInvalidPrefixCount, stats.lengthInvalidPrefixCount],
      prefixChart
    );

//    originAsesChart = drawDoughnutChart("#originAsesChart",
//      ['ASes originating valid prefixes', 'ASes originating unknown prefixes', 'ASes originating invalid maxlength prefixes', 'ASes originating hijacked prefixes'],
//      [ stats.originValidAsCount, stats.originUnknownAsCount, stats.originLengthInvalidAsCount, stats.originAsInvalidAsCount],
//      originAsesChart
//    );

    originAsesChart = drawDoughnutChart("#originAsesChart",
      ['ASes originating only valid prefixes', 'ASes originating only unknown prefixes', 'ASes originating no invalid prefixes', 'ASes originating some invalid prefixes', 'ASes originating only invalid prefixes'],
      [ stats.originAsOnlyValidCount, stats.originAsOnlyUnknownCount, stats.originAsOnlyValidAndUnknownCount, stats.originAsMixedStatusCount, stats.originAsOnlyInvalidCount],
      originAsesChart
    );

    transitAsesChart = drawDoughnutChart("#transitAsesChart",
      ['ASes transiting only valid and unknown prefixes', 'ASes transiting mix of invalid prefixes', 'ASes transiting unallowed subprefixes', 'ASes transiting protected prefixes from wrong AS'],
      [ stats.transitAsOnlyValidAndUnknownCount, stats.transitAsMixInvalidCount, stats.transitAsLengthInvalidCount, stats.transitAsInvalidCount ],
      transitAsesChart
    );

  });

  $.getJSON(`/api/as-resources/${vantagePoint}/${ipFamily}`, function(res) {
    let roas = res.roas;
    let neighbors = res.neighbors;

    roasChart = chartRoas(roas, roasChart);
    originNeighChart = chartOriginNeighbors(neighbors, originNeighChart, ipFamily);
    transitNeighChart = chartTransitNeighbors(neighbors, transitNeighChart, ipFamily);
  });
};

$(document).ready(function() {
  Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  Chart.defaults.global.defaultFontColor = '#858796';

  $("#vantagepoint").change(fetchAndLoad);
  $("#vantagepoint").change();

  $("#family").change(fetchAndLoad);
  $("#family").change();
});
