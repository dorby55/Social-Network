import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { searchUsers, searchGroups, searchPosts } from "../services/api";
import UserItem from "../components/user/UserItem";
import GroupItem from "../components/group/GroupItem";
import PostItem from "../components/post/PostItem";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    users: [],
    groups: [],
    posts: [],
  });
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [searchCache, setSearchCache] = useState({});

  const getResultsForQuery = useCallback(
    async (searchQuery, searchType) => {
      const cacheKey = `${searchQuery}-${searchType}`;

      if (searchCache[cacheKey]) {
        return searchCache[cacheKey];
      }

      let searchResults = {};

      if (searchType === "all" || searchType === "users") {
        try {
          const users = await searchUsers(searchQuery);
          searchResults.users = users;
        } catch (err) {
          console.error("Error searching users:", err);
          searchResults.users = [];
        }
      }

      if (searchType === "all" || searchType === "groups") {
        try {
          const groups = await searchGroups(searchQuery);
          searchResults.groups = groups;
        } catch (err) {
          console.error("Error searching groups:", err);
          searchResults.groups = [];
        }
      }

      if (searchType === "all" || searchType === "posts") {
        try {
          const posts = await searchPosts(searchQuery);
          searchResults.posts = posts;
        } catch (err) {
          console.error("Error searching posts:", err);
          searchResults.posts = [];
        }
      }

      setSearchCache((prev) => ({
        ...prev,
        [cacheKey]: searchResults,
      }));

      return searchResults;
    },
    [searchCache]
  );

  useEffect(() => {
    const performSearch = async () => {
      if (!query) return;

      setLoading(true);
      setError(null);

      try {
        const newResults = await getResultsForQuery(query, type);

        if (type === "all") {
          setResults({
            users: newResults.users || [],
            groups: newResults.groups || [],
            posts: newResults.posts || [],
          });
        } else if (type === "users") {
          setResults((prev) => ({
            ...prev,
            users: newResults.users || [],
          }));
        } else if (type === "groups") {
          setResults((prev) => ({
            ...prev,
            groups: newResults.groups || [],
          }));
        } else if (type === "posts") {
          setResults((prev) => ({
            ...prev,
            posts: newResults.posts || [],
          }));
        }

        setHasSearched(true);
      } catch (err) {
        console.error("General search error:", err);
        setError("An error occurred while searching. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, type, getResultsForQuery]);

  const getTotalResults = () => {
    if (type === "users") return results.users.length;
    if (type === "groups") return results.groups.length;
    if (type === "posts") return results.posts.length;
    return results.users.length + results.groups.length + results.posts.length;
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Search Results for "{query}"</h1>
        {loading ? (
          <p>Searching...</p>
        ) : (
          <p>{getTotalResults()} results found</p>
        )}

        <div className="search-filters">
          <Link
            to={`/search?q=${encodeURIComponent(query)}&type=all`}
            className={`filter-link ${type === "all" ? "active" : ""}`}
          >
            All
          </Link>
          <Link
            to={`/search?q=${encodeURIComponent(query)}&type=users`}
            className={`filter-link ${type === "users" ? "active" : ""}`}
          >
            Users ({results.users.length})
          </Link>
          <Link
            to={`/search?q=${encodeURIComponent(query)}&type=groups`}
            className={`filter-link ${type === "groups" ? "active" : ""}`}
          >
            Groups ({results.groups.length})
          </Link>
          <Link
            to={`/search?q=${encodeURIComponent(query)}&type=posts`}
            className={`filter-link ${type === "posts" ? "active" : ""}`}
          >
            Posts ({results.posts.length})
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">Searching...</div>
      ) : (
        <div className="search-results">
          {!hasSearched ? (
            <div className="initial-search">
              <p>Enter a search term to find users, groups, and posts.</p>
            </div>
          ) : getTotalResults() === 0 ? (
            <div className="no-results">
              <p>No results found for "{query}"</p>
              <p>Try different keywords or check your spelling</p>
            </div>
          ) : (
            <>
              {type === "all" || type === "users"
                ? results.users.length > 0 && (
                    <div className="result-section">
                      <h2>Users</h2>
                      <div className="users-grid">
                        {results.users.map((user) => (
                          <UserItem key={user._id} user={user} />
                        ))}
                      </div>
                    </div>
                  )
                : null}

              {type === "all" || type === "groups"
                ? results.groups.length > 0 && (
                    <div className="result-section">
                      <h2>Groups</h2>
                      <div className="groups-grid">
                        {results.groups.map((group) => (
                          <GroupItem key={group._id} group={group} />
                        ))}
                      </div>
                    </div>
                  )
                : null}

              {type === "all" || type === "posts"
                ? results.posts.length > 0 && (
                    <div className="result-section">
                      <h2>Posts</h2>
                      <div className="posts-list">
                        {results.posts.map((post) => (
                          <PostItem key={post._id} post={post} />
                        ))}
                      </div>
                    </div>
                  )
                : null}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
