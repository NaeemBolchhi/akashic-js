# Akashic.js - Quicksave for Websites
Akashic.js is a lightweight JavaScript library designed to enhance website performance and user experience by caching and serving static assets (CSS, HTML fragments, and JavaScript).

## Features
- **Intelligent Caching:** Leverages both localStorage and IndexedDB to store assets, prioritizing localStorage for smaller, frequently accessed files and IndexedDB for larger resources.
- **Version Control:** Automatically updates cached assets when a new version is supplied, ensuring users always have the latest content.
- **LZW Compression:** Utilizes LZW compression to reduce the size of cached data, optimizing storage and transfer.
- **Base64 Encoding/Decoding:** Handles Base64 encoding and decoding for data passed via the data-akashic attribute.
- **Declarative Asset Management:** Define your assets directly in your HTML using a `data-akashic` attribute on the script tag or through custom HTML tags (`<akashic-css>`, `<akashic-html>`, `<akashic-js>`, `<link rel="akashic">`).

## Getting Started
### Installation
The easiest way to include Akashic.js in your project is by adding the script tag to your HTML:

```html
<script src="path/to/akashic.min.js" defer></script>
```
Replace `path/to/akashic.min.js` with the actual path to the Akashic.js file in your project. It's recommended to include the defer attribute for optimal loading.

### Usage
Akashic.js offers two ways to declare and manage your assets:

#### 1. Using the `data-akashic` attribute
You can define all your assets as a JSON string within the `data-akashic` attribute of the Akashic.js script tag.

```html
<script src="akashic.min.js" defer data-akashic='{ /* JSON config */ }'></script>
```

The JSON config can also be **LZW** compressed and/or encoded to **Base64**. Use a tool like [Code Beautify](https://codebeautify.org/jsonviewer) to minify your JSON config.

```json
{
  "html": [
    {
      "fn": "header.html.min.js",
      "pt": "/hfrags/",
      "vr": "1",
      "st": "ls"
    },
    {
      "fn": "images.html.min.js",
      "pt": "/hfrags/",
      "vr": "1",
      "st": "indb"
    }
  ],
  "css": [
    {
      "fn": "main.min.css",
      "pt": "/styles/",
      "id": "",
      "vr": "1",
      "st": "ls"
    },
    {
      "fn": "normalize.min.css",
      "pt": "/styles/",
      "id": "",
      "vr": "1",
      "st": "ls"
    }
  ],
  "js": [
    {
      "fn": "theme.min.js",
      "pt": "/scripts/",
      "id": "",
      "pr": "head",
      "vr": "1",
      "st": "ls"
    },
    {
      "fn": "main.min.js",
      "pt": "/scripts/",
      "id": "",
      "pr": "body",
      "vr": "1",
      "st": "indb"
    }
  ]
}
```

##### Attribute details for `data-akashic` JSON:
- **`html`, `css`, `js`:** Arrays containing objects for each asset type.
- **`fn` (filename):** The name of the asset file (e.g., main.min.css).
- **`pt` (path):** The relative or absolute path to the asset's directory (e.g., /styles/).
- **`vr` (version):** The version number of the asset. Akashic.js will re-fetch and update the cache if the stored version is older.
- **`st` (storage):** Specifies the storage mechanism:
    - **"ls":** **localStorage** (for smaller assets, quicker access).
    - **"indb":** **IndexedDB** (for larger assets, slightly delayed loading).
- **`id` (ID - optional):** An optional ID to apply to the injected `<link>` or `<script>` tag.
- **`pr` (parent - for JS only):** Specifies where the JavaScript should be placed: `"head"` or `"body"`.

#### 2. Using Custom HTML Tags
You can also declare assets using custom HTML tags directly within your `head` or `body`.

```html
<head>
    <link rel="akashic" data-tag="css" data-name="normalize.min.css" data-path="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/" data-version="1" data-store="ls">
    <link rel="akashic" data-tag="css" data-name="main.min.css" data-path="/styles/" data-id="light" data-version="1" data-store="indb">
    <link rel="akashic" data-tag="js" data-name="theme.min.js" data-path="/scripts/" data-version="1" data-store="indb">
</head>
<body>
    <akashic-html data-name="home.html.min.js" data-path="/hfrags/" data-version="1" data-store="ls"></akashic-html>
    <akashic-css data-name="special.min.css" data-path="/styles/" data-version="1" data-store="ls"></akashic-html>
    <akashic-js data-name="main.min.js" data-path="/scripts/" data-version="1" data-store="indb"></akashic-js>
</body>
```

##### Attribute Details for Custom Tags:
- **`data-tag:`** Akashic custom tags don't work in `<head>` due to browser rules. Instead, `<link rel="akashic">` can be used when defining elements in `<head>`. In this case, you need the `data-tag` attribute to define it as `css`, `js`, or `html`.
- **`data-name:`** Equivalent to `fn` in the JSON configuration.
- **`data-path:`** Equivalent to `pt`.
- **`data-version:`** Equivalent to `vr`.
- **`data-store:`** Equivalent to `st`.
- **`data-id` (optional):** Equivalent to `id`.
- **parent:** Automatically detected based on whether the custom tag is inside `<head>` or `<body>`. Equivalent to `pr`. Only applicable to `js`.

## How it Works
1. **Asset Consolidation:** On page load, Akashic.js scans for declared assets (via `data-akashic` attribute or custom tags, or both) and consolidates them into a single internal object.

2. **Version Check:** For each asset, it checks if a cached version exists in **localStorage** and if its version matches or is newer than the declared version.

3. **Fetch & Cache:**
  - If an asset is new or its version is outdated, Akashic.js fetches the resource from its specified `path` and `filename`.
  - The fetched content is then compressed using LZW and stored in either **localStorage** ("ls") or **IndexedDB** ("indb") based on your configuration.

4. **Inject & Serve:**
  - For assets already in cache or newly fetched, Akashic.js dynamically injects the content directly into the DOM (as `<style>` tags for CSS, and `<script>` tags for HTML fragments and JavaScript). This minimizes network requests on subsequent visits.
  - As HTML fragments are stored as `*.html.js` or `*.html.min.js` files, they will contain both the html code and some js code for inserting the html code somewhere in the DOM when the file is loaded into a `<script>` tag.

5. **Cleanup:** After processing, Akashic.js removes its temporary global variables and any custom tags from the DOM, leaving a clean page.

## Releases
Release links can be found in [CDN.md](https://github.com/NaeemBolchhi/akashic-js/blob/main/CDN.md).

## Development
To contribute or set up a development environment:

1. Clone the repository:

```Bash
git clone https://github.com/NaeemBolchhi/akashic-js.git
cd akashic-js
```

2. Make your changes.
3. Run tests.
4. Open a Pull Request!

## Gratitude
- [LZW Compression](https://rosettacode.org/wiki/LZW_compression#JavaScript)
- Easy IndexedDB Handler by Gemini
- [Proper Base64 Encoding and Decoding](https://stackoverflow.com/a/30106551)

## License
Akashic.js is released under the [MIT License](https://github.com/NaeemBolchhi/akashic-js/blob/main/README.md).