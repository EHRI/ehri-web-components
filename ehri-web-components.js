
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

function truncateText(str) {
  return str
      ? str.split(/\r?\n\r?\n/).splice(0, 4)
      : [];
}

const EI_TEMPLATE = `
  <style>
    .ei-container * {
        margin: 0;
        padding: 0;
        border: 0;
    }
    
    .ei-container {
        border: 1px solid #eee;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.42857;
        font-size: 14px;
        margin: 20px 0;
        box-shadow: 2px 2px 6px 2px rgba(230, 230, 230, 1);
        background-color: #fff;
    }

    .ei {
        padding: .7em .5em;
    }

    .ei-body {
        margin: 0;
    }
    
    .ei-body p {
        margin-bottom: .5rem;
    }

    .ei-heading header {
        font-family: serif;
        margin-top: 0;
        margin-bottom: 0;
        text-transform: none;
        font-size: 1.3rem;
        font-weight: 400;
    }

    .ei-heading a {
        text-decoration: none;
        box-shadow: none;
    }

    .ei-heading a:hover {
        text-decoration: underline;
    }

    .ei-heading.Repository a header {
        color: inherit;
    }

    .ei-heading.Repository a {
        color: #034153;
    }

    .ei-heading.HistoricalAgent a {
        color: #517c00;
    }

    .ei-heading.DocumentaryUnit a {
        color: #6c003b;
    }

    .ei-heading.VirtualUnit a {
        color: #544F5F;
    }
    
    .ei-heading.Country a {
        color: #864300;
    }

    .ei-details {
        font-size: .85em;
    }

    .ei-details a.alt {
        color: #111;
        font-weight: bolder;
        box-shadow: none;
    }

    .ei-details a.alt:hover {
        text-decoration: underline;
    }

    .ei-subitems a {
        font-size: .85em;
        margin-top: 5px;
        color: #333;
        font-weight: lighter;
        box-shadow: none;
        text-shadow: rgba(82, 168, 236, 0.8) 0 0 5px;
    }

    .ei-subitems a:hover {
        text-decoration: underline;
    }

    .ei-details ul {
        padding-left: 0;
        margin-left: 0;
        list-style: none;
        color: #999;
        margin-bottom: 5px;
    }

    .ei-details li:first-child {
        padding-left: 0;
    }

    .ei-details li {
        padding-right: 5px;
        display: inline-block;
    }

    .ei-heading ul.ei-alternate-names {
        list-style: none;
        margin-left: 0;
        margin-bottom: 5px;
        line-height: inherit;
    }

    .ei-alternate-names li {
        font-weight: bold;
        display: inline;
    }

    .ei-heading ul.ei-alternate-names li:after {
        content: " | ";
    }

    .ei-heading ul.ei-alternate-names li:last-child:after {
        content: "";
    }

    .ei-footer {
        margin-top: 5px;
        border-top: 1px solid #ddd;
        padding: 0 .25em;
        background-color: #f5f5f5;
        overflow: auto;
    }

    .ei-footer a {
        float: right;
        color: #666;
        padding: .2em;
        font-size: .85em;
        box-shadow: none;
    }

    .ei-footer a:hover {
        color: #333;
    }

    .ei-placeholder {
        margin: 10px;
    }

    .loading-placeholder {
        background-color: #efefef;
        color: #efefef;
        white-space:nowrap;
        -moz-transform: rotate(.8deg) skewx(-12deg);
        -moz-box-shadow:3px 0 2px #444;
        border:4px solid #fff;
        background: -moz-linear-gradient(180deg, #000, #222);
    }
  </style>
  <div class="ei-container">
    <div class="ei">
      <div class="ei-heading type-highlight">
        <header>
          <a target="_blank" class="external type-highlight loading-placeholder">
            Loading...
          </a>
        </header>
        <ul class="ei-alternate-names">
          <li class="loading-placeholder">Loading...</li>
        </ul>
      </div>
      <div class="ei-details">
        <ul>
          <li class="loading-placeholder">Loading...</li>
        </ul>
      </div>
      <div class="ei-body">
        <p class="loading-placeholder">Loading...</p>
        <p class="loading-placeholder">Loading...</p>
        <p class="loading-placeholder">Loading...</p>
        <p class="loading-placeholder">Loading...</p>
      </div>
      <div class="ei-subitems">
      </div>
    </div>
    <div class="ei-footer">
      <a target="_blank" href="#" class="loading-placeholder">Loading...</a>
    </div>
  </div>
`;

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
    let headDiv = fragment.querySelector(".ei-heading");
    headDiv.classList.add(type);
    let headLink = fragment.querySelector(".ei-heading header a");
    headLink.href = url;
    headLink.classList.remove("loading-placeholder");
    headLink.textContent = name;
    let altNameList = fragment.querySelector(".ei-alternate-names");
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

    let body = fragment.querySelector(".ei-body");
    body.textContent = "";
    for (let para of paras) {
      let p = document.createElement("p");
      p.textContent = para;
      body.appendChild(p);
    }

    let detailList = fragment.querySelector(".ei-details ul");
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

    let subItemsDiv = fragment.querySelector(".ei-subitems");
    if (subItems) {
      let a = document.createElement("a");
      a.href = `${url}/search`;
      a.target = "_blank";
      a.textContent = subItems;
      subItemsDiv.appendChild(a);
    } else {
      subItemsDiv.remove();
    }

    let footerLink = fragment.querySelector(".ei-footer a");
    footerLink.href = url;
    footerLink.classList.remove("loading-placeholder");
    footerLink.textContent = "View this item on the EHRI Portal";

    return fragment;
  }
}


