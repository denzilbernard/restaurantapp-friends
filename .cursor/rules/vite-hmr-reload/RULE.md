---
description: Ensures Vite's hot module replacement reloads properly after code changes. Use when making changes to React/Vite projects or when the browser doesn't reflect code updates.
alwaysApply: false
---

# Vite HMR Reload Rule

This rule ensures that Vite's Hot Module Replacement (HMR) properly reloads the browser after code changes.

## When Making Code Changes

After editing any file in a Vite project:

1. **Save the file** - Ensure all changes are saved
2. **Trigger file watcher** - If HMR doesn't detect changes, add a small whitespace change or comment to trigger Vite's file watcher
3. **Refresh browser** - Navigate to the app URL and wait for Vite to reload
4. **Verify changes** - Take a snapshot or check the browser to confirm changes are visible

## Force Reload Methods

If Vite's HMR doesn't pick up changes automatically:

### Method 1: Touch the File
Add a small comment or whitespace change to trigger Vite's file watcher:
```javascript
// Force reload trigger
```

### Method 2: Navigate Browser
After making changes, always navigate to the app:
```javascript
// Navigate to http://localhost:5173 (or your Vite dev server URL)
// Wait 2-3 seconds for HMR to process
// Take a snapshot to verify changes
```

### Method 3: Hard Refresh Browser
If changes still don't appear:
- Use `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux) for hard refresh
- Or navigate with cache-busting: `http://localhost:5173/?t=${Date.now()}`

## Vite Configuration

Ensure your `vite.config.js` has proper HMR settings:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: true  // Show error overlay
    },
    watch: {
      usePolling: true  // Use polling for file changes (if needed)
    }
  }
})
```

## Troubleshooting

If HMR consistently fails:
1. Check that the dev server is running (`npm run dev`)
2. Verify Vite is connected (check browser console for `[vite] connected.`)
3. Check for compilation errors in terminal
4. Restart the dev server if needed

## After Code Changes Checklist

**ALWAYS follow these steps after making code changes:**

1. ✅ **Save the file** - Ensure all changes are saved
2. ✅ **Navigate browser** - Use `browser_navigate` to go to `http://localhost:5173`
3. ✅ **Wait for HMR** - Wait 2-3 seconds for Vite to process changes
4. ✅ **Verify changes** - Use `browser_snapshot` to confirm changes are visible
5. ✅ **If changes don't appear** - Try hard refresh (`Cmd+Shift+R` or `Ctrl+Shift+R`)

## Automated Reload Pattern

When making code changes, always end with this sequence:

```javascript
// After making changes:
1. Save file (already done by edit tools)
2. Navigate browser: browser_navigate('http://localhost:5173')
3. Wait: browser_wait_for({ time: 3 })
4. Snapshot: browser_snapshot()
5. Verify changes are visible
```

## Force Reload Script

If HMR consistently fails, you can use the force reload script:

```bash
node .cursor/rules/vite-hmr-reload/force-reload.js
```

This touches `vite.config.js` to trigger Vite's file watcher.

## After Code Changes Checklist

- [ ] File is saved
- [ ] Browser is navigated to the app URL
- [ ] Wait 2-3 seconds for HMR
- [ ] Verify changes in browser snapshot
- [ ] If changes don't appear, try hard refresh or restart dev server
