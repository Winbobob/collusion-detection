var scoreSection = ['twofive', 'fivezero', 'sevenfive', 'onezerozero'];
var classSection = ['link twofive', 'link fivezero', 'link sevenfive', 'link onezerozero'];

var filepaths = ['collusion_detection_sample_724.txt', 
                 'collusion_detection_sample_733_wikib.txt', 
                 'collusion_detection_sample_749_final.txt',
                 'collusion_detection_sample_736_OSS.txt'];

d3.json(filepaths[1], function(d){
var coll_cyc = d.colluder_sycles;
var links = d.crituques;
var nodes = {};
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
    
// build the arrow. ???
// Different link/path types can be defined here
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

// add the links and the arrows
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
    .attr('text-anchor', 'beginning')
    
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
})
    



// not checked yet
// https://bl.ocks.org/mbostock/4062045


// Highlight node/text/in edge function
function highlight_in() {
    d3.select(this).select('text').transition()
        .duration(750)
        .attr('x', 22)
        .style('fill', 'blue')
        .style('stroke', 'blue')
        .style('stroke-width', '.5px')
        .style('font', '20px sans-serif');
//    d3.select(this).select('circle').transition()
//        .duration(750)
//        .attr('r', 12)
//        .style('fill', 'blue');
    d3.select(this).select('text')
        .call(function(d){
            unityid = d[0][0].innerHTML;
            d3.selectAll('path')[0].filter(function(path){
                p=d3.select(path)
                postfix=/[a-z]+$/.exec(p[0][0].attributes[0].nodeValue)[0] // obtain path status
                if(p.attr('reviewee_actor_id')==unityid){
                    if(postfix=='hidden'){
                        p[0][0].attributes[0].nodeValue=p[0][0].attributes[0].nodeValue.substring(0,p[0][0].attributes[0].nodeValue.lastIndexOf(' '));
                        postfix=/[a-z]+$/.exec(p[0][0].attributes[0].nodeValue)[0]
                    }
                    if(postfix=='twofive'||postfix=='fivezero'||postfix=='sevenfive'||postfix=='onezerozero'){
                        p[0][0].attributes[0].nodeValue=p[0][0].attributes[0].nodeValue+' highlight';
                    }
                }else{
                    if(postfix=='twofive'||postfix=='fivezero'||postfix=='sevenfive'||postfix=='onezerozero'){
                        p[0][0].attributes[0].nodeValue=p[0][0].attributes[0].nodeValue+' hidden';
                    }
                }
                
            })
        })
}
    
// Unhighlight node/text/in edge function
function unhighlight_in() {
    d3.select(this).select('text').transition()
        .duration(750)
        .attr('x', 12)
        .style('fill', 'black')
        .style('stroke', 'none')
        .style('stroke-width', '.5px')
        .style('font', '10px sans-serif');
//    d3.select(this).select('circle').transition()
//        .duration(750)
//        .attr('r', 6)
//        .style('fill', '#ccc');
    d3.select(this).select('text')
        .call(function(d){ 
            unityid = d[0][0].innerHTML;
            d3.selectAll('path')[0].filter(function(path){
                p=d3.select(path)
                postfix=/[a-z]+$/.exec(p[0][0].attributes[0].nodeValue)[0]
                if(postfix=='hidden' || postfix=='highlight'){
                    p[0][0].attributes[0].nodeValue=p[0][0].attributes[0].nodeValue.substring(0,p[0][0].attributes[0].nodeValue.lastIndexOf(' '));
                }
            })
        })
}

// Highlight node/text/in edge function
function highlight_out() {
    d3.select(this).select('text').transition()
        .duration(750)
        .attr('x', 22)
        .style('fill', 'blue')
        .style('stroke', 'blue')
        .style('stroke-width', '.5px')
        .style('font', '20px sans-serif');
//    d3.select(this).select('circle').transition()
//        .duration(750)
//        .attr('r', 16)
//        .style('fill', 'blue');
    d3.select(this).select('text')
        .call(function(d){ 
            unityid = d[0][0].innerHTML;
            // console.log(unityid);
            d3.selectAll('path')[0].filter(function(path){
                p=d3.select(path)
                postfix=/[a-z]+$/.exec(p[0][0].attributes[0].nodeValue)[0]
                if(p.attr('reviewer_actor_id')==unityid){
                    if(postfix=='hidden'){
                        p[0][0].attributes[0].nodeValue=p[0][0].attributes[0].nodeValue.substring(0,p[0][0].attributes[0].nodeValue.lastIndexOf(' '));
                        postfix=/[a-z]+$/.exec(p[0][0].attributes[0].nodeValue)[0]
                    }
                    if(postfix=='twofive'||postfix=='fivezero'||postfix=='sevenfive'||postfix=='onezerozero'){
                        p[0][0].attributes[0].nodeValue=p[0][0].attributes[0].nodeValue+' highlight';
                    }
                }else{
                    if(postfix=='twofive'||postfix=='fivezero'||postfix=='sevenfive'||postfix=='onezerozero'){
                        p[0][0].attributes[0].nodeValue=p[0][0].attributes[0].nodeValue+' hidden';
                    }
                }
            })
        })
}
    
