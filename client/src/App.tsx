import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Test from "@/pages/test";

// Define Home component directly since we're having import issues
const Home = () => {
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
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/test" component={Test} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
