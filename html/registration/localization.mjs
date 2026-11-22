/* globals formatAll, parseHTMLFragment, formatLocalizedMarkdown */
export function message(key, substitutions = []) {
  return messenger.i18n.getMessage("registration." + key, substitutions);
}

export // Replace only marked text labels, retaining translated arrow positions.
function replaceLabelGlyphs(root = document) {
  const labels = root.matches?.(".has-glyphs") ? [root] : root.querySelectorAll(".has-glyphs");
  function replaceText(parent) {
    for (const node of [...parent.childNodes]) {
      if (node.nodeType === 3 && node.nodeValue.includes("🡇")) {
        const parts = node.nodeValue.split("🡇");
        const fragment = document.createDocumentFragment();
        parts.forEach((part, index) => {
          if (index) {
            const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            arrow.setAttribute("class", "label-arrow");
            arrow.setAttribute("viewBox", "0 0 24 24");
            arrow.setAttribute("fill", "currentColor");
            arrow.setAttribute("aria-hidden", "true");
            arrow.setAttribute("focusable", "false");
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", "M7 2h10v10h6L12 23 1 12h6Z");
            arrow.appendChild(path);
            fragment.appendChild(arrow);
          }
          fragment.appendChild(document.createTextNode(part));
        });
        node.replaceWith(fragment);
      } else if (node.nodeType === 1 && node.namespaceURI !== "http://www.w3.org/2000/svg") {
        replaceText(node);
      }
    }
  }
  for (const label of labels) {
    replaceText(label);
  }
}

export function localizePage() {
  document.documentElement.lang = messenger.i18n.getUILanguage();
  i18n.updateDocument();
  document.getElementById("terms-intro").textContent = message("terms.intro");
  // Only dedicated rich-text leaves are formatted; controls/links remain intact.
  // data-l10n-id records legacy source entities and has no runtime role.
  for (const element of document.querySelectorAll(".localized-markup")) {
    element.replaceChildren(parseHTMLFragment(formatAll(element.textContent)));
  }
  for (const element of document.querySelectorAll(".localizedFormatting")) {
    formatLocalizedMarkdown(element);
  }
  replaceLabelGlyphs();
}
