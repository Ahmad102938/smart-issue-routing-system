import { User, Store, ServiceProvider, Ticket, Remark, DashboardMetrics } from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'dallas_store_001',
    email: 'manager@walmart-dallas.com',
    phone_number: '+1-555-0101',
    role: 'STORE_REGISTER',
    associated_entity_id: '1',
    is_active: true,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    username: 'tech_john_doe',
    email: 'john@techservices.com',
    phone_number: '+1-555-0201',
    role: 'SERVICE_PROVIDER',
    associated_entity_id: '1',
    is_active: true,
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-10T09:00:00Z'
  },
  {
    id: '3',
    username: 'admin_sarah',
    email: 'sarah@walmart.com',
    phone_number: '+1-555-0301',
    role: 'ADMIN',
    is_active: true,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '4',
    username: 'mod_dallas',
    email: 'moderator@walmart-dallas.com',
    phone_number: '+1-555-0401',
    role: 'MODERATOR',
    associated_entity_id: '1',
    is_active: true,
    created_at: '2024-01-05T11:00:00Z',
    updated_at: '2024-01-05T11:00:00Z'
  }
];

// Mock Stores
export const mockStores: Store[] = [
  {
    id: '1',
    name: 'Walmart Supercenter Dallas',
    store_id: '3482',
    address: '1234 Main Street',
    city: 'Dallas',
    state: 'TX',
    zip_code: '75201',
    location_coordinates: { latitude: 32.7767, longitude: -96.7970 },
    status: 'APPROVED',
    moderator_user_id: '4',
    created_at: '2024-01-15T08:00:00Z',
    approved_at: '2024-01-15T12:00:00Z'
  },
  {
    id: '2',
    name: 'Walmart Neighborhood Market Austin',
    store_id: '3483',
    address: '5678 Oak Avenue',
    city: 'Austin',
    state: 'TX',
    zip_code: '78701',
    location_coordinates: { latitude: 30.2672, longitude: -97.7431 },
    status: 'APPROVED',
    created_at: '2024-01-20T09:00:00Z',
    approved_at: '2024-01-20T14:00:00Z'
  }
];

// Mock Service Providers
export const mockServiceProviders: ServiceProvider[] = [
  {
    id: '1',
    company_name: 'Elite Tech Services',
    primary_location_address: '9999 Service Drive, Dallas, TX 75202',
    primary_location_coordinates: { latitude: 32.7831, longitude: -96.8067 },
    unique_company_id: 'ETS-2024-001',
    skills: 'Refrigeration, HVAC, POS Systems, Electrical',
    capacity_per_day: 5,
    current_load: 2,
    status: 'APPROVED',
    approved_by_moderator_id: '4',
    created_at: '2024-01-10T09:00:00Z',
    approved_at: '2024-01-10T15:00:00Z'
  },
  {
    id: '2',
    company_name: 'Quick Fix Solutions',
    primary_location_address: '1111 Repair Lane, Dallas, TX 75203',
    primary_location_coordinates: { latitude: 32.7668, longitude: -96.8080 },
    unique_company_id: 'QFS-2024-002',
    skills: 'Plumbing, Electrical, General Maintenance',
    capacity_per_day: 8,
    current_load: 1,
    status: 'APPROVED',
    approved_by_moderator_id: '4',
    created_at: '2024-01-12T10:00:00Z',
    approved_at: '2024-01-12T16:00:00Z'
  }
];

// Mock Tickets
export const mockTickets: Ticket[] = [
  {
    id: '1',
    store_id: '1',
    reporter_user_id: '1',
    description: 'Freezer in Aisle 5 is not cooling properly. Temperature reading 35°F instead of normal 0°F. Products are starting to thaw.',
    qr_asset_id: 'FRZ-A5-001',
    ai_classification_category: 'Facilities',
    ai_classification_subcategory: 'Cold Storage',
    ai_priority: 'high',
    location_in_store: 'Aisle 5, Frozen Foods Section',
    status: 'in_progress',
    assigned_service_provider_id: '1',
    sla_deadline: '2024-12-20T14:00:00Z',
    created_at: '2024-12-20T10:00:00Z',
    assigned_at: '2024-12-20T10:05:00Z',
    accepted_at: '2024-12-20T10:15:00Z'
  },
  {
    id: '2',
    store_id: '1',
    reporter_user_id: '1',
    description: 'POS Terminal 3 displaying error code E-101 and cannot process transactions',
    ai_classification_category: 'IT',
    ai_classification_subcategory: 'POS Systems',
    ai_priority: 'medium',
    location_in_store: 'Checkout Lane 3',
    status: 'assigned',
    assigned_service_provider_id: '1',
    sla_deadline: '2024-12-21T10:00:00Z',
    created_at: '2024-12-20T14:30:00Z',
    assigned_at: '2024-12-20T14:35:00Z'
  },
  {
    id: '3',
    store_id: '1',
    reporter_user_id: '1',
    description: 'Lighting fixture flickering near produce section, affecting customer shopping experience',
    ai_classification_category: 'Facilities',
    ai_classification_subcategory: 'Electrical',
    ai_priority: 'low',
    location_in_store: 'Produce Section, Fixture #P-12',
    status: 'completed',
    assigned_service_provider_id: '2',
    sla_deadline: '2024-12-22T14:30:00Z',
    created_at: '2024-12-19T09:15:00Z',
    assigned_at: '2024-12-19T09:20:00Z',
    accepted_at: '2024-12-19T09:30:00Z',
    completed_at: '2024-12-19T11:45:00Z'
  }
];

