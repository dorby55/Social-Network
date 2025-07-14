const urlRegex = /(https?:\/\/[^\s]+)/g;

const linkifyText = (text) => {
  if (!text) return "";

  return text.replace(urlRegex, (url) => {
    const cleanUrl = url.replace(/[.,;:!?]+$/, "");
    const trailingPunctuation = url.substring(cleanUrl.length);

    return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="post-link">${cleanUrl}</a>${trailingPunctuation}`;
  });
};

const LinkifiedText = ({ text, className = "" }) => {
  if (!text) return null;

  const linkedText = linkifyText(text);

  return (
    <div
      className={`linkified-text ${className}`}
      dangerouslySetInnerHTML={{ __html: linkedText }}
    />
  );
};

export default LinkifiedText;
