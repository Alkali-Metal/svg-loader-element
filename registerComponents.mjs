import { CustomIcon } from "./CustomIcon.mjs";

const components = [
	CustomIcon
];

// call this in your init hook
export function registerCustomComponents() {
	for (const component of components) {
		if (!window.customElements.get(component.elementName)) {
			console.debug(`Registering component "${component.elementName}"`);
			window.customElements.define(
				component.elementName,
				component,
			);
		};
	}
};
