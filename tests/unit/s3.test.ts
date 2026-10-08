import { describe, expect, it } from "vitest";
import { codificar, presignar } from "../../src/lib/media/s3";

describe("direcciones prefirmadas (AWS Signature Version 4)", () => {
  it("coincide con el ejemplo oficial de AWS («Authenticating Requests: Using Query Parameters»)", () => {
    const url = presignar({
      metodo: "GET",
      url: "https://examplebucket.s3.amazonaws.com/test.txt",
      credenciales: { accessKeyId: "AKIAIOSFODNN7EXAMPLE", secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", region: "us-east-1" },
      fecha: new Date("2013-05-24T00:00:00Z"),
      segundos: 86400,
    });
    expect(url).toBe(
      "https://examplebucket.s3.amazonaws.com/test.txt?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20130524T000000Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404",
    );
  });
  it("codifica como pide la especificación y firma también los parámetros añadidos", () => {
    expect(codificar("a b!'()*/ñ")).toBe("a%20b%21%27%28%29%2A%2F%C3%B1");
    const base = { metodo: "GET" as const, url: "https://cuenta.r2.cloudflarestorage.com/videos/u1/a.mp4", credenciales: { accessKeyId: "k", secretAccessKey: "s", region: "auto" }, fecha: new Date("2026-10-08T12:00:00Z"), segundos: 3600 };
    const sin = presignar(base);
    const con = presignar({ ...base, consulta: { "response-content-disposition": 'attachment; filename="combate.mp4"' } });
    expect(con).toContain("response-content-disposition=attachment%3B%20filename%3D%22combate.mp4%22");
    expect(con.split("X-Amz-Signature=")[1]).not.toBe(sin.split("X-Amz-Signature=")[1]);
  });
});