const ER_ID_ATTR = "resource-id";
const ER_BASE_URL_ATTR = "base-url";
const ER_BASE_URL = "https://api.eosc-portal.eu";

const ER_TEMPLATE = `
  <style>
  .er-container {
    border: 1px solid #eee;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    line-height: 1.42857;
    font-size: 14px;
    margin: 1rem 0;
    box-shadow: 2px 2px 6px 2px rgba(230, 230, 230, 1);
    background-color: #fff;
  }
  .er {
    display: grid;
    grid-template-areas: 'logo title' 'logo description';
    grid-template-columns: 8rem 1fr;
    grid-gap: .5rem 0.7rem;
    padding: .7em .5em;
  }
  .logo {
    grid-area: logo;
  }
  img {
    width: 8rem;
    height: auto;
  }
  header {
    grid-area: title;
    margin: 0;
    color: #83014c;
    font-size: 1.3rem;
  }
  header a {
    text-decoration: none;
  }
  header a:hover {
    text-decoration: underline;
  }
  .er-description {
    grid-area: description;
  }
  .er-description p {
    margin: 0 0 1rem 0;
  }
  .er-description img {
    width: 20rem;
    height: auto;
  }
  .er-footer {
      margin-top: 5px;
      border-top: 1px solid #ddd;
      padding: 0 .25em;
      background-color: #f5f5f5;
      overflow: auto;
  }
  .er-footer a {
      float: right;
      color: #666;
      padding: .2em;
      font-size: .85em;
      box-shadow: none;
  }
  .loading-placeholder {
      background-color: #efefef;
      color: #efefef;
      white-space:nowrap;
      -moz-transform: rotate(.8deg) skewx(-12deg);
      -moz-box-shadow:3px 0 2px #444;
      border:4px solid #fff;
      background: -moz-linear-gradient(180deg, #000, #222);
  }
  .logo.loading-placeholder {
    width: 8rem;
    height: 8rem;
  }
  </style>
  <div class="er-container">
    <div class="er">
      <a href="#" target="_blank" class="logo loading-placeholder">
      </a>
      <header class="er-header">
          <a class="loading-placeholder" href="#" target="_blank">Loading...</a>
      </header>
      <div class="er-description">
          <p class="loading-placeholder"></p>
          <p class="loading-placeholder"></p>
          <p class="loading-placeholder"></p>
          <p class="loading-placeholder"></p>
      </div>
    </div>
    <div class="er-footer">
        <a href="#" target="_blank">Visit this site</a>
    </div>
  </div>
`;

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

    let logoLink = fragment.querySelector(".er a.logo");
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

    let descDiv = fragment.querySelector(".er-description");
    descDiv.textContent = '';
    for (let para of truncateText(data.description)) {
      let p = document.createElement("p");
      p.textContent = para;
      descDiv.appendChild(p);
    }

    let footerLink = fragment.querySelector(".er-footer a");
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