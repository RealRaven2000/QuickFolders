// eslint-disable-next-line no-unused-vars
var insertHtmlSafely = (container, html, clear = false) => {
  if (!container || !html) {
    return null;
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

function replaceNested(text) {
  let result = text;
  const maxLoops = 5; // prevent infinite recursion

  for (let i = 0; i < maxLoops; i++) {
    let changed = false;

    result = result.replace(/\{\+([\w.]+)\}/g, (_, id) => {
      // replace is streaming results from 1st capturing group:
      // (fullMatch, group1, index, originalString)
      const replacement = messenger.i18n.getMessage(id) || `{+${id}}`;
      if (replacement !== `{+${id}}`) {
        changed = true;
      }
      return replacement;
    });

    if (!changed) {
      break;
    }
  }

  return result;
}

// eslint-disable-next-line no-unused-vars
function specialAttributes(str, content) {
  if (!str) {
    return "";
  }

  let out = [];
  let title;

  for (const p of str.split(/\s+/)) {
    const [k, v] = p.split("=");

    if (!k || !v) {
      continue;
    }

    if (k === "class" && v.includes("maintenance")) {
      // for class=maintenance the tag contains the maintenance version number!
      const tooltip = messenger.i18n.getMessage("whats-new-maintenance", [content]);
      title = `title="${tooltip}"`;
    }

    out.push(`${k}="${v}"`);
  }
  if (title) {
    out.push(title);
  }

  return out.join(" ");
}


// eslint-disable-next-line no-unused-vars
function formatAll(txt) {
  if (!txt) {
    return "";
  }
  /* when replacing a href, start with the special cases first! */
  let localizedMsg = replaceNested(txt)
    // "switchtorelease" article link to be replaced with future announcement of compatibility for experimental Add-ons (RC only)
    // future: add "switchtoESR" link (once official announcement is made)
    .replace(
      /\{a switchtorelease\}/g,
      "<a href='https://blog.thunderbird.net/2025/03/thunderbird-release-channel-update/'>",
    )
    .replace(
      /\{a compatCheck\}/g,
      "<a href='https://addons.thunderbird.net/thunderbird/addon/addon-compatibility-check/' class='native'>",
    )
    .replace(
      /\{a apiwork\}/g,
      "<a href='https://blog.thunderbird.net/2026/03/thunderbird-monthly-development-digest-march-2026/'>",
    )
    .replace(/\{bold\}/g, "<b>")
    .replace(/\{\/bold\}/g, "</b>")
    .replace(/\{b(?:\s+([^}]+))?\}(.*?)\{\/b\}/g, (_, attrs, content) => {
      const attrStr = attrs ? specialAttributes(attrs, content) : "";
      return attrStr ? `<b ${attrStr}>${content}</b>` : `<b>${content}</b>`;
    })
    .replace(/\{italic\}/g, "<i>")
    .replace(/\{\/italic\}/g, "</i>")
    .replace(/\{emph\}/g, "<span class='important'>")
    .replace(/\{\/emph\}/g, "</span>")
    .replace(/\{hr\}/g, "<hr>")
    .replace(/\{U\}/gi, "<ul>")
    .replace(/\{\/U\}/gi, "</ul>")
    .replace(/\{L(?:\s+([^}]+))?\}/gi, (_, attrs) => (attrs ? `<li ${attrs}>` : "<li>"))
    .replace(/\{\/L\}/gi, "</li>")
    .replace(/\{P(?:\s+([^}]+))?\}/g, (_, attrs) => (attrs ? `<p ${attrs}>` : "<p>"))
    .replace(/\{\/P\}/gi, "</p>")
    .replace(/\{a ([^}]+?)\}/g, "<a $1>")
    .replace(/\{\/a\}/gi, "</a>")
    .replace(/\{br\}/gi, "<br>")
    .replace(/\[Bugzilla (\d*)\]/g, "<a class='bugzilla' no='$1' href='#'>[Bugzilla $1]</a>")
    .replace(/\[issue (\d*)\]/g, "<a class=issue no=$1 href='#'>[issue $1]</a>")
    .replace(/\[(.)\]/g, "<code class='keystroke'>$1</code>")
    .replace(/\[(F\d*)\]/g, "<code class='keystroke'>$1</code>")
    .replace(/\[(CTRL|ALT)\]/g, "<code class='keystroke'>$1</code>")
    .replace(/\{code\}(.*?)\{\/code\}/g, "<code>$1</code>");
  return localizedMsg;
}
