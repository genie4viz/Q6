var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var poverty_map = d3.map();
var detail_map = d3.map();

var path = d3.geoPath();

var tip = d3.tip().attr('class', 'd3-tip').html(function(d) { return d; });

var x = d3.scaleLinear()
    .domain([1, 10])
    .rangeRound([100, 300]);

var color = d3.scaleThreshold()
    .domain(d3.range(2, 10))
    .range(d3.schemeBlues[9]);

var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(930,240)");

g.selectAll("rect")
    .data(color.range().map(function (d) {
        d = color.invertExtent(d);
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
    }))
    .enter().append("rect")
    .attr("width", 8)
    .attr("y", function (d) {        
        return x(d[0]);
    })
    .attr("height", function (d) {
        return x(d[1]) - x(d[0]);
    })
    .attr("fill", function (d) {
        return color(d[0]);
    });

g.append("text")
    .attr("class", "caption")
    .attr("x", -40)
    .attr("y", 80)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Poverty map rate");

g.call(d3.axisLeft(x)
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
        poverty_map.set(d.CensusId, +d.Poverty);
        poverty_map.set(d.CensusId + "_state", d.State);
        poverty_map.set(d.CensusId + "_county", d.County);
    }),
    d3.csv("county_detail.csv", function (d) {

        detail_map.set(d.CensusId + "_total", +d.TotalPop);
        detail_map.set(d.CensusId + "_income", +d.IncomePerCap);
    })
]

Promise.all(promises).then(ready);

function ready([us]) {    
    svg.append("g")
        .attr("class", "counties")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
        .attr("fill", function (d) {
            d.Poverty = poverty_map.get(d.id);
            d.State = poverty_map.get(d.id + "_state");
            d.County = poverty_map.get(d.id + "_county");
            d.TotalPop = detail_map.get(d.id + "_total");
            d.IncomePerCap = detail_map.get(d.id + "_income");
            return color(d.Poverty);
        })
        .attr("d", path)
        .call(tip)
        .on('mouseover', function (d) {            
            var strInner = d.State + `<br>` + d.County + `<br>` + d.Poverty + `%<br>` + d.TotalPop + `<br>` + d.IncomePerCap;
            tip.show(strInner);
        });

    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, function (a, b) {
            return a !== b;
        }))
        .attr("class", "states")
        .attr("d", path);
}