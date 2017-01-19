var scoreSection = ['link twofive', 'link fivezero', 'link sevenfive', 'link onezerozero'];
var filepaths = ['collusion_detection_sample_724.txt', 
                 'collusion_detection_sample_733_wikib.txt', 
                 'collusion_detection_sample_749_final.txt',
                 'collusion_detection_sample_736_OSS.txt'];

d3.json(filepaths[1], function(d){
var coll_cyc = d.colluder_sycles;
var links = d.crituques;
var nodes = {};
// Compute the distance nodes from the links
links.forEach(function(link) {
    link.reviewer_actor_id = nodes[link.reviewer_actor_id] || (nodes[link.reviewer_actor_id] = { id: link.reviewer_actor_id });
    link.reviewee_actor_id = nodes[link.reviewee_actor_id] || (nodes[link.reviewee_actor_id] = { id: link.reviewee_actor_id });
});
    
var w = window.innerWidth;
var h = window.innerHeight;
var margin = { top: 0, bottom: 0, left: 100, right: 100 };
var width = w - margin.left - margin.right;
var height = h - margin.top - margin.bottom;

var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);
    
var force = d3.layout.force()
    // Since nodes is a hashtable, d3.values() returns an array containing the values.
//    .nodes(d3.values(nodes))
//    .links(links)
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
		link.type = 'twofive normal';
	} else if (vScale(link.score) <= 80 && vScale(link.score) > 25) {
		link.type = 'fivezero normal';
	} else if (vScale(link.score) <= 90 && vScale(link.score) > 80) {
		link.type = 'sevenfive normal';
	} else if (vScale(link.score) <= 100 && vScale(link.score) > 90) {
		link.type = 'onezerozero normal';
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
    .enter().append('svg:path')
        .attr('class', function(d) { return 'link ' + d.type; })
        .attr('marker-end', 'url(#end)')
        .attr('reviewer_actor_id', function(d){ return d.reviewer_actor_id.name })
        .attr('reviewee_actor_id', function(d){ return d.reviewee_actor_id.name });

// define the nodes
var node = svg.selectAll('.node').data(d3.values(nodes))
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
    

// add the curvy lines
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

// Click function
node.on('click', function(d) {
    if(d3.select(this).attr('active') === 'false') {
        // text transition
        d3.select(this).select('text').transition()
            .attr('x', 22)
            .style('fill', 'blue')
            .style('font', '20px sans-serif')
        // related path transition
        d3.select(this).select('text')
            .call(function (d) {
                var unityId = d.text();
                d3.selectAll('path').filter(function(path) {
                    if(typeof path['reviewer_actor_id'] !== 'undefined') {
                        if(path['reviewer_actor_id'].id === unityId ||
                           path['reviewee_actor_id'].id === unityId) {
                            var className = d3.select(this).attr('class');
                            d3.select(this)
                                .classed(className, false)
                                .classed(className.substring(0, className.lastIndexOf(' ')) + ' highlight', true)
                        }
                        else{
                            var className = d3.select(this).attr('class');
                            d3.select(this)
                                .classed(className, false)
                                .classed(className.substring(0, className.lastIndexOf(' ')) + ' hidden', true)
                        }
                    }
                }) 
            })
        // circle transition
        d3.select(this).select('circle').transition()
            .attr('r', 12)
            .style('fill', 'lightsteelblue');
    //    d3.select(this).select('text')
    //        .call(function(d){ 
    //            unityid = d[0][0].innerHTML;
    //            // console.log(unityid);
    //            d3.selectAll('[reviewer_actor_id='+unityid+'],[reviewee_actor_id='+unityid+']')
    //                .call(function(d){ 
    //                    d[0].forEach(function(p){
    //                        if(p.attributes[0].nodeValue.substring(p.attributes[0].nodeValue.lastIndexOf(' ')+1)!='highlight'){
    //                            p.attributes[0].nodeValue=p.attributes[0].nodeValue+' highlight';
    //                        }
    //                    });
    //                })
    //        })
        d3.select(this).attr('active', true);
    }
    else {
         d3.select(this).select('text').transition()
            .attr('x', 12)
            .style('fill', 'black')
            .style('font', '10px sans-serif');
        d3.select(this).select('circle').transition()
            .attr('r', 6)
            .style('fill', '#ccc');
        d3.select(this).attr('active', false);
    }
    
})
    
// Highlight node/text/in edge function
function highlight_in() {
    d3.select(this).select('text').transition()
        .duration(750)
        .attr('x', 22)
        .style('fill', 'steelblue')
        .style('stroke', 'lightsteelblue')
        .style('stroke-width', '.5px')
        .style('font', '20px sans-serif');
//    d3.select(this).select('circle').transition()
//        .duration(750)
//        .attr('r', 12)
//        .style('fill', 'lightsteelblue');
    d3.select(this).select('text')
        .call(function(d){
            unityid = d[0][0].innerHTML;
            d3.selectAll('path')[0].filter(function(path){
                p=d3.select(path)
                postfix=p[0][0].attributes[0].nodeValue.substring(p[0][0].attributes[0].nodeValue.lastIndexOf(' ')+1)
                if(p.attr('reviewee_actor_id')==unityid){
                    if(postfix=='hidden'){
                        p[0][0].attributes[0].nodeValue=p[0][0].attributes[0].nodeValue.substring(0,p[0][0].attributes[0].nodeValue.lastIndexOf(' '));
                        postfix=p[0][0].attributes[0].nodeValue.substring(p[0][0].attributes[0].nodeValue.lastIndexOf(' ')+1)
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
                postfix=p[0][0].attributes[0].nodeValue.substring(p[0][0].attributes[0].nodeValue.lastIndexOf(' ')+1)
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
        .style('fill', 'steelblue')
        .style('stroke', 'lightsteelblue')
        .style('stroke-width', '.5px')
        .style('font', '20px sans-serif');
//    d3.select(this).select('circle').transition()
//        .duration(750)
//        .attr('r', 16)
//        .style('fill', 'lightsteelblue');
    d3.select(this).select('text')
        .call(function(d){ 
            unityid = d[0][0].innerHTML;
            // console.log(unityid);
            d3.selectAll('path')[0].filter(function(path){
                p=d3.select(path)
                postfix=p[0][0].attributes[0].nodeValue.substring(p[0][0].attributes[0].nodeValue.lastIndexOf(' ')+1)
                if(p.attr('reviewer_actor_id')==unityid){
                    if(postfix=='hidden'){
                        p[0][0].attributes[0].nodeValue=p[0][0].attributes[0].nodeValue.substring(0,p[0][0].attributes[0].nodeValue.lastIndexOf(' '));
                        postfix=p[0][0].attributes[0].nodeValue.substring(p[0][0].attributes[0].nodeValue.lastIndexOf(' ')+1)
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
    
function highlight_nodes(s,e){
//    d3.select(this).select('text').transition()
//        .duration(750)
//        .attr('x', 22)
//        .style('fill', 'steelblue')
//        .style('stroke', 'lightsteelblue')
//        .style('stroke-width', '.5px')
//        .style('font', '20px sans-serif');
    d3.selectAll('text')[0].filter(function(text){
        t=d3.select(text)
        if(t[0][0].textContent==s||t[0][0].textContent==e){
            t.style('fill', 'steelblue');
            t.style('stroke', 'lightsteelblue');
            t.style('stroke-width', '.5px');
            t.style('font', '20px sans-serif');
        }
        
    })
    d3.selectAll('path')[0].filter(function(path){
        p=d3.select(path)
        postfix=p[0][0].attributes[0].nodeValue.substring(p[0][0].attributes[0].nodeValue.lastIndexOf(' ')+1)
        if(p.attr('reviewer_actor_id')==s && p.attr('reviewee_actor_id')==e){
            if(postfix=='hidden'){
                p[0][0].attributes[0].nodeValue=p[0][0].attributes[0].nodeValue.substring(0,p[0][0].attributes[0].nodeValue.lastIndexOf(' '));
                postfix=p[0][0].attributes[0].nodeValue.substring(p[0][0].attributes[0].nodeValue.lastIndexOf(' ')+1)
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
}

d3.selectAll('#horizon-controls input[name=mode]').on('change', function() {
    // console.log(this.value);
    if(this.value=='strong'){
        d3.selectAll('.node')
            .call(function(d){
                console.log(d[0]);
                d[0].forEach(function(n){
                    paths=d3.selectAll('[reviewee_actor_id='+n.__data__.name+']');
                    strong_paths=paths[0].filter(function(d){ return d.attributes[0].nodeValue.match(/onezerozero/); })
                    if(paths[0].length > 0){
                        if(Math.floor((strong_paths.length/paths[0].length)*100)>80){
                            console.log(n.__data__.name + '  Percentage: ' + Math.floor((strong_paths.length/paths[0].length)*100));
                            if (typeof highlight_in == 'function') {
                                highlight_in.apply(n);
                            }
                        }
                    }
                });
            });
    }else if(this.value=='weak'){
        d3.selectAll('.node')
            .call(function(d){
                //console.log(d[0]);
                d[0].forEach(function(n){
                    paths=d3.selectAll('[reviewee_actor_id='+n.__data__.name+']');
                    weak_paths=paths[0].filter(function(d){ return d.attributes[0].nodeValue.match(/fivezero/) || d.attributes[0].nodeValue.match(/twofive/) || d.attributes[0].nodeValue.match(/sevenfive/); })
                    if(paths[0].length > 0){
                        console.log(n.__data__.name + '  Percentage: ' + Math.floor((weak_paths.length/paths[0].length)*100));
                        if(Math.floor((weak_paths.length/paths[0].length)*100)>80){
                            if (typeof highlight_in == 'function') {
                                highlight_in.apply(n);
                            }
                        }
                    }
                });
            });
    }else if(this.value=='easy'){
        d3.selectAll('.node')
            .call(function(d){
                //console.log(d[0]);
                d[0].forEach(function(n){
                    paths=d3.selectAll('[reviewer_actor_id='+n.__data__.name+']');
                    easy_paths=paths[0].filter(function(d){ return d.attributes[0].nodeValue.match(/onezerozero/); })
                    if(paths[0].length > 0){
                        if(Math.floor((easy_paths.length/paths[0].length)*100)>80){
                            //console.log(n.__data__.name + '  Percentage: ' + Math.floor((easy_paths.length/paths[0].length)*100));
                            if (typeof highlight_out == 'function') {
                                highlight_out.apply(n);
                            }
                        }
                    }
                });
            });
    }else if(this.value=='critical'){
        d3.selectAll('.node')
            .call(function(d){
                //console.log(d[0]);
                d[0].forEach(function(n){
                    paths=d3.selectAll('[reviewer_actor_id='+n.__data__.name+']');
                    easy_paths=paths[0].filter(function(d){ return d.attributes[0].nodeValue.match(/fivezero/) || d.attributes[0].nodeValue.match(/twofive/); })
                    if(paths[0].length > 0){
                        console.log(n.__data__.name + '  Percentage: ' + Math.floor((easy_paths.length/paths[0].length)*100));
                        if(Math.floor((easy_paths.length/paths[0].length)*100)>90){
                            
                            if (typeof highlight_out == 'function') {
                                highlight_out.apply(n);
                            }
                        }
                    }
                });
            });
    }else if(this.value=='colludes'){
        // console.log(coll_cyc);
        coll_cyc.forEach(function(coll){
            //console.log(coll)
            c=coll.colluders
            len=c.length
            for(var i = 0; i < len; i++){
                s=c[i%len].id
                e=c[(i+1)%len].id
                //console.log(s+' --> '+e)
                highlight_nodes(s,e)
            }
        });
    }else{
        d3.selectAll('.node')
            .call(function(d){
                d[0].forEach(function(n){
                    unhighlight_in.apply(n);
                });
            });
    }
});
    force.start();
});