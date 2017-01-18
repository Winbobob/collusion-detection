var bardata = [];
//for (var i = 0; i < 50; i++){
//    bardata.push(Math.round(Math.random() * 100) + 10);
//}
//bardata.sort(function compareNumbers(a, b){
//    return a - b;
//});

d3.tsv('data.tsv', function(data) {
    for(key in data) {
        bardata.push(data[key].value);
    }
    console.log(window.innerHeight);
    console.log(window.innerWidth);
    var margin = { top: 30, right: 30, bottom: 40, left: 50 };
    var height = window.innerHeight - margin.top - margin.bottom - 200,
        width = window.innerWidth - margin.left - margin.right - 300;

    var tempColor;
    var colors = d3.scale.linear()
        .domain([0, bardata.length * .33, bardata.length * .66, bardata.length])
        .range(['#B58929','#C61C6F', '#268BD2', '#85992C'])

    var yScale = d3.scale.linear()
        .domain([0, d3.max(bardata)])
        .range([0, height]);

    var xScale = d3.scale.ordinal()
    //    # d3.range([start, ]stop[, step])
    //    If step is omitted, it defaults to 1
    //    d3.range(0, 1, 0.2) // [0, 0.2, 0.4, 0.6000000000000001, 0.8]
        .domain(d3.range(0, bardata.length)) 
        .rangeBands([0, width], 0.2); // rangeBands(interval, padding);

    var tooltip = d3.select('body').append('div')
        .style('position', 'absolute')
        .style('padding', '0 10px')
        .style('background', 'white')
        .style('opacity', 0);

    var myChart = d3.select('#chart').append('svg')
    //    .style('background', '#E7E0CB')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g') // group
        .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')') // displacement
        .selectAll('rect').data(bardata)
        .enter().append('rect')
            .style('fill', function(data, index) {
                return colors(index);
            })
            .attr('width', xScale.rangeBand())
            .attr('x', function(data, index) {
                return xScale(index);
            })
            // initial height and y position, for later transition animation.
            .attr('height', 0)
            .attr('y', height - 0)
            
        .on('mouseover', function(data) {
            tooltip.transition()
                .style('opacity', .9)
            tooltip.html(data)
                .style('left', (d3.event.pageX - 35) + 'px')
                .style('top', (d3.event.pageY - 30) + 'px')
            // store current color in variable in order to restore during mouseout event
            tempColor = this.style.fill;
            d3.select(this)
                .style('opacity', .5)
                .style('fill', 'yellow')
        })

        .on('mouseout', function(data) {
            d3.select(this)
                .style('opacity', 1)
                .style('fill', tempColor)
        })
    // transition is a way to animate selection.
    myChart.transition()
        // compare to the initial status L59-60
        .attr('height', function(data) {
            return yScale(data);
        })
        .attr('y', function(data) {
            return height - yScale(data);
        })
        .delay(function(data, index) {
            return index * 20;
        })
        .duration(1000)
        .ease('elastic')

    var vGuideScale = d3.scale.linear()
        .domain([0, d3.max(bardata)])
        .range([height, 0])

    var xAxis = d3.svg.axis()
        .scale(vGuideScale)
        .orient('left')
        .ticks(11)

    var vGuide = d3.select('svg').append('g')
        xAxis(vGuide)
        vGuide.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
        vGuide.selectAll('path')
            .style({ fill: 'none', stroke: '#000' })
        vGuide.selectAll('line')
            .style({ stroke: '#000' })

    var hGuideScale = d3.scale.linear()
        .domain([0, bardata.length])
        .range([0, width])

    var yAxis = d3.svg.axis()
        .scale(hGuideScale)
        .orient('bottom')
        .ticks(10)

    var hGuide = d3.select('svg').append('g')
        yAxis(hGuide)
        hGuide.attr('transform', 'translate(' + margin.left + ', ' + (height + margin.top) + ')')
        hGuide.selectAll('path')
            .style({ fill: 'none', stroke: '#000' })
        hGuide.selectAll('line')
            .style({ stroke: '#000' })
})
