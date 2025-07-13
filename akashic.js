/*!
    Akashic.js -- Quicksave for Websites
    Version 0.1.1
    https://github.com/NaeemBolchhi/akashic-js
    (c) 2025 NaeemBolchhi, MIT License
*/

// Enclosed so that variables don't escape
(function() {
    'use strict';

// LZW Compression (Modified)
// Original Source: https://rosettacode.org/wiki/LZW_compression#JavaScript
const LZW = {
    compress: function (uncompressed) {
        "use strict";
        // Build the dictionary.
        var i,
            dictionary = {},
            c,
            wc,
            w = "",
            result = [],
            dictSize = 256;
        for (i = 0; i < 256; i += 1) {
            dictionary[String.fromCharCode(i)] = i;
        }

        for (i = 0; i < uncompressed.length; i += 1) {
            c = uncompressed.charAt(i);
            wc = w + c;
            //Do not use dictionary[wc] because javascript arrays 
            //will return values for array['pop'], array['push'] etc
           // if (dictionary[wc]) {
            if (dictionary.hasOwnProperty(wc)) {
                w = wc;
            } else {
                result.push(dictionary[w]);
                // Add wc to the dictionary.
                dictionary[wc] = dictSize++;
                w = String(c);
            }
        }

        // Output the code for w.
        if (w !== "") {
            result.push(dictionary[w]);
        }
        return result.toString();
    },
    decompress: function (compressedString) {
        "use strict";
        // Parse Array
        let compressed = compressedString.split(',').map(Number);

        // Build the dictionary.
        var i,
            dictionary = [],
            w,
            result,
            k,
            entry = "",
            dictSize = 256;
        for (i = 0; i < 256; i += 1) {
            dictionary[i] = String.fromCharCode(i);
        }

        w = String.fromCharCode(compressed[0]);
        result = w;
        for (i = 1; i < compressed.length; i += 1) {
            k = compressed[i];
            if (dictionary[k]) {
                entry = dictionary[k];
            } else {
                if (k === dictSize) {
                    entry = w + w.charAt(0);
                } else {
                    return null;
                }
            }

            result += entry;

            // Add w+entry[0] to the dictionary.
            dictionary[dictSize++] = w + entry.charAt(0);

            w = entry;
        }
        return result;
    }
};

// IndexedDB easy interaction
const inDB = {
    dbName: 'AkashicDB',
    storeName: 'AkashicAssets',
    dbVersion: 1,
    open: async function () {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(inDB.dbName, inDB.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(inDB.storeName)) {
                    db.createObjectStore(inDB.storeName);
                }
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    },
    write: async function (key, value) {
        let db;
        try {
            db = await inDB.open();
            const transaction = db.transaction([inDB.storeName], 'readwrite');
            const store = transaction.objectStore(inDB.storeName);

            return new Promise((resolve, reject) => {
                const request = store.put(value, key);

                request.onsuccess = () => {
                    resolve();
                };

                request.onerror = (event) => {
                    reject(event.target.error);
                };

                transaction.oncomplete = () => {
                    db.close();
                };
                transaction.onerror = (event) => {
                    reject(event.target.error);
                };
            });
        } catch (error) {
            if (db) db.close();
            throw error;
        }
    },
    read: async function (key) {
        let db;
        try {
            db = await inDB.open();
            const transaction = db.transaction([inDB.storeName], 'readonly');
            const store = transaction.objectStore(inDB.storeName);

            return new Promise((resolve, reject) => {
                const request = store.get(key);

                request.onsuccess = (event) => {
                    resolve(event.target.result || null);
                };

                request.onerror = (event) => {
                    reject(event.target.error);
                };

                transaction.oncomplete = () => {
                    db.close();
                };
                transaction.onerror = (event) => {
                    reject(event.target.error);
                };
            });
        } catch (error) {
            if (db) db.close();
            throw error;
        }
    }
};

// Base64 string conversion
const base64 = {
    do: function (string) {
        return btoa(encodeURIComponent(string).replace(/%([0-9A-F]{2})/g,
            function toSolidBytes(match, p1) {
                return String.fromCharCode('0x' + p1);
            })
        );
    },
    undo: function (string) {
        return decodeURIComponent(atob(string).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }
};

// Generate asset JSON from elements and attribute
async function consolidateAssets() {
    let aTag = document.querySelector('script[src*="akashic.min.js"],script[src*="akashic.js"]');

    window.akashicAssets = {
        "html": [],
        "css": [],
        "js": []
    };

    if (aTag.getAttribute('data-akashic') !== null && aTag.getAttribute('data-akashic') !== "") {
        let aTagData = aTag.getAttribute('data-akashic');
        try {
            // Try JSON parse first
            window.akashicAssets = JSON.parse(aTagData);
        } catch {
            try {
                // Try to decompress and then parse
                window.akashicAssets = JSON.parse(LZW.decompress(aTagData));
            } catch {
                try {
                    // Try to undoBase64 and then parse
                    window.akashicAssets = JSON.parse(base64.undo(aTagData));
                } catch {
                    try {
                        // Try to undoBase64, then decompress, then parse
                        window.akashicAssets = JSON.parse(LZW.decompress(base64.undo(aTagData)));
                    } catch {
                        console.log('Akashic.js: Could not parse data-akashic string.');
                    }
                }
            }
        }
    }

    // Add custom tags to the same js object
    let dynamicTags = document.querySelectorAll('akashic-css,akashic-html,akashic-js,link[rel="akashic"]');

    for (let x = 0; x < dynamicTags.length; x++) {
        let tp = dynamicTags[x].tagName.toLowerCase().replace(/^.*\-/i,''),
            fn = dynamicTags[x].getAttribute('data-name'),
            pt = dynamicTags[x].getAttribute('data-path'),
            vr = dynamicTags[x].getAttribute('data-version'),
            pr = dynamicTags[x].closest('head,body').tagName.toLowerCase(),
            id = dynamicTags[x].getAttribute('data-id') || '',
            st = dynamicTags[x].getAttribute('data-store') || 'ls';

        if (tp === "link") {
            tp = dynamicTags[x].getAttribute('data-tag');
        }

        window.akashicAssets[tp].push({
            "fn": fn,
            "pt": pt,
            "vr": vr,
            "pr": pr,
            "id": id,
            "st": st
        });
    }
}

// Wipe HTML fragment JS and other remains
async function clearRemains() {
    let remains = document.querySelectorAll('script[data-frag="true"],akashic-css,akashic-html,akashic-js,link[rel="akashic"]');

    for (let x = 0; x < remains.length; x++) {
        remains[x].remove();
    }

    delete window.akashicAssets;
    delete window.inDBCache;
    delete window.akashicStatus;
    delete window.akashicLoad;
    delete window.akashicSave;
}

// Handle CSS
async function akashicCSS() {
    if (!window.akashicAssets.hasOwnProperty('css')) {return;}

    let aCSS = window.akashicAssets.css,
        fType = 'CSS_';

    for (let x = 0; x < aCSS.length; x++) {
        if (localStorage.getItem(fType + aCSS[x].fn) === null ||
            parseInt(localStorage.getItem(fType + aCSS[x].fn)) < aCSS[x].vr) {

            let styleURL = aCSS[x].pt + aCSS[x].fn,
                style = document.createElement('link');

            if (!aCSS[x].pt.match(/^http/i)) {
                styleURL = window.location.origin + styleURL;
            }

            style.setAttribute('rel','stylesheet');
            style.setAttribute('type','text/css');
            style.href = styleURL;
            if (aCSS[x].id !== "" && aCSS[x].id !== undefined) {
                style.id = aCSS[x].id;
            }
            document.head.appendChild(style);

            window.akashicSave.push({"0": [styleURL, aCSS[x].fn, fType, aCSS[x].st],
                                     "1": [aCSS[x].fn, aCSS[x].vr]});
        } else {
            window.akashicLoad.push({"0": [aCSS[x].fn, fType],
                                     "1": [aCSS[x].st]});
        }
    }
}

// Handle HTML
async function akashicHTML() {
    if (!window.akashicAssets.hasOwnProperty('html')) {return;}

    let aHTML = window.akashicAssets.html,
        fType = 'HTML_';

    for (let x = 0; x < aHTML.length; x++) {
        if (localStorage.getItem(fType + aHTML[x].fn) === null ||
            parseInt(localStorage.getItem(fType + aHTML[x].fn)) < aHTML[x].vr) {

            let hfragURL = aHTML[x].pt + aHTML[x].fn,
                hfrag = document.createElement('script');

            if (!aHTML[x].pt.match(/^http/i)) {
                hfragURL = window.location.origin + hfragURL;
            }

            hfrag.setAttribute('type','text/javascript');
            hfrag.setAttribute('data-frag','true');
            hfrag.src = hfragURL;

            document.body.appendChild(hfrag);

            window.akashicSave.push({"0": [hfragURL, aHTML[x].fn, fType, aHTML[x].st],
                                     "1": [aHTML[x].fn, aHTML[x].vr]});
        } else {
            window.akashicLoad.push({"0": [aHTML[x].fn, fType],
                                     "1": [aHTML[x].st]});
        }
    }
}

// Handle JS
async function akashicJS() {
    if (!window.akashicAssets.hasOwnProperty('js')) {return;}

    let aJS = window.akashicAssets.js,
        fType = 'JS_';

    for (let x = 0; x < aJS.length; x++) {
        if (localStorage.getItem(fType + aJS[x].fn) === null ||
            parseInt(localStorage.getItem(fType + aJS[x].fn)) < aJS[x].vr) {

            let scriptURL = aJS[x].pt + aJS[x].fn,
                script = document.createElement('script');

            if (aJS[x].pt.match(/^http/i)) {
                scriptURL = aJS[x].pt + aJS[x].fn;
            } else {
                scriptURL = window.location.origin + scriptURL;
            }

            script.setAttribute('type','text/javascript');
            script.src = scriptURL;
            if (aJS[x].id !== '' && aJS[x].id !== undefined) {
                script.id = aJS[x].id;
            }
            document.querySelector(aJS[x].pr).appendChild(script);

            window.akashicSave.push({"0": [scriptURL, aJS[x].fn, fType, aJS[x].st],
                                     "1": [aJS[x].fn, aJS[x].vr]});
        } else {
            window.akashicLoad.push({"0": [aJS[x].fn, fType],
                                     "1": [aJS[x].st]});
        }
    }
}

// Save files when idle
async function saveResources() {
    try {
        let aSave = window.akashicSave;

        for (let x = 0; x < aSave.length; x++) {
            let method = localCache.quicksave;
            if (aSave[x][0][3] === 'indb') {
                method = localCache.save;
            }

            if (await method(aSave[x][0][0], aSave[x][0][1], aSave[x][0][2]) === true) {
                localStorage.setItem(aSave[x][0][2] + aSave[x][1][0], aSave[x][1][1]);
            }
        }

        await moveDB.toCache();
    } catch (error) {
        console.error(`Akashic.js Error: Something went wrong:`, error);
        return null;
    }
}

// Load files as needed
async function loadResources(delayed) {
    let aLoad = window.akashicLoad;

    for (let x = 0; x < aLoad.length; x++) {
        if (aLoad[x][1][0] !== 'indb' && !delayed) {
            // Loading 'ls' early
            loadRes(x);
        } else if (aLoad[x][1][0] === 'indb' && delayed) {
            // Loading 'indb' later
            loadRes(x);
        }
    }

    // Loading sorter
    function loadRes(x) {
        if (aLoad[x][0][1].match(/css/i)) {
            doCSS(aLoad[x][0][0], aLoad[x][0][1]);
        } else if (aLoad[x][0][1].match(/html/i)) {
            doHTML(aLoad[x][0][0], aLoad[x][0][1]);
        } else if (aLoad[x][0][1].match(/js/i)) {
            doJS(aLoad[x][0][0], aLoad[x][0][1]);
        }
    }
}

// Load CSS
async function doCSS(key, type) {
    let aCSS = window.akashicAssets.css;

    for (let x = 0; x < aCSS.length; x++) {
        if (aCSS[x].fn === key) {
            if (document.querySelector(`style[data-file="${aCSS[x].fn}"]`)) {continue;}

            let style = document.createElement('style'),
                method = localCache.quickload;
            style.setAttribute('type','text/css');
            if (aCSS[x].st === 'indb') {
                method = localCache.load;
            }
            style.textContent = await method(type + key + '_data');
            if (aCSS[x].id !== '' && aCSS[x].id !== undefined) {
                style.id = aCSS[x].id;
            }
            style.setAttribute('data-file', aCSS[x].fn);
            document.head.appendChild(style);
            break;
        }
    }
}

// Load HTML
async function doHTML(key, type) {
    let aHTML = window.akashicAssets.html;

    for (let x = 0; x < aHTML.length; x++) {
        if (aHTML[x].fn === key) {
            if (document.querySelector(`script[data-file="${aHTML[x].fn}"]`)) {continue;}

            let hfrag = document.createElement('script'),
                method = localCache.quickload;
            hfrag.setAttribute('type','text/javascript');
            if (aHTML[x].st === 'indb') {
                method = localCache.load;
            }
            hfrag.textContent = await method(type + key + '_data');
            hfrag.setAttribute('data-file', aHTML[x].fn);
            hfrag.setAttribute('data-frag','true');
            document.body.appendChild(hfrag);
            break;
        }
    }
}

// Load JS
async function doJS(key, type) {
    let aJS = window.akashicAssets.js;

    for (let x = 0; x < aJS.length; x++) {
        if (aJS[x].fn === key) {
            if (document.querySelector(`script[data-file="${aJS[x].fn}"]`)) {continue;}

            let script = document.createElement('script'),
                method = localCache.quickload;
            script.setAttribute('type','text/javascript');
            if (aJS[x].st === 'indb') {
                method = localCache.load;
            }
            script.textContent = await method(type + key + '_data');
            if (aJS[x].id !== '' && aJS[x].id !== undefined) {
                script.id = aJS[x].id;
            }
            script.setAttribute('data-file', aJS[x].fn);
            document.querySelector(aJS[x].pr).appendChild(script);
            break;
        }
    }
}

// Optimize indexed db transfers, one for all
const moveDB = {
    dbkey: 'aCache',
    toWindow: async function () {
        window.inDBCache = await inDB.read(moveDB.dbkey);
    },
    toCache: async function () {
        const merged = Object.assign({}, await inDB.read(moveDB.dbkey), window.inDBCache);
        await inDB.write(moveDB.dbkey, merged);
    }
};

// Store and retrieve data
const localCache = {
    fetch: async function (fileLink, fn) {
        try {
            const response = await fetch(fileLink + '?' + Date.now());

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} for ${fileLink}`);
            }

            const fileContent = await response.text();

            return LZW.compress(fileContent);
        } catch (error) {
            console.error(`Akashic.js Error: Failed to fetch '${fn}' from ${fileLink}:`, error);
        }
    },
    quicksave: async function (fileLink, fn, fileType) {
        try {
            let oneData = await localCache.fetch(fileLink, fn);

            if (oneData !== undefined && oneData !== null) {
                localStorage.setItem(fileType + fn + '_data', oneData);
                return true;
            }
        } catch (error) {
            console.error(`Akashic.js Error: Failed to cache '${fn}':`, error);
        }
    },
    save: async function (fileLink, fn, fileType) {
        try {
            let oneData = await localCache.fetch(fileLink, fn);

            if (oneData !== undefined && oneData !== null) {
                window.inDBCache[fileType + fn + '_data'] = oneData;
                return true;
            }
        } catch (error) {
            console.error(`Akashic.js Error: Failed to cache '${fn}':`, error);
        }
    },
    quickload: async function (key) {
        try {
            let value = localStorage.getItem(key);

            if (value !== null && value !== undefined) {
                return LZW.decompress(value);
            }
            return null;
        } catch (error) {
            console.error(`Akashic.js Error: Failed to retrieve '${key}' from cache:`, error);
            return null;
        }
    },
    load: async function (key) {
        try {
            let value = window.inDBCache[key];

            if (value !== null && value !== undefined) {
                return LZW.decompress(value);
            }
            return null;
        } catch (error) {
            console.error(`Akashic.js Error: Failed to retrieve '${key}' from cache:`, error);
            return null;
        }
    }
};

// Akashic main function
async function akashicState() {
    await consolidateAssets();

    document.documentElement.style.display = 'none';

    await akashicCSS();
    await akashicHTML();
    await akashicJS();

    // without variables to load early
    await loadResources();

    document.documentElement.style.removeProperty('display');
    if (document.documentElement.getAttribute('style') === '') {
        document.documentElement.removeAttribute('style');
    }

    await moveDB.toWindow();

    // with true to load later
    await loadResources(true);

    await saveResources();

    // comment out to leave remains
    await clearRemains();
}

// Run akashic main thread
(function() {
    'use strict';

    window.inDBCache = {};
    window.akashicSave = [];
    window.akashicLoad = [];

    if (document.readyState == 'complete' || document.readyState == 'interactive') {
        akashicState();
    } else {
        document.addEventListener('readystatechange', () => {
            if (window.akashicStatus === true) {return;}
            if (document.readyState !== 'complete' && document.readyState !== 'interactive') {return;}

            akashicState();
            window.akashicStatus = true;
        });
    }
})();

})();