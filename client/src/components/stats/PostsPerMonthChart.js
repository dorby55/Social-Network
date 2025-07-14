import { useEffect, useRef, useState } from "react";
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

  const formatMonth = (monthString) => {
    const [month, year] = monthString.split("/");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${monthNames[parseInt(month) - 1]} ${year.slice(-2)}`;
  };

  useEffect(() => {
    if (data.length === 0 || loading) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const defs = svg.append("defs");

    const gradient = defs
      .append("linearGradient")
      .attr("id", "areaGradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", height)
      .attr("x2", 0)
      .attr("y2", 0);

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3B82F6")
      .attr("stop-opacity", 0.1);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3B82F6")
      .attr("stop-opacity", 0.8);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const processedData = data.map((d) => ({
      ...d,
      formattedMonth: formatMonth(d.month),
    }));

    const xScale = d3
      .scaleBand()
      .domain(processedData.map((d) => d.formattedMonth))
      .range([0, width])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(processedData, (d) => d.count)])
      .nice()
      .range([height, 0]);

    const line = d3
      .line()
      .x((d) => xScale(d.formattedMonth) + xScale.bandwidth() / 2)
      .y((d) => yScale(d.count))
      .curve(d3.curveCardinal);

    const area = d3
      .area()
      .x((d) => xScale(d.formattedMonth) + xScale.bandwidth() / 2)
      .y0(height)
      .y1((d) => yScale(d.count))
      .curve(d3.curveCardinal);

    g.selectAll(".grid-line")
      .data(yScale.ticks(5))
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3");

    g.append("path")
      .datum(processedData)
      .attr("fill", "url(#areaGradient)")
      .attr("d", area)
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 1);

    const path = g
      .append("path")
      .datum(processedData)
      .attr("fill", "none")
      .attr("stroke", "#3B82F6")
      .attr("stroke-width", 3)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);

    const totalLength = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1500)
      .attr("stroke-dashoffset", 0);

    g.selectAll(".dot")
      .data(processedData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => xScale(d.formattedMonth) + xScale.bandwidth() / 2)
      .attr("cy", (d) => yScale(d.count))
      .attr("r", 0)
      .attr("fill", "#3B82F6")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .transition()
      .delay((d, i) => i * 100)
      .duration(500)
      .attr("r", 5);

    g.selectAll(".dot")
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(200).attr("r", 8);

        const tooltip = g
          .append("g")
          .attr("class", "tooltip")
          .attr(
            "transform",
            `translate(${
              xScale(d.formattedMonth) + xScale.bandwidth() / 2
            }, ${yScale(d.count)})`
          );

        const tooltipRect = tooltip
          .append("rect")
          .attr("x", -30)
          .attr("y", -35)
          .attr("width", 60)
          .attr("height", 25)
          .attr("fill", "rgba(0, 0, 0, 0.8)")
          .attr("rx", 4);

        tooltip
          .append("text")
          .attr("text-anchor", "middle")
          .attr("y", -15)
          .attr("fill", "white")
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .text(d.count);
      })
      .on("mouseout", function (event, d) {
        d3.select(this).transition().duration(200).attr("r", 5);

        g.select(".tooltip").remove();
      });

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)")
      .style("font-size", "12px")
      .style("fill", "#6b7280");

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .style("font-size", "12px")
      .style("color", "#6b7280");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#6b7280")
      .text("Number of Posts");

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
          <span className="text-4xl mb-4 block">📈</span>
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

export default PostsPerMonthChart;
