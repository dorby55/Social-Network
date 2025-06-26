export const getCacheBustedUrl = (url) => {
  if (!url || url === "") {
    return "/default-avatar.png";
  }

  if (url.includes("?t=")) {
    return url;
  }

  const timestamp = new Date().getTime();
  return url.includes("?") ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
};
