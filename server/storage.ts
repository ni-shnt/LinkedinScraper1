import { 
  users, 
  type User, 
  type InsertUser,
  linkedinProfiles,
  type LinkedinProfile,
  type InsertLinkedinProfile,
  searches,
  type Search,
  type InsertSearch,
  searchResults,
  type SearchResult,
  type InsertSearchResult
} from "@shared/schema";

import { eq, like, or, SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Database connection setup
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

// Storage interface for all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // LinkedIn Profile operations
  getProfile(id: number): Promise<LinkedinProfile | undefined>;
  getProfileByUrl(profileUrl: string): Promise<LinkedinProfile | undefined>;
  createProfile(profile: InsertLinkedinProfile): Promise<LinkedinProfile>;
  updateProfile(id: number, profile: Partial<InsertLinkedinProfile>): Promise<LinkedinProfile | undefined>;
  deleteProfile(id: number): Promise<boolean>;
  getAllProfiles(limit?: number, offset?: number): Promise<LinkedinProfile[]>;
  searchProfiles(query: string): Promise<LinkedinProfile[]>;
  
  // Search operations
  getSearch(id: number): Promise<Search | undefined>;
  createSearch(search: InsertSearch): Promise<Search>;
  getAllSearches(userId?: number): Promise<Search[]>;
  
  // Search Results operations
  addProfileToSearch(searchId: number, profileId: number): Promise<SearchResult>;
  getProfilesBySearch(searchId: number): Promise<LinkedinProfile[]>;
}

