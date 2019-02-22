var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var poverty_map = d3.map();
var detail_map = d3.map();

var path = d3.geoPath();

var x = d3.scaleLinear()
    .domain([1, 10])
    .rangeRound([600, 860]);

var color = d3.scaleThreshold()
    .domain(d3.range(2, 10))
    .range(d3.schemeBlues[9]);

var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(0,40)");

g.selectAll("rect")
    .data(color.range().map(function (d) {
        d = color.invertExtent(d);
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
    }))
    .enter().append("rect")
    .attr("height", 8)
    .attr("x", function (d) {
        return x(d[0]);
    })
    .attr("width", function (d) {
        return x(d[1]) - x(d[0]);
    })
    .attr("fill", function (d) {
        return color(d[0]);
    });

g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("poverty_map rate");

g.call(d3.axisBottom(x)
        .tickSize(13)
        .tickFormat(function (x, i) {
            return i ? x : x + "%";
        })
        .tickValues(color.domain()))
    .select(".domain")
    .remove();

var promises = [
    d3.json("us.json"),
    d3.csv("county_poverty.csv", function (d) {
        // console.log(d);
        poverty_map.set(d.id, +d.CensusId);
    }),
    d3.csv("county_detail.csv", function (d) {        
        detail_map.set(d.id, +d.CensusId);
    })
]

Promise.all(promises).then(ready);

function ready([us]) {
    console.log([us]);
    svg.append("g")
        .attr("class", "counties")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
        .attr("fill", function (d) {
            return color(d.rate = poverty_map.get(d.id));
        })
        .attr("d", path)
        .append("title")
        .text(function (d) {
            return d.rate + "%";
        });

    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, function (a, b) {
            return a !== b;
        }))
        .attr("class", "states")
        .attr("d", path);
}