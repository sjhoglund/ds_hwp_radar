//https://gist.github.com/MartinMuzatko/1060fe584d17c7b9ca6e
function commarize(min) {
  min = min || 1e3;
  // Alter numbers larger than 1k
  if (this >= min) {
    var units = ["k", "M", "B", "T"];

    var order = Math.floor(Math.log(this) / Math.log(1000));

    var unitname = units[(order - 1)];
    var num = Math.floor(this / 1000 ** order);

    // output number remainder + unitname
    return num + unitname
  }

  // return formatted original number
  return this.toLocaleString()
}

// Add method to prototype. this allows you to use this function on numbers and strings directly
Number.prototype.commarize = commarize
String.prototype.commarize = commarize

//Function to convert colour codes from hex to rgba
function hexToRGB(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

    if (alpha) {
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    } else {
        return "rgb(" + r + ", " + g + ", " + b + ")";
    }
}


// create and add the container
var el = document.createElement('div');
el.id = 'chartContainer';
document.body.appendChild(el);

dscc.subscribeToData(function(data) {
  //remove canvas if it exists
  if(document.getElementById("chartCanvas") != null){
    var oldEl = document.getElementById("chartCanvas");
    oldEl.parentNode.removeChild(oldEl);
  }

  // create and add the canvas
  var canvasEl = document.createElement('canvas');
  canvasEl.id = 'chartCanvas';
  canvasEl.width = dscc.getWidth() - 40;
  canvasEl.height = dscc.getHeight() - 40;

  document.getElementById('chartContainer').appendChild(canvasEl);

  var ctx = canvasEl.getContext('2d');

  //console.log(data);

  var dataByConfigId = data.tables.DEFAULT;
  var styleByConfigId = data.style;

  var lineWidth = !!styleByConfigId.width ? styleByConfigId.width.value : styleByConfigId.width.defaultValue;
  var fillArea = !!styleByConfigId.fill ? styleByConfigId.fill.value : true;
  var opacity = !!styleByConfigId.opacity ? styleByConfigId.opacity.value : styleByConfigId.opacity.defaultValue;

  var lineColors = [];
  for (i=0; i<10; i++) {
    var colorId = 'color' + (i+1);
    lineColors[i] = !!styleByConfigId[colorId].value ? styleByConfigId[colorId].value.color : undefined;
  }

  //prepare datasets
  var labels = data.fields.value.map(function(m){return !!m && !!m.name ? m.name : undefined});
  var datasets = [];

  dataByConfigId.forEach(function(d, i){

    var themeColor = lineColors[i] || data.theme.themeSeriesColor[i%20].color;
    var fillColor = hexToRGB(themeColor, opacity)

    datasets.push({
      data: d['value'],
      label: d['breakdown'],
      borderColor: themeColor,
      backgroundColor: fillColor,
      borderWidth: lineWidth,
      fill: fillArea
    })

  });

  //console.log(datasets);

  var legend = !!styleByConfigId.legend ? !styleByConfigId.legend.value : true;
  var legendPosition = !!styleByConfigId.legendPosition ? styleByConfigId.legendPosition.value : undefined;
  var metricType = !!data.fields.value[0] ? data.fields.value[0].type : undefined;
  var tooltips = !!styleByConfigId.tooltips ? !styleByConfigId.tooltips.value : true;


/*

  var xDisplay = !!styleByConfigId.xhide ? !styleByConfigId.xhide.value : true;
  var xMin = !!styleByConfigId.xmin.value ? +styleByConfigId.xmin.value : undefined;
  var xMax = !!styleByConfigId.xmax.value ? +styleByConfigId.xmax.value : undefined;
  var xTicks = !!styleByConfigId.xticks.value ? +styleByConfigId.xticks.value : undefined;
*/
  var yLabels = !!styleByConfigId.ylabels ? !styleByConfigId.ylabels.value : true;
  var yLines = !!styleByConfigId.ylines ? !styleByConfigId.ylines.value : true;
  var yMin = !!styleByConfigId.ymin.value ? +styleByConfigId.ymin.value : undefined;
  var yMax = !!styleByConfigId.ymax.value ? +styleByConfigId.ymax.value : undefined;
  var yTicks = !!styleByConfigId.yticks.value ? +styleByConfigId.yticks.value : undefined;
  var pointLabels = !!styleByConfigId.pointLabels ? !styleByConfigId.pointLabels.value : true;
  var gridlines = !!styleByConfigId.gridlines.value ? !styleByConfigId.gridlines.value : true;
  var circular = !!styleByConfigId.circular.value ? styleByConfigId.circular.value : false;

  Chart.defaults.global.defaultFontColor = data.theme.themeFontColor.color;
  Chart.defaults.global.defaultFontFamily = data.theme.themeFontFamily;
  Chart.defaults.global.elements.point.radius = 0;
  Chart.defaults.global.elements.point.hitRadius = 10;
  Chart.defaults.global.elements.point.hoverRadius = 3;
  Chart.defaults.global.elements.line.fill = false;

  var myRadarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        legend:{
			    display: legend,
          position:  legendPosition
			  },
        scale: {
          ticks: {
            beginAtZero: true,
            min: yMin,
            max: yMax,
            maxTicksLimit: yTicks,
            display: yLabels
          },
          angleLines: {
            display: yLines
          },
          gridLines: {
            display: gridlines,
            circular: circular
          },
          pointLabels: {
            display: pointLabels
          }
        },
        animation: {
            duration: 0 // general animation time
        },
        responsive: true,
        maintainAspectRatio: false,
        tooltips: {
          enabled: tooltips,
          intersect: false,
					mode: 'index',
          displayColors: true,
          callbacks: {
            label: function(tooltipItem, data) {
                      var label = data.datasets[tooltipItem.datasetIndex].label || '';
                      label += ": ";

                      var val = tooltipItem.yLabel
                      if(parseInt(val) >= 1000){
                          val = val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                      }

                      if (!!metricType && metricType == "CURRENCY_USD") {
                        return label + "$" + val;
                      } else {
                        return label + val;
                      }
                    }
            }
        }
      }
  });


}, {transform: dscc.objectTransform});