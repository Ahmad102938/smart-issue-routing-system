import { StateGraph, END } from '@langchain/langgraph';
import { prisma } from '@/lib/prisma';
import { ServiceProvider, UserRole } from '@prisma/client';

interface AvailabilityState {
  requiredSkills: string[];
  storeLocation: { latitude: number; longitude: number };
  availableProviders?: ServiceProvider[];
  error?: string;
}

interface AvailableProvider extends ServiceProvider {
  distance?: number;
  availabilityScore?: number;
}

export class AvailabilityAgent {
  private graph: StateGraph<AvailabilityState>;

  constructor() {
    this.graph = this.buildGraph();
  }

  private buildGraph(): StateGraph<AvailabilityState> {
    const graph = new StateGraph<AvailabilityState>({
      channels: {
        requiredSkills: null,
        storeLocation: null,
        availableProviders: null,
        error: null
      }
    });

    // Check availability node
    graph.addNode('checkAvailability', async (state: AvailabilityState) => {
      try {
        // Get all approved service providers with proper where clause
        const providers = await prisma.serviceProvider.findMany({
          where: {
            status: 'APPROVED',
            current_load: {
              lt: await prisma.serviceProvider.findFirst({
                select: { capacity_per_day: true }
              }).then(p => p?.capacity_per_day || 10)
            }
          },
          include: {
            users: {
              where: {
                role: 'SERVICE_PROVIDER',
                is_active: true
              }
            }
          }
        });

        // Alternative approach - get providers and filter manually
        const allProviders = await prisma.serviceProvider.findMany({
          where: {
            status: 'APPROVED'
          },
          include: {
            users: {
              where: {
                role: 'SERVICE_PROVIDER',
                is_active: true
              }
            }
          }
        });

        // Filter providers with available capacity
        const availableCapacityProviders = allProviders.filter(provider => 
          provider.current_load < provider.capacity_per_day
        );

        // Validate required skills
        if (!state.requiredSkills || state.requiredSkills.length === 0) {
          console.warn('No required skills provided, returning all available providers');
        }

        // Validate store location
        if (!state.storeLocation || 
            typeof state.storeLocation.latitude !== 'number' || 
            typeof state.storeLocation.longitude !== 'number') {
          throw new Error('Invalid store location provided');
        }

        // Filter by skills and calculate availability
        const availableProviders: AvailableProvider[] = availableCapacityProviders
          .filter(provider => {
            // If no required skills, include all providers
            if (!state.requiredSkills || state.requiredSkills.length === 0) {
              return provider.users.length > 0;
            }

            // Check if provider has required skills
            const hasRequiredSkills = state.requiredSkills.some(skill =>
              provider.skills.some(providerSkill =>
                providerSkill.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(providerSkill.toLowerCase())
              )
            );
            
            // Check if provider has active users
            const hasActiveUsers = provider.users.length > 0;
            
            return hasRequiredSkills && hasActiveUsers;
          })
          .map(provider => {
            try {
              // Safely parse coordinates
              let coords: { latitude: number; longitude: number };
              
              if (typeof provider.primary_location_coordinates === 'string') {
                coords = JSON.parse(provider.primary_location_coordinates);
              } else {
                coords = provider.primary_location_coordinates as { latitude: number; longitude: number };
              }

              // Validate coordinates
              if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
                console.warn(`Invalid coordinates for provider ${provider.id}, using default distance`);
                coords = { latitude: 0, longitude: 0 };
              }

              const distance = this.calculateDistance(
                state.storeLocation.latitude,
                state.storeLocation.longitude,
                coords.latitude,
                coords.longitude
              );

              // Calculate availability score (0-1)
              const capacityUtilization = provider.current_load / Math.max(provider.capacity_per_day, 1);
              const availabilityScore = Math.max(0, 1 - capacityUtilization);

              return {
                ...provider,
                distance,
                availabilityScore
              };
            } catch (coordError) {
              console.error(`Error processing provider ${provider.id}:`, coordError);
              return {
                ...provider,
                distance: 999999, // Large distance for providers with coordinate errors
                availabilityScore: 0
              };
            }
          })
          .filter(provider => provider.availabilityScore! > 0) // Only include providers with availability
          .sort((a, b) => {
            // Sort by availability score first, then by distance
            if (Math.abs(a.availabilityScore! - b.availabilityScore!) > 0.1) {
              return b.availabilityScore! - a.availabilityScore!;
            }
            return a.distance! - b.distance!;
          });

        console.log(`Found ${availableProviders.length} available providers for skills: ${state.requiredSkills?.join(', ')}`);

        return {
          ...state,
          availableProviders
        };
      } catch (error) {
        console.error('Availability check error:', error);
        return {
          ...state,
          availableProviders: [],
          error: error instanceof Error ? error.message : 'Unknown error occurred while checking availability'
        };
      }
    });

    // Set entry point and edges
    graph.setEntryPoint('checkAvailability');
    graph.addEdge('checkAvailability', END);

    return graph;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    try {
      // Validate inputs
      if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
        console.warn('Invalid coordinates provided to calculateDistance');
        return 999999; // Return large distance for invalid coordinates
      }

      const R = 6371; // Earth's radius in kilometers
      const dLat = this.toRadians(lat2 - lat1);
      const dLon = this.toRadians(lon2 - lon1);
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // Ensure we return a valid number
      return isNaN(distance) ? 999999 : distance;
    } catch (error) {
      console.error('Error calculating distance:', error);
      return 999999;
    }
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async getAvailableProviders(
    requiredSkills: string[],
    storeLocation: { latitude: number; longitude: number }
  ): Promise<AvailableProvider[]> {
    try {
      // Validate inputs
      if (!Array.isArray(requiredSkills)) {
        console.warn('Invalid requiredSkills provided, using empty array');
        requiredSkills = [];
      }

      if (!storeLocation || 
          typeof storeLocation.latitude !== 'number' || 
          typeof storeLocation.longitude !== 'number') {
        throw new Error('Invalid store location provided');
      }

      const compiled = this.graph.compile();
      
      const result = await compiled.invoke({
        requiredSkills,
        storeLocation
      });

      if (result.error) {
        console.error('AvailabilityAgent error:', result.error);
        return [];
      }

      return result.availableProviders || [];
    } catch (error) {
      console.error('Error in getAvailableProviders:', error);
      return [];
    }
  }
}

// Singleton instance
export const availabilityAgent = new AvailabilityAgent();