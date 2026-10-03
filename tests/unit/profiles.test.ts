import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { normalizeImage, imagePosition, MAX_IMAGE_BYTES } from "../../src/lib/profiles/images";
import { parseGraduation, graduationLabel } from "../../src/lib/fighters/graduation";
import { canEditProfile, profileKind } from "../../src/lib/profiles/profiles";
describe("personalización de perfiles", () => {
  it("solo el titular o moderación pueden editar", () => {
    expect(canEditProfile(null,"a",null)).toBe(false);
    expect(canEditProfile({id:"b",role:"FIGHTER"},"a",null)).toBe(false);
    expect(canEditProfile({id:"a",role:"FIGHTER"},"a",null)).toBe(true);
    expect(canEditProfile({id:"b",role:"FAN"},null,"b")).toBe(true);
    expect(canEditProfile({id:"c",role:"ADMIN"},null,null)).toBe(true);
  });
  it("rechaza tipos y encuadres manipulados", () => {
    expect(profileKind("__proto__")).toBe(null);
    expect(imagePosition("-1")).toBe(null);expect(imagePosition("101")).toBe(null);expect(imagePosition("NaN")).toBe(null);expect(imagePosition("100")).toBe(100);
  });
  it("reconvierte fotos reales a WebP sin EXIF", async () => {
    const data=await sharp({create:{width:800,height:900,channels:3,background:"red"}}).jpeg().withMetadata().toBuffer();
    const output=await normalizeImage(new File([new Uint8Array(data)],"foto.jpg",{type:"image/jpeg"}),"avatar");
    const meta=await sharp(output).metadata();expect(meta.format).toBe("webp");expect(meta.width).toBeLessThanOrEqual(640);expect(meta.exif).toBeUndefined();
  });
  it("no acepta SVG disfrazado de JPEG ni archivos corruptos", async () => {
    await expect(normalizeImage(new File(['<svg xmlns="http://www.w3.org/2000/svg" width="5" height="5"></svg>'],"foto.jpg",{type:"image/jpeg"}),"banner")).rejects.toThrow();
    await expect(normalizeImage(new File(["no es una foto"],"foto.png"),"avatar")).rejects.toThrow();
  });
  it("limita tamaño y dimensiones", async () => {
    await expect(normalizeImage(new File([new Uint8Array(MAX_IMAGE_BYTES+1)],"foto.jpg"),"avatar")).rejects.toThrow();
    const huge=await sharp({create:{width:6000,height:5000,channels:3,background:"white"}}).png().toBuffer();
    await expect(normalizeImage(new File([new Uint8Array(huge)],"foto.png"),"avatar")).rejects.toThrow();
  });
});
describe("graduación por disciplina",()=>{
  it("conserva cinturón y grados de BJJ",()=>{expect(parseGraduation("JIUJITSU","PURPLE","2")).toEqual({belt:"PURPLE",beltDegrees:2});expect(graduationLabel("PURPLE",2)).toBe("Cinturón morado · 2 grados");});
  it("no traslada la graduación a otros deportes",()=>{expect(parseGraduation("BOXEO","PURPLE","2")).toEqual({belt:null,beltDegrees:null});});
  it("permite no declarar y rechaza valores ajenos a la lista",()=>{expect(parseGraduation("JIUJITSU","","")).toEqual({belt:null,beltDegrees:null});expect(parseGraduation("JIUJITSU","__proto__","2")).toBe(null);expect(parseGraduation("JIUJITSU","BLACK","11")).toBe(null);expect(parseGraduation("JIUJITSU","","2")).toBe(null);});
});
