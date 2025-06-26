import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getPostsPerMonth } from "../../services/api";

const PostsPerMonthChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const svgRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const chartData = await getPostsPerMonth();
        setData(chartData);
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

    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.month))
      .range([0, width])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count)])
      .nice()
      .range([height, 0]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    svg.append("g").call(d3.axisLeft(y));

    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.month))
      .attr("y", (d) => y(0))
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", "steelblue")
      .transition()
      .duration(1000)
      .attr("y", (d) => y(d.count))
      .attr("height", (d) => height - y(d.count));

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 0 - margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("Posts per Month");
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

export default PostsPerMonthChart;