// Unhighlight node/text/in edge function
//function unhighlight_out() {
//    d3.select(this).select('text').transition()
//        .duration(750)
//        .attr('x', 12)
//        .style('fill', 'black')
//        .style('stroke', 'none')
//        .style('stroke-width', '.5px')
//        .style('font', '10px sans-serif');
//    d3.select(this).select('circle').transition()
//        .duration(750)
//        .attr('r', 6)
//        .style('fill', '#ccc');
//    d3.select(this).select('text')
//        .call(function(d){ 
//            unityid = d[0][0].innerHTML;
//            // console.log(unityid);
//            d3.selectAll('[reviewer_actor_id='+unityid+']')
//                .call(function(d){ 
//                    d[0].forEach(function(p){
//                        if(p.attributes[0].nodeValue.substring(p.attributes[0].nodeValue.lastIndexOf(' ')+1)=='highlight'){
//                            p.attributes[0].nodeValue=p.attributes[0].nodeValue.substring(0,p.attributes[0].nodeValue.lastIndexOf(' '));
//                        }
//                    });
//                })
//        })
//}
    
    
// for strong/weak submissions and easy/critical reviewers
function highlight_nodes_and_paths(review_id_type, id){
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
    
function unhighlight_all_nodes_and_paths(){
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

// Show different graphs according to top radio button selection
d3.selectAll('#horizon-controls input[name=mode]').on('change', function() {
//    // Before highlight collusion links
//    // Change existing 'highlight' attr to 'hidden' or add 'hidden' attr
//    d3.selectAll('path')[0].filter(function(path){
//        p=d3.select(path);
//        nodeValue=/[a-z]+$/.exec(p[0][0].attributes[0].nodeValue);
//        if(nodeValue && nodeValue.length > 0){
//            postfix=nodeValue[0];
//            if(postfix == 'highlight'){
//                p[0][0].attributes[0].nodeValue.replace('highlight', 'hidden');
//            }else if(scoreSection.indexOf(postfix) !== -1){
//                p[0][0].attributes[0].nodeValue += ' hidden';
//            }
//        }
//    })
        
    if(this.value == 'strong'){
        d3.selectAll('.node')
            .call(function(d){
                d[0].forEach(function(n){
                    paths = d3.selectAll('[reviewee_actor_id = ' + n.__data__.id + ']');
                    strong_paths = paths[0].filter(function(d){ return d.attributes[0].nodeValue.match(/onezerozero/); })
                    if(paths[0].length > 0){
                        strong_percentage = Math.floor(strong_paths.length / paths[0].length);
                        if(strong_percentage > 0.8){
                            console.log('=====Strong Submissions=====');
                            console.log(n.__data__.id + '  Percentage: ' + strong_percentage);
                            highlight_nodes_and_paths('reviewee_actor_id', n.__data__.id);
                        }
                    }
                });
            });
    }else if(this.value == 'weak'){
        d3.selectAll('.node')
            .call(function(d){
                d[0].forEach(function(n){
                    paths = d3.selectAll('[reviewee_actor_id = ' + n.__data__.id + ']');
                    weak_paths = paths[0].filter(function(d){ return d.attributes[0].nodeValue.match(/(fivezero|twofive|sevenfive)/); })
                    if(paths[0].length > 0){
                        weak_percentage = Math.floor(weak_paths.length / paths[0].length);
                        if(weak_percentage > 0.8){
                            console.log('=====Weak Submissions=====');
                            console.log(n.__data__.id + '  Percentage: ' + weak_percentage);
                            highlight_nodes_and_paths('reviewee_actor_id', n.__data__.id);
                        }
                    }
                });
            });
    }else if(this.value == 'easy'){
        d3.selectAll('.node')
            .call(function(d){
                d[0].forEach(function(n){
                    paths = d3.selectAll('[reviewer_actor_id = ' + n.__data__.id + ']');
                    easy_paths = paths[0].filter(function(d){ return d.attributes[0].nodeValue.match(/onezerozero/); })
                    if(paths[0].length > 0){
                        easy_percentage = Math.floor(easy_paths.length / paths[0].length);
                        if(easy_percentage > 0.8){
                            console.log('=====Easy-going Submissions=====');
                            console.log(n.__data__.id + '  Percentage: ' + easy_percentage);
                            highlight_nodes_and_paths('reviewer_actor_id', n.__data__.id);
                        }
                    }
                });
            });
    }else if(this.value == 'critical'){
        d3.selectAll('.node')
            .call(function(d){
                d[0].forEach(function(n){
                    paths=d3.selectAll('[reviewer_actor_id = ' + n.__data__.id + ']');
                    critial_paths = paths[0].filter(function(d){ return d.attributes[0].nodeValue.match(/(fivezero|twofive)/); })
                    if(paths[0].length > 0){
                        critial_percentage = Math.floor(critial_paths.length / paths[0].length);
                        if(critial_percentage > 0.9){
                            console.log('=====Critial Submissions=====');
                            console.log(n.__data__.id + '  Percentage: ' + critial_percentage);
                            highlight_nodes_and_paths('reviewer_actor_id', n.__data__.id);
                        }
                    }
                });
            });
    }else if(this.value == 'colludes'){
        coll_cyc.forEach(function(coll){
            c=coll.colluders
            len=c.length
            for(var i = 0; i < len; i++){
                for(var j = i + 1; j < len; j++){
                    highlight_collude_nodes_and_paths(c[i].id, c[j].id);
                }
            }
        });
    }else if(this.value == 'all'){
        unhighlight_all_nodes_and_paths();
    }
});
    force.start();
});