
var svg = d3.select('.container')
    .append('svg')
    .attr('height', 1000)
    .attr('width', 1200)
    .append('g')
    .attr('transform','translate(50,50)');

var diameter = 900;

var TRWhite = '#FFFFFF',
    TRDarkPurple  = '#621F95',
    TRMutedGray = '#D0D0D0',
    TRDarkGray = '#4D4D4D';

var scaleColor = d3.scaleLinear()
    .domain([1,2,3,4,5])
    .range(['#d1c8e9','#b29fd7','#9576c3','#7b4dad',TRDarkPurple])


var scaleColorPct = d3.scaleThreshold()
    .domain([0.2,0.4,0.6,0.8,1])
    .range(['#d1c8e9','#b29fd7','#9576c3','#7b4dad',TRDarkPurple])

var scaleColorViewer = d3.scaleLinear()
    .range(['#d1c8e9',TRDarkPurple])

//import data
d3.queue()
  .defer(d3.csv,'data/WorldCup_PopAudience_0515.csv', parse)
  .await(dataLoaded);
 
function dataLoaded(err, fans) {

   var filteredFans = fans.filter(function(d){return d.attr == 'Country'})
       filteredFans = filteredFans.filter(function(d){ return d.pct_viewership < 1})

   popRange = d3.extent(filteredFans, d => d.population)

   //Set interval by the range between 0 and max
   min = popRange[0]
   max = popRange[1]

   arrPop = filteredFans.map(d => d.population)
   arrViewer = filteredFans.map(d => d.viewership)

   scaleColorViewer.domain(d3.extent(filteredFans, d => d.viewership))

   // var scaleColor = d3.scaleThreshold()
   //     .domain(ss.jenks(arrPop,5))
   //     .range(d3.range(5).map(function(i){return 'q'+ i + '-5'; }));

    console.log(ss.jenks(arrPop,5))
   //  console.log(d3.range(5).map(function(i){return 'q'+ i + '-5'; }))

   //Nest the data
   var nest = d3.nest()
       .key(d => d.region)
       .entries(filteredFans)

   var obj = { name: 'viewership', children: [] }
   for(var n in nest){
     var arr = nest[n].values.map(d => {
        return { name: d.name,
                 code: d.code, 
                 size: d.viewership, 
                 pop: d.population,
                 color: d.pct_viewership, 
                 region: d.region,
                 group: d.group }
        })
     //console.log(arr)

     obj.children.push({
        name: nest[n].key,
        children: arr
     })
   }

   //console.log(obj)

   var pack = d3.pack()
       .size([diameter - 10, diameter - 10])
       .padding(10)

   var root = d3.hierarchy(obj)
       .sum(function(d) {  return d.size; }) // sized by audience
       // .sum(function(d) {  return d.pop; }) // sized by population
       //.sum(function(d) { return d.color}) // sized by pct
       .sort(function(a, b) { return b.value - a.value; });

   // console.log(root);

   var data = pack(root).descendants(),
       circlePositions = {};   

   var node = svg.selectAll('.node')
       .data(data)
       .enter()
       .append('g')
       .attr('class', d => {
         circlePositions[d.data.name] = {x: d.x, y:d.y}
         return d.children ? 'node' : 'leaf node';
       })
       .attr('transform', d =>{
         circlePositions[d.data.name] = {x: d.x, y:d.y}
         return `translate(${d.x},${d.y})`
       })
     
   node.append('circle')
       .attr('id', d => 'circle_' + d.data.name)
       // .attr('class', d => scaleColor(d.data.pop))
       .attr('r', d => d.r)
       .style('fill', d => {
          if(d.data.color == 'null'){
            return 'none';
          } else if(d.data.color == 0){
            return TRMutedGray;
          } else if(d.data.name == 'viewership' || 
            d.data.name == 'Africa' || 
            d.data.name == 'Middle East' ||
            d.data.name == 'North, Central America & Caribbean' || 
            d.data.name == 'Europe' || d.data.name == 'South America' || 
            d.data.name == 'Asia' || d.data.name == 'Oceania' || 
            d.data.name == 'French Overseas Territories'){
            return 'none';
          // } else if
          //   (d.data.name == 'Syria' || 
          //   d.data.name == 'Bahrain' ||
          //   d.data.name == 'Iraq' || 
          //   d.data.name == 'Jordan' || d.data.name == 'Kuwait' || 
          //   d.data.name == 'Lebanon' || d.data.name == 'Oman' || 
          //   d.data.name == 'Palestine' || d.data.name == 'Qatar' ||
          //   d.data.name == 'Saudi Arabia' || d.data.name == 'Yemen'){

          //   var t = textures.lines()
          //       .lighter()
          //       .size(8);

          //   svg.call(t);

          //   return t.url();
          } else {

            return scaleColorPct(d.data.color) // colored by pct
            // return scaleColor(d.data.group)   //colored by population group  
            // return scaleColorViewer(d.data.size) // colored by viewer
          }
       })
       .style('fill-opacity', 1)
       .style('stroke', d => {
          if(d.data.name == 'viewership' || 
            d.data.name == 'Africa' || 
            d.data.name == 'Middle East' ||
            d.data.name == 'North, Central America & Caribbean' || 
            d.data.name == 'Europe' || d.data.name == 'South America' || 
            d.data.name == 'Asia' || d.data.name == 'Oceania' || 
            d.data.name == 'French Overseas Territories'){
            return TRMutedGray
          } else {
            return 'none'
          }
       })
       .on('mouseover', d => console.log(d.data.name, d.data.pop))
 

   node.append('text')
       .attr('transform', d =>{
         circlePositions[d.data.name] = {x: d.x, y:d.y}
         return 'translate('+ d.x-300 + ',' + d.y-300 +')'
       })
       // .text(d => { 
       //   //audience > 20 millions
       //   if(d.data.size > 10000000 || d.data.color > 0.6 || d.data.color < 0.4){ return d.data.name}
       // })
       .text(d => { 
         //audience > 20 millions
         if(d.data.size > 10000000){ return d.data.name}
         // if(d.data.color > 0.2){return d.data.name}
       })       
       .style('font-size', '11px')
       .style('text-anchor','middle')
       .style('fill', d => {if(d.data.color > 0.6){return TRWhite} else{return TRDarkGray}})
       //.style('fill',d => {if(d.data.size > 50000000){ return TRWhite} else {return TRDarkGray}})
}



function parse(d){
	return{
		name: d['name_displayed'],
		code: d['country_code'],
		population: +d['pop_2014'],
		viewership: +d['audience_2014'],
		pct_viewership: +d['pct_audience_2014'],
		region: d['region'],
    attr: d['attribute'],
    group: +d['group']
	}
}



