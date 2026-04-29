import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useShipments } from "@/hooks/useShipments";
import { HUBS } from "@/lib/sim/network";
import { Leaf, Plus, Zap, Copy } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  itemName: z.string().trim().min(1).max(120),
  shop: z.string().trim().min(1).max(120),
  recipientName: z.string().trim().min(1).max(120),
  recipientAddress: z.string().trim().max(500).optional(),
  amountDue: z.number().min(0).max(1_000_000),
});

export function SellerCreateShipment() {
  const { create } = useShipments();
  const [origin, setOrigin] = useState("SFO");
  const [destination, setDestination] = useState("JFK");
  const [itemName, setItemName] = useState("");
  const [shop, setShop] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("0");
  const [paid, setPaid] = useState(false);
  const [priority, setPriority] = useState(false);
  const [eco, setEco] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastTid, setLastTid] = useState<string | null>(null);

  const submit = async () => {
    if (origin === destination) return toast.error("Origin and destination must differ");
    const parsed = schema.safeParse({
      itemName, shop, recipientName,
      recipientAddress: recipientAddress || undefined,
      amountDue: Number(amount) || 0,
    });
    if (!parsed.success) return toast.error("Please fill all required fields");
    setSubmitting(true);
    const s = await create({
      origin, destination,
      itemName: parsed.data.itemName,
      shop: parsed.data.shop,
      recipientName: parsed.data.recipientName,
      recipientAddress: parsed.data.recipientAddress,
      amountDue: parsed.data.amountDue,
      paymentStatus: paid ? "paid" : "unpaid",
      priority, eco,
    });
    setSubmitting(false);
    if (!s) return toast.error("Failed to dispatch");
    setLastTid(s.tracking_id);
    toast.success(`Dispatched ${s.tracking_id}`);
    setItemName(""); setRecipientName(""); setRecipientAddress(""); setAmount("0");
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="font-display text-lg">Dispatch new shipment</h3>
        <p className="text-xs text-muted-foreground">A tracking ID is generated automatically — share it with the receiver.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Item name *">
          <Input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Wireless headphones" />
        </Field>
        <Field label="Shop / brand *">
          <Input value={shop} onChange={e => setShop(e.target.value)} placeholder="Aether Audio" />
        </Field>
        <Field label="Recipient name *">
          <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Maya Chen" />
        </Field>
        <Field label="Amount due (USD)">
          <Input type="number" min={0} value={amount} onChange={e => setAmount(e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Recipient address">
            <Input value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} placeholder="123 Market St, San Francisco, CA" />
          </Field>
        </div>
        <HubSelect label="From hub *" value={origin} onChange={setOrigin} />
        <HubSelect label="To hub *" value={destination} onChange={setDestination} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Toggle label="Priority" icon={<Zap className="w-4 h-4 text-primary" />} checked={priority} onChange={setPriority} />
        <Toggle label="Eco" icon={<Leaf className="w-4 h-4 text-success" />} checked={eco} onChange={setEco} />
        <Toggle label="Paid" checked={paid} onChange={setPaid} />
      </div>

      <Button
        className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 glow-primary"
        onClick={submit}
        disabled={submitting}
      >
        <Plus className="w-4 h-4 mr-1" /> {submitting ? "Dispatching…" : "Dispatch shipment"}
      </Button>

      {lastTid && (
        <div className="glass-strong rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tracking ID generated</div>
            <div className="font-mono text-primary text-sm mt-0.5">{lastTid}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(lastTid); toast.success("Copied"); }}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function HubSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-muted/40 border-border"><SelectValue /></SelectTrigger>
        <SelectContent>
          {HUBS.map(h => <SelectItem key={h.id} value={h.id}>{h.city} ({h.id})</SelectItem>)}
        </SelectContent>
      </Select>
    </Field>
  );
}

function Toggle({ label, icon, checked, onChange }: { label: string; icon?: React.ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="glass-strong rounded-xl px-3 py-2 flex items-center justify-between text-sm cursor-pointer">
      <span className="flex items-center gap-2">{icon}{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}