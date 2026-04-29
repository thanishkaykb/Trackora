import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles } from "lucide-react";
import { useSim } from "@/context/SimContext";
import { toast } from "sonner";
import { TrackingDialog } from "./TrackingDialog";

export function TrackInput() {
  const { trackOrCreate, shipments } = useSim();
  const [tid, setTid] = useState("");
  const [open, setOpen] = useState(false);
  const [trackedId, setTrackedId] = useState<string | null>(null);
  const tracked = shipments.find(s => s.id === trackedId) ?? null;

  const doTrack = (raw: string) => {
    const v = raw.trim();
    if (!v) { toast.error("Enter a tracking ID"); return; }
    const s = trackOrCreate(v);
    setTrackedId(s.id);
    setOpen(true);
    toast.success(`Tracking ${s.trackingId} — ${s.shop}`);
  };

  return (
    <>
      <div className="glass rounded-2xl p-3 flex gap-2 items-center">
        <Search className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
        <Input
          placeholder="Track any order — e.g. PT-AB12CD"
          value={tid}
          onChange={e => setTid(e.target.value.toUpperCase())}
          onKeyDown={e => { if (e.key === "Enter") doTrack(tid); }}
          className="bg-transparent border-0 focus-visible:ring-0 font-mono text-sm"
        />
        <Button
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => doTrack(tid)}
        >Track</Button>
        <Button
          variant="ghost"
          size="icon"
          title="Track a random order"
          onClick={() => {
            const s = shipments[Math.floor(Math.random() * shipments.length)];
            if (s) { setTid(s.trackingId); doTrack(s.trackingId); }
          }}
        ><Sparkles className="w-4 h-4" /></Button>
      </div>
      <TrackingDialog shipment={tracked} open={open} onOpenChange={setOpen} />
    </>
  );
}
