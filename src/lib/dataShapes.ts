import type { OrderItemPayload, MeasurementMap } from "@/db/schema";

/**
 * Shapes of the records stored in the repository data files
 * (data/orders.json, data/customers.json, data/tailoring-requests.json).
 * They mirror the previous database rows, serialized (ISO date strings).
 */

export interface StoredOrder {
  id: number;
  orderNumber: string;
  customerId: number | null;
  customerName: string;
  customerEmail: string | null;
  phone: string;
  whatsapp: string;
  deliveryAddress: string;
  deliveryZone: string;
  orderNotes: string | null;
  paymentMethod: string;
  paymentTransactionId: string | null;
  items: OrderItemPayload[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  status: string;
  createdAt: string;
}

export interface StoredTailoringRequest {
  id: number;
  requestNumber: string;
  category: string;
  productId: number | null;
  productName: string;
  productImage: string | null;
  selectedColor: string | null;
  tailoringOption: string;
  unit: string;
  measurements: MeasurementMap;
  referenceImageName: string | null;
  referenceImageData: string | null;
  specialNotes: string | null;
  customerName: string;
  whatsappNumber: string;
  deliveryAddress: string;
  additionalInstructions: string | null;
  status: string;
  createdAt: string;
}

export interface StoredCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  passwordHash: string;
  savedMeasurements?: MeasurementMap;
  measurementUnit?: "inches" | "cm";
  createdAt: string;
}
