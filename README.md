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

## Admin Upload Portal

Access the admin portal at `/admin` to upload restaurant data:

1. Navigate to `http://localhost:5173/admin`
2. Login with the admin password (see below)
3. Drag and drop your CSV file or click to browse
4. Preview the parsed data
5. Click "Save to App" to load the data

### Admin Password

**Default Admin Password:** `admin123`

To change the admin password, edit `src/components/AdminLogin.jsx` and update the `ADMIN_PASSWORD` constant:

```javascript
const ADMIN_PASSWORD = 'your-new-password-here'
```

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

1. **Uploaded CSV data** - Data uploaded via admin portal (stored in localStorage)
2. **Dummy data** - Built-in sample data for development
3. **Google Sheets** - Optional: Configure in `useSheetData.js`

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

