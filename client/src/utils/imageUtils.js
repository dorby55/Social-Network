export const getCacheBustedUrl = (url) => {
  // If the URL is undefined, null, or an empty string, return the default avatar
  if (!url || url === "") {
    return "/default-avatar.png";
  }

  // If it's already a cache-busted URL, don't add another parameter
  if (url.includes("?t=")) {
    return url;
  }

  // Add cache-busting parameter
  const timestamp = new Date().getTime();
  return url.includes("?") ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
};
