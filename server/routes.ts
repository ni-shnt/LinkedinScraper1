import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertLinkedinProfileSchema, 
  insertSearchSchema, 
  insertSearchResultSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // ------ LinkedIn Profile Routes ------
  
  // Get all profiles with pagination
  app.get("/api/profiles", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const profiles = await storage.getAllProfiles(limit, offset);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });
  
  // Get a single profile by ID
  app.get("/api/profiles/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const profile = await storage.getProfile(id);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });
  
  // Create a new profile
  app.post("/api/profiles", async (req: Request, res: Response) => {
    try {
      const validatedData = insertLinkedinProfileSchema.parse(req.body);
      const profile = await storage.createProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating profile:", error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });
  
  // Update a profile
  app.patch("/api/profiles/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertLinkedinProfileSchema.partial().parse(req.body);
      
      const updatedProfile = await storage.updateProfile(id, validatedData);
      
      if (!updatedProfile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      res.json(updatedProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  
  // Delete a profile
  app.delete("/api/profiles/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProfile(id);
      
      if (!success) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });
  
  // Search profiles
  app.get("/api/profiles/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const profiles = await storage.searchProfiles(query);
      res.json(profiles);
    } catch (error) {
      console.error("Error searching profiles:", error);
      res.status(500).json({ error: "Failed to search profiles" });
    }
  });
  
  // ------ Search Routes ------
  
  // Get all searches
  app.get("/api/searches", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const searches = await storage.getAllSearches(userId);
      res.json(searches);
    } catch (error) {
      console.error("Error fetching searches:", error);
      res.status(500).json({ error: "Failed to fetch searches" });
    }
  });
  
  // Get a single search by ID
  app.get("/api/searches/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const search = await storage.getSearch(id);
      
      if (!search) {
        return res.status(404).json({ error: "Search not found" });
      }
      
      res.json(search);
    } catch (error) {
      console.error("Error fetching search:", error);
      res.status(500).json({ error: "Failed to fetch search" });
    }
  });
  
  // Create a new search
  app.post("/api/searches", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSearchSchema.parse(req.body);
      const search = await storage.createSearch(validatedData);
      res.status(201).json(search);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating search:", error);
      res.status(500).json({ error: "Failed to create search" });
    }
  });
  
  // Get profiles for a search
  app.get("/api/searches/:id/profiles", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const profiles = await storage.getProfilesBySearch(id);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching profiles for search:", error);
      res.status(500).json({ error: "Failed to fetch profiles for search" });
    }
  });
  
  // Add profile to search
  app.post("/api/searches/:searchId/profiles/:profileId", async (req: Request, res: Response) => {
    try {
      const searchId = parseInt(req.params.searchId);
      const profileId = parseInt(req.params.profileId);
      
      // Check if the search exists
      const search = await storage.getSearch(searchId);
      if (!search) {
        return res.status(404).json({ error: "Search not found" });
      }
      
      // Check if the profile exists
      const profile = await storage.getProfile(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const result = await storage.addProfileToSearch(searchId, profileId);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error adding profile to search:", error);
      res.status(500).json({ error: "Failed to add profile to search" });
    }
  });
  
  // Bulk import profiles from the Chrome extension
  app.post("/api/import/profiles", async (req: Request, res: Response) => {
    try {
      // Validate the array of profiles
      const profilesData = z.array(insertLinkedinProfileSchema).parse(req.body.profiles);
      
      // Optional search metadata
      const searchName = req.body.searchName as string;
      const searchUrl = req.body.searchUrl as string;
      const searchCriteria = req.body.searchCriteria as string;
      const userId = req.body.userId ? parseInt(req.body.userId as string) : undefined;
      
      const importedProfiles = [];
      let searchId: number | undefined;
      
      // Create a search record if metadata is provided
      if (searchName && searchUrl) {
        const search = await storage.createSearch({
          name: searchName,
          searchUrl: searchUrl,
          searchCriteria: searchCriteria,
          resultsCount: profilesData.length,
          userId: userId
        });
        searchId = search.id;
      }
      
      // Import each profile
      for (const profileData of profilesData) {
        // Check if profile already exists by URL
        let profile;
        if (profileData.profileUrl) {
          profile = await storage.getProfileByUrl(profileData.profileUrl);
        }
        
        // Create or update the profile
        if (!profile) {
          profile = await storage.createProfile(profileData);
        } else {
          // Update with any new information
          profile = await storage.updateProfile(profile.id, profileData) || profile;
        }
        
        importedProfiles.push(profile);
        
        // Associate with the search if a search was created
        if (searchId !== undefined) {
          await storage.addProfileToSearch(searchId, profile.id);
        }
      }
      
      res.status(201).json({
        message: `Imported ${importedProfiles.length} profiles`,
        searchId,
        profiles: importedProfiles
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error importing profiles:", error);
      res.status(500).json({ error: "Failed to import profiles" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
