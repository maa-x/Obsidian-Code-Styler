import { App } from "obsidian";

import { CodeblockStylerSettings, CodeblockStylerThemeColors, CodeblockStylerThemeModeColors, CodeblockStylerThemeSettings, Color, LANGUAGE_NAMES, LANGUAGE_COLORS } from "./Settings";
import { isCss } from "./SettingsTab";

interface ThemeStyle {
	'border'?: {
		'size': number;
		'style': string;
	},
	'extra'?: string;
}

const STYLE_ID = 'codeblock-styler-styles';
const THEME_STYLES: Record<string,ThemeStyle> = {
	'Prism': {
		'border': {
			'size': 1,
			'style': '1px solid var(--window-border-color)',
		},
	},
	'Shimmering Focus': {
		'border': {
			'size': 1,
			'style': 'var(--thin-muted-border)',
		},
	},
	'Minimal': {
		'extra': `
			.markdown-source-view.mod-cm6.is-readable-line-width :not(pre.codeblock-styler-pre) > [class^='codeblock-styler-header-container'] {
				max-width: calc(var(--max-width) - var(--folding-offset)) !important;
				width: calc(var(--line-width-adaptive) - var(--folding-offset)) !important;
				margin-left: max(calc(50% + var(--folding-offset) - var(--line-width-adaptive)/2), calc(50% + var(--folding-offset) - var(--max-width)/2)) !important;
			}
		`,
	},
}

export function updateStyling(settings: CodeblockStylerSettings, app: App): void {
	let currentTheme = getCurrentTheme(app);
	let styleTag = getStyleTag();
	styleTag.innerText = (styleThemeColors(settings.currentTheme.colors)+styleThemeSettings(settings.currentTheme.settings,currentTheme)+styleLanguageColors(settings.currentTheme.settings,settings.redirectLanguages,currentTheme)).trim().replace(/\s+/g,' ');
	addThemeSettingsClasses(settings.currentTheme.settings);
}

function styleThemeColors (themeColors: CodeblockStylerThemeColors): string {
	return Object.keys(themeColors.light.highlights.alternativeHighlights).reduce((result: string, alternativeHighlight: string) => {
		return result + `
			body.codeblock-styler .codeblock-styler-line-highlighted-${alternativeHighlight.replace(/\s+/g, '-').toLowerCase()} {
				--gradient-background-color: var(--codeblock-styler-${alternativeHighlight.replace(/\s+/g, '-').toLowerCase()}-highlight-color) !important;
			}
		`;
	},`
		body.codeblock-styler.theme-light {
			${getThemeColors(themeColors.light)}
		}
		body.codeblock-styler.theme-dark {
			${getThemeColors(themeColors.dark)}
		}
	`);
}

function getThemeColors (themeModeColors: CodeblockStylerThemeModeColors): string {
	return Object.entries({
		'codeblock-background-color': themeModeColors.codeblock.backgroundColor,
		'codeblock-text-color': themeModeColors.codeblock.textColor,
		'gutter-background-color': themeModeColors.gutter.backgroundColor,
		'gutter-text-color': themeModeColors.gutter.textColor,
		'gutter-active-text-color': themeModeColors.gutter.activeTextColor,
		'header-background-color': themeModeColors.header.backgroundColor,
		'header-title-text-color': themeModeColors.header.title.textColor,
		'header-language-tag-background-color': themeModeColors.header.languageTag.backgroundColor,
		'header-language-tag-text-color': themeModeColors.header.languageTag.textColor,
		'header-separator-color': themeModeColors.header.lineColor,
		'active-codeblock-line-color': themeModeColors.highlights.activeCodeblockLineColor,
		'active-editor-line-color': themeModeColors.highlights.activeEditorLineColor,
		'default-highlight-color': themeModeColors.highlights.defaultColor,
		'button-color': themeModeColors.advanced.buttonColor,
		'button-active-color': themeModeColors.advanced.buttonActiveColor,
		...Object.entries(themeModeColors.highlights.alternativeHighlights).reduce((result: Record<string,Color>,[alternativeHighlight,color]: [string,Color]): Record<string,Color> => {
			result[`${alternativeHighlight.replace(/\s+/g, '-').toLowerCase()}-highlight-color`] = color;
			return result;
		},{})
	}).reduce((result: string, [cssVariable,color]: [string,Color]): string => {
		const styleColor = isCss(color)?`var(${color})`:color;
		return result + `--codeblock-styler-${cssVariable}: ${styleColor};`
	},``)
}

