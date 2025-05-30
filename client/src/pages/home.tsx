import React from "react";

function Home() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">LinkedIn Sales Navigator Scraper</h1>
      <p className="mb-4">
        A Chrome Extension that scrapes LinkedIn Sales Navigator search results via DOM manipulation.
      </p>
      <div className="bg-gray-100 p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Key Features:</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>DOM-based scraping: Extract data directly from visible HTML</li>
          <li>Toggle UI for user control</li>
          <li>Data cleaning and filtering</li>
          <li>Export options (CSV, JSON)</li>
        </ul>
      </div>
    </div>
  );
}

export default Home;