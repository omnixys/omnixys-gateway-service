/**
 * @license GPL-3.0-or-later
 * Copyright (C) 2025 Caleb Gyamfi - Omnixys Technologies
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * For more information, visit <https://www.gnu.org/licenses/>.
 */

/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  // Output-Verzeichnis
  out: 'docs',

  // Haupt-Einstiegspunkt (expand = alle Module im Ordner src)
  entryPoints: ['src'],
  entryPointStrategy: 'expand',

  // Anzeigeoptionen
  name: 'Omnixys Invitation API Documentation',
  includeVersion: true,
  readme: './README.md',
  lang: 'en', // statt htmlLang

  // Theme-Konfiguration
  theme: 'default', // → Standard HTML Theme
  // plugin: ['typedoc-plugin-markdown'],
  // theme: 'markdown'  → falls du Markdown-Ausgabe willst (z. B. für mkdocs)

  // Sichtbarkeitsfilter
  excludePrivate: true,
  excludeProtected: false,
  excludeExternals: true,

  // Validierung
  validation: {
    invalidLink: true,
  },

  // Saubere URLs für GitHub Pages (optional)
  cleanOutputDir: true, // löscht alten Inhalt von /docs bei jedem Build

  // Branding über Custom CSS
  customCss: 'public/theme.css',
};
