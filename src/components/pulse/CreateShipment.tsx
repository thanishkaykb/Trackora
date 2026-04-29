import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSim } from "@/context/SimContext";
import { HUBS } from "@/lib/sim/network";
import { Leaf, Plus, Zap } from "lucide-react";
import { toast } from "sonner";

export function CreateShipment() {
  const { addShipment } = useSim();
  const [origin, setOrigin] = useState("SFO");
  const [destination, setDestination] = useState("JFK");
  const [priority, setPriority] = useState(false);
  const [eco, setEco] = useState(false);

  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <div>
        <h3 className="font-display text-lg">Dispatch shipment</h3>
        <p className="text-xs text-muted-foreground">Backed by the predictive routing engine</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <HubSelect label="Origin" value={origin} onChange={setOrigin} />
        <HubSelect label="Destination" value={destination} onChange={setDestination} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="glass-strong rounded-xl px-3 py-2 flex items-center justify-between text-sm cursor-pointer">
          <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" />Priority</span>
          <Switch checked={priority} onCheckedChange={setPriority} />
        </label>
        <label className="glass-strong rounded-xl px-3 py-2 flex items-center justify-between text-sm cursor-pointer">
          <span className="flex items-center gap-2"><Leaf className="w-4 h-4 text-success" />Eco</span>
          <Switch checked={eco} onCheckedChange={setEco} />
        </label>
      </div>
      <Button
        className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 glow-primary"
        onClick={() => {
          if (origin === destination) {
            toast.error("Origin and destination must differ");
            return;
          }
          const s = addShipment(origin, destination, { priority, eco });
          toast.success(`Created ${s.trackingId}`);
        }}
      >
        <Plus className="w-4 h-4 mr-1" /> Dispatch
      </Button>
    </div>
  );
}

function HubSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-muted/40 border-border"><SelectValue /></SelectTrigger>
        <SelectContent>
          {HUBS.map(h => (
            <SelectItem key={h.id} value={h.id}>{h.city} ({h.id})</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
