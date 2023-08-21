/*
╭━━╮╱╱╱╱╭╮╱╱╱╱╱╭╮╱╭╮╱╱╱╱╱╭╮            ━╮ ╭━
╰┫┣╯╱╱╱╱┃┃╱╱╱╱╭╯╰╮┃┃╱╱╱╱╱┃┃             | |
╱┃┃╭━╮╭━╯┣━━┳━┻╮╭╯┃┃╱╱╭━━┫╰━┳━━╮       ╱ o \
╱┃┃┃╭╮┫╭╮┃┃━┫━━┫┃╱┃┃╱╭┫╭╮┃╭╮┃━━┫      ╱_____\
╭┫┣┫┃┃┃╰╯┃┃━╋━━┃╰╮┃╰━╯┃╭╮┃╰╯┣━━┃     ╱    o  \  
╰━━┻╯╰┻━━┻━━┻━━┻━╯╰━━━┻╯╰┻━━┻━━╯    (__o______)  

Yet another science experiment from Indest Labs.

Recommend viewing in Visual Source Code.
*
*    Gauge.js
*
*    A cool D3.js animated gauge designed by Amelia Wattenberger (thank you). Noteworthy 
*    are the visual cues for the user, gradient fills (hard with arcs), a bubble (circle)
*    indicator, an animated needle that follows the animated fill, a label to provide context
*    (is this value good or not?) and an animated value indicator, all designed to make it
*    easy for the user to quickly comprehend what is happening with the visualization.   
*
*    This visually cool gauge provides context for the view. Refactored from Amelia Wattenberger's
*    React component. See her excellent blog post at: 
*    https://wattenberger.com/blog/gauge
*
*/

class Gauge {

  constructor(_parentElement,{_initialValue = 50, _min = 0, _max = 100} = {}) { //DOM element, data, options?
      
      this.parentElement = _parentElement

      this.initVis()
  }

  initVis() {   // set up attributes and helper functions
      const vis = this
      vis.TAU = 2 * Math.PI; // http://TAUday.com/TAU-manifesto //candidate for a global variable
      vis.value = 50 //initial value (50%)
      vis.min = 0
      vis.max = 100
      vis.data = []
      vis.roundedness = 1  // amount of roundedness for arc beginnings and endings
 
      vis.arc = d3.arc()
            .cornerRadius(vis.roundedness) // round the ends of the arcs
      
      vis.backgroundArc = d3.arc() // this will be static
          .innerRadius(0.65) //inner & outer radii are sized according to the viewBox
          .outerRadius(1)
          .startAngle(-Math.PI / 2)
          .endAngle(Math.PI / 2)
          .cornerRadius(vis.roundedness)

      vis.percentScale = d3.scaleLinear() // from 0 - 100 to 0 - 1
          .domain([vis.min, vis.max])
          .range([0, 1])
    
      vis.angleScale = d3.scaleLinear()
          .domain([0, 1]) // this range driven by vis.percentScale above
          .range([-Math.PI / 2, Math.PI / 2]) // 9 o'clock to 3 o'clock (radians)
          .clamp(true) // can't exceed the specified values of scale

      // main variable - drives fill, bubble and needle
      vis.angle = vis.angleScale(vis.percentScale(vis.value)) 
    
      vis.colorScale = d3.scaleLinear() // can interpolate colors in d3
          .domain([0, 1])
          .range(["#dbdbe7", "#4834d4"]) // colors here are purple

      // create gradient steps, tricky with paths (11 steps); note ticks is a method of d3.scaleLinear
      vis.gradientSteps = vis.colorScale.ticks(10).map(value => vis.colorScale(value))

      vis.markerLocation = vis.getCoordsOnArc(vis.angle, 1 - ((1 - 0.65) / 2)) // nice job of positioning, Amelia
      console.log(vis.markerLocation)
// note: https://chartio.com/resources/tutorials/how-to-resize-an-svg-when-the-window-is-resized-in-d3-js/

      vis.svg = d3.select(vis.parentElement)
        .append("svg")
          .attr("preserveAspectRatio", "xMinYMin meet")
          .style('overflow', 'visible')
          .attr('width','9em')
          .attr('viewBox', '-1, -1, 2, 1')  // create our own coordinate system, nice trick
          .attr('transform', 'translate(20, 60)') // candidate for initial coordinate position
          
      vis.defs = vis.svg.append('defs')

      const gradient = vis.defs.append('linearGradient')
        .attr('id','Gauge__gradient')
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1','-1')
        .attr('x2','1')
        .attr('y2','0')

      vis.gradientSteps.map((color, index) => ( // gradientSteps initialized above, 11 colors
        gradient.append("stop")
          .attr('stop-color', color)
          .attr('offset', `${index / (vis.gradientSteps.length - 1)}`) // 0 - 100%
      ))

      vis.svg.append('path') // static background arc
        .attr('d', vis.backgroundArc)
        .attr('fill', '#dbdbe7')

      vis.svg.append('line') // a little static vertical line, a visual cue to show the half-way mark
        .attr('x1', 0)
        .attr('y1', -1)
        .attr('x2', 0)
        .attr('y2', -0.65)
        .style('stroke', 'white')
        .style('stroke-width', 0.027)

      // this is the pointer in the center of the gauge (svg definition was output from Figma)
      vis.indicatorNeedle = vis.svg.append('path') // another dynamic visual cue to show value on gauge
        .attr('d',
          "M0.136364 0.0290102C0.158279 -0.0096701 0.219156 -0.00967009 0.241071 0.0290102C0.297078 0.120023 0.375 0.263367 0.375 0.324801C0.375 0.422639 0.292208 0.5 0.1875 0.5C0.0852272 0.5 -1.8346e-08 0.422639 -9.79274e-09 0.324801C0.00243506 0.263367 0.0803571 0.120023 0.136364 0.0290102ZM0.1875 0.381684C0.221591 0.381684 0.248377 0.356655 0.248377 0.324801C0.248377 0.292947 0.221591 0.267918 0.1875 0.267918C0.153409 0.267918 0.126623 0.292947 0.126623 0.324801C0.126623 0.356655 0.155844 0.381684 0.1875 0.381684Z")          
        .attr('fill', '#6a6a85') // nice dark gray
        .attr('transform',
            `rotate(${vis.angle * (180 / Math.PI)}) translate(-0.2, -0.34)`) // move arrow left          
        // and up to rotate around the middle dot instead of our arrow's top left corner

      vis.gaugeCounter = vis.svg // a numerical visual cue
          .append('text')
            .attr('transform', 'translate(0, .95)')
          .style('font-feature-settings', 'zero') // this font supports a slash in zero
          .style('font-feature-settings', 'tnum') // digits are mono-spaced
          .style('text-anchor', 'middle' ) // centered
          .style('font-size'  , '.05em')  // nice size for visibility
          .style('font-weight', '900') // make it big
          .style('fill', '#8b8ba7')
          .text(vis.value) // initial value of gauge

      vis.formatNumber = d3.format(",")

      vis.gaugeLabel = vis.svg.append('text') // label showing context - e.g.,bad, good, best
        .attr('transform', 'translate(0, -1.25)')
        .style('font-size', '.02em')
        .style('font-weight', '600')
        .style('text-anchor', 'middle')
        .style('fill', '#8b8ba7')
        .text('Good')

      vis.gaugeUnits = vis.svg.append('text') // label showing units
        .attr('transform', 'translate(0.0, 1.25)')
        .style('font-size', '.015em')
        .style('font-weight', '200')
        .style('text-anchor', 'middle')
        .style('fill', '#8b8ba7')
        .text('percent')

        vis.wrangleData()  // call wrangleData
      
    } // end of initVis
 
