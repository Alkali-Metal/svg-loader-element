/*
This file is the heavy-weight of the SVG loader, you will want to update lines:
	12
	24
	69
	84
at the minimum to account for your file structure, and how you want to tell the
component to have hot-reload support. (I do this by using a client setting named
"devMode" that I set to true)
*/

import { StyledShadowElement } from "./mixins/StyledShadowElement.mjs";

/**
Attributes:
@property {string} name - The name of the icon, takes precedence over the path
@property {string} path - The path of the icon file
*/
export class CustomIcon extends StyledShadowElement(HTMLElement) {
	static elementName = `custom-icon`;
	static formAssociated = false;

	/* Stuff for the mixin to use */
	static _stylePath = `css/components/icon.css`;


	static _cache = new Map();
	#container;
	/** @type {null | string} */
	_name;
	/** @type {null | string} */
	_path;

	/* Stored IDs for all of the hooks that are in this component */
	#svgHmr;

	constructor() {
		super();

		this.#container = document.createElement(`div`);
		this._shadow.appendChild(this.#container);
	};

	_mounted = false;
	async connectedCallback() {
		super.connectedCallback();
		if (this._mounted) { return };

		this._name = this.getAttribute(`name`);
		this._path = this.getAttribute(`path`);

		/*
		This converts all of the double-dash prefixed properties on the element to
		CSS variables so that they don't all need to be provided by doing style=""
		*/
		for (const attrVar of this.attributes) {
			if (attrVar.name?.startsWith(`var:`)) {
				const prop = attrVar.name.replace(`var:`, ``);
				this.style.setProperty(`--` + prop, attrVar.value);
			};
		};

		/*
		Try to retrieve the icon if it isn't present, try the path then default to
		the slot content, as then we can have a default per-icon usage
		*/
		let content;
		if (this._name) {
			content = await this.#getIcon(`./systems/${game.system.id}/assets/${this._name}.svg`);
		};

		if (this._path && !content) {
			content = await this.#getIcon(this._path);
		};

		if (content) {
			this.#container.appendChild(content.cloneNode(true));
		};

		/*
		This is so that when we get an HMR event from Foundry we can appropriately
		handle it using our logic to update the component and the icon cache.
		*/
		if (game.settings.get(game.system.id, `devMode`)) {
			this.#svgHmr = Hooks.on(`${game.system.id}-hmr:svg`, (iconName, data) => {
				if (this._name === iconName || this._path?.endsWith(data.path)) {
					const svg = this.#parseSVG(data.content);
					this.constructor._cache.set(iconName, svg);
					this.#container.replaceChildren(svg.cloneNode(true));
				};
			});
		};

		this._mounted = true;
	};

	disconnectedCallback() {
		super.disconnectedCallback();
		if (!this._mounted) { return };

		Hooks.off(`${game.system.id}-hmr:svg`, this.#svgHmr);

		this._mounted = false;
	};

	async #getIcon(path) {
		// Cache hit!
		if (this.constructor._cache.has(path)) {
			console.debug(`Image ${path} cache hit`);
			return this.constructor._cache.get(path);
		};

		const r = await fetch(path);
		switch (r.status) {
			case 200:
			case 201:
				break;
			default:
				console.error(`Failed to fetch icon: ${path}`);
				return;
		};

		console.debug(`Adding image ${path} to the cache`);
		const svg = this.#parseSVG(await r.text());
		this.constructor._cache.set(path, svg);
		return svg;
	};

	/** Takes an SVG string and returns it as a DOM node */
	#parseSVG(content) {
		const temp = document.createElement(`div`);
		temp.innerHTML = content;
		return temp.querySelector(`svg`);
	};
};