function styleThemeSettings (themeSettings: CodeblockStylerThemeSettings, currentTheme: string): string {
	return `
		body.codeblock-styler [class^="codeblock-styler-header-language-tag"] {
			--codeblock-styler-header-language-tag-text-bold: ${themeSettings.header.languageTag.textBold?'bold':'normal'};
			--codeblock-styler-header-language-tag-text-italic: ${themeSettings.header.languageTag.textItalic?'italic':'normal'};
			font-family: ${themeSettings.header.languageTag.textFont!==''?themeSettings.header.languageTag.textFont:'var(--font-text)'};
		}
		body.codeblock-styler .codeblock-styler-header-text {
			--codeblock-styler-header-title-text-bold: ${themeSettings.header.title.textBold?'bold':'normal'};
			--codeblock-styler-header-title-text-italic: ${themeSettings.header.title.textItalic?'italic':'normal'};
			font-family: ${themeSettings.header.languageTag.textFont!==''?themeSettings.header.languageTag.textFont:'var(--font-text)'};
		}
		body.codeblock-styler {
			--border-radius: ${themeSettings.codeblock.curvature}px;
			--language-icon-size: ${themeSettings.advanced.iconSize}px;
			--gradient-highlights-color-stop: ${themeSettings.advanced.gradientHighlights?themeSettings.advanced.gradientHighlightsColorStop:'100%'};
			--header-font-size: ${themeSettings.header.fontSize}px;
			--line-wrapping: ${themeSettings.codeblock.unwrapLines?'pre':'pre-wrap'};
			${!themeSettings.codeblock.wrapLinesActive?'':'--line-active-wrapping: pre-wrap;'}
			${themeSettings.header.languageIcon.displayColor?'':'--language-icon-filter: grayscale(1);'}
		}
		${THEME_STYLES?.[currentTheme]?.border?`
			.markdown-source-view :not(pre.codeblock-styler-pre) > [class^='codeblock-styler-header-container'] {
				--codeblock-styler-header-border:`+ //@ts-expect-error Does Exist
					THEME_STYLES[currentTheme].border.style+`;
				--header-separator-width-padding: calc(var(--header-separator-width) - `+ //@ts-expect-error Does Exist
					THEME_STYLES[currentTheme].border.size+`px);
				--collapsed-bottom-border: var(--codeblock-styler-header-border);
			}
		`:''}
		${THEME_STYLES?.[currentTheme]?.extra?THEME_STYLES[currentTheme].extra:''}
	`;
}

function styleLanguageColors (themeSettings: CodeblockStylerThemeSettings, redirectLanguages: Record<string,{color?: Color, icon?: string}>, currentTheme: string): string {
	return Object.entries(LANGUAGE_NAMES).reduce((result: string,[languageName, languageDisplayName]: [string,string]): string => {
		if (languageDisplayName in LANGUAGE_COLORS || (languageName in redirectLanguages && 'color' in redirectLanguages[languageName])) {
			result += `
				.language-${languageName} {
					--language-border-color: ${redirectLanguages?.[languageName]?.['color'] ?? LANGUAGE_COLORS[languageDisplayName]};
					--language-border-width: ${themeSettings.advanced.languageBorderColor?themeSettings.advanced.languageBorderWidth:0}px;
				}
			`;
			if (THEME_STYLES?.[currentTheme]?.border) {
				result += `
					.markdown-source-view :not(pre.codeblock-styler-pre) > [class^='codeblock-styler-header-container'].language-${languageName}  {
						--language-border-width: ${ //@ts-expect-error Does exist
							themeSettings.advanced.languageBorderColor?themeSettings.advanced.languageBorderWidth+THEME_STYLES[currentTheme].border.size:0
						}px;
					}`
			}
		}
		return result;
	},'')
}

function addThemeSettingsClasses (themeSettings: CodeblockStylerThemeSettings): void {
	if (themeSettings.codeblock.lineNumbers)
		document.body.classList.add("codeblock-styler-show-line-numbers");
	else
		document.body.classList.remove("codeblock-styler-show-line-numbers");

	if (themeSettings.gutter.highlight)
		document.body.classList.add('codeblock-styler-gutter-highlight');
	else
		document.body.classList.remove('codeblock-styler-gutter-highlight');

	if (themeSettings.gutter.activeLine)
		document.body.classList.add('codeblock-styler-gutter-active-line');
	else
		document.body.classList.remove('codeblock-styler-gutter-active-line');
	
	document.body.classList.remove("codeblock-styler-active-line-highlight","codeblock-styler-active-line-highlight-codeblock","codeblock-styler-active-line-highlight-editor")
	if (themeSettings.highlights.activeEditorLine && themeSettings.highlights.activeCodeblockLine) // Inside and outside of codeblocks with different colors
		document.body.classList.add("codeblock-styler-active-line-highlight");
	else if (themeSettings.highlights.activeEditorLine && !themeSettings.highlights.activeCodeblockLine) // Only outside codeblocks
		document.body.classList.add("codeblock-styler-active-line-highlight-editor");
	else if (!themeSettings.highlights.activeEditorLine && themeSettings.highlights.activeCodeblockLine) // Only inside codeblocks
		document.body.classList.add("codeblock-styler-active-line-highlight-codeblock");
	
	document.body.classList.remove("codeblock-styler-show-langnames","codeblock-styler-show-langnames-always");
	if (themeSettings.header.languageTag.display === 'always')
		document.body.classList.add("codeblock-styler-show-langnames-always");
	else if (themeSettings.header.languageTag.display === 'if_header_shown')
		document.body.classList.add("codeblock-styler-show-langnames");

	document.body.classList.remove("codeblock-styler-show-langicons","codeblock-styler-show-langicons-always");
	if (themeSettings.header.languageIcon.display === 'always')
		document.body.classList.add("codeblock-styler-show-langicons-always");
	else if (themeSettings.header.languageIcon.display === 'if_header_shown')
		document.body.classList.add("codeblock-styler-show-langicons");
}

export function removeStylesAndClasses(): void {
	document.getElementById(STYLE_ID)?.remove();
	document.body.classList.remove(
		'codeblock-styler',
		"codeblock-styler-show-line-numbers",
		'codeblock-styler-gutter-highlight',
		'codeblock-styler-gutter-active-line',
		"codeblock-styler-show-langnames",
		"codeblock-styler-show-langnames-always",
		"codeblock-styler-show-langicons",
		"codeblock-styler-show-langicons-always",
	);
}

function getStyleTag(style_id: string = STYLE_ID): HTMLElement {
	let styleTag = document.getElementById(style_id);
	if (!styleTag) {
		styleTag = document.createElement('style');
		styleTag.id = style_id;
		document.getElementsByTagName('head')[0].appendChild(styleTag);
	}
	return styleTag
}

function getCurrentTheme(app: App): string {
	//@ts-expect-error Undocumented Obsidian API
	return app.vault.getConfig("cssTheme");
}
