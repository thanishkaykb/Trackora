import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useShipments } from "@/hooks/useShipments";
import { COUNTRIES, CURRENCIES, hubForCountry, countryByCode } from "@/lib/sim/countries";
import { hubMap } from "@/lib/sim/network";
import { Leaf, Plus, Zap, Copy } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  itemName: z.string().trim().min(1).max(120),
  shop: z.string().trim().min(1).max(120),
  recipientName: z.string().trim().min(1).max(120),
  recipientPhone: z.string().trim().min(4, "Phone number is required").max(30),
  recipientAddress: z.string().trim().min(1, "Address is required").max(500),
  recipientCountry: z.string().length(2),
  originCountry: z.string().length(2),
  phoneCountry: z.string().length(2),
  currency: z.string().length(3),
  amountDue: z.number().min(0).max(1_000_000_000),
});

export function SellerCreateShipment() {
  const { create } = useShipments();
  const [originCountry, setOriginCountry] = useState("US");
  const [recipientCountry, setRecipientCountry] = useState("GB");
  const [phoneCountry, setPhoneCountry] = useState("GB");
  const [currency, setCurrency] = useState("USD");
  const [itemName, setItemName] = useState("");
  const [shop, setShop] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("0");
  const [paid, setPaid] = useState(false);
  const [priority, setPriority] = useState(false);
  const [eco, setEco] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastTid, setLastTid] = useState<string | null>(null);

  const origin = useMemo(() => hubForCountry(originCountry), [originCountry]);
  const destination = useMemo(() => hubForCountry(recipientCountry), [recipientCountry]);
  const phoneDial = countryByCode.get(phoneCountry)?.dial ?? "+";

  const submit = async () => {
    if (origin === destination) return toast.error("Origin and destination countries must use different hubs");
    const parsed = schema.safeParse({
      itemName, shop, recipientName, recipientPhone, recipientAddress,
      recipientCountry, originCountry, phoneCountry, currency,
      amountDue: Number(amount) || 0,
    });
    if (!parsed.success) return toast.error("Please fill all required fields");
    setSubmitting(true);
    const s = await create({
      origin, destination,
      itemName: parsed.data.itemName,
      shop: parsed.data.shop,
      recipientName: parsed.data.recipientName,
      recipientPhone: `${phoneDial} ${parsed.data.recipientPhone}`.trim(),
      recipientPhoneCountry: phoneCountry,
      recipientCountry,
      recipientAddress: parsed.data.recipientAddress,
      amountDue: parsed.data.amountDue,
      currency: parsed.data.currency,
      paymentStatus: paid ? "paid" : "unpaid",
      priority, eco,
    });
    setSubmitting(false);
    if (!s) return toast.error("Failed to dispatch");
    setLastTid(s.tracking_id);
    toast.success(`Dispatched ${s.tracking_id}`);
    setItemName(""); setRecipientName(""); setRecipientPhone(""); setRecipientAddress(""); setAmount("0");
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="font-display text-lg">Dispatch new shipment</h3>
        <p className="text-xs text-muted-foreground">Worldwide delivery — pick origin & destination countries and we'll route through the nearest hubs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Item name *">
          <Input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Wireless headphones" />
        </Field>
        <Field label="Shop / brand *">
          <Input value={shop} onChange={e => setShop(e.target.value)} placeholder="Aether Audio" />
        </Field>
        <CountrySelect label="From country *" value={originCountry} onChange={setOriginCountry} />
        <CountrySelect label="To country *" value={recipientCountry} onChange={setRecipientCountry} />
        <Field label="Recipient name *">
          <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Maya Chen" />
        </Field>
        <Field label="Recipient phone *">
          <div className="flex gap-1.5">
            <div className="w-[130px] shrink-0">
              <Select value={phoneCountry} onValueChange={setPhoneCountry}>
                <SelectTrigger className="bg-muted/40 border-border">
                  <SelectValue>
                    <span className="font-mono text-xs">{countryByCode.get(phoneCountry)?.flag} {phoneDial}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {COUNTRIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="font-mono">{c.flag} {c.dial}</span> <span className="text-muted-foreground">· {c.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input type="tel" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder="555 123 4567" />
          </div>
        </Field>
        <Field label="Amount due">
          <div className="flex gap-1.5">
            <div className="w-[110px] shrink-0">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-muted/40 border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input type="number" min={0} value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
        </Field>
        <div className="md:col-span-2">
          <Field label="Recipient address *">
            <Input value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} placeholder="221B Baker St, London" />
          </Field>
        </div>
      </div>

      <div className="glass-strong rounded-xl px-3 py-2 text-xs text-muted-foreground">
        Auto-routing: <span className="text-foreground">{hubMap.get(origin)?.city} <span className="font-mono">({origin})</span></span>
        {" → "}
        <span className="text-foreground">{hubMap.get(destination)?.city} <span className="font-mono">({destination})</span></span>
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

function CountrySelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-muted/40 border-border"><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-72">
          {COUNTRIES.map(c => (
            <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
          ))}
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