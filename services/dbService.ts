
import { Order, User, Signature, AppState, Person, Sector, Job, Vehicle, VehicleBrand, VehicleSchedule } from '../types';

const DB_NAME = 'BrandDocDB_v2';
const DB_VERSION = 6; // Incrementado para nova store de agendamentos
const STORES = {
  ORDERS: 'orders',
  USERS: 'users',
  SIGNATURES: 'signatures',
  SETTINGS: 'settings',
  PERSONS: 'persons',
  SECTORS: 'sectors',
  JOBS: 'jobs',
  VEHICLES: 'vehicles',
  BRANDS: 'vehicles_brands',
  SCHEDULES: 'vehicle_schedules'
};

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.ORDERS)) {
        db.createObjectStore(STORES.ORDERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        db.createObjectStore(STORES.USERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SIGNATURES)) {
        db.createObjectStore(STORES.SIGNATURES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.PERSONS)) {
        db.createObjectStore(STORES.PERSONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SECTORS)) {
        db.createObjectStore(STORES.SECTORS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.JOBS)) {
        db.createObjectStore(STORES.JOBS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.VEHICLES)) {
        db.createObjectStore(STORES.VEHICLES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.BRANDS)) {
        db.createObjectStore(STORES.BRANDS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SCHEDULES)) {
        db.createObjectStore(STORES.SCHEDULES, { keyPath: 'id' });
      }
    };
  });
};

const getAll = async <T>(storeName: string): Promise<T[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
};

const save = async <T>(storeName: string, item: T): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const remove = async (storeName: string, id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllOrders = () => getAll<Order>(STORES.ORDERS);
export const saveOrder = (order: Order) => save(STORES.ORDERS, order);
export const deleteOrder = (id: string) => remove(STORES.ORDERS, id);
export const clearAllOrders = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.ORDERS, 'readwrite');
    const store = transaction.objectStore(STORES.ORDERS);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllUsers = () => getAll<User>(STORES.USERS);
export const saveUser = (user: User) => save(STORES.USERS, user);
export const deleteUser = (id: string) => remove(STORES.USERS, id);

export const getAllSignatures = () => getAll<Signature>(STORES.SIGNATURES);
export const saveSignature = (sig: Signature) => save(STORES.SIGNATURES, sig);
export const deleteSignature = (id: string) => remove(STORES.SIGNATURES, id);

export const getAllPersons = () => getAll<Person>(STORES.PERSONS);
export const savePerson = (person: Person) => save(STORES.PERSONS, person);
export const deletePerson = (id: string) => remove(STORES.PERSONS, id);

export const getAllSectors = () => getAll<Sector>(STORES.SECTORS);
export const saveSector = (sector: Sector) => save(STORES.SECTORS, sector);
export const deleteSector = (id: string) => remove(STORES.SECTORS, id);

export const getAllJobs = () => getAll<Job>(STORES.JOBS);
export const saveJob = (job: Job) => save(STORES.JOBS, job);
export const deleteJob = (id: string) => remove(STORES.JOBS, id);

export const getAllVehicles = () => getAll<Vehicle>(STORES.VEHICLES);
export const saveVehicle = (vehicle: Vehicle) => save(STORES.VEHICLES, vehicle);
export const deleteVehicle = (id: string) => remove(STORES.VEHICLES, id);

export const getAllBrands = () => getAll<VehicleBrand>(STORES.BRANDS);
export const saveBrand = (brand: VehicleBrand) => save(STORES.BRANDS, brand);
export const deleteBrand = (id: string) => remove(STORES.BRANDS, id);

export const getAllSchedules = () => getAll<VehicleSchedule>(STORES.SCHEDULES);
export const saveSchedule = (s: VehicleSchedule) => save(STORES.SCHEDULES, s);
export const deleteSchedule = (id: string) => remove(STORES.SCHEDULES, id);

export const getGlobalSettings = async (): Promise<AppState | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SETTINGS, 'readonly');
    const store = transaction.objectStore(STORES.SETTINGS);
    const request = store.get('global_config');
    request.onsuccess = () => resolve(request.result ? (request.result as any).data : null);
    request.onerror = () => reject(request.error);
  });
};

export const saveGlobalSettings = async (settings: AppState): Promise<void> => {
  return save(STORES.SETTINGS, { id: 'global_config', data: settings });
};

export const getGlobalCounter = async (): Promise<number> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SETTINGS, 'readonly');
    const store = transaction.objectStore(STORES.SETTINGS);
    const request = store.get('global_counter');
    request.onsuccess = () => resolve(request.result ? (request.result as any).value : 0);
    request.onerror = () => reject(request.error);
  });
};

export const incrementGlobalCounter = async (): Promise<number> => {
  const current = await getGlobalCounter();
  const next = current + 1;
  await save(STORES.SETTINGS, { id: 'global_counter', value: next });
  return next;
};
