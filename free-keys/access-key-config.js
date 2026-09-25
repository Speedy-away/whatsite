// Public browser API configuration. The portal key and policy slugs are public
// identifiers; Turnstile secrets remain encrypted on ProudlyServer.
window.SCOOBY_ACCESS_KEY_CONFIG = Object.freeze({
    apiBase: 'https://proudlyauthentication.com',
    portalKey: 'pk_gri2butNfQ28AWQqNTD5xLtQKwer2MNv',
    policies: Object.freeze({
        gta5: 'allfree',
        rdr2: 'allfree',
        cs2: 'allfree',
        gmod: 'allfree',
        fivem: 'allfree',
        spoofer: 'allfree',
        l4d: 'allfree',
        sbox: 'allfree',
        tlou: 'allfree'
    })
});
