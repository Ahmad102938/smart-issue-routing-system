import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRole, StoreStatus, ServiceProviderStatus } from '@prisma/client';
import formidable, { Fields, Files } from 'formidable';
import fs from 'fs';
import crypto from 'crypto';

// Disable Next.js default body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

const StoreRegisterSchema = z.object({
  type: z.literal('store'),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  phone_number: z.string().optional(),
  store_name: z.string().min(1),
  store_id: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip_code: z.string().min(1),
  latitude: z.string(),
  longitude: z.string()
});

const ServiceProviderRegisterSchema = z.object({
  type: z.literal('service_provider'),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  phone_number: z.string().optional(),
  company_name: z.string().min(1),
  unique_company_id: z.string().min(1),
  address: z.string().min(1),
  latitude: z.string(),
  longitude: z.string(),
  skills: z.string(),
  capacity_per_day: z.string()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // Ensure upload directory exists
    const uploadDir = './public/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const form = new formidable.IncomingForm({
      uploadDir,
      keepExtensions: true,
      multiples: true,
    });

    // Promisify formidable parse
    const { fields, files } = await new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    // Helper to get string value from formidable field (which may be string | string[])
    const getField = (field: any) => Array.isArray(field) ? field[0] : field;

    if (!fields.type) {
      return res.status(400).json({ error: 'Missing registration type' });
    }
    if (getField(fields.type) === 'store') {
      try {
        const validatedData = StoreRegisterSchema.parse({
          type: getField(fields.type),
          username: getField(fields.username),
          email: getField(fields.email),
          password: getField(fields.password),
          phone_number: getField(fields.phone_number),
          store_name: getField(fields.store_name),
          store_id: getField(fields.store_id),
          address: getField(fields.address),
          city: getField(fields.city),
          state: getField(fields.state),
          zip_code: getField(fields.zip_code),
          latitude: getField(fields.latitude),
          longitude: getField(fields.longitude),
        });
        // Check if username or email already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { username: validatedData.username },
              { email: validatedData.email }
            ]
          }
        });
        if (existingUser) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        // Check if store_id already exists
        const existingStore = await prisma.store.findUnique({
          where: { store_id: validatedData.store_id }
        });
        if (existingStore) {
          return res.status(400).json({ error: 'Store ID already exists' });
        }
        // Hash password
        const password_hash = await bcrypt.hash(validatedData.password, 12);
        // Create store and user in transaction
        const result = await prisma.$transaction(async (tx) => {
          const store = await tx.store.create({
            data: {
              name: validatedData.store_name,
              store_id: validatedData.store_id,
              address: validatedData.address,
              city: validatedData.city,
              state: validatedData.state,
              zip_code: validatedData.zip_code,
              location_coordinates: {
                latitude: parseFloat(validatedData.latitude),
                longitude: parseFloat(validatedData.longitude)
              },
              status: StoreStatus.PENDING_APPROVAL
            }
          });
          const user = await tx.user.create({
            data: {
              username: validatedData.username,
              email: validatedData.email,
              password_hash,
              phone_number: validatedData.phone_number,
              role: UserRole.STORE_REGISTER,
              associated_entity_id: store.id,
              registration_status: 'PENDING',
            }
          });
          // Save uploaded documents
          const fileArr = files && files.documents
            ? (Array.isArray(files.documents) ? files.documents : [files.documents])
            : [];
          if (fileArr.length > 0) {
            await tx.document.createMany({
              data: fileArr.map((file: any) => ({
                url: `/uploads/${file.newFilename || file.originalFilename}`,
                type: file.mimetype,
                userId: user.id
              }))
            });
          }
          return { store, user };
        });
        return res.status(200).json({
          message: 'Store registration submitted for approval',
          store_id: result.store.id
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        return res.status(500).json({ error: 'Registration failed', details: error.message });
      }
    }
    if (getField(fields.type) === 'service_provider') {
      try {
        const validatedData = ServiceProviderRegisterSchema.parse({
          type: getField(fields.type),
          username: getField(fields.username),
          email: getField(fields.email),
          password: getField(fields.password),
          phone_number: getField(fields.phone_number),
          company_name: getField(fields.company_name),
          unique_company_id: getField(fields.unique_company_id),
          address: getField(fields.address),
          latitude: getField(fields.latitude),
          longitude: getField(fields.longitude),
          skills: getField(fields.skills),
          capacity_per_day: getField(fields.capacity_per_day),
        });
        // Check if username or email already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { username: validatedData.username },
              { email: validatedData.email }
            ]
          }
        });
        if (existingUser) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        // Check if company_id already exists
        const existingProvider = await prisma.serviceProvider.findUnique({
          where: { unique_company_id: validatedData.unique_company_id }
        });
        if (existingProvider) {
          return res.status(400).json({ error: 'Company ID already exists' });
        }
        // Hash password
        const password_hash = await bcrypt.hash(validatedData.password, 12);
        // Create service provider and user in transaction
        const result = await prisma.$transaction(async (tx) => {
          const serviceProvider = await tx.serviceProvider.create({
            data: {
              company_name: validatedData.company_name,
              unique_company_id: validatedData.unique_company_id,
              primary_location_address: validatedData.address,
              primary_location_coordinates: {
                latitude: parseFloat(validatedData.latitude),
                longitude: parseFloat(validatedData.longitude)
              },
              skills: validatedData.skills.split(',').map((s: string) => s.trim()),
              capacity_per_day: parseInt(validatedData.capacity_per_day, 10),
              status: ServiceProviderStatus.PENDING_APPROVAL
            }
          });
          const user = await tx.user.create({
            data: {
              username: validatedData.username,
              email: validatedData.email,
              password_hash,
              phone_number: validatedData.phone_number,
              role: UserRole.SERVICE_PROVIDER,
              associated_entity_id: serviceProvider.id,
              registration_status: 'PENDING',
            }
          });
          // Save uploaded documents
          const fileArr = files && files.documents
            ? (Array.isArray(files.documents) ? files.documents : [files.documents])
            : [];
          if (fileArr.length > 0) {
            await tx.document.createMany({
              data: fileArr.map((file: any) => ({
                url: `/uploads/${file.newFilename || file.originalFilename}`,
                type: file.mimetype,
                userId: user.id
              }))
            });
          }
          return { serviceProvider, user };
        });
        return res.status(200).json({
          message: 'Service provider registration submitted for approval',
          provider_id: result.serviceProvider.id
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        return res.status(500).json({ error: 'Registration failed', details: error.message });
      }
    }
    // Moderator/Admin registration (basic, no files)
    if (getField(fields.type) === 'moderator' || getField(fields.type) === 'admin') {
      if (!fields.username || !fields.email || !fields.password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      // Check if username or email already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: getField(fields.username) },
            { email: getField(fields.email) }
          ]
        }
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      const password_hash = await bcrypt.hash(getField(fields.password), 12);
      const user = await prisma.user.create({
        data: {
          username: getField(fields.username),
          email: getField(fields.email),
          password_hash,
          role: getField(fields.type) === 'admin' ? UserRole.ADMIN : UserRole.MODERATOR
        }
      });
      return res.status(200).json({
        message: `${getField(fields.type).charAt(0).toUpperCase() + getField(fields.type).slice(1)} registration submitted for approval`,
        user_id: user.id
      });
    }
    return res.status(400).json({ error: 'Invalid registration type' });
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    return res.status(500).json({ error: 'Registration failed', details: error.message });
  }
} 