var width = 800;
var height = 600;
var circleWidth = 5;
var palette = {
    "lightgray": "#819090",
    "gray": "#708284",
    "mediumgray": "#536870",
    "darkgray": "#475B62",
    "darkblue": "#0A2933",
    "darkerblue": "#042029",
    "paleryellow": "#FCF4DC",
    "paleyellow": "#EAE3CB",
    "yellow": "#A57706",
    "orange": "#BD3613",
    "red": "#D11C24",
    "pink": "#C61C6F",
    "purple": "#595AB7",
    "blue": "#2176C7",
    "green": "#259286",
    "yellowgreen": "#738A05"
}

var nodes = [
    { name: 'Parent'},
    { name: 'child1'},
    { name: 'child2', target: [0] },
    { name: 'child3', target: [0] },
    { name: 'child4', target: [1] },
    { name: 'child5', target: [0, 1, 2, 3] }
]

var links = []
for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].target !== undefined) {
        for(var j = 0; j < nodes[i].target.length; j++) {
            links.push({
                source: nodes[i],
                target: nodes[nodes[i].target[j]]
            });
        }
    }
}


var myChart = d3.select('#chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height)

var force = d3.layout.force()
    .nodes(nodes)
    .links([])
    .gravity(0.1)
    .charge(-1000)
    .size([width, height])

var link = myChart.selectAll('line').data(links)
    .enter().append('line')
    .attr('stroke', palette.gray)

var node = myChart.selectAll('circle').data(nodes)
    .enter().append('g')
    .call(force.drag)

node.append('circle')
    .attr('cx', function(data) { return data.x })
    .attr('cy', function(data) { return data.y })
    .attr('r', function(data, index) {
        if (index > 0) { return circleWidth }
        else { return circleWidth + 5 }
    })
    .attr('fill', function(data, index) {
        if (index > 0) { return palette.pink }
        else { return palette.blue }
    })

node.append('text')
    .text(function(data) { return data.name })
    .attr('font-family', 'Roboto Slab')
    .attr('fill', function(data, index) {
        if (index > 0) { return palette.mediumgray }
        else { return palette.yellowgreen }
    })
    .attr('x', function(data, index) {
        if (index > 0) { return circleWidth + 5 }
        else { return circleWidth - 10 }
    })
    .attr('y', function(data, index) {
        if (index > 0) { return circleWidth }
        else { return circleWidth - 10 }
    })
    .attr('text-anchor', function(data, index) {
        if (index > 0) { return 'beginning' }
        else { return 'end' }
    })
    .attr('font-size', function(data, index) {
        if(index > 0) { return '1em' }
        else { return '1.8em' }
    })

// define how things gets animated over time.
// tick - timing of javascript
force.on('tick', function(e) {
    node.attr('transform', function(data) {
        return 'translate(' + data.x + ', ' + data.y + ')';
    })
    
    link
        .attr('x1', function(data) { return data.source.x })
        .attr('y1', function(data) { return data.source.y })
        .attr('x2', function(data) { return data.target.x })
        .attr('y2', function(data) { return data.target.y })
})

force.start()
