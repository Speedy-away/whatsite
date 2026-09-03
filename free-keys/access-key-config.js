// Public browser API configuration. The portal key and policy slugs are public
// identifiers; Turnstile secrets remain encrypted on ProudlyServer.
window.SCOOBY_ACCESS_KEY_CONFIG = Object.freeze({
    apiBase: 'https://proudlyauthentication.com',
    portalKey: 'pk_gri2butNfQ28AWQqNTD5xLtQKwer2MNv',
    policies: Object.freeze({
        gta5: 'gtav',
        rdr2: 'rdr',
        cs2: 'cs2',
        gmod: 'gmod',
        fivem: 'fivem',
        spoofer: 'spoofer'
    })
});
