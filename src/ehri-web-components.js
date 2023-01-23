
const EI_ID_ATTR = "item-id";
const EI_BASE_URL_ATTR = "base-url";
const EI_BASE_URL = "https://portal.ehri-project.eu";
const EI_PATH_MAP = {
  DocumentaryUnit: 'units',
  VirtualUnit: 'virtual',
  Repository: 'institutions',
  HistoricalAgent: 'authorities',
  Country: 'countries',
}

// Import templates as strings (this relies on esbuild --loader:.css=text and --loader:.html=text)
import item_css from './css/item.css';
import item_html from './html/item.html';
import service_css from './css/service.css';
import service_html from './html/service.html';

function truncateText(str) {
  return str
      ? str.split(/\r?\n\r?\n/).splice(0, 4)
      : [];
}

const EI_TEMPLATE = `<style>${item_css}</style>${item_html}`;

class EHRIItem extends HTMLElement {
  constructor() {
    self = super();

    this.attachShadow({ mode: "open" });
    let template = document.createElement("template");
    template.innerHTML = EI_TEMPLATE;
    this.shadowRoot.appendChild(template.content);
  }

  static get observedAttributes() {
    return [EI_ID_ATTR, EI_BASE_URL_ATTR];
  }

  attributeChangedCallback() {
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    let itemId = this.getAttribute(EI_ID_ATTR);
    let baseUrl = this.getAttribute(EI_BASE_URL_ATTR) || EI_BASE_URL;
    fetch(`${baseUrl}/api/v1/${itemId}`)
        .then(r => r.json())
        .then(data => {
          let renderData = this.getData(itemId, baseUrl, data);
          let fragment = this.buildFragment(renderData);
          this.shadowRoot.textContent = "";
          this.shadowRoot.appendChild(fragment);
        })
        .catch(e => {
          console.error(e);
          this.shadowRoot.innerHTML = `
            <pre class="error">
              An EHRI item with id &quot;${itemId}&quot; could not be loaded.
            </pre>
          `;
        });
  }

  parseRepository(baseUrl, itemId, type, json) {
    const name = json.data.attributes.name;
    const otherNames = (json.data.attributes.otherFormsOfName || [])
        .concat(json.data.attributes.parallelFormsOfName || []);
    const paras = truncateText(json.data.attributes.history);
    const url = `${baseUrl}/${EI_PATH_MAP[type]}/${itemId}`;
    const details = [];
    for (let attr of ['streetAddress', 'city']) {
      let value = json.data.attributes.address[attr];
      if (value) {
        details.push(value);
      }
    }
    const parents = {};
    if (json.data.attributes.address) {
      parents[json.data.attributes.address.country] =
          `${baseUrl}/${EI_PATH_MAP[type]}/${json.data.attributes.address.countryCode.toLowerCase()}`;
    }
    let subItems = null;
    if (json.data.meta.subitems) {
      let i = json.data.meta.subitems;
      if (i > 0) {
        subItems = `${i} archival description` + (i > 1 ? 's' : '');
      }
    }

    return {type, url, name, otherNames, parents, paras, details, subItems};
  }

  parseHistoricalAgent(baseUrl, itemId, type, json) {
    const name = json.data.attributes.name;
    const otherNames = (json.data.attributes.otherFormsOfName || [])
        .concat(json.data.attributes.parallelFormsOfName || []);
    const paras = truncateText(json.data.attributes.history);
    const url = `${baseUrl}/${EI_PATH_MAP[type]}/${itemId}`;
    const details = [];
    const parents = {};
    const subItems = null;

    return {type, url, name, otherNames, parents, paras, details, subItems};
  }

  parseDocumentaryUnit(baseUrl, itemId, type, json) {
    const name = json.data.attributes.descriptions[0].name;
    const otherNames = json.data.attributes.descriptions[0].parallelFormsOfName || [];
    const paras = truncateText(json.data.attributes.descriptions[0].scopeAndContent);
    const url = `${baseUrl}/${EI_PATH_MAP[type]}/${itemId}`;
    const details = [];
    details.push(json.data.attributes.localId);
    for (let attr of ['language', 'extentAndMedium']) {
      if (json.data.attributes.descriptions[0][attr]) {
        details.push(json.data.attributes.descriptions[0][attr]);
      }
    }
    const parents = {};
    let included = json.included ? json.included.filter(item => item.type ==='Repository') : [];
    for (let repo of included) {
      parents[repo.attributes.name] = `${baseUrl}/${EI_PATH_MAP[repo.type]}/${repo.id}`;
    }
    let subItems = null;
    if (json.data.meta.subitems) {
      let i = json.data.meta.subitems;
      if (i > 0) {
        subItems = `${i} child item` + (i > 1 ? 's' : '');
      }
    }

    return {type, url, name, otherNames, parents, paras, details, subItems};
  }

