var classSection = ['link twofive', 'link fivezero', 'link sevenfive', 'link onezerozero'];
var filepaths = ['collusion_detection_sample_724.txt', 
                 'collusion_detection_sample_733_wikib.txt', 
                 'collusion_detection_sample_749_final.txt',
                 'collusion_detection_sample_736_OSS.txt'];

d3.json(filepaths[1], function(d){
var coll_cycs = d.colluder_sycles;
var links = d.crituques;
var nodes = {};
var bar_data = [];
var dropdownElements;
// Populate the nodes from the links
links.forEach(function(link) {
    link.reviewer_actor_id = nodes[link.reviewer_actor_id] || (nodes[link.reviewer_actor_id] = { id: link.reviewer_actor_id });
    link.reviewee_actor_id = nodes[link.reviewee_actor_id] || (nodes[link.reviewee_actor_id] = { id: link.reviewee_actor_id });
    bar_data.push(link.score);
});
    
var w = window.innerWidth;
var h = window.innerHeight;
var margin = { top: 0, bottom: 0, left: 50, right: 50 };
var width = w - margin.left - margin.right;
var height = h - margin.top - margin.bottom;

var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);
    
var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links([])
    .size([width, height])
    .linkDistance(400)
    .charge(-300);
    
// Scale the scores into 0~100
var vScale = d3.scale.linear()
    .domain([0, d3.max(links, function(d) { 
        return d.score; 
    })])
    .range([0, 100]);

// assign a type per value to encode opacity
links.forEach(function(link) {
	if (vScale(link.score) <= 25) {
		link.type = 'twofive';
	} else if (vScale(link.score) <= 80 && vScale(link.score) > 25) {
		link.type = 'fivezero';
	} else if (vScale(link.score) <= 90 && vScale(link.score) > 80) {
		link.type = 'sevenfive';
	} else if (vScale(link.score) <= 100 && vScale(link.score) > 90) {
		link.type = 'onezerozero';
	}
});
    
// draw the arrow.
// Define different link/path types
svg.append('svg:defs').selectAll('marker').data(['end'])
    .enter().append('svg:marker')
    // This section adds in the arrows
        .attr('id', String)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', -1.5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
    .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5');

// define the paths (links + arrows)
var path = svg.append('svg:g').selectAll('path').data(links)
    .enter().append('path')
        .attr('class', function(d) { return 'link ' + d.type; })
        .attr('marker-end', 'url(#end)')
        .attr('reviewer_actor_id', function(d){ return d.reviewer_actor_id.id })
        .attr('reviewee_actor_id', function(d){ return d.reviewee_actor_id.id });

// define the nodes
// Since nodes is a hashtable, d3.values() returns an array containing the values.
var node = svg.append('svg:g').selectAll('node').data(force.nodes())
    .enter().append('g')
        .attr('class', 'node')
        .attr('active', false)
        .call(force.drag);

// add the nodes
node.append('circle')
    .attr('cx', function(d) { return d.x })
    .attr('cy', function(d) { return d.y })
    .attr('r', 5);

// add the text 
node.append('text')
    .text(function(d) { return d.id; })
    .attr('x', 12)
    .attr('text-anchor', 'beginning');
    
// Draw link curves and arrows
// Use elliptical arc path segments to doubly-encode directionality.
force.on('tick', function(d) {
    path.attr('d', function(d) {
        var dx = d.reviewee_actor_id.x - d.reviewer_actor_id.x,
            dy = d.reviewee_actor_id.y - d.reviewer_actor_id.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return 'M' + 
            d.reviewer_actor_id.x + ',' + 
            d.reviewer_actor_id.y + 'A' + 
            dr + ',' + dr + ' 0 0,1 ' + 
            d.reviewee_actor_id.x + ',' + 
            d.reviewee_actor_id.y;
    });
    // Displacement
    node.attr('transform', function(d) {
        return 'translate(' + d.x + ',' + d.y + ')'; 
    });
})

// Click function (attr 'active' -> node and attr 'highlight/hidden' -> link)
// highlight/unhighlight certain node and corresponding links
node.on('click', function(d) {
    // make sure only select 'all' radio button can trigger click event
    if(d3.selectAll('#horizon-controls input[name=mode]:checked').node().id == 'horizon-all'){
    if(d3.select(this).attr('active') === 'false') {
        // reset other active node(s)
        d3.selectAll('.node[active = true]')
            .select('circle').transition()
                .attr('r', 5)
                .style('fill', '#ccc')
        d3.selectAll('.node[active = true]')
            .select('text').transition()
                .attr('x', 12)
                .style('fill', 'black')
                .style('font', '10px sans-serif');
        d3.selectAll('.node[active = true]')
            .attr('active', 'false');
        // Start change this node
        // Change active status
        d3.select(this).attr('active', true);
        // circle transition
        d3.select(this).select('circle').transition()
            .attr('r', 12)
            .style('fill', 'blue');
        // text transition
        d3.select(this).select('text').transition()
            .attr('x', 22)
            .style('fill', 'blue')
            .style('font', '20px sans-serif');
        // related path transition
        var unityId = '';
        d3.select(this).select('text')
            .call(function (d) { unityId = d.text(); })
        d3.selectAll('path').filter(function(path) {
            p = d3.select(this);
            if(p.attr('reviewer_actor_id') === unityId ||
               p.attr('reviewee_actor_id') === unityId) {
                className = p.attr('class');
                if(className && classSection.indexOf(className) === -1) {
                    d3.select(this)
                        .classed(className, false)
                        .classed(className.substring(0, className.lastIndexOf(' ')) + ' highlight', true)
                }
                else {
                    d3.select(this)
                        .classed(className, false)
                        .classed(className + ' highlight', true)
                }
            }
            else{
                className = p.attr('class');
                if(className && classSection.indexOf(className) === -1) {
                    d3.select(this)
                        .classed(className, false)
                        .classed(className.substring(0, className.lastIndexOf(' ')) + ' hidden', true)
                }
                else {
                    d3.select(this)
                        .classed(className, false)
                        .classed(className + ' hidden', true)
                }
            }    
        }) 
    }
    else {
        // Change active status
        d3.select(this).attr('active', false);
        // circle transition
        d3.select(this).select('circle').transition()
            .attr('r', 5)
            .style('fill', '#ccc')
        // text transition
        d3.select(this).select('text').transition()
            .attr('x', 12)
            .style('fill', 'black')
            .style('font', '10px sans-serif');
        // Reset all paths when second click on same node        
        d3.selectAll('path').filter(function(path){
            p = d3.select(this);        
            className = p.attr('class');
            if(className && classSection.indexOf(className) === -1){
                d3.select(this)
                    .classed(className, false)
                    .classed(className.substring(0, className.lastIndexOf(' ')), true)
            }
        })
    }
    }
})

force.start();

    
//**************************************************************
// Radio button
// Show different graphs according to top radio button selection
//**************************************************************
d3.selectAll('#horizon-controls input[name=mode]').on('change', function() {        
    dropdownElements = ['All'];
    d3.select('select').remove();
    unhighlight_all_nodes_and_hide_all_paths();
    if(this.value == 'strong'){
        show_diff_mode_type(this.value, 'reviewee_actor_id', /onezerozero/, 0.8);
        populate_dropdown(dropdownElements, this.value, 'reviewee_actor_id', /onezerozero/, 0.8);
    }else if(this.value == 'weak'){
        show_diff_mode_type(this.value, 'reviewee_actor_id', /(fivezero|twofive|sevenfive)/, 0.5);
        populate_dropdown(dropdownElements, this.value, 'reviewee_actor_id', /(fivezero|twofive|sevenfive)/, 0.5);
    }else if(this.value == 'easy'){
        show_diff_mode_type(this.value, 'reviewer_actor_id', /onezerozero/, 0.8);
        populate_dropdown(dropdownElements, this.value, 'reviewer_actor_id', /onezerozero/, 0.8);
    }else if(this.value == 'critical'){
        show_diff_mode_type(this.value, 'reviewer_actor_id', /(fivezero|twofive)/, 0.9);
        populate_dropdown(dropdownElements, this.value, 'reviewer_actor_id', /(fivezero|twofive)/, 0.9);
    }else if(this.value == 'colludes'){
        coll_cycs.forEach(function(coll){ show_collusion_cycle(coll); });
        populate_dropdown(coll_cycs, this.value, undefined, undefined, undefined);
    }else if(this.value == 'all'){
        unhighlight_all_nodes_and_unhighlight_all_paths();
    }
    show_bar_chart();
});
    
// for strong/weak submissions and easy/critical reviewers
// display all candidates, call function 'highlight_node_and_paths' and 'populate_dropdown'
function show_diff_mode_type(mode, review_id_type, regex, threshold){
    iterator = 1;
    d3.selectAll('.node')
    .call(function(d){
        d[0].forEach(function(n){
            paths = d3.selectAll('[' + review_id_type + ' = "' + n.__data__.id + '"]');
            selected_paths = paths[0].filter(function(d){ return d.attributes[0].nodeValue.match(regex); })
            if(paths[0].length > 0){
                percentage = selected_paths.length / paths[0].length;
                if(percentage > threshold){
                    console.log('=====' + mode + ' Submissions=====');
                    console.log(n.__data__.id + '  Percentage: ' + percentage);
                    dropdownElements[iterator] = n.__data__.id;
                    iterator = iterator + 1;
                    highlight_node_and_paths(review_id_type, n.__data__.id);
                }
            }
        });
    });
}
    
// for strong/weak submissions and easy/critical reviewers
// display certain candidate
function highlight_node_and_paths(review_id_type, id){
    // highlight related nodes (text and circle)
    d3.selectAll('.node')
        .call(function(d){
            d[0].forEach(function(n){
                t = d3.select(n).select('text');
                if(t[0][0].textContent == id){
                    t.transition()
                        .attr('x', 22)
                        .style('fill', 'blue')
                        .style('font', '20px sans-serif');
                    d3.select(n).select('circle').transition()
                        .attr('r', 12)
                        .style('fill', 'blue')
                }
            })
        })
    // highlight related paths
    d3.selectAll('path').filter(function(path){
        p = d3.select(this);        
        className = p.attr('class');
        if(p.attr(review_id_type) == id){
            if(classSection.indexOf(className) === -1){
                d3.select(this)
                    .classed(className, false)
                    .classed(className.substring(0, className.lastIndexOf(' ')) + ' highlight', true)
            }else{
                d3.select(this)
                    .classed(className, false)
                    .classed(className + ' highlight', true)
            }
        }else{
            
        }
    })
}

// for collusion detection graph
// display one collusion cycle, call function 'highlight_collude_nodes_and_paths'
function show_collusion_cycle(coll_cyc){
    c = coll_cyc.colluders
    len = c.length
    for(var i = 0; i < len; i++){
        for(var j = i + 1; j < len; j++){
            highlight_collude_nodes_and_paths(c[i].id, c[j].id);
        }
    }
}
    
// for collusion detection graph
function highlight_collude_nodes_and_paths(reviewer_id, reviewee_id){
    // highlight related nodes (text and circle)
    d3.selectAll('.node')
        .call(function(d){
            d[0].forEach(function(n){
                t = d3.select(n).select('text');
                if(t[0][0].textContent == reviewer_id || t[0][0].textContent == reviewee_id){
                    t.transition()
                        .attr('x', 22)
                        .style('fill', 'blue')
                        .style('font', '20px sans-serif');
                    d3.select(n).select('circle').transition()
                        .attr('r', 12)
                        .style('fill', 'blue')
                }
            })
        })
    // highlight related paths
    d3.selectAll('path').filter(function(path){
        p = d3.select(this);        
        className = p.attr('class');
        if((p.attr('reviewer_actor_id') == reviewer_id && p.attr('reviewee_actor_id') == reviewee_id)||
           p.attr('reviewer_actor_id') == reviewee_id && p.attr('reviewee_actor_id') == reviewer_id){
            if(classSection.indexOf(className) === -1){
                d3.select(this)
                    .classed(className, false)
                    .classed(className.substring(0, className.lastIndexOf(' ')) + ' highlight', true)
            }else{
                d3.select(this)
                    .classed(className, false)
                    .classed(className + ' highlight', true)
            }
        }else{
            
        }
    })
}
    
function unhighlight_all_nodes_and_hide_all_paths(){
    // unhighlight all nodes (text and circle)
    d3.selectAll('.node')
        .call(function(d){
            d[0].forEach(function(n){
                d3.select(n).select('text').transition()
                    .attr('x', 12)
                    .style('fill', 'black')
                    .style('font', '10px sans-serif');
                d3.select(n).select('circle').transition()
                    .attr('r', 5)
                    .style('fill', '#ccc')
            })
        })
    // hide related paths
    d3.selectAll('path').filter(function(path){
        p = d3.select(this);        
        className = p.attr('class');
        if(className){
            if(classSection.indexOf(className) === -1){
                d3.select(this)
                    .classed(className, false)
                    .classed(className.substring(0, className.lastIndexOf(' ')) + ' hidden', true)
            }else{
                d3.select(this)
                    .classed(className, false)
                    .classed(className + ' hidden', true)
            }
        }
    })
}
    
function unhighlight_all_nodes_and_unhighlight_all_paths(){
    // unhighlight all nodes (text and circle)
    d3.selectAll('.node')
        .call(function(d){
            d[0].forEach(function(n){
                d3.select(n).select('text').transition()
                    .attr('x', 12)
                    .style('fill', 'black')
                    .style('font', '10px sans-serif');
                d3.select(n).select('circle').transition()
                    .attr('r', 5)
                    .style('fill', '#ccc')
            })
        })
    // unhighlight related paths
    d3.selectAll('path').filter(function(path){
        p = d3.select(this);        
        className = p.attr('class');
        if(className && classSection.indexOf(className) === -1){
            d3.select(this)
                .classed(className, false)
                .classed(className.substring(0, className.lastIndexOf(' ')), true)
        }
    })
}
 
    
//**************************************************************
// dropdown
//**************************************************************
function populate_dropdown(dropdown_data, mode, review_id_type, regex, threshold){
     // add text
     d3.select('#horizon-controls').append('text')
        .html('<br/>Choose different items: <br/>')
        .style('font', '15px sans-serif');
    
    dropdown = d3.select('#horizon-controls').append('select')
        .attr('id', 'dropdown')
   
    console.log(dropdown_data);
    dropdown.selectAll('option').data(dropdown_data)
        .enter().append('option')
            .text(function(d, i){
                if(mode == 'colludes'){
                    str = i.toString() + '.';
                    d.colluders.forEach(function(data) { str += ' ' + data.id; })
                    return str;
                }else{
                    return d; 
                }
            });
    
    // in this case, the 'change' method can access all params pass in
    dropdown.on('change', function(d){
        selectValue = d3.select('select').property('value')
        unhighlight_all_nodes_and_hide_all_paths();
        if(selectValue == '--'){
            if(mode == 'colludes'){
                coll_cycs.forEach(function(coll){ show_collusion_cycle(dropdown_data); });
            }else{ // show all candidates
                show_diff_mode_type(mode, review_id_type, regex, threshold);
            }
        }else {
            if(mode == 'colludes'){
                index = parseInt(selectValue[0]);
                show_collusion_cycle(coll_cycs[index]);
            }else{ // show one candidate
                highlight_node_and_paths(review_id_type, selectValue);
            }
        }
    });
}
    
//**************************************************************
// bar chart to set threshold
//**************************************************************
function show_bar_chart(){
    // sort bar_data
    bar_data.sort(function compareNumbers(a, b){
        return a - b;
    })
    var height = 100;
    var width = 350;
    var bar_xScale = d3.scale.ordinal()
        .domain(d3.range(0, bar_data.length))
        .rangeBands([0, width], 0); // rangeBands(interval, padding);

    var bar_yScale = d3.scale.linear()
        .domain([0, d3.max(links, function(d){
            return vScale(d.score);
        })])
        .range([0, height]);

    // add text
    d3.select('#horizon-controls').append('text')
        .html('<br/><br/>Slide your mouse on bar chart to choose a theshold: <br/>')
        .style('font', '15px sans-serif');
    
    var barChart = d3.select('#horizon-controls').append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g').selectAll('rect').data(bar_data)
        .enter().append('rect')
            .style('fill', 'blue')
            .attr('width', bar_xScale.rangeBand())
            .attr('x', function(d, i){
                return bar_xScale(i);
            })
            // initial height and y position, for later transition animation.
            .attr('height', 0)
            .attr('y', height - 0)
    
    barChart.transition()
        .attr('height', function(d){
            return bar_yScale(d);
        })
        .attr('y', function(d){
            return height - bar_yScale(d);
        })
        .delay(function(d, i){
            return i * 10;
        })
        .duration(500)
        .ease('elastic')
    
    barChart.on('mouseover', function(){
        d3.select(this)
            .attr('fill', 'yellow')
    })
}
});