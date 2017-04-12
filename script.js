var classSection = ['link red', 'link green'];
var filepaths = ['collusion_detection_sample_724.txt',
                 '733-test.txt',
                 'collusion_detection_sample_733_wikib.txt', 
                 'collusion_detection_sample_749_final.txt',
                 'collusion_detection_sample_736_OSS.txt',
                 'collusion_detection_sample_733_wikib_scrubbed.txt'];

d3.json(filepaths[1], function(d){
var coll_cycs = d.colluder_cycles;
var links = d.crituques;
var nodes = {};
var percentage = 0.8;
var line_color_threshold = 80;
var dropdownElements;
// Populate the nodes from the links
links.forEach(function(link) {
    link.reviewer_actor_id = nodes[link.reviewer_actor_id] || (nodes[link.reviewer_actor_id] = { id: link.reviewer_actor_id });
    link.reviewee_actor_id = nodes[link.reviewee_actor_id] || (nodes[link.reviewee_actor_id] = { id: link.reviewee_actor_id });
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
	if (vScale(link.score) <= line_color_threshold) {
		link.type = 'red';
	} else {
		link.type = 'green';
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
        .attr('score', function(d){ return d.score; })
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

add_line_color_threshold_slider();

force.start();

    
//**************************************************************
// Radio button
// Show different graphs according to top radio button selection
//**************************************************************
d3.selectAll('#horizon-controls input[name=mode]').on('change', function() {  
    // reset data before each change
    dropdownElements = ['All'];
    d3.select('#set_percentage').remove();
    d3.select('#percentage_slider').remove();
    d3.select('#percentage_value').remove();
    d3.select('#set_line_color_threshold').remove();
    d3.select('#color_threshold_slider').remove();
    d3.select('#color_threshold_value').remove();
    d3.select('#choose_diff_item').remove();
    d3.select('#dropdown').remove();
    unhighlight_all_nodes_and_hide_all_paths();
   
    if(this.value == 'strong'){
        change_horizon_controls(this.value, 'reviewee_actor_id', /green/);
    }else if(this.value == 'weak'){
        change_horizon_controls(this.value, 'reviewee_actor_id', /red/);
    }else if(this.value == 'easy'){
        change_horizon_controls(this.value, 'reviewer_actor_id', /green/);
    }else if(this.value == 'critical'){
        change_horizon_controls(this.value, 'reviewer_actor_id', /red/);
    }else if(this.value == 'colludes'){
        coll_cycs.forEach(function(coll){ show_collusion_cycle(coll); });
        populate_dropdown(this.value, undefined, undefined, undefined);
    }else if(this.value == 'all'){
        add_line_color_threshold_slider();
        unhighlight_all_nodes_and_unhighlight_all_paths();
    }
});

function change_horizon_controls(mode, review_id_type, regex){
    show_diff_mode_type(mode, review_id_type, regex);
    add_percentage_slider(mode, review_id_type, regex);
    populate_dropdown(mode, review_id_type, regex);
}

//**************************************************************
// for strong/weak submissions and easy/critical reviewers
//**************************************************************
// show all candidates, call function 'highlight_node_and_paths'
function show_diff_mode_type(mode, review_id_type, regex){
    console.log('=====' + mode + ' Submissions=====');
    iterator = 1;
    d3.selectAll('.node')
    .call(function(d){
        d[0].forEach(function(n){
            paths = d3.selectAll('[' + review_id_type + ' = "' + n.__data__.id + '"]');
            selected_paths = paths[0].filter(function(d){ return d.attributes[0].nodeValue.match(regex); })
            if(paths[0].length > 0){
                ratio = selected_paths.length / paths[0].length;
                if(ratio >= percentage){
                    console.log(n.__data__.id + '  Percentage: ' + ratio);
                    dropdownElements[iterator] = n.__data__.id;
                    iterator = iterator + 1;
                    highlight_node_and_paths(review_id_type, n.__data__.id);
                }
            }
        });
    });
 }
    
// show one candidate
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

//**************************************************************
// for collusion detection graph
//**************************************************************
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
  
//**************************************************************
// for unhighlight nodes or paths
//**************************************************************
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
// Slider to set percentage (the percentage of green lines out of all received/submitted lines)
//**************************************************************
function add_percentage_slider(mode, review_id_type, regex){
    // add text
    d3.select('#horizon-controls').append('text')
        .html('<br/>Set percentage of ' + regex.toString().replace(/\//ig, '') + ' lines out of all lines <br/>')
        .attr('id', 'set_percentage')
        .style('font', '15px sans-serif');
    d3.select('#horizon-controls').append('input')
        .attr('id', 'percentage_slider')
        .attr('type', 'range')
        .attr('min', '0')
        .attr('max', '1')
        .attr('step', '0.1')
        .attr('value', percentage);
    d3.select('#horizon-controls').append('output')
        .text(percentage)
        .attr('id', 'percentage_value');

    d3.select('#percentage_slider').on('input', function(){
        percentage = this.value;
        d3.select('#percentage_value').text(percentage);
        // reset data before each change
        dropdownElements = ['All'];
        d3.select('#choose_diff_item').remove();
        d3.select('#dropdown').remove();
        unhighlight_all_nodes_and_hide_all_paths();
        // update node, link and dropdown
        show_diff_mode_type(mode, review_id_type, regex, percentage);
        populate_dropdown(mode, review_id_type, regex, percentage);
        console.log('percentage: ' + percentage);
    })
}
    
//**************************************************************
// Slider to set line color threshold (a score represents as a green lines or red line)
//**************************************************************
function add_line_color_threshold_slider(){
    // add text
    d3.select('#horizon-controls').append('text')
        .html('<br/>Set line color threshold: <br/>')
        .attr('id', 'set_line_color_threshold')
        .style('font', '15px sans-serif');
    d3.select('#horizon-controls').append('input')
        .attr('id', 'color_threshold_slider')
        .attr('type', 'range')
        .attr('min', '0')
        .attr('max', '100')
        .attr('step', '1')
        .attr('value', line_color_threshold);
    d3.select('#horizon-controls').append('output')
        .html('<br/>>= ' + line_color_threshold + ' => green; < ' + line_color_threshold + ' => red')
        .attr('id', 'color_threshold_value');

    d3.select('#color_threshold_slider').on('input', function(){
        line_color_threshold = this.value;
        d3.select('#color_threshold_value').html('<br/>>= ' + line_color_threshold + ' => green; < ' + line_color_threshold + ' => red'); 
        // change classes of all paths
        d3.selectAll('path').filter(function(path){
            p = d3.select(this);        
            className = p.attr('class');
            score = parseInt(p.attr('score'));
            if(classSection.indexOf(className) != -1){
                d3.select(this).classed(className, false)
                if(score >= line_color_threshold){
                    d3.select(this).classed('link green', true);
                } else {
                    d3.select(this).classed('link red', true);
                }
            }
        })

//        // reset data before each change
//        dropdownElements = ['All'];
//        d3.select('#choose_diff_item').remove();
//        d3.select('#dropdown').remove();
//        unhighlight_all_nodes_and_hide_all_paths();
//        // update node, link and dropdown
//        show_diff_mode_type(mode, review_id_type, regex, percentage);
//        populate_dropdown(mode, review_id_type, regex, percentage);
        console.log('color threshold value: ' + line_color_threshold);
    })
}

//**************************************************************
// dropdown
//**************************************************************
function populate_dropdown(mode, review_id_type, regex){
     // add text
     d3.select('#horizon-controls').append('text')
        .html('<br/>Choose different items: <br/>')
        .attr('id', 'choose_diff_item')
        .style('font', '15px sans-serif');
    
    dropdown = d3.select('#horizon-controls').append('select')
        .attr('id', 'dropdown')
    
   if(mode == 'colludes'){
       dropdownElements = coll_cycs;
   }
    console.log(dropdownElements);
    dropdown.selectAll('option').data(dropdownElements)
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
        if(selectValue == 'All'){
            if(mode == 'colludes'){
                coll_cycs.forEach(function(coll){ show_collusion_cycle(dropdownElements); });
            }else{ // show all candidates
                show_diff_mode_type(mode, review_id_type, regex, percentage);
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
    

});