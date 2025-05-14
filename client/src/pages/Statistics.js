// src/pages/Statistics.js
import React from "react";
import PostsPerMonthChart from "../components/stats/PostsPerMonthChart";
import GroupsByMembersChart from "../components/stats/GroupsByMembersChart";

const Statistics = () => {
  return (
    <div className="statistics-page">
      <h1>Network Statistics</h1>

      <div className="charts-container">
        <div className="chart-wrapper">
          <h2>Posts Per Month</h2>
          <PostsPerMonthChart />
        </div>

        <div className="chart-wrapper">
          <h2>Top Groups by Members</h2>
          <GroupsByMembersChart />
        </div>
      </div>
    </div>
  );
};

export default Statistics;
