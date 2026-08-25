import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useApi } from "@/react-app/hooks/useApi";
import { EmergencyMockDB } from "@/react-app/data/emergencyData";
import { DB_KEYS, MockDB } from "@/react-app/data/terminalData";
import { canManageEmergencyContacts, mapTerminalRoleToEmergencyApi } from "@/shared/constants/emergency";
import type { EmergencyContactRecord } from "@/shared/services/emergencyLookup";

export default function EmergencyManagePage() {
  const isLocal = __GRAMA_LOCAL_DEV__;
  const localUser = isLocal ? MockDB.getUserByPhone(localStorage.getItem(DB_KEYS.SESSION) ?? "") : null;
  const { data: apiUser } = useApi<{ role: string; name?: string }>("/api/users/me", { enabled: !isLocal });
  const { data: apiContacts, refetch } = useApi<EmergencyContactRecord[]>(
    "/api/emergency/contacts/manage/list",
    { enabled: !isLocal }
  );

  const [contacts, setContacts] = useState<EmergencyContactRecord[]>([]);
  const [form, setForm] = useState<Partial<EmergencyContactRecord>>({
    name: "",
    phone: "",
    service_type: "OTHER",
    scope: "VILLAGE",
  });

  const role = isLocal && localUser
    ? mapTerminalRoleToEmergencyApi(localUser.role)
    : apiUser?.role ?? "";
  const canManage = canManageEmergencyContacts(role);

  useEffect(() => {
    if (isLocal) setContacts(EmergencyMockDB.getContacts());
    else if (apiContacts) setContacts(apiContacts);
  }, [isLocal, apiContacts]);

  if (!canManage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-bold text-red-700">Unauthorized — admin access required</p>
      </div>
    );
  }

  const handleVerify = async (id: string | number) => {
    if (isLocal) {
      const c = EmergencyMockDB.getContactById(id);
      if (c) {
        EmergencyMockDB.saveContact({
          ...c,
          verified_at: new Date().toISOString(),
          verified_by: localUser?.name ?? "Admin",
        });
        setContacts(EmergencyMockDB.getContacts());
      }
      return;
    }
    await fetch(`/api/emergency/contacts/${id}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: form.source }),
    });
    refetch();
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) return;
    if (isLocal) {
      EmergencyMockDB.saveContact({
        id: form.id ?? `ec-${Date.now()}`,
        name: form.name,
        phone: form.phone,
        service_type: form.service_type ?? "OTHER",
        scope: form.scope ?? "VILLAGE",
        district: form.district,
        mandal: form.mandal,
        village: form.village,
        address: form.address,
        description: form.description,
        source: form.source,
        is_active: true,
        isDemoData: true,
      });
      setContacts(EmergencyMockDB.getContacts());
      setForm({ name: "", phone: "", service_type: "OTHER", scope: "VILLAGE" });
      return;
    }
    const method = form.id ? "PATCH" : "POST";
    const url = form.id ? `/api/emergency/contacts/${form.id}` : "/api/emergency/contacts";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    refetch();
    setForm({ name: "", phone: "", service_type: "OTHER", scope: "VILLAGE" });
  };

  const handleDeactivate = async (id: string | number) => {
    if (isLocal) {
      EmergencyMockDB.deleteContact(id);
      setContacts(EmergencyMockDB.getContacts());
      return;
    }
    await fetch(`/api/emergency/contacts/${id}`, { method: "DELETE" });
    refetch();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b-4 border-tg-gold shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-black text-tg-maroon">Emergency Contact Management</h1>
          <Link to="/emergency" className="text-xs font-bold">← Emergency Home</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-900">
            ⚠️ Contact information must be verified before production use.
          </p>
          <p className="text-xs text-amber-800 mt-1">
            Unverified contacts are hidden from citizens in production (Cloudflare mode).
          </p>
        </div>

        <section className="bg-white rounded-2xl border p-6 shadow-md space-y-4">
          <h2 className="font-black text-slate-900">Add / Edit Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="Name"
              value={form.name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="px-4 py-2 border rounded-xl"
            />
            <input
              placeholder="Phone"
              value={form.phone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="px-4 py-2 border rounded-xl"
            />
            <select
              value={form.service_type ?? "OTHER"}
              onChange={(e) => setForm((f) => ({ ...f, service_type: e.target.value }))}
              className="px-4 py-2 border rounded-xl"
            >
              {["POLICE", "AMBULANCE", "HOSPITAL", "PHC", "FIRE", "ELECTRICITY", "WATER", "PANCHAYAT", "WOMEN_SUPPORT", "CHILD_SUPPORT", "DISASTER", "OTHER"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={form.scope ?? "VILLAGE"}
              onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
              className="px-4 py-2 border rounded-xl"
            >
              {["STATE", "DISTRICT", "MANDAL", "VILLAGE"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input placeholder="District" value={form.district ?? ""} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} className="px-4 py-2 border rounded-xl" />
            <input placeholder="Mandal" value={form.mandal ?? ""} onChange={(e) => setForm((f) => ({ ...f, mandal: e.target.value }))} className="px-4 py-2 border rounded-xl" />
            <input placeholder="Village" value={form.village ?? ""} onChange={(e) => setForm((f) => ({ ...f, village: e.target.value }))} className="px-4 py-2 border rounded-xl" />
            <input placeholder="Source reference" value={form.source ?? ""} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} className="px-4 py-2 border rounded-xl md:col-span-2" />
          </div>
          <button type="button" onClick={handleSave} className="px-6 py-3 bg-tg-maroon text-white rounded-xl font-black text-xs uppercase">
            Save Contact
          </button>
        </section>

        <section className="space-y-4">
          <h2 className="font-black text-slate-900">All Contacts</h2>
          {contacts.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black">{c.name}</p>
                <p className="text-xs text-slate-500">{c.service_type} • {c.scope} • {c.phone}</p>
                {c.verified_at ? (
                  <p className="text-xs text-green-700 font-bold mt-1">
                    ✓ Verified on {new Date(c.verified_at).toLocaleDateString()} by {c.verified_by}
                  </p>
                ) : (
                  <p className="text-xs text-amber-700 font-black mt-1">⚠️ Verification Required</p>
                )}
              </div>
              <div className="flex gap-2">
                {!c.verified_at && (
                  <button type="button" onClick={() => handleVerify(c.id)} className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold">
                    Verify
                  </button>
                )}
                <button type="button" onClick={() => setForm(c)} className="px-3 py-2 border rounded-lg text-xs font-bold">
                  Edit
                </button>
                <button type="button" onClick={() => handleDeactivate(c.id)} className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                  Deactivate
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
