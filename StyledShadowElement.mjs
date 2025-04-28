/*
This file is used by me to make it so that I can style the custom elements that
I use on a per-component basis, the following lines will need to be updated to
account for your system's file structure
	65
using this mixin also makes it so that styling that Foundry makes can be prevented
from hitting the component (because I really like writing CSS and Foundry's causes
more issues than it helps with my designs).
*/

/**
 * @param {HTMLElement} Base
 */
export function StyledShadowElement(Base) {
	return class extends Base {
		/**
		 * The path to the CSS that is loaded
		 * @type {string}
		 */
		static _stylePath;

		/**
		 * The stringified CSS to use
		 * @type {Map<string, string>}
		 */
		static _styles = new Map();

		/**
		 * The HTML element of the stylesheet
		 * @type {HTMLStyleElement}
		 */
		_style;

		/** @type {ShadowRoot} */
		_shadow;

		constructor() {
			super();

			this._shadow = this.attachShadow({ mode: `open` });
			this._style = document.createElement(`style`);
			this._shadow.appendChild(this._style);
		};

		#mounted = false;
		connectedCallback() {
			if (this.#mounted) { return };

			this._getStyles();

			this.#mounted = true;
		};

		disconnectedCallback() {
			if (!this.#mounted) { return };
			this.#mounted = false;
		};

		_getStyles() {
			// TODO: Cache the CSS content in a more sane way that doesn't break
			const stylePath = this.constructor._stylePath;
			if (this.constructor._styles.has(stylePath)) {
				this._style.innerHTML = this.constructor._styles.get(stylePath);
			} else {
				fetch(`./systems/${game.system.id}/templates/${stylePath}`)
					.then(r => r.text())
					.then(t => {
						this.constructor._styles.set(stylePath, t);
						this._style.innerHTML = t;
					});
			}
		};
	};
};