    wrangleData() {
      
      const vis = this
      vis.data.push({
              id: 'myGauge',
              startAngle: -Math.PI / 2,
              endAngle: vis.angle,
              innerRadius: 0.65,
              outerRadius: 1,
              fill: 'url(#Gauge__gradient)'
            })
      vis.svg.selectAll(vis.parentElement)
          .data(vis.data)
          .join(
            (enter) => {
              return enter
                .append('path')
                  .attr('id', d => d.id)
                  .attr('d', vis.arc)
                  .style('fill', d => d.fill)
          },
          (update) => {
            return update 

          },
          (exit) => {
            return exit.remove()
          }
    )
    vis.indicatorBubble = vis.svg.append('circle') // another dynamic visual cue to show value of gauge
      .attr('cx', vis.markerLocation[0])
      .attr('cy', vis.markerLocation[1])
      .attr('r', '0.2')
      .style('stroke','#2c3e50')
      .style('stroke-width','0.01')
      .style('fill', vis.colorScale(vis.percent))
    
    } // end of wrangleData()
    
    updateVis(value) { // update arc and circle and needle
      const vis = this
      vis.angle = vis.angleScale(vis.percentScale(value)) // refresh angle
 
      vis.markerLocation = vis.getCoordsOnArc(vis.angle, 1 - ((1 - 0.65) / 2))

      vis.indicatorBubble // update the bubble / circle indicator
        .attr('cx', vis.markerLocation[0])
        .attr('cy', vis.markerLocation[1])
        .attr('fill', vis.colorScale(vis.percentScale(value)))
      
      vis.indicatorNeedle // move the needle
        .attr('transform', `rotate(${vis.angle * (180 / Math.PI)}) translate(-0.2, -0.34)`)
      vis.gaugeCounter.text(value) // update the counter
      const threshold = d3.scaleThreshold()
        .domain([25, 40, 50, 70, 80, 90])
        .range(["Not so good", "Try harder", "So so", "Okay", "Better", "Good", "Great!"])
 
      vis.gaugeLabel.text(threshold(value))

      vis.svg.select('#myGauge')
        .transition()
          .duration(0)
          .attrTween('d', d => vis.arcTween(d, vis.angle)) // value scaled to radians  
    } // end of updateVis()

    arcTween(d, new_endAngle) {
      const vis = this
      let interpolate_end = d3.interpolate(d.endAngle, new_endAngle)
        return (t) => {
          d.endAngle = interpolate_end(t)
          return vis.arc(d) 
      }
     
    } // end of arcTween()
    
    getCoordsOnArc(angle, offset=10) { 
      return [ // returns an array
      Math.cos(angle - (Math.PI / 2)) * offset,
      Math.sin(angle - (Math.PI / 2)) * offset
    ] }

    getDimensions(selection) {
      let dimensions = null
      let node = selection.node()
  
      if (node instanceof SVGElement) {
        dimensions = node.getBBox()
        console.log('getting BBox')
      } else {
        dimensions = node.getBoundingClientRect()
      }
      console.log('in compute', dimensions.height, dimensions.width)
      return dimensions
    }
}
