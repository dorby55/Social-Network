// src/components/stats/GroupsByMembersChart.js
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getGroupsByMembers } from "../../services/api";

const GroupsByMembersChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const svgRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const chartData = await getGroupsByMembers();
        // Sort by member count and take top 10
        const sortedData = chartData
          .sort((a, b) => b.memberCount - a.memberCount)
          .slice(0, 10);
        setData(sortedData);
        setError(null);
      } catch (err) {
        setError("Error loading chart data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (data.length === 0 || loading) return;

    // Clear any existing chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Set dimensions
    const margin = { top: 20, right: 180, bottom: 40, left: 100 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([0, height])
      .padding(0.1);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.memberCount)])
      .nice()
      .range([0, width]);

    // Add axes
    svg.append("g").call(d3.axisLeft(y));

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Define color scale based on privacy
    const colorScale = d3
      .scaleOrdinal()
      .domain([true, false])
      .range(["#ff9999", "#66b3ff"]);

    // Add bars
    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d) => y(d.name))
      .attr("x", 0)
      .attr("height", y.bandwidth())
      .attr("width", 0)
      .attr("fill", (d) => colorScale(d.isPrivate))
      .transition()
      .duration(1000)
      .attr("width", (d) => x(d.memberCount));

    // Add group count labels
    svg
      .selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("y", (d) => y(d.name) + y.bandwidth() / 2 + 5)
      .attr("x", (d) => x(d.memberCount) + 5)
      .text((d) => d.memberCount)
      .attr("font-size", "12px")
      .attr("fill", "black");

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 0 - margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("Top Groups by Member Count");

    // Add legend
    const legend = svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .selectAll("g")
      .data([
        { label: "Private Groups", color: colorScale(true) },
        { label: "Public Groups", color: colorScale(false) },
      ])
      .enter()
      .append("g")
      .attr("transform", (d, i) => `translate(${width + 20},${i * 20})`);

    legend
      .append("rect")
      .attr("x", 0)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", (d) => d.color);

    legend
      .append("text")
      .attr("x", 20)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text((d) => d.label);
  }, [data, loading]);

  if (loading) {
    return <div className="loading">Loading chart...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (data.length === 0) {
    return <div className="empty-chart">No data available</div>;
  }

  return (
    <div className="chart-container">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default GroupsByMembersChart;