// Database-backed storage implementation
export class DbStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(({ id: userId }) => userId.equals(id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(({ username: userName }) => userName.equals(username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  // LinkedIn Profile operations
  async getProfile(id: number): Promise<LinkedinProfile | undefined> {
    const result = await db.select().from(linkedinProfiles).where(({ id: profileId }) => profileId.equals(id)).limit(1);
    return result[0];
  }
  
  async getProfileByUrl(profileUrl: string): Promise<LinkedinProfile | undefined> {
    const result = await db.select().from(linkedinProfiles).where(({ profileUrl: url }) => url.equals(profileUrl)).limit(1);
    return result[0];
  }
  
  async createProfile(profile: InsertLinkedinProfile): Promise<LinkedinProfile> {
    const result = await db.insert(linkedinProfiles).values(profile).returning();
    return result[0];
  }
  
  async updateProfile(id: number, profile: Partial<InsertLinkedinProfile>): Promise<LinkedinProfile | undefined> {
    const result = await db.update(linkedinProfiles).set(profile).where(({ id: profileId }) => profileId.equals(id)).returning();
    return result[0];
  }
  
  async deleteProfile(id: number): Promise<boolean> {
    const result = await db.delete(linkedinProfiles).where(({ id: profileId }) => profileId.equals(id)).returning();
    return result.length > 0;
  }
  
  async getAllProfiles(limit: number = 100, offset: number = 0): Promise<LinkedinProfile[]> {
    return await db.select().from(linkedinProfiles).limit(limit).offset(offset);
  }
  
  async searchProfiles(query: string): Promise<LinkedinProfile[]> {
    // Simple search implementation that looks for the query in name, title, company, or email
    return await db.select().from(linkedinProfiles).where(
      ({ name, title, company, email }) => 
        name.like(`%${query}%`)
        .or(title.like(`%${query}%`))
        .or(company.like(`%${query}%`))
        .or(email.like(`%${query}%`))
    );
  }
  
  // Search operations
  async getSearch(id: number): Promise<Search | undefined> {
    const result = await db.select().from(searches).where(({ id: searchId }) => searchId.equals(id)).limit(1);
    return result[0];
  }
  
  async createSearch(search: InsertSearch): Promise<Search> {
    const result = await db.insert(searches).values(search).returning();
    return result[0];
  }
  
  async getAllSearches(userId?: number): Promise<Search[]> {
    if (userId) {
      return await db.select().from(searches).where(({ userId: uId }) => uId.equals(userId));
    }
    return await db.select().from(searches);
  }
  
  // Search Results operations
  async addProfileToSearch(searchId: number, profileId: number): Promise<SearchResult> {
    const result = await db.insert(searchResults).values({ searchId, profileId }).returning();
    return result[0];
  }
  
  async getProfilesBySearch(searchId: number): Promise<LinkedinProfile[]> {
    const result = await db
      .select({
        profile: linkedinProfiles
      })
      .from(searchResults)
      .innerJoin(linkedinProfiles, ({ profile_id, id }) => profile_id.equals(id))
      .where(({ search_id }) => search_id.equals(searchId));
    
    return result.map(r => r.profile);
  }
}

// In-memory storage fallback
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private profiles: Map<number, LinkedinProfile>;
  private searches: Map<number, Search>;
  private searchResults: Map<number, SearchResult>;
  private userIdCounter: number;
  private profileIdCounter: number;
  private searchIdCounter: number;
  private searchResultIdCounter: number;

  constructor() {
    this.users = new Map();
    this.profiles = new Map();
    this.searches = new Map();
    this.searchResults = new Map();
    this.userIdCounter = 1;
    this.profileIdCounter = 1;
    this.searchIdCounter = 1;
    this.searchResultIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // LinkedIn Profile operations
  async getProfile(id: number): Promise<LinkedinProfile | undefined> {
    return this.profiles.get(id);
  }
  
  async getProfileByUrl(profileUrl: string): Promise<LinkedinProfile | undefined> {
    return Array.from(this.profiles.values()).find(
      (profile) => profile.profileUrl === profileUrl
    );
  }
  
  async createProfile(profile: InsertLinkedinProfile): Promise<LinkedinProfile> {
    const id = this.profileIdCounter++;
    const now = new Date();
    const newProfile: LinkedinProfile = { 
      ...profile, 
      id,
      dateAdded: now,
      lastContacted: null
    };
    this.profiles.set(id, newProfile);
    return newProfile;
  }
  
  async updateProfile(id: number, profile: Partial<InsertLinkedinProfile>): Promise<LinkedinProfile | undefined> {
    const existingProfile = this.profiles.get(id);
    if (!existingProfile) return undefined;
    
    const updatedProfile = { ...existingProfile, ...profile };
    this.profiles.set(id, updatedProfile);
    return updatedProfile;
  }
  
  async deleteProfile(id: number): Promise<boolean> {
    return this.profiles.delete(id);
  }
  
  async getAllProfiles(limit: number = 100, offset: number = 0): Promise<LinkedinProfile[]> {
    return Array.from(this.profiles.values())
      .slice(offset, offset + limit);
  }
  
  async searchProfiles(query: string): Promise<LinkedinProfile[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.profiles.values()).filter(profile => 
      profile.name?.toLowerCase().includes(lowercaseQuery) ||
      profile.title?.toLowerCase().includes(lowercaseQuery) ||
      profile.company?.toLowerCase().includes(lowercaseQuery) ||
      profile.email?.toLowerCase().includes(lowercaseQuery)
    );
  }
  
  // Search operations
  async getSearch(id: number): Promise<Search | undefined> {
    return this.searches.get(id);
  }
  
  async createSearch(search: InsertSearch): Promise<Search> {
    const id = this.searchIdCounter++;
    const now = new Date();
    const newSearch: Search = {
      ...search,
      id,
      searchDate: now
    };
    this.searches.set(id, newSearch);
    return newSearch;
  }
  
  async getAllSearches(userId?: number): Promise<Search[]> {
    if (userId) {
      return Array.from(this.searches.values()).filter(
        search => search.userId === userId
      );
    }
    return Array.from(this.searches.values());
  }
  
  // Search Results operations
  async addProfileToSearch(searchId: number, profileId: number): Promise<SearchResult> {
    const id = this.searchResultIdCounter++;
    const searchResult: SearchResult = { id, searchId, profileId };
    this.searchResults.set(id, searchResult);
    return searchResult;
  }
  
  async getProfilesBySearch(searchId: number): Promise<LinkedinProfile[]> {
    // Get all searchResult entries for this searchId
    const resultIds = Array.from(this.searchResults.values())
      .filter(sr => sr.searchId === searchId)
      .map(sr => sr.profileId);
    
    // Get the profiles with these ids
    return Array.from(this.profiles.values())
      .filter(profile => resultIds.includes(profile.id));
  }
}

// Choose which storage implementation to use based on environment
export const storage = process.env.DATABASE_URL 
  ? new DbStorage() 
  : new MemStorage();
