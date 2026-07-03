const EI_ID_ATTR = "item-id";
const EI_BASE_URL_ATTR = "base-url";
const EI_TRUNCATE_ATTR = "truncate";
const EI_BASE_URL = "https://portal.ehri-project.eu";
const EI_PATH_MAP = {
  DocumentaryUnit: 'units',
  VirtualUnit: 'virtual',
  Repository: 'institutions',
  HistoricalAgent: 'authorities',
  Country: 'countries',
}

// Maximum number of characters in a paragraph:
const EI_MAX_LENGTH = 1024;

// Import templates as strings (this relies on esbuild --loader:.css=text and --loader:.html=text)
import item_css from './css/item.css';
import item_html from './html/item.html';

const EI_TEMPLATE = `<style>${item_css}</style>${item_html}`;

export class EHRIItem extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });
    let template = document.createElement("template");
    template.innerHTML = EI_TEMPLATE;
    this.shadowRoot.appendChild(template.content);
  }

  static get observedAttributes() {
    return [EI_ID_ATTR, EI_BASE_URL_ATTR, EI_TRUNCATE_ATTR];
  }

  attributeChangedCallback() {
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  #stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || '';
  }

  #truncateText(str, maxLength) {
    // Strip any embedded HTML first, then split the plain text into
    // paragraphs on blank lines, discarding empty ones...
    const allParas = this.#stripHtml(str || '')
        .split(/\r?\n\r?\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    // Show at most the first four paragraphs, within maxLength:
    const paras = [];
    let remaining = maxLength;
    let truncated = false;
    for (const para of allParas) {
      if (paras.length >= 4 || remaining <= 0) {
        // More content exists than we're showing.
        truncated = true;
        break;
      }
      if (para.length <= remaining) {
        paras.push(para);
        remaining -= para.length;
      } else {
        paras.push(para.slice(0, remaining).trimEnd());
        truncated = true;
        break;
      }
    }

    return {paras, truncated};
  }

  #renderError(errorHtml) {
    return `
    <style>
      pre.error {
          border: 1px solid #f5c6cb;
          border-radius: .3rem;
          background-color: #f8d7da;
          color: #721c24;
          padding: .4rem .7rem;
      }
    </style>
    <pre class="error">${errorHtml}</pre>
  `;
  }

  render() {
    let itemId = this.getAttribute(EI_ID_ATTR);
    let baseUrl = this.getAttribute(EI_BASE_URL_ATTR) || EI_BASE_URL;
    let truncateTo = parseInt(this.getAttribute(EI_TRUNCATE_ATTR)) || EI_MAX_LENGTH;
    if (itemId) {
      fetch(`${baseUrl}/api/v1/${itemId}`)
          .then(r => r.json())
          .then(data => {
            let renderData = this.#getData(itemId, baseUrl, data, truncateTo);
            let fragment = this.#buildFragment(renderData);
            this.shadowRoot.textContent = "";
            this.shadowRoot.appendChild(fragment);
          })
          .catch(e => {
            console.error(e);
            this.shadowRoot.innerHTML = this.#renderError(
                `An EHRI item with id &quot;${itemId}&quot; could not be loaded.`);
          });
    } else {
      this.shadowRoot.innerHTML = this.#renderError(
          `An EHRI item ID must be specified with the <code>item-id</code> attribute.`);
    }
  }

  #parseRepository(baseUrl, itemId, type, json, truncateTo) {
    const name = json.data.attributes.name;
    const otherNames = (json.data.attributes.otherFormsOfName || [])
        .concat(json.data.attributes.parallelFormsOfName || []);
    const {paras, truncated} = this.#truncateText(json.data.attributes.history, truncateTo);
    const url = `${baseUrl}/${EI_PATH_MAP[type]}/${itemId}`;
    const details = [];
    const parents = {};
    const address = json.data.attributes.address;
    if (address) {
      for (let attr of ['streetAddress', 'city']) {
        if (address[attr]) {
          details.push(address[attr]);
        }
      }
      if (address.country && address.countryCode) {
        parents[address.country] =
            `${baseUrl}/${EI_PATH_MAP.Country}/${address.countryCode.toLowerCase()}`;
      }
    }
    let subItems = null;
    if (json.data.meta?.subitems) {
      let i = json.data.meta.subitems;
      if (i > 0) {
        subItems = `${i} archival description` + (i > 1 ? 's' : '');
      }
    }

    return {type, url, name, otherNames, parents, paras, truncated, details, subItems};
  }

  #parseHistoricalAgent(baseUrl, itemId, type, json, truncateTo) {
    const name = json.data.attributes.name;
    const otherNames = (json.data.attributes.otherFormsOfName || [])
        .concat(json.data.attributes.parallelFormsOfName || []);
    const {paras, truncated} = this.#truncateText(json.data.attributes.history, truncateTo);
    const url = `${baseUrl}/${EI_PATH_MAP[type]}/${itemId}`;
    const details = [];
    const parents = {};
    const subItems = null;

    return {type, url, name, otherNames, parents, paras, truncated, details, subItems};
  }

  #parseDocumentaryUnit(baseUrl, itemId, type, json, truncateTo) {
    const desc = (json.data.attributes.descriptions || [])[0];
    if (!desc) {
      throw new Error(`No description available for item: ${itemId}`);
    }
    const name = desc.name;
    const otherNames = desc.parallelFormsOfName || [];
    const {paras, truncated} = this.#truncateText(desc.scopeAndContent, truncateTo);
    const url = `${baseUrl}/${EI_PATH_MAP[type]}/${itemId}`;
    const details = [];
    details.push(json.data.attributes.localId);
    for (let attr of ['language', 'extentAndMedium']) {
      if (desc[attr]) {
        details.push(desc[attr]);
      }
    }
    const parents = {};
    let included = json.included ? json.included.filter(item => item.type ==='Repository') : [];
    for (let repo of included) {
      parents[repo.attributes.name] = `${baseUrl}/${EI_PATH_MAP[repo.type]}/${repo.id}`;
    }
    let subItems = null;
    if (json.data.meta?.subitems) {
      let i = json.data.meta.subitems;
      if (i > 0) {
        subItems = `${i} child item` + (i > 1 ? 's' : '');
      }
    }

    return {type, url, name, otherNames, parents, paras, truncated, details, subItems};
  }

  #parseCountry(baseUrl, itemId, type, json, truncateTo) {
    const name = json.data.attributes.name;
    const otherNames = [];
    const {paras, truncated} = this.#truncateText(json.data.attributes.history, truncateTo);
    const url = `${baseUrl}/${EI_PATH_MAP[type]}/${itemId}`;
    const details = [];
    const parents = {};
    let subItems = null;
    if (json.data.meta?.subitems) {
      let i = json.data.meta.subitems;
      if (i > 0) {
        subItems = `${i} institution` + (i > 1 ? 's' : '');
      }
    }

    return {type, url, name, otherNames, parents, paras, truncated, details, subItems};
  }

  #getData(itemId, baseUrl, data, truncateTo) {
    const type = data.data.type;
    if (type === 'Repository') {
      return this.#parseRepository(baseUrl, itemId, type, data, truncateTo);
    } else if (type === 'HistoricalAgent') {
      return this.#parseHistoricalAgent(baseUrl, itemId, type, data, truncateTo);
    } else if (type === 'DocumentaryUnit' || type === 'VirtualUnit') {
      return this.#parseDocumentaryUnit(baseUrl, itemId, type, data, truncateTo);
    } else if (type === 'Country') {
      return this.#parseCountry(baseUrl, itemId, type, data, truncateTo);
    } else {
      throw new Error(`Unsupported item type: ${type}`);
    }
  }

  #buildFragment({type, url, name, otherNames, parents, paras, truncated, details, subItems}) {
    let content = document.createElement("template");
    content.innerHTML = EI_TEMPLATE;
    let fragment = content.content;
    let headDiv = fragment.querySelector(".heading");
    headDiv.classList.add(type);
    let headLink = fragment.querySelector(".heading header a");
    headLink.href = url;
    headLink.classList.remove("loading-placeholder");
    headLink.textContent = name;
    let altNameList = fragment.querySelector(".alternate-names");
    if (otherNames.length) {
      altNameList.textContent = "";
      for (let name of otherNames) {
        let li = document.createElement("li");
        li.textContent = name;
        altNameList.appendChild(li);
      }
    } else {
      altNameList.remove();
    }

    let body = fragment.querySelector(".description");
    body.textContent = "";
    paras.forEach((para, i) => {
      let p = document.createElement("p");
      p.textContent = para;
      // On the final paragraph, if the text was truncated, append an ellipsis
      // followed by a "more" link to the full item.
      if (truncated && i === paras.length - 1) {
        p.append("… ");
        let more = document.createElement("a");
        more.href = url;
        more.target = "_blank";
        more.classList.add("more");
        more.textContent = "more";
        p.appendChild(more);
      }
      body.appendChild(p);
    });

    let detailList = fragment.querySelector(".details ul");
    detailList.textContent = "";
    for (const [name, url] of Object.entries(parents)) {
      let li = document.createElement("li");
      let a = document.createElement("a");
      a.href = url;
      a.textContent = name;
      a.classList.add("alt");
      a.target = "_blank";
      li.appendChild(a);
      detailList.appendChild(li);
    }

    for (let detail of details) {
      let li = document.createElement("li");
      li.textContent = detail;
      detailList.appendChild(li);
    }

    let subItemsDiv = fragment.querySelector(".subitems");
    if (subItems) {
      let a = document.createElement("a");
      a.href = `${url}/search`;
      a.target = "_blank";
      a.textContent = subItems;
      subItemsDiv.appendChild(a);
    } else {
      subItemsDiv.remove();
    }

    let footerLink = fragment.querySelector("footer a");
    footerLink.href = url;
    footerLink.classList.remove("loading-placeholder");
    footerLink.textContent = "View this item on the EHRI Portal";

    return fragment;
  }
}