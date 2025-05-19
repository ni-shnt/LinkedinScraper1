# LinkedIn Sales Navigator Scraper

A Chrome Extension that automatically scrapes LinkedIn Sales Navigator search results by parsing the DOM without using any APIs.

## 📝 Features

- **DOM-based scraping:** Extract data directly from visible HTML elements on Sales Navigator pages
- **Comprehensive data extraction:**
  - Full Name
  - Job Title
  - LinkedIn Profile URL
  - Company Name
  - Company LinkedIn URL
  - Email addresses (when available in the DOM)
- **User-friendly UI:**
  - Toggle controls for different scraping options
  - Progress indicators
  - Real-time results display
- **Data cleaning and management:**
  - Automatic deduplication
  - Field formatting and cleaning
  - Filtering capabilities
- **Export options:**
  - CSV export with configurable fields
  - JSON export with full data
- **Database integration:**
  - Optional database storage for persistent data
  - Search history tracking
  - Profile management

## 🚀 Installation

### Chrome Extension Setup

#### Using the dist folder (recommended):

1. Download the `dist` folder from this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked"
5. Select the `dist` folder containing the extension files
6. The extension is now installed and ready to use!

#### Manual installation:

If you prefer to set up the extension manually:

1. Create a new folder for the extension (e.g., `linkedin-scraper`)
2. Copy the following files to the folder:
   - `manifest.json`
   - `popup.html`
   - `popup.css`
   - `popup.js`
   - `content.js`
   - `background.js`
3. Create a `lib` subfolder and add the following:
   - `papaparse.min.js`
4. Follow steps 2-5 above to install the extension

### Backend Setup (Optional)

The extension can work standalone, but for database integration:

1. Make sure you have Node.js and PostgreSQL installed
2. Navigate to the backend directory
3. Install dependencies:
   ```
   npm install
   ```
4. Set your database connection string in an environment variable:
   ```
   export DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   ```
5. Run database migrations:
   ```
   npm run db:push
   ```
6. Start the server:
   ```
   npm run dev
   ```
7. The API server will be available at http://localhost:5000

## 💻 Usage

1. Log in to LinkedIn and navigate to Sales Navigator
2. Perform a search for the leads you want to scrape
3. Click on the extension icon to open the popup interface
4. Configure your scraping options:
   - Toggle "Include Email Addresses" to attempt to find emails
   - Set "Scraping Depth" based on how thoroughly you want to extract data
   - Enable "Auto-Scroll Page" for automatic scrolling
5. Click "Start Scraping" to begin the data extraction process
6. View results in real-time as they appear in the popup
7. Use the filter box to search within extracted profiles
8. Click "Export" to download your data in CSV or JSON format

### Database Integration

1. Open the extension settings panel
2. Toggle "Sync with Database"
3. Enter your backend URL (default: http://localhost:5000)
4. Now when you scrape, profiles will be sent to your database
5. Access stored profiles via the API endpoints

## 🔍 API Endpoints

If using the database integration, the following endpoints are available:

**Profiles:**
- `GET /api/profiles` - Get all profiles with pagination
- `GET /api/profiles/:id` - Get a specific profile
- `POST /api/profiles` - Create a new profile
- `PATCH /api/profiles/:id` - Update a profile
- `DELETE /api/profiles/:id` - Delete a profile
- `GET /api/profiles/search` - Search profiles by query

**Searches:**
- `GET /api/searches` - Get all search records
- `GET /api/searches/:id` - Get a specific search
- `POST /api/searches` - Create a new search
- `GET /api/searches/:id/profiles` - Get profiles from a search

**Bulk Import:**
- `POST /api/import/profiles` - Import multiple profiles

## ⚙️ Extension Options

- **Include Email Addresses:** Attempts to extract emails (slower but more comprehensive)
- **Auto-Scroll Page:** Automatically scrolls the page to load more results
- **Scraping Depth:**
  - Basic: Fast extraction of visible data
  - Standard: Moderate depth with some element expansion
  - Deep: Most thorough extraction (slower)
- **Batch Size:** Number of profiles to extract before stopping
- **Scraping Delay:** Time delay between operations to avoid detection
- **Database Integration:** Toggle syncing with backend database

## 🛑 Important Notice

This tool is intended for personal use only. Always comply with LinkedIn's Terms of Service. Excessive or abusive use may result in restrictions on your LinkedIn account.

## 🔧 Technical Details

The extension consists of:

- **Content Script (`content.js`):** Runs on the LinkedIn page and extracts data
- **Popup (`popup.html`, `popup.js`, `popup.css`):** User interface for controlling the scraper
- **Background Script (`background.js`):** Manages extension state and communication
- **Backend API:** Optional Node.js server with PostgreSQL for persistent storage

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.