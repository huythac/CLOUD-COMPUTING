import type { Customer } from '../types/customer';
import { read, write, uuid, nowISO } from './storage';

const KEY = 'customers';

const SEED: Omit<Customer, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Alice Nguyen',  phone: '555-0101', email: 'alice@example.com',  address: '12 Maple St'    },
  { name: 'Bob Tran',      phone: '555-0102', email: 'bob@example.com',    address: '34 Oak Ave'     },
  { name: 'Carol Pham',    phone: '555-0103', email: 'carol@example.com',  address: '56 Pine Rd'     },
  { name: 'David Le',      phone: '555-0104', email: 'david@example.com',  address: '78 Cedar Ln'    },
  { name: 'Eva Hoang',     phone: '555-0105', email: 'eva@example.com'                               },
  { name: 'Frank Do',      phone: '555-0106', email: 'frank@example.com',  address: '90 Birch Blvd'  },
  { name: 'Grace Vu',      phone: '555-0107', email: 'grace@example.com',  address: '11 Elm Ct'      },
  { name: 'Henry Dao',     phone: '555-0108', email: 'henry@example.com'                             },
  { name: 'Iris Ly',       phone: '555-0109', email: 'iris@example.com',   address: '22 Walnut Way'  },
  { name: 'James Bui',     phone: '555-0110',                              address: '33 Spruce Dr'   },
];

/** Seed with 10 realistic contacts if none exist for this userId. */
export function seedCustomers(userId = '1'): void {
  const all = read<Customer[]>(KEY, []);
  if (all.some((c) => c.userId === userId)) return;
  const seeded = SEED.map((d) => ({ ...d, id: uuid(), userId, createdAt: nowISO(), updatedAt: nowISO() }));
  write(KEY, [...all, ...seeded]);
}

export function listCustomers(userId = '1'): Customer[] {
  return read<Customer[]>(KEY, []).filter((c) => c.userId === userId);
}

export function createCustomer(
  userId: string,
  payload: Omit<Customer, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
): Customer {
  const all = read<Customer[]>(KEY, []);
  const customer: Customer = { ...payload, id: uuid(), userId, createdAt: nowISO(), updatedAt: nowISO() };
  write(KEY, [...all, customer]);
  return customer;
}

export function updateCustomer(
  id: string,
  payload: Partial<Omit<Customer, 'id' | 'userId' | 'createdAt'>>,
): Customer | null {
  const all = read<Customer[]>(KEY, []);
  let updated: Customer | null = null;
  const next = all.map((c) => {
    if (c.id !== id) return c;
    updated = { ...c, ...payload, updatedAt: nowISO() };
    return updated;
  });
  if (updated) write(KEY, next);
  return updated;
}

export function deleteCustomer(id: string): boolean {
  const all = read<Customer[]>(KEY, []);
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return false;
  write(KEY, next);
  return true;
}
