'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { MarginalRateData, StreamgraphDataPoint } from '../lib/calculators/MarginalRateCalculator'

interface StreamgraphProps {
  data: MarginalRateData[]
  width?: number
  height?: number
  className?: string
  language?: 'fr' | 'en'
}

interface StreamgraphSeries {
  key: string
  values: Array<{
    income: number
    value: number
    y0: number
    y1: number
  }>
}

const COMPONENT_LABELS = {
  fr: {
    rrq: 'RRQ',
    assurance_emploi: 'Assurance emploi',
    rqap: 'RQAP',
    fss: 'FSS',
    ramq: 'RAMQ',
    quebec_income_tax: 'Impôt Québec',
    federal_income_tax: 'Impôt fédéral'
  },
  en: {
    rrq: 'QPP',
    assurance_emploi: 'Employment Insurance',
    rqap: 'QPIP',
    fss: 'HSF',
    ramq: 'RAMQ',
    quebec_income_tax: 'Quebec Tax',
    federal_income_tax: 'Federal Tax'
  }
}

const COMPONENT_COLORS = {
  rrq: '#1f77b4',
  assurance_emploi: '#ff7f0e',
  rqap: '#2ca02c',
  fss: '#d62728',
  ramq: '#9467bd',
  quebec_income_tax: '#8c564b',
  federal_income_tax: '#e377c2'
}

export const Streamgraph: React.FC<StreamgraphProps> = ({
  data,
  width = 800,
  height = 400,
  className = '',
  language = 'fr'
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    content: string
  }>({ visible: false, x: 0, y: 0, content: '' })

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Set up dimensions and margins
    const margin = { top: 20, right: 120, bottom: 40, left: 60 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Prepare data for d3.stack
    const components = ['rrq', 'assurance_emploi', 'rqap', 'fss', 'ramq', 'quebec_income_tax', 'federal_income_tax']
    
    // Transform data to the format expected by d3.stack
    const stackData = data.map(d => ({
      income: d.income,
      ...d.components
    }))

    // Create stack generator
    const stack = d3.stack<any>()
      .keys(components)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetWiggle) // Creates the streamgraph effect

    const series = stack(stackData)

    // Set up scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.income) as [number, number])
      .range([0, chartWidth])

    const yExtent = d3.extent(series.flat().map(d => [d[0], d[1]]).flat()) as [number, number]
    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([chartHeight, 0])

    // Create area generator
    const area = d3.area<any>()
      .x(d => xScale(d.data.income))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveBasis)

    // Create color scale
    const colorScale = d3.scaleOrdinal<string>()
      .domain(components)
      .range(components.map(c => COMPONENT_COLORS[c as keyof typeof COMPONENT_COLORS]))

    // Draw the streamgraph layers
    const layers = g.selectAll('.layer')
      .data(series)
      .enter().append('g')
      .attr('class', 'layer')

    layers.append('path')
      .attr('d', area)
      .attr('fill', (d, i) => colorScale(components[i]))
      .attr('stroke', 'none')
      .attr('opacity', 0.8)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1)
        
        const [mouseX, mouseY] = d3.pointer(event, svg.node())
        const component = components[series.indexOf(d)]
        const labels = COMPONENT_LABELS[language]
        
        setTooltip({
          visible: true,
          x: mouseX,
          y: mouseY,
          content: labels[component as keyof typeof labels] || component
        })
      })
      .on('mousemove', function(event) {
        const [mouseX, mouseY] = d3.pointer(event, svg.node())
        setTooltip(prev => ({
          ...prev,
          x: mouseX,
          y: mouseY
        }))
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8)
        setTooltip(prev => ({ ...prev, visible: false }))
      })

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat((d) => `${d3.format(',.0f')(d as number)}$`)
      .ticks(6)

    const yAxis = d3.axisLeft(yScale)
      .tickFormat((d) => `${((d as number) * 100).toFixed(1)}%`)
      .ticks(5)

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '12px')
      .style('font-family', 'ui-sans-serif, system-ui, sans-serif')

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '12px')
      .style('font-family', 'ui-sans-serif, system-ui, sans-serif')

    // Add axis labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (chartHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-family', 'ui-sans-serif, system-ui, sans-serif')
      .style('fill', '#374151')
      .text(language === 'fr' ? 'Taux marginal d\'imposition' : 'Marginal Tax Rate')

    g.append('text')
      .attr('transform', `translate(${chartWidth / 2}, ${chartHeight + margin.bottom - 5})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-family', 'ui-sans-serif, system-ui, sans-serif')
      .style('fill', '#374151')
      .text(language === 'fr' ? 'Revenu brut de travail' : 'Gross Employment Income')

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - margin.right + 10}, ${margin.top})`)

    const legendItems = legend.selectAll('.legend-item')
      .data(components.filter(c => !['quebec_income_tax', 'federal_income_tax', 'rqap', 'fss'].includes(c))) // Only show implemented components
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`)

    legendItems.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', d => COMPONENT_COLORS[d as keyof typeof COMPONENT_COLORS])
      .attr('opacity', 0.8)

    legendItems.append('text')
      .attr('x', 25)
      .attr('y', 9)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('font-family', 'ui-sans-serif, system-ui, sans-serif')
      .style('fill', '#374151')
      .text(d => COMPONENT_LABELS[language][d as keyof typeof COMPONENT_LABELS[typeof language]])

  }, [data, width, height, language])

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="bg-white border border-gray-300 rounded-lg shadow-sm"
      />
      {tooltip.visible && (
        <div
          className="absolute pointer-events-none z-10 bg-gray-900 text-white text-sm rounded px-2 py-1"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  )
}