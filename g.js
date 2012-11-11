
function init_graph(data) {
  $.get('https://saleiva-beta.cartodb.com/api/v1/sql?q=select%20*%20from%20diseases_groups_legend', function(dataColor)  {
    var colors = dataColor.rows.map(function(d) {
      return {
        color: d.color,
        name: d.name,
        group_id: d.identifier
      }
    });
    graph(data, colors);
  });
}

 

function graph(data, dataColor) {

  var colors_ = {};
  dataColor.forEach(function(d) {
    colors_[d.identifier] = d.color;
  });
  /* Another layer generator using gamma distributions. */
  function stream_layers(n, m) {
   return d3.range(n).map(function(group) {
     return d3.range(m).map(function(j) {
         var c = dataColor[group];

         var a = data.first().time.getTime();
         var b = data.last().time.getTime();
         var time = a + (j/m)*(b - a);
         var act = data.getActiveEarthquakes(time);
         //get for group
         var count = 0;
         for(var a in act) {
           var dis = act[a];
           if(dis.data.group_id == c.group) {
             ++count;
           }
         }
         return [count, c.color];
        
       }).map(stream_index);
     });
  }
  function stream_index(d, i) {
    return {x: i, y: Math.max(0, d[0]), color: d[1]};
  }

  var n = dataColor.length,
     m = data.size()/100,
     data = d3.layout.stack()(stream_layers(n, m)),
     color = d3.interpolateRgb("#aad", "#556");
 
 var margin = 20,
     width = $(window).width(),
     height = 200 - .5 - margin,
     mx = m,
     my = d3.max(data, function(d) {
       return d3.max(d, function(d) {
         return d.y0 + d.y;
       });
     }),
     mz = d3.max(data, function(d) {
       return d3.max(d, function(d) {
         return d.y;
       });
     }),
     x = function(d) { return d.x * width / mx; },
     y0 = function(d) { return height - d.y0 * height / my; },
     y1 = function(d) { return height - (d.y + d.y0) * height / my; },
     y2 = function(d) { return d.y * height / mz; }; // or `my` to not rescale
 
 var vis = d3.select("#chart")
   .append("svg")
     .attr("width", $(window).width())
     .attr("height", height + margin);
 
 var layers = vis.selectAll("g.layer")
     .data(data)
   .enter().append("g")
     .style("fill", function(d, i) { 
       //return color(i / (n - 1)); 
       return d[i].color;
      })
     .style("fill-opacity", '0.5')
     .attr("class", "layer");
 
 var bars = layers.selectAll("g.bar")
     .data(function(d) { return d; })
   .enter().append("g")
     .attr("class", "bar")
     .attr("transform", function(d) { return "translate(" + x(d) + ",0)"; });
 
 bars.append("rect")
     .attr("width", x({x: .9}))
     .attr("x", 0)
     .attr("y", height)
     .attr("height", 0)
   .transition()
     .delay(function(d, i) { return i * 10; })
     .attr("y", y1)
     .attr("height", function(d) { return y0(d) - y1(d); });
 
 /*var labels = vis.selectAll("text.label")
     .data(data[0])
   .enter().append("text")
     .attr("class", "label")
     .attr("x", x)
     .attr("y", height + 6)
     .attr("dx", x({x: .45}))
     .attr("dy", ".71em")
     .attr("text-anchor", "middle")
     .text(function(d, i) { return i; });
     */
 
 /*
 vis.append("line")
     .attr("x1", 0)
     .attr("x2", width - x({x: .1}))
     .attr("y1", height)
     .attr("y2", height);
     */
 
 function transitionGroup() {
   var group = d3.selectAll("#chart");
 
   group.select("#group")
       .attr("class", "first active");
 
   group.select("#stack")
       .attr("class", "last");
 
   group.selectAll("g.layer rect")
     .transition()
       .duration(500)
       .delay(function(d, i) { return (i % m) * 10; })
       .attr("x", function(d, i) { return x({x: .9 * ~~(i / m) / n}); })
       .attr("width", x({x: .9 / n}))
       .each("end", transitionEnd);
 
   function transitionEnd() {
     d3.select(this)
       .transition()
         .duration(500)
         .attr("y", function(d) { return height - y2(d); })
         .attr("height", y2);
   }
 }
 
 function transitionStack() {
   var stack = d3.select("#chart");
 
   stack.select("#group")
       .attr("class", "first");
 
   stack.select("#stack")
       .attr("class", "last active");
 
   stack.selectAll("g.layer rect")
     .transition()
       .duration(500)
       .delay(function(d, i) { return (i % m) * 10; })
       .attr("y", y1)
       .attr("height", function(d) { return y0(d) - y1(d); })
       .each("end", transitionEnd);
 
   function transitionEnd() {
     d3.select(this)
       .transition()
         .duration(500)
         .attr("x", 0)
         .attr("width", x({x: .9}));
   }
 }

 return function(t) {
   var a = data.first().time.getTime();
   var b = data.last().time.getTime();
   var idx = ((t - a)/(b - a)*data.size())>>0;

 }
}

