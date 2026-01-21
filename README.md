# Restaurant Recommendations Website

A lightweight React application for filtering and viewing restaurant recommendations with an admin CSV upload portal.

## Features

- Filter restaurants by name, city, neighborhood, cuisine type, and reservation requirements
- View detailed information about each restaurant
- Direct links to restaurant websites
- **Cuisine-based images** - Visual representation of each restaurant based on cuisine type
- Modern, responsive UI with warm color palette
- **Admin CSV Upload Portal** - Upload restaurant data directly via CSV file
- Data persists in browser localStorage

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Development: Vite Hot Module Replacement (HMR)

This project uses Vite's Hot Module Replacement for fast development. If changes don't appear in the browser automatically:

### Automatic Reload

After making code changes:
1. **Save the file** - Ensure all changes are saved
2. **Wait 2-3 seconds** - Vite should automatically detect changes and reload
3. **Check browser** - Changes should appear automatically
4. **If changes don't appear** - Try a hard refresh:
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + R`

### Force Reload Script

If HMR consistently fails to detect changes, you can force a reload:

```bash
node .cursor/rules/vite-hmr-reload/force-reload.js
```

This script touches `vite.config.js` to trigger Vite's file watcher.

### Troubleshooting HMR

If Hot Module Replacement isn't working:

1. **Check dev server is running** - Ensure `npm run dev` is active
2. **Verify Vite connection** - Check browser console for `[vite] connected.` message
3. **Check for errors** - Look for compilation errors in the terminal
4. **Restart dev server** - Stop (`Ctrl+C`) and restart with `npm run dev`
5. **Clear browser cache** - Hard refresh or clear cache and reload

### Vite Configuration

The project includes optimized HMR settings in `vite.config.js`:
- Error overlay enabled for better debugging
- File watching configured for reliable change detection

For more details, see `.cursor/rules/vite-hmr-reload/RULE.md`

## Admin Upload Portal

Access the admin portal at `/admin` to upload restaurant data:

1. Navigate to `http://localhost:5173/admin` (or your production URL `/admin`)
2. Login with the admin password (see below)
3. Drag and drop your CSV file or click to browse
4. Preview the parsed data
5. Click "Upload to Live App" to update the production site

**When you upload via the admin page, the data is stored on the server and immediately visible to ALL users** - no redeployment needed!

### Admin Password

**Default Admin Password:** `admin123`

To change the admin password, edit `src/components/AdminLogin.jsx` and update the `ADMIN_PASSWORD` constant:

```javascript
const ADMIN_PASSWORD = 'your-new-password-here'
```

### Production Setup: Vercel Blob Storage

For the admin CSV upload to work in production (on Vercel), you need to set up Blob Storage:

1. **Enable Blob Storage in your Vercel project:**
   - Go to your project in the Vercel dashboard
   - Navigate to **Storage** tab
   - Click **Create Database** and select **Blob**
   - Follow the prompts to create a new Blob store

2. **The `BLOB_READ_WRITE_TOKEN` will be automatically added to your environment variables**

3. **(Optional) Add an admin token for extra security:**
   - In Vercel Dashboard, go to **Settings > Environment Variables**
   - Add `ADMIN_UPLOAD_TOKEN` with a secure random string
   - Add `VITE_ADMIN_UPLOAD_TOKEN` with the same value (for the frontend)

4. **Redeploy your application** to pick up the new environment variables

## CSV Format

Your CSV file should have these column headers (tab or comma-separated):

| Column Name | Description |
|-------------|-------------|
| Restaurant Name | Name of the restaurant |
| Website Link | URL to the restaurant's website |
| City: | City where the restaurant is located |
| Neighborhood/Area | Specific neighborhood or area |
| Cuisine Type | Type of cuisine |
| What do you love about this place? | Description of what makes it special |
| What are your "Must Have" recommendations"? | Recommended dishes |
| Reservation needed/required? | Reservation policy |
| How far in advance do we need to plan? | Planning timeframe |

A sample CSV file is included: `sample-restaurants.csv`

## Data Sources (Priority Order)

The app loads data in this order:

1. **localStorage** - For immediate display after admin upload (same browser session)
2. **Server API (Vercel Blob Storage)** - Production data visible to all users
3. **Static CSV file** - Fallback `sample-restaurants.csv` included in the build
4. **Dummy data** - Built-in sample data for development

When you upload via the admin portal, the data is:
- Saved to Vercel Blob Storage (visible to all users immediately)
- Also saved to localStorage (for instant local display)

## Google Sheets (Optional)

To use Google Sheets instead of CSV upload:

1. Open your Google Sheet with restaurant data
2. Go to **File > Share > Publish to web**
3. Select **CSV** format and publish
4. Update `GOOGLE_SHEET_CSV_URL` in `src/hooks/useSheetData.js`
5. Set `USE_DUMMY_DATA_AS_FALLBACK` to `false`

## Restaurant Images

The app currently displays cuisine-based images for each restaurant card. Images are automatically selected based on the restaurant's cuisine type using royalty-free images from Unsplash Source.

### Future Enhancement: Google Places Photos API

For restaurant-specific photos (actual photos of each restaurant), consider upgrading to use the **Google Places Photos API**. This would integrate seamlessly with your existing Google Places API setup:

**Benefits:**
- Uses the same API key you already have configured
- Shows actual photos of the specific restaurant
- No additional setup required beyond code changes

**How it works:**
1. The Places Text Search API (already in use via `addressLookup.js`) returns a `photos` array
2. Each photo has a `photo_reference` that can be used to fetch the actual image:
   ```
   https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference={REFERENCE}&key={API_KEY}
   ```

**Considerations:**
- Each photo fetch counts toward your Places API quota
- Would need to cache photo URLs to minimize API calls
- Implementation would modify `src/services/addressLookup.js` to also return photo references

## Technologies

- React 18
- React Router DOM
- Vite
- Tailwind CSS
- PapaParse (CSV parsing)