  parseCountry(baseUrl, itemId, type, json) {
    const name = json.data.attributes.name;
    const otherNames = [];
    const paras = truncateText(json.data.attributes.history);
    const url = `${baseUrl}/${EI_PATH_MAP[type]}/${itemId}`;
    const details = [];
    const parents = {};
    let subItems = null;
    if (json.data.meta.subitems) {
      let i = json.data.meta.subitems;
      if (i > 0) {
        subItems = `${i} institution` + (i > 1 ? 's' : '');
      }
    }

    return {type, url, name, otherNames, parents, paras, details, subItems};
  }

  getData(itemId, baseUrl, data) {
    const type = data.data.type;
    if (type === 'Repository') {
      return this.parseRepository(baseUrl, itemId, type, data);
    } else if (type === 'HistoricalAgent') {
      return this.parseHistoricalAgent(baseUrl, itemId, type, data);
    } else if (type === 'DocumentaryUnit' || type === 'VirtualUnit') {
      return this.parseDocumentaryUnit(baseUrl, itemId, type, data);
    } else if (type === 'Country') {
      return this.parseCountry(baseUrl, itemId, type, data);
    } else {
      throw new Exception(`Unsupported item type: ${type}`);
    }
  }

  buildFragment({type, url, name, otherNames, parents, paras, details, subItems}) {
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
    if (otherNames) {
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
    for (let para of paras) {
      let p = document.createElement("p");
      p.textContent = para;
      body.appendChild(p);
    }

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


const ER_ID_ATTR = "resource-id";
const ER_BASE_URL_ATTR = "base-url";
const ER_BASE_URL = "https://api.eosc-portal.eu";

const ER_TEMPLATE = `<style>${item_css}${service_css}</style>${service_html}`;

class EHRIResource extends HTMLElement {
  constructor() {
    self = super();

    this.attachShadow({ mode: "open" });
    let template = document.createElement("template");
    template.innerHTML = ER_TEMPLATE;
    this.shadowRoot.appendChild(template.content);
  }

  static get observedAttributes() {
    return [ER_ID_ATTR, ER_BASE_URL_ATTR];
  }

  attributeChangedCallback() {
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  buildFragment(data) {
    let content = document.createElement("template");
    content.innerHTML = ER_TEMPLATE;
    let fragment = content.content;

    let logoLink = fragment.querySelector(".item a.logo");
    logoLink.classList.remove("loading-placeholder");
    logoLink.href = data.webpage;
    let logoImg = document.createElement("img");
    logoImg.alt = data.name;
    logoImg.src = data.logo;
    logoLink.appendChild(logoImg);

    let headerLink = fragment.querySelector("header a");
    headerLink.classList.remove("loading-placeholder");
    headerLink.href = data.webpage;
    headerLink.textContent = data.name;

    let descDiv = fragment.querySelector(".description");
    descDiv.textContent = '';
    for (let para of truncateText(data.description)) {
      let p = document.createElement("p");
      p.textContent = para;
      descDiv.appendChild(p);
    }

    let footerLink = fragment.querySelector("footer a");
    footerLink.classList.remove("loading-placeholder");
    footerLink.href = data.webpage;
    footerLink.textContent = "Visit this site";

    return fragment;
  }

  render() {
    let itemId = this.getAttribute(ER_ID_ATTR);
    let baseUrl = this.getAttribute(ER_BASE_URL_ATTR) || ER_BASE_URL;
    fetch(`${baseUrl}/service/${itemId}`)
        .then(r => r.json())
        .then(data => {
          let fragment = this.buildFragment(data);
          this.shadowRoot.textContent = "";
          this.shadowRoot.appendChild(fragment);
        })
        .catch(e => {
          console.error(e);
          this.shadowRoot.innerHTML = `
            <pre class="error">
              An EHRI resource with id &quot;${itemId}&quot; could not be loaded.
            </pre>
          `;
        });
  }
}

customElements.define("ehri-item", EHRIItem);
customElements.define("ehri-resource", EHRIResource);