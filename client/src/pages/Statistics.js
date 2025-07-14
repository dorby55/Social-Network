import { useState, useEffect } from "react";
import { getPostsPerMonth, getGroupsByMembers } from "../services/api";
import PostsPerMonthChart from "../components/stats/PostsPerMonthChart";
import GroupsByMembersChart from "../components/stats/GroupsByMembersChart";

const StatCard = ({ title, value, change, trend, icon, loading = false }) => {
  if (loading) {
    return (
      <div className="stat-card bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="stat-value text-2xl font-bold text-gray-900">
            {value?.toLocaleString() || "0"}
          </p>
          {change && (
            <div
              className={`flex items-center mt-2 text-sm ${
                trend === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              <span className="mr-1 text-lg">{trend === "up" ? "↗" : "↘"}</span>
              {change}
              <span className="ml-1 text-xs text-gray-500">vs last period</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="stat-icon w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <span className="text-2xl">{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ChartCard = ({
  title,
  children,
  className = "",
  loading = false,
  error = null,
}) => {
  if (loading) {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}
      >
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <span className="text-4xl mb-2 block">📊</span>
            <p>Unable to load chart data</p>
            <p className="text-sm text-gray-400 mt-1">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`chart-container bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
};

const Statistics = () => {
  const [postsData, setPostsData] = useState([]);
  const [groupsData, setGroupsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState("12months");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [postsResponse, groupsResponse] = await Promise.all([
          getPostsPerMonth(),
          getGroupsByMembers(),
        ]);

        setPostsData(postsResponse);
        setGroupsData(groupsResponse);
        setError(null);
      } catch (err) {
        setError("Failed to load statistics data");
        console.error("Error fetching statistics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalPosts = postsData.reduce((sum, item) => sum + item.count, 0);
  const totalGroups = groupsData.length;
  const totalMembers = groupsData.reduce(
    (sum, group) => sum + group.memberCount,
    0
  );
  const avgMembersPerGroup =
    totalGroups > 0 ? Math.round(totalMembers / totalGroups) : 0;
  const publicGroups = groupsData.filter((g) => !g.isPrivate).length;
  const privateGroups = groupsData.filter((g) => g.isPrivate).length;

  const lastTwoMonths = postsData.slice(-2);
  const growthRate =
    lastTwoMonths.length === 2
      ? Math.round(
          ((lastTwoMonths[1].count - lastTwoMonths[0].count) /
            lastTwoMonths[0].count) *
            100
        )
      : 0;

  if (error && postsData.length === 0 && groupsData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-900 mb-2">
              Unable to Load Statistics
            </h2>
            <p className="text-red-700 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-page min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Network Analytics
              </h1>
              <p className="text-gray-600">
                Comprehensive insights into your social network's performance
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="time-range-select px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="3months">Last 3 Months</option>
                <option value="12months">Last 12 Months</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 slide-up">
          <StatCard
            title="Total Posts"
            value={totalPosts}
            change={
              growthRate !== 0
                ? `${growthRate > 0 ? "+" : ""}${growthRate}%`
                : null
            }
            trend={growthRate >= 0 ? "up" : "down"}
            icon="📝"
            loading={loading}
          />
          <StatCard
            title="Active Groups"
            value={totalGroups}
            icon="👥"
            loading={loading}
          />
          <StatCard
            title="Total Members"
            value={totalMembers}
            icon="🌐"
            loading={loading}
          />
          <StatCard
            title="Avg Members/Group"
            value={avgMembersPerGroup}
            icon="📊"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ChartCard
            title="📈 Posts Activity Over Time"
            className="lg:col-span-2"
            loading={loading}
            error={postsData.length === 0 ? "No post data available" : null}
          >
            <div className="h-96">
              <PostsPerMonthChart />
            </div>
          </ChartCard>

          <ChartCard
            title="👥 Top Groups by Member Count"
            loading={loading}
            error={groupsData.length === 0 ? "No group data available" : null}
          >
            <div className="h-80">
              <GroupsByMembersChart />
            </div>
          </ChartCard>

          <ChartCard title="🔒 Group Privacy Distribution" loading={loading}>
            <div className="space-y-6">
              {[
                {
                  type: "Public Groups",
                  count: publicGroups,
                  color: "#10B981",
                  icon: "🌐",
                },
                {
                  type: "Private Groups",
                  count: privateGroups,
                  color: "#EF4444",
                  icon: "🔒",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{item.icon}</span>
                    <div>
                      <span className="text-gray-700 font-medium block">
                        {item.type}
                      </span>
                      <span className="text-sm text-gray-500">
                        {totalGroups > 0
                          ? `${((item.count / totalGroups) * 100).toFixed(
                              1
                            )}% of total`
                          : "No data"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className="text-2xl font-bold"
                      style={{ color: item.color }}
                    >
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <ChartCard title="⭐ Quick Insights">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-blue-600 text-lg mr-2">🚀</span>
                <span className="font-semibold text-blue-900">
                  Growth Trend
                </span>
              </div>
              <p className="text-blue-800 text-sm">
                {growthRate >= 0
                  ? `Your network is showing ${
                      growthRate > 0 ? "strong" : "stable"
                    } growth with a ${growthRate}% change in posts this period.`
                  : `Posts have decreased by ${Math.abs(
                      growthRate
                    )}% this period. Consider engagement strategies.`}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-green-600 text-lg mr-2">💡</span>
                <span className="font-semibold text-green-900">
                  Most Active
                </span>
              </div>
              <p className="text-green-800 text-sm">
                {groupsData.length > 0
                  ? `${groupsData[0]?.name} is your most popular group with ${groupsData[0]?.memberCount} members.`
                  : "No group data available yet."}
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-purple-600 text-lg mr-2">📈</span>
                <span className="font-semibold text-purple-900">
                  Network Health
                </span>
              </div>
              <p className="text-purple-800 text-sm">
                {totalGroups > 0
                  ? `You have ${totalGroups} active groups with an average of ${avgMembersPerGroup} members each.`
                  : "Start creating groups to build your community!"}
              </p>
            </div>
          </div>
        </ChartCard>

        <div className="text-center text-gray-500 text-sm mt-8">
          <p>
            Last updated: {new Date().toLocaleDateString()} • Data refreshes in
            real-time
          </p>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
