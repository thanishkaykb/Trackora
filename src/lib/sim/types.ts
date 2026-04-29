export type ShipmentEvent = {
  ts: number;
  type: "created" | "depart" | "arrive" | "delay" | "reroute" | "delivered" | "info";
  hub?: string;
  message: string;
};

export type SimShipment = {
  id: string;            // local uuid
  trackingId: string;    // PT-XXXX
  origin: string;        // hub id
  destination: string;   // hub id
  currentHub: string;    // hub id
  nextHub?: string;      // hub id (in-flight target)
  segmentProgress: number; // 0..1 along current edge
  route: string[];       // hub ids
  status: "in_transit" | "delivered" | "delayed" | "rerouted";
  etaMinutes: number;
  delayMinutes: number;
  delayCause?: string;
  explanation?: string;
  priority: boolean;
  eco: boolean;
  events: ShipmentEvent[];
  createdAt: number;
  shop: string;
  itemName: string;
  recipient: string;
};

export type Analytics = {
  active: number;
  delivered: number;
  avgEta: number;
  delayRate: number;
  efficiency: number; // 0..100
  recentDeliveryMinutes: number[];
};
