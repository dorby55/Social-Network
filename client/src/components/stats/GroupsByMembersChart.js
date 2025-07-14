import { useEffect, useRef, useState } from "react";
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
        const sortedData = chartData
          .sort((a, b) => b.memberCount - a.memberCount)
          .slice(0, 8);
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

    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 120, bottom: 40, left: 120 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([0, height])
      .padding(0.2);

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.memberCount)])
      .nice()
      .range([0, width]);

    const colorScale = d3
      .scaleOrdinal()
      .domain([true, false])
      .range(["#EF4444", "#10B981"]);

    const defs = svg.append("defs");

    data.forEach((d, i) => {
      const gradient = defs
        .append("linearGradient")
        .attr("id", `barGradient${i}`)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("x2", xScale(d.memberCount))
        .attr("y1", 0)
        .attr("y2", 0);

      const baseColor = colorScale(d.isPrivate);
      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", baseColor)
        .attr("stop-opacity", 0.7);

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", baseColor)
        .attr("stop-opacity", 1);
    });

    g.selectAll(".grid-line")
      .data(xScale.ticks(5))
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3");

    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d) => yScale(d.name))
      .attr("x", 0)
      .attr("height", yScale.bandwidth())
      .attr("width", 0)
      .attr("fill", (d, i) => `url(#barGradient${i})`)
      .attr("rx", 6)
      .style("cursor", "pointer")
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr("width", (d) => xScale(d.memberCount));

    g.selectAll(".bar")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", 0.8)
          .attr("stroke", "#374151")
          .attr("stroke-width", 2);

        const tooltip = g
          .append("g")
          .attr("class", "tooltip")
          .attr(
            "transform",
            `translate(${xScale(d.memberCount) + 10}, ${
              yScale(d.name) + yScale.bandwidth() / 2
            })`
          );

        const tooltipBg = tooltip
          .append("rect")
          .attr("x", 0)
          .attr("y", -15)
          .attr("width", 100)
          .attr("height", 30)
          .attr("fill", "rgba(0, 0, 0, 0.8)")
          .attr("rx", 4);

        tooltip
          .append("text")
          .attr("x", 50)
          .attr("y", 5)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .text(`${d.memberCount} members`);
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", 1)
          .attr("stroke", "none");

        g.select(".tooltip").remove();
      });

    g.selectAll(".bar-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .attr("y", (d) => yScale(d.name) + yScale.bandwidth() / 2)
      .attr("x", (d) => xScale(d.memberCount) + 5)
      .attr("dy", "0.35em")
      .attr("fill", "#374151")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .style("opacity", 0)
      .text((d) => d.memberCount)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100 + 500)
      .style("opacity", 1);

    g.append("g")
      .call(d3.axisLeft(yScale))
      .style("font-size", "12px")
      .style("color", "#374151")
      .selectAll("text")
      .style("font-weight", "500");

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .style("font-size", "12px")
      .style("color", "#6b7280");

    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 5)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#6b7280")
      .text("Number of Members");

    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        `translate(${width + margin.left + 20}, ${margin.top + 20})`
      );

    const legendData = [
      { label: "Public Groups", color: colorScale(false), isPrivate: false },
      { label: "Private Groups", color: colorScale(true), isPrivate: true },
    ];

    const legendItems = legend
      .selectAll(".legend-item")
      .data(legendData)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 25})`);

    legendItems
      .append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", (d) => d.color)
      .attr("rx", 3);

    legendItems
      .append("text")
      .attr("x", 20)
      .attr("y", 12)
      .style("font-size", "12px")
      .style("fill", "#374151")
      .style("font-weight", "500")
      .text((d) => d.label);

    g.selectAll(".domain").style("stroke", "#d1d5db");

    g.selectAll(".tick line").style("stroke", "#d1d5db");
  }, [data, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center text-red-600">
          <span className="text-4xl mb-4 block">📊</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center text-gray-500">
          <span className="text-4xl mb-4 block">👥</span>
          <p>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <svg
        ref={svgRef}
        className="w-full"
        style={{ maxWidth: "100%", height: "auto" }}
      ></svg>
    </div>
  );
};

export default GroupsByMembersChart;
