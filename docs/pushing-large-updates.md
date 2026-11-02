# Pushing large updates

GitHub limits one Git push to 2 GiB. The number of files is not the limit.
The four pending commits inspected on 2026-11-02 contain 12.90 GiB of new
blobs, including a first commit containing 12.34 GiB.

Check the upload plan from the repository root:

```powershell
node scripts/push-in-batches.cjs
```

Upload in batches, then push the existing main commits:

```powershell
node scripts/push-in-batches.cjs --push
```

The helper uploads blobs in batches of at most 768 MiB to a temporary
`codex/upload-objects-<commit>` branch. After uploading, it anchors the original
history on that temporary branch so GitHub knows the original commits too.
It then uses push negotiation to fast-forward remote main to the original local commit, verifies the result, and removes
the temporary branch. It preserves local commits, files and the Git index.
It does not force-push main, rewrite history or execute downloaded files.
The temporary branch contains object-ID filenames rather than a working site.

If interrupted, run the same command again. The plan is saved inside
`.git/batch-upload/`, and completed batches are skipped. Keep the same HEAD
and batch size until the upload completes. Smaller batches are available
with `--batch-mib=256` (range 1–768); a single file is kept intact. All new
blobs are checked against GitHub's 100 MiB file limit before uploading.

GitHub Desktop can remain open, but avoid simultaneous pushes or commits.
After completion its ahead count should clear when it refreshes.

Reference: [GitHub's 2 GiB push limit](https://docs.github.com/en/get-started/using-git/troubleshooting-the-2-gb-push-limit).
