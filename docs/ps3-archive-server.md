# PS3 local archive downloads

The read-only server exposes only inventoried PS3 console builds and original archives. Large Texture Installer, Uncharted and Wesley packages can be downloaded directly from the local backup without mirroring them in the public site. It never installs, extracts or executes files.

From the repository, start a preview on this computer only:

```powershell
node scripts/serve-ps3-downloads.cjs
```

Open [http://127.0.0.1:8766/](http://127.0.0.1:8766/). To use a PS3 on the same LAN, explicitly bind to this computer’s private IPv4 address, for example:

```powershell
node scripts/serve-ps3-downloads.cjs --host=192.168.1.20
```

Use your computer’s actual address. Open `http://192.168.1.20:8766/` in the PS3 browser. In ezRemote, set the server URL to `http://192.168.1.20:8766/ezremote/`, HTTP server type to **Apache** (the default), and remote directory to `/`. Browse a resource folder, then the named build folder to reach its original filename. No firewall settings are changed automatically. If Windows blocks the connection, allow the Node process on your private network using your normal Windows settings. Keep the terminal open; Ctrl+C stops the server. An occupied port can be changed with `--port=8767`.

The directory uses ordinary HTML links without JavaScript. “Save with webMAN on this PS3” needs webMAN MOD already running; open it on the PS3 itself. It downloads to `/dev_hdd0/packages` and does not install or launch anything. A computer’s `127.0.0.1` address cannot be reached from the console. Packages still require the compatible PS3 environment and Package Manager. Archives need extraction; SPRX/EBOOT/script/configuration files need their documented game-specific destinations and dependencies. Allow enough console storage for downloads, extracted files and installation.

The server supports GET, HEAD and a single HTTP byte range for clients that resume downloads. It verifies a file’s recorded size and SHA-256 before first delivery and rechecks changed files. Only exact PS3 inventory records are exposed; desktop helpers, source code, documentation and unrelated consoles remain excluded. Runtime DDS/TXT dependencies are included only when explicitly classified as builds, separately from documentation. Restart after updating the archive inventory. The archive drive must be present. HTTP browser/client verification does not establish PS3 hardware installation or execution support.

Routes for site integration:

- `/` — directory; `/?resource=gta-iv-texture-installer-v2` filters by a resource ID.
- `/catalog.json` — sanitized metadata and direct file URLs; the same resource filter is supported.
- `/files/<32-character ID>/<filename>` — exact allowlisted file, including large backup-only packages.
- `/ezremote/` — Apache-format HTTP directory with relative resource/build/file links; choose Apache in ezRemote. JSON records also expose each build's `directoryUrl` and `ezremoteUrl`.
- Existing allowlisted `/downloads/ps3/...` and pinned `/downloads/archive/...` URLs also work against this server. The website’s file-server setting can use this server’s HTTP origin for those files.

The public responses contain no desktop archive paths or temporary source URLs. All responses are read-only. There are no upload, install, launch or delete endpoints.
