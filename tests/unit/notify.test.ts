import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ bout: { findUnique: vi.fn() }, follow: { findMany: vi.fn() } }));
const mail = vi.hoisted(() => ({ APP_URL: "https://ring.test", sendMail: vi.fn() }));
const auth = vi.hoisted(() => ({ unsubscribeLink: vi.fn(async (id: string) => `https://ring.test/baja?token=${id}`) }));
vi.mock("../../src/lib/common/db", () => ({ db }));
vi.mock("../../src/lib/common/mail", () => mail);
vi.mock("../../src/lib/accounts/auth", () => auth);

import { notifyFollowersOfBout } from "../../src/lib/community/notify";

const fighter = (id: string, first: string, last: string) => ({ id, firstName: first, lastName: last });
const bout = (date: Date) => ({ id: "b1", fighterAId: "fa", fighterBId: "fb", fighterA: fighter("fa", "Ana", "Ruiz"), fighterB: fighter("fb", "Luis", "Gil"), event: { name: "Velada\nCentral", slug: "velada-central", date, venue: "Sala", city: "Madrid" } });
const follow = (userId: string, email: string, name: string, f: ReturnType<typeof fighter>) => ({ userId, user: { email, name }, fighter: f });
const future = new Date(Date.now() + 10 * 864e5);

beforeEach(() => { vi.clearAllMocks(); mail.sendMail.mockResolvedValue(true); });

describe("avisos a seguidores", () => {
  it("un combate que ya ha pasado o no existe no avisa a nadie", async () => {
    db.bout.findUnique.mockResolvedValueOnce(null);
    expect(await notifyFollowersOfBout("x")).toBe(0);
    db.bout.findUnique.mockResolvedValueOnce(bout(new Date(Date.now() - 864e5)));
    expect(await notifyFollowersOfBout("b1")).toBe(0);
    expect(db.follow.findMany).not.toHaveBeenCalled();
  });
  it("solo busca a quien tiene el correo verificado y los avisos activados", async () => {
    db.bout.findUnique.mockResolvedValue(bout(future)); db.follow.findMany.mockResolvedValue([]);
    await notifyFollowersOfBout("b1");
    expect(db.follow.findMany.mock.calls[0][0].where.user).toEqual({ emailVerifiedAt: { not: null }, notifyEmails: true });
  });
  it("quien sigue a los dos peleadores recibe un solo correo, con enlace de baja", async () => {
    db.bout.findUnique.mockResolvedValue(bout(future));
    db.follow.findMany.mockResolvedValue([follow("u1", "a@x.es", "Carla", fighter("fa", "Ana", "Ruiz")), follow("u1", "a@x.es", "Carla", fighter("fb", "Luis", "Gil")), follow("u2", "b@x.es", "Dani", fighter("fa", "Ana", "Ruiz"))]);
    expect(await notifyFollowersOfBout("b1")).toBe(2);
    expect(mail.sendMail).toHaveBeenCalledTimes(2);
    const [to, subject, text, opts] = mail.sendMail.mock.calls[0];
    expect(to).toBe("a@x.es");
    expect(subject).toBe("Ana Ruiz y Luis Gil tienen un nuevo combate");
    expect(text).toContain("dejar de seguir a cada uno");
    expect(text).toContain("https://ring.test/baja?token=u1");
    expect(opts).toEqual({ unsubscribeUrl: "https://ring.test/baja?token=u1" });
  });
  it("el texto de otras personas no puede meter saltos de línea en el mensaje", async () => {
    db.bout.findUnique.mockResolvedValue(bout(future));
    db.follow.findMany.mockResolvedValue([follow("u1", "a@x.es", "Carla\nBcc: otro@x.es", fighter("fa", "Ana", "Ruiz"))]);
    await notifyFollowersOfBout("b1");
    const text: string = mail.sendMail.mock.calls[0][2];
    expect(text).toContain("Hola Carla Bcc: otro@x.es,");
    expect(text).toContain("«Velada Central»");
  });
  it("un fallo con una persona no impide avisar a las demás", async () => {
    db.bout.findUnique.mockResolvedValue(bout(future));
    db.follow.findMany.mockResolvedValue([follow("u1", "a@x.es", "Carla", fighter("fa", "Ana", "Ruiz")), follow("u2", "b@x.es", "Dani", fighter("fa", "Ana", "Ruiz")), follow("u3", "c@x.es", "Eva", fighter("fa", "Ana", "Ruiz"))]);
    mail.sendMail.mockRejectedValueOnce(new Error("proveedor caído")).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await notifyFollowersOfBout("b1")).toBe(1);
    expect(mail.sendMail).toHaveBeenCalledTimes(3);
  });
});