// Mock Remarks
export const mockRemarks: Remark[] = [
  {
    id: '1',
    ticket_id: '1',
    user_id: '2',
    remark_text: 'Diagnosed faulty compressor. Ordering replacement part from supplier. ETA 2 hours.',
    created_at: '2024-12-20T10:30:00Z'
  },
  {
    id: '2',
    ticket_id: '1',
    user_id: '2',
    remark_text: 'Part arrived. Beginning installation process. Will test temperature stability.',
    created_at: '2024-12-20T12:15:00Z'
  },
  {
    id: '3',
    ticket_id: '3',
    user_id: '2',
    remark_text: 'Replaced faulty ballast in lighting fixture. Tested all connections. Issue resolved.',
    created_at: '2024-12-19T11:30:00Z'
  }
];

// Mock Dashboard Metrics
export const mockDashboardMetrics: DashboardMetrics = {
  total_tickets: 156,
  open_tickets: 12,
  in_progress_tickets: 8,
  completed_tickets: 136,
  sla_compliance_rate: 94.2,
  avg_resolution_time: 4.7 // hours
};

// AI Classification Logic (Mock)
export const classifyIssue = (description: string) => {
  const keywords = {
    'Facilities': {
      'Cold Storage': ['freezer', 'cooling', 'refrigerator', 'thaw', 'temperature'],
      'Electrical': ['light', 'lighting', 'flicker', 'power', 'outlet', 'electrical'],
      'Plumbing': ['leak', 'water', 'drain', 'pipe', 'faucet'],
      'HVAC': ['heating', 'air conditioning', 'ventilation', 'hvac', 'climate']
    },
    'IT': {
      'POS Systems': ['pos', 'terminal', 'checkout', 'transaction', 'payment'],
      'Network': ['wifi', 'internet', 'network', 'connection', 'router'],
      'Computers': ['computer', 'monitor', 'keyboard', 'mouse', 'screen']
    },
    'Equipment': {
      'Shopping Carts': ['cart', 'shopping cart', 'wheel', 'basket'],
      'Doors': ['door', 'entrance', 'exit', 'automatic door'],
      'Shelving': ['shelf', 'shelving', 'display', 'rack']
    }
  };

  const desc = description.toLowerCase();
  
  for (const [category, subcategories] of Object.entries(keywords)) {
    for (const [subcategory, terms] of Object.entries(subcategories)) {
      if (terms.some(term => desc.includes(term))) {
        let priority: 'high' | 'medium' | 'low' = 'medium';
        
        if (desc.includes('not cooling') || desc.includes('thaw') || desc.includes('leak') || desc.includes('no power')) {
          priority = 'high';
        } else if (desc.includes('flicker') || desc.includes('slow') || desc.includes('cosmetic')) {
          priority = 'low';
        }
        
        return {
          category,
          subcategory,
          priority,
          confidence: 0.85
        };
      }
    }
  }
  
  return {
    category: 'General',
    subcategory: 'Maintenance',
    priority: 'medium' as const,
    confidence: 0.6
  };
};

// Mock SLA calculation
export const calculateSLADeadline = (priority: 'high' | 'medium' | 'low', createdAt: string): string => {
  const created = new Date(createdAt);
  let hoursToAdd = 24; // default medium
  
  switch (priority) {
    case 'high':
      hoursToAdd = 4;
      break;
    case 'medium':
      hoursToAdd = 12;
      break;
    case 'low':
      hoursToAdd = 48;
      break;
  }
  
  const deadline = new Date(created.getTime() + (hoursToAdd * 60 * 60 * 1000));
  return deadline.toISOString();
};