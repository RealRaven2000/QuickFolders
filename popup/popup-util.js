// eslint-disable-next-line no-unused-vars
var sanitizeHTML = (htmlString) => {
  const Cc = Components.classes;
  const Ci = Components.interfaces;
  if (!htmlString) {
    return "";
  }
  const parserUtils = Cc["@mozilla.org/parserutils;1"].getService(Ci.nsIParserUtils);

  const sanitizedHTML = parserUtils.sanitize(
    htmlString,
    parserUtils.SanitizerAllowStyle | parserUtils.SanitizerAllowImages
  );

  return sanitizedHTML;
};

// eslint-disable-next-line no-unused-vars
var insertHtmlSafely = (container, html, clear = false) => {
  if (!container || !html) {
    return;
  }
  if (clear) { 
    container.textContent = "";
  }
  // Function to recursively sanitize nodes
  // see also DOMpurify
  const sanitizeNode = (node) => {
    if (node.nodeType !== 1) {
      return node;
    } // Only ELEMENT_NODE

    // Remove <script> tags
    if (node.tagName.toLowerCase() === "script") {
      return null;
    }

    // Define dangerous inline event attributes
    const dangerousAttrs = [
      "onclick",
      "onchange",
      "oninput",
      "onmouseover",
      "onload",
      "onerror",
      "onfocus",
      "onblur",
      "onmousedown",
      "onmouseup",
      "onmouseenter",
      "onmouseleave",
    ];

    [...node.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();

      // Remove if attribute is dangerous or contains javascript:
      if (dangerousAttrs.includes(name) || value.startsWith("javascript:")) {
        node.removeAttribute(attr.name);
      }
    });

    // Recursively sanitize child nodes
    Array.from(node.childNodes).forEach((child) => {
      const sanitized = sanitizeNode(child);
      if (!sanitized) {
        child.remove();
      }
    });

    return node;
  };

  // Create a detached document fragment
  const ownerDoc = container.ownerDocument;
  const frag = ownerDoc.createDocumentFragment();

  if (typeof html == "object" && html.nodeType) {
    // html is a Node → move its child nodes
    while (html.firstChild) {
      frag.appendChild(html.firstChild);
    }
    container.appendChild(frag);
    return true;
  }
  if (typeof html != "string") {
    return false;
  }
  // do what DOMpurify does - remove inline event handlers ("onclick" etc and script tags)

  // Parse the HTML string into a temporary document
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Sanitize all children of body and move to fragment
  for (const node of Array.from(doc.body.childNodes)) {
    const sanitized = sanitizeNode(node);
    if (!sanitized) {
      continue;
    }
    frag.appendChild(sanitized);
  }

  // Append fragment to the container
  container.appendChild(frag);

  // Move <head> child nodes into the container's document <head>
  if (doc.head && container.ownerDocument.head) {
    for (const node of Array.from(doc.head.childNodes)) {
      const sanitized = sanitizeNode(node);
      if (!sanitized) {
        continue;
      }
      container.ownerDocument.head.appendChild(sanitized);
    }
  }
  return true;
};