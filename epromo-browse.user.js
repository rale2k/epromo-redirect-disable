// ==UserScript==
// @name         ePROMO - Stop loyalty-card redirect
// @namespace    local.epromo
// @version      1.0.0
// @description  Keep browsing instead of being sent to /no-loyalty-card. Does not change account data or server permissions.
// @match        https://epromo.ee/*
// @run-at       document-start
// @grant        none
// @sandbox      raw
// @inject-into  page
// ==/UserScript==

(() => {
    'use strict';

    // Disable only the component responsible for the automatic redirect.
    // Match its export name rather than a build-specific chunk/module ID.
    const chunks = window.webpackChunk_N_E = window.webpackChunk_N_E || [];
    let push = wrap(chunks.push);

    function intercept(originalPush, ...entries) {
        for (const entry of entries) {
            const modules = entry[1];
            if (!modules) continue;
            for (const id of Object.keys(modules)) {
                const source = Function.prototype.toString.call(modules[id]);
                if (!/\bLoyaltyCardsCheck\s*:/.test(source) ||
                    !source.includes('NoLoyaltyCard')) continue;

                modules[id] = function (module, exports, require) {
                    require.r(exports);
                    require.d(exports, { LoyaltyCardsCheck: () => () => null });
                };
                console.info('[ePROMO browse] Disabled loyalty-card redirect component.');
            }
        }
        return originalPush.apply(this, entries);
    }

    function wrap(originalPush) {
        return function (...entries) {
            return intercept.call(this, originalPush, ...entries);
        };
    }

    // Keep intercepting when webpack installs its own chunk loader.
    Object.defineProperty(chunks, 'push', {
        configurable: true,
        get: () => push,
        set: value => { push = wrap(value); }
    });
})();
